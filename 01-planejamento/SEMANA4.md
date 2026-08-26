# Semana 4 — Roteiro de implementação (F2b Exercícios da Rotina — RF02 completo)

> Mesmo formato da S3: roteiro com código de exemplo, não copia-e-cola cego.
> Cards correspondentes no Trello: S4.

> **Ponto de partida:** S3 fechada — `Divisao` (CRUD por dia da semana) já
> funciona, testes verdes, tela "Minha Divisão" salva a semana. Falta a
> parte que a Decisão D deixou pendente: ligar cada dia da divisão a uma
> lista ordenada de exercícios, via `DivisaoExercicio`.

> **Decisão D (relembrando):** `Divisao` não tem `muscles[]`. O "resumo de
> músculos do dia" citado no card do Trello é sempre calculado on-the-fly
> por `Divisao → DivisaoExercicio → Exercicio → GrupamentoMuscular` — nunca
> gravado como coluna. Esta semana é a que finalmente preenche
> `DivisaoExercicio`, então o resumo deixa de ficar vazio.

Critério de aceite (card 🎯 ENTREGÁVEL S4):
- [ ] `GET /exercises` com grupamento muscular e filtro
- [ ] Adicionar/remover/ordenar exercícios por dia funcionando
- [ ] Persistência em `DivisaoExercicio` com `ordem`
- [ ] Resumo de músculos da divisão passa a aparecer (derivado do JOIN, Decisão D)
- [ ] Fluxo completo divisão → exercícios sem erros no console
- [ ] Print da rotina montada guardado (figura para o TCC)

---

## Passo 0 — `server/src/types/indexTypes.ts`

Acrescentar os tipos de `Exercicio` (espelha o catálogo fixo, seed da S1) e
de `DivisaoExercicio` (o vínculo que esta semana passa a gravar).

```ts
export interface Exercicio {
  id_exercicio: number;
  nome_exercicio: string;
  fk_grupamento: number;
}

// GET /exercises devolve já com o nome do grupamento (JOIN), não só o id —
// evita o front ter que buscar GrupamentoMuscular à parte pra exibir o filtro
export interface ExercicioComGrupamento extends Exercicio {
  nome_grupamento: string;
}

export interface DivisaoExercicio {
  id_divisao_exercicio: number;
  fk_divisao: string;
  fk_exercicio: number;
  ordem: number;
}

// Payload que o front manda pro PUT de um dia: só o id do exercício, a
// ordem é a posição no array — evita mandar "ordem" duplicado e correr o
// risco de vir inconsistente com a posição real da lista
export interface DivisaoExercicioInput {
  fk_exercicio: number;
}
```

---

## Passo 1 — `server/src/models/exerciseModel.ts`

Só leitura — o catálogo de exercícios é fixo (seed da S1), não tem
CRUD nesta feature. `listarTodos` aceita um `fk_grupamento` opcional pra
filtrar (o card pede "filtro").

```ts
import { pool } from '../config/db';
import { ExercicioComGrupamento } from '../types/indexTypes';

export async function listarTodos(
  fkGrupamento?: number
): Promise<ExercicioComGrupamento[]> {
  const condicao = fkGrupamento ? 'WHERE e.fk_grupamento = $1' : '';
  const parametros = fkGrupamento ? [fkGrupamento] : [];

  const resultado = await pool.query<ExercicioComGrupamento>(
    `SELECT e.id_exercicio, e.nome_exercicio, e.fk_grupamento, g.nome AS nome_grupamento
     FROM Exercicio e
     JOIN GrupamentoMuscular g ON g.id_grupamento = e.fk_grupamento
     ${condicao}
     ORDER BY g.nome, e.nome_exercicio`,
    parametros
  );
  return resultado.rows;
}
```

### `server/src/controllers/exerciseController.ts`

```ts
import { Request, Response } from 'express';
import * as exerciseModel from '../models/exerciseModel';

export async function listar(req: Request, res: Response) {
  const grupamento = req.query.grupamento
    ? Number(req.query.grupamento)
    : undefined;

  if (grupamento !== undefined && Number.isNaN(grupamento)) {
    return res.status(400).json({ erro: 'grupamento precisa ser um número' });
  }

  const exercicios = await exerciseModel.listarTodos(grupamento);
  return res.status(200).json({ exercicios });
}
```

### `server/src/routes/exerciseRoutes.ts`

Rota autenticada (mesma regra da S3: nada logado-only fica público), mas
sem regra de dono — o catálogo é o mesmo pra todo usuário.

```ts
import { Router } from 'express';
import { listar } from '../controllers/exerciseController';
import { autenticar } from '../middlewares/auth';

const router = Router();

router.get('/exercises', autenticar, listar);

export default router;
```

Registrar em `app.ts` ao lado de `divisionRoutes`:

```ts
import exerciseRoutes from './routes/exerciseRoutes';
// ...
app.use(exerciseRoutes);
```

**Teste manual:** `GET /exercises` com token devolve a lista dos ~95
exercícios da seed, com `nome_grupamento`. `GET /exercises?grupamento=1`
filtra só um grupamento.

---

## Passo 2 — `server/src/models/divisionModel.ts` (acrescentar)

Duas funções novas. Diferente do `substituirSemana` da S3, aqui o
apaga-e-reinsere **não tem o mesmo problema**: `DivisaoExercicio` não é
referenciado por nenhuma tabela filha ainda (isso só chega na S5, e mesmo
lá é `Treino`/`SerieTreino` que referencia `Exercicio`/`Divisao`
diretamente, não `DivisaoExercicio`). Então trocar o `id_divisao_exercicio`
a cada salvamento é seguro — mais simples que replicar o UPSERT da S3.

**`buscarExerciciosDoDia`** — lista os exercícios de uma divisão, na ordem
salva, já com nome do exercício e do grupamento (pro front não fazer outro
fetch pra montar a lista):

```ts
export async function buscarExerciciosDoDia(
  fkDivisao: string
): Promise<ExercicioDoDia[]> {
  const resultado = await pool.query<ExercicioDoDia>(
    `SELECT de.id_divisao_exercicio, de.fk_divisao, de.fk_exercicio, de.ordem,
            e.nome_exercicio, g.nome AS nome_grupamento
     FROM DivisaoExercicio de
     JOIN Exercicio e ON e.id_exercicio = de.fk_exercicio
     JOIN GrupamentoMuscular g ON g.id_grupamento = e.fk_grupamento
     WHERE de.fk_divisao = $1
     ORDER BY de.ordem`,
    [fkDivisao]
  );
  return resultado.rows;
}
```

**`substituirExerciciosDoDia`** — dentro de uma transação: apaga tudo que
existia pra aquela divisão e insere de novo na ordem do array recebido
(`ordem` = índice no array + 1). Simples porque, como explicado acima, não
há FK filha pra proteger ainda.

```ts
export async function substituirExerciciosDoDia(
  fkDivisao: string,
  exercicios: DivisaoExercicioInput[]
): Promise<ExercicioDoDia[]> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM DivisaoExercicio WHERE fk_divisao = $1', [
      fkDivisao,
    ]);

    for (let i = 0; i < exercicios.length; i++) {
      await client.query(
        `INSERT INTO DivisaoExercicio (fk_divisao, fk_exercicio, ordem)
         VALUES ($1, $2, $3)`,
        [fkDivisao, exercicios[i].fk_exercicio, i + 1]
      );
    }

    await client.query('COMMIT');
  } catch (erro) {
    await client.query('ROLLBACK');
    throw erro;
  } finally {
    client.release();
  }

  return buscarExerciciosDoDia(fkDivisao);
}
```

**`buscarResumoMusculos`** — o "resumo de músculos" do critério de aceite:
grupamentos distintos treinados em cada dia da semana do usuário, via JOIN
completo (Decisão D — nunca lido de coluna, sempre calculado). Devolve por
`dia_semana` pra o front não ter que cruzar nada:

```ts
export async function buscarResumoMusculos(
  fkUsuario: string
): Promise<{ dia_semana: number; grupamentos: string[] }[]> {
  const resultado = await pool.query<{ dia_semana: number; nome: string }>(
    `SELECT DISTINCT d.dia_semana, g.nome
     FROM Divisao d
     JOIN DivisaoExercicio de ON de.fk_divisao = d.id_divisao
     JOIN Exercicio e ON e.id_exercicio = de.fk_exercicio
     JOIN GrupamentoMuscular g ON g.id_grupamento = e.fk_grupamento
     WHERE d.fk_usuario = $1
     ORDER BY d.dia_semana, g.nome`,
    [fkUsuario]
  );

  const porDia = new Map<number, string[]>();
  for (const linha of resultado.rows) {
    const lista = porDia.get(linha.dia_semana) ?? [];
    lista.push(linha.nome);
    porDia.set(linha.dia_semana, lista);
  }
  return Array.from(porDia, ([dia_semana, grupamentos]) => ({
    dia_semana,
    grupamentos,
  }));
}
```

> Acrescentar `ExercicioDoDia` em `indexTypes.ts` (`DivisaoExercicio` +
> `nome_exercicio` + `nome_grupamento`) — mesmo padrão de
> `ExercicioComGrupamento` do Passo 0.

---

## Passo 3 — `server/src/controllers/divisionController.ts` (acrescentar)

**Dono da divisão sempre confirmado antes de tocar em `DivisaoExercicio`**
— igual ao cuidado da S3 com `req.userId`, mas agora em duas etapas: primeiro
confere que o `id_divisao` da URL pertence ao usuário do token, só depois
mexe nos exercícios. Sem essa checagem, um usuário poderia montar a rotina
de outro só adivinhando um UUID.

```ts
async function confirmarDono(idDivisao: string, fkUsuario: string) {
  const divisoes = await divisionModel.buscarPorUsuario(fkUsuario);
  return divisoes.some((d) => d.id_divisao === idDivisao);
}

export async function listarExercicios(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  if (!(await confirmarDono(id, req.userId as string))) {
    return res.status(404).json({ erro: 'Divisão não encontrada' });
  }
  const exercicios = await divisionModel.buscarExerciciosDoDia(id);
  return res.status(200).json({ exercicios });
}

export async function salvarExercicios(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { exercicios } = req.body as { exercicios: DivisaoExercicioInput[] };

  if (!(await confirmarDono(id, req.userId as string))) {
    return res.status(404).json({ erro: 'Divisão não encontrada' });
  }
  if (!Array.isArray(exercicios)) {
    return res.status(400).json({ erro: 'Corpo precisa ter um array "exercicios"' });
  }
  for (const item of exercicios) {
    if (typeof item.fk_exercicio !== 'number') {
      return res.status(400).json({ erro: 'fk_exercicio precisa ser um número' });
    }
  }

  try {
    const salvos = await divisionModel.substituirExerciciosDoDia(id, exercicios);
    return res.status(200).json({ exercicios: salvos });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao salvar exercícios da divisão' });
  }
}

export async function resumoMusculos(req: AuthenticatedRequest, res: Response) {
  const resumo = await divisionModel.buscarResumoMusculos(req.userId as string);
  return res.status(200).json({ resumo });
}
```

---

## Passo 4 — `server/src/routes/divisionRoutes.ts` (acrescentar)

```ts
router.get('/divisions/:id/exercises', autenticar, listarExercicios);
router.put('/divisions/:id/exercises', autenticar, salvarExercicios);
router.get('/divisions/muscle-summary', autenticar, resumoMusculos);
```

> **Cuidado com ordem de rota no Express:** `/divisions/muscle-summary`
> precisa vir **antes** de `/divisions/:id/exercises` seria irrelevante aqui
> (prefixos diferentes), mas fica registrada depois de `/divisions` e
> `/divisions/:id/exercises` de qualquer forma — como `:id` é um segmento
> fixo seguido de `/exercises`, não colide com `/muscle-summary` (que não
> tem esse segundo segmento). Só checar se, no futuro, alguém criar
> `/divisions/:algumaCoisa` sem sufixo — aí a ordem passaria a importar.

**Teste manual:** `PUT /divisions/:id/exercises` com 2-3 `fk_exercicio`
existentes (pegos do `GET /exercises`), depois `GET` no mesmo endpoint
confere a ordem. `GET /divisions/muscle-summary` já mostra os grupamentos
do dia que acabou de ganhar exercícios.

---

## Passo 5 — Testes de unidade (matriz RF02, parte 2)

Mesmo runner da S2/S3. Precisa de uma divisão existente antes de testar
exercícios — helper novo que registra, loga e cria um dia via `PUT
/divisions`, devolvendo o `id_divisao`.

```ts
async function registrarComDivisao() {
  const { token } = await registrarELogar();
  const divisao = await request(app)
    .put('/divisions')
    .set('Authorization', `Bearer ${token}`)
    .send({ divisoes: [{ dia_semana: 1, nome: 'Peito e tríceps' }] });
  return { token, idDivisao: divisao.body.divisoes[0].id_divisao as string };
}
```

```ts
test('GET /exercises devolve catálogo com grupamento', async () => {
  const { token } = await registrarELogar();
  const resposta = await request(app)
    .get('/exercises')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(resposta.status, 200);
  assert.ok(resposta.body.exercicios.length > 0);
  assert.ok(resposta.body.exercicios[0].nome_grupamento);
});
```

```ts
test('PUT /divisions/:id/exercises salva e GET devolve na ordem certa', async () => {
  const { token, idDivisao } = await registrarComDivisao();
  const catalogo = await request(app)
    .get('/exercises')
    .set('Authorization', `Bearer ${token}`);
  const [ex1, ex2] = catalogo.body.exercicios;

  const resposta = await request(app)
    .put(`/divisions/${idDivisao}/exercises`)
    .set('Authorization', `Bearer ${token}`)
    .send({ exercicios: [{ fk_exercicio: ex1.id_exercicio }, { fk_exercicio: ex2.id_exercicio }] });

  assert.equal(resposta.status, 200);
  assert.equal(resposta.body.exercicios[0].ordem, 1);
  assert.equal(resposta.body.exercicios[0].fk_exercicio, ex1.id_exercicio);
  assert.equal(resposta.body.exercicios[1].ordem, 2);
});
```

```ts
test('PUT /divisions/:id/exercises em divisão de outro usuário retorna 404', async () => {
  const { idDivisao } = await registrarComDivisao();
  const { token: tokenOutro } = await registrarELogar();

  const resposta = await request(app)
    .put(`/divisions/${idDivisao}/exercises`)
    .set('Authorization', `Bearer ${tokenOutro}`)
    .send({ exercicios: [] });

  assert.equal(resposta.status, 404);
});
```

```ts
test('GET /divisions/muscle-summary reflete os exercícios salvos', async () => {
  const { token, idDivisao } = await registrarComDivisao();
  const catalogo = await request(app)
    .get('/exercises')
    .set('Authorization', `Bearer ${token}`);
  const exercicio = catalogo.body.exercicios[0];

  await request(app)
    .put(`/divisions/${idDivisao}/exercises`)
    .set('Authorization', `Bearer ${token}`)
    .send({ exercicios: [{ fk_exercicio: exercicio.id_exercicio }] });

  const resumo = await request(app)
    .get('/divisions/muscle-summary')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(resumo.status, 200);
  assert.equal(resumo.body.resumo[0].grupamentos[0], exercicio.nome_grupamento);
});
```

Salvar num arquivo novo, `server/src/__tests__/exercise.test.ts`, reaproveitando
o helper `registrarELogar` (mesma ideia da S3 — se preferir, extrair os
helpers pra um `testHelpers.ts` compartilhado agora que são usados em dois
arquivos).

---

## Passo 6 — Front: `client/src/services/api.ts` (acrescentar)

```ts
export interface Exercicio {
  id_exercicio: number;
  nome_exercicio: string;
  fk_grupamento: number;
  nome_grupamento: string;
}

export interface ExercicioDoDia {
  id_divisao_exercicio: number;
  fk_exercicio: number;
  ordem: number;
  nome_exercicio: string;
  nome_grupamento: string;
}

export function buscarExercicios(fkGrupamento?: number) {
  const query = fkGrupamento ? `?grupamento=${fkGrupamento}` : '';
  return apiFetch(`/exercises${query}`) as Promise<{ exercicios: Exercicio[] }>;
}

export function buscarExerciciosDaDivisao(idDivisao: string) {
  return apiFetch(`/divisions/${idDivisao}/exercises`) as Promise<{
    exercicios: ExercicioDoDia[];
  }>;
}

export function salvarExerciciosDaDivisao(idDivisao: string, fkExercicios: number[]) {
  return apiFetch(`/divisions/${idDivisao}/exercises`, {
    method: 'PUT',
    body: { exercicios: fkExercicios.map((fk_exercicio) => ({ fk_exercicio })) },
  }) as Promise<{ exercicios: ExercicioDoDia[] }>;
}

export function buscarResumoMusculos() {
  return apiFetch('/divisions/muscle-summary') as Promise<{
    resumo: { dia_semana: number; grupamentos: string[] }[];
  }>;
}
```

---

## Passo 7 — Front: tela de exercícios por dia

**Onde encaixar na navegação:** ainda não há `react-router` (adiado desde
a S3). Caminho mais simples que não força roteamento cedo demais: em
`DivisionView`, cada linha de dia preenchido ganha um botão "Exercícios"
que abre um segundo componente (`DayExercisesView` ou um `Dialog` do MUI)
recebendo o `id_divisao` daquele dia. Decidir Dialog vs. tela separada é
livre — o roteiro assume **Dialog**, por não exigir estado de navegação
nenhum.

**`client/src/components/DayExercisesDialog.tsx`** — carrega o catálogo
(Passo 6) e os exercícios já salvos daquele dia; adicionar empurra pro fim
da lista, remover tira, subir/descer troca posição no array (mais simples
que drag-and-drop pra um MVP — arrastar é melhoria futura, não critério de
aceite). Salvar manda a lista na ordem atual.

```tsx
import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem,
  ListItemText, IconButton, MenuItem, TextField, Stack,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../services/api';
import { FeedbackAlert } from './FeedbackAlert';

interface Props {
  idDivisao: string;
  nomeDia: string;
  aberto: boolean;
  onFechar: () => void;
}

export function DayExercisesDialog({ idDivisao, nomeDia, aberto, onFechar }: Props) {
  const [catalogo, setCatalogo] = useState<api.Exercicio[]>([]);
  const [selecionados, setSelecionados] = useState<api.Exercicio[]>([]);
  const [paraAdicionar, setParaAdicionar] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    async function carregar() {
      try {
        const [{ exercicios: todos }, { exercicios: doDia }] = await Promise.all([
          api.buscarExercicios(),
          api.buscarExerciciosDaDivisao(idDivisao),
        ]);
        setCatalogo(todos);
        setSelecionados(
          doDia.map((d) => todos.find((e) => e.id_exercicio === d.fk_exercicio)!)
        );
      } catch (erro) {
        setErro(erro instanceof Error ? erro.message : 'Erro ao carregar');
      }
    }
    carregar();
  }, [aberto, idDivisao]);

  function adicionar() {
    const exercicio = catalogo.find((e) => String(e.id_exercicio) === paraAdicionar);
    if (!exercicio) return;
    setSelecionados([...selecionados, exercicio]);
    setParaAdicionar('');
  }

  function remover(index: number) {
    setSelecionados(selecionados.filter((_, i) => i !== index));
  }

  function mover(index: number, direcao: -1 | 1) {
    const alvo = index + direcao;
    if (alvo < 0 || alvo >= selecionados.length) return;
    const nova = [...selecionados];
    [nova[index], nova[alvo]] = [nova[alvo], nova[index]];
    setSelecionados(nova);
  }

  async function salvar() {
    setSalvando(true);
    setErro('');
    try {
      await api.salvarExerciciosDaDivisao(
        idDivisao,
        selecionados.map((e) => e.id_exercicio)
      );
      onFechar();
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={aberto} onClose={onFechar} fullWidth maxWidth="sm">
      <DialogTitle>Exercícios — {nomeDia}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1}>
            <TextField
              select
              label="Adicionar exercício"
              value={paraAdicionar}
              onChange={(e) => setParaAdicionar(e.target.value)}
              fullWidth
            >
              {catalogo.map((e) => (
                <MenuItem key={e.id_exercicio} value={e.id_exercicio}>
                  {e.nome_exercicio} ({e.nome_grupamento})
                </MenuItem>
              ))}
            </TextField>
            <Button onClick={adicionar} disabled={!paraAdicionar}>
              Adicionar
            </Button>
          </Stack>

          <List>
            {selecionados.map((exercicio, i) => (
              <ListItem
                key={`${exercicio.id_exercicio}-${i}`}
                secondaryAction={
                  <>
                    <IconButton onClick={() => mover(i, -1)} disabled={i === 0}>
                      <ArrowUpwardIcon />
                    </IconButton>
                    <IconButton onClick={() => mover(i, 1)} disabled={i === selecionados.length - 1}>
                      <ArrowDownwardIcon />
                    </IconButton>
                    <IconButton onClick={() => remover(i)}>
                      <DeleteIcon />
                    </IconButton>
                  </>
                }
              >
                <ListItemText
                  primary={`${i + 1}. ${exercicio.nome_exercicio}`}
                  secondary={exercicio.nome_grupamento}
                />
              </ListItem>
            ))}
          </List>

          <FeedbackAlert erro={erro} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onFechar}>Cancelar</Button>
        <Button variant="contained" onClick={salvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar exercícios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

**Em `DivisionView.tsx`** — cada dia preenchido ganha o botão que abre o
Dialog, e a lista de grupamentos do resumo (Passo 6, `buscarResumoMusculos`)
aparece como `Chip`s abaixo do nome do dia assim que existir algo salvo:

```tsx
// estado novo, ao lado dos que já existem
const [resumo, setResumo] = useState<{ dia_semana: number; grupamentos: string[] }[]>([]);
const [dialogAberto, setDialogAberto] = useState<{ dia: number; idDivisao: string } | null>(null);

// dentro do carregar() existente, além de buscarDivisoes()
const { resumo } = await api.buscarResumoMusculos();
setResumo(resumo);

// no JSX, ao lado de cada TextField de dia com nome preenchido e já salvo
// (precisa do id_divisao daquele dia — guardar junto do nome ao carregar,
// não só a string, senão não dá pra abrir o Dialog)
```

> Esse último trecho não é um snippet fechado de propósito: exige trocar
> `nomes: string[]` por algo como `dias: { id_divisao?: string; nome: string
> }[]` no estado de `DivisionView`, o que mexe em várias linhas já
> existentes da S3. Ajustar o estado primeiro, comparando com o
> `DivisionView.tsx` atual, depois plugar o botão/Dialog — é mais seguro que
> copiar um JSX pronto que pode não bater com o que já está na tela.

---

## Passo 8 — Fechar a semana

1. Testar pela interface: abrir "Minha Divisão" → dia com nome salvo mostra
   botão "Exercícios" → abrir Dialog → adicionar 3-4 exercícios de
   grupamentos diferentes → reordenar com as setas → salvar → fechar e
   reabrir o Dialog → ordem e itens continuam → voltar pra tela principal →
   chips do resumo de músculos aparecem no dia.
2. Rodar `npm run test` no server — suíte verde (S2 + S3 + S4 juntas).
3. Rodar `npm run build` nos dois lados — sem erro de tipo.
4. Print da rotina montada (dia com 3+ exercícios e resumo de músculos
   visível) — figura pro capítulo de resultados, conforme o critério de
   aceite pede.
5. Commit + push. Sugestão: um commit pra backend (catálogo + vínculo +
   resumo) e outro pro Dialog de exercícios, espelhando as duas sessões.

---

## Ordem sugerida pra essa sessão

1. **Sessão A (backend):** Passos 0 → 5 (types → exerciseModel/controller/
   rotas → divisionModel/controller/rotas para exercícios + resumo →
   testes). Testar cada endpoint manualmente antes do automatizado.
2. **Sessão B (frontend):** Passos 6 → 7 (api.ts → Dialog → integração em
   `DivisionView`), já contra o backend funcionando da Sessão A.
3. Passo 8 fecha a semana, idealmente ao final da Sessão B.

## Armadilhas comuns desta semana

- Tentar reaproveitar o padrão UPSERT do `substituirSemana` (S3) em
  `substituirExerciciosDoDia` — aqui não precisa: `DivisaoExercicio` ainda
  não é referenciada por nenhuma FK filha, então apagar-e-reinserir é
  seguro e mais simples. Não é a mesma decisão da S3 por engano de cópia.
- Esquecer de checar `confirmarDono` antes de listar/salvar exercícios de
  uma `id_divisao` vinda da URL — sem isso, qualquer usuário logado edita a
  rotina de qualquer outro só sabendo (ou adivinhando) o UUID.
- Calcular o resumo de músculos no front, cruzando `catálogo` +
  `exercíciosDoDia` na mão — a Decisão D pede que isso seja sempre uma
  consulta no backend (`buscarResumoMusculos`), não estado derivado no
  cliente.
- Deixar `ordem` vir do índice do array errado (ex.: começar em 0 e gravar
  0 igual pra dois itens por erro de off-by-one) — usar `i + 1` como no
  Passo 2, ou qualquer convenção, mas testar explicitamente que a ordem
  salva bate com a enviada (já coberto no teste do Passo 5).
- Adicionar `react-router` só pra essa tela de exercícios — não é
  necessário ainda; um Dialog resolve sem mexer na decisão de roteamento
  adiada da S3.
