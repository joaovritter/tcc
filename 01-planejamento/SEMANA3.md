# Semana 3 — Roteiro de implementação (F2a Divisão Semanal — RF02)

> Isto é um **roteiro com código de exemplo**, não um copia-e-cola cego. Cada
> seção explica a decisão por trás do trecho e depois mostra o arquivo
> inteiro pra você comparar com o que digitou. Adapte nomes/detalhes ao seu
> gosto — o que importa é entender o porquê de cada linha. Marque as caixas
> conforme for terminando. Cards correspondentes no Trello: S3.

> **Por que essa semana importa:** é o primeiro CRUD "de verdade" do
> sistema, e o primeiro dado que pertence a um usuário (`fk_usuario` em
> `Divisao`, já usando `req.userId` do middleware da S2). O padrão de
> model/controller/rotas fixado aqui (e a decisão de salvar a semana inteira
> numa transação) se repete em quase toda feature daqui pra frente.

> **Decisão vigente (09/08):** `Divisao` **não tem** coluna `muscles[]` — os
> grupamentos treinados em cada dia são derivados via JOIN
> `Divisao → DivisaoExercicio → Exercicio → GrupamentoMuscular`. Como essa
> tabela intermediária só ganha linhas na S4, o resumo de músculos fica
> **vazio** por enquanto — é esperado, não é bug. Ver
> [`DECISAO-MUSCLES-DIVISIONS.md`](./DECISAO-MUSCLES-DIVISIONS.md) (Opção D).

> **Design decidido em 19/08:** o front desta semana (Passo 6) já usa a base
> de design de [`DESIGN-BASE.md`](./DESIGN-BASE.md) — MUI + sidebar
> flutuante (`AppShell`), que precisa estar implementada **antes** de
> começar o Passo 6 aqui (`theme.ts`, `PageLayout`, `FeedbackAlert`,
> `Sidebar`, `AppShell` — Passos 0 a 7 daquele arquivo). Os Passos 0–5 deste
> arquivo (backend) não dependem disso e podem ser feitos em qualquer ordem.

Critério de aceite (card 🎯 ENTREGÁVEL S3):
- [ ] `GET /divisions` e `PUT /divisions` funcionando (em transação)
- [ ] Tela Minha Divisão salva e recarrega a semana toda
- [ ] Validações: `dia_semana` 0–6, nome obrigatório, sem dois registros no mesmo dia
- [ ] Sem coluna `muscles[]` — músculos derivados via JOIN, estado vazio até a S4 (Decisão D)
- [ ] Teste de unidade do CRUD passando (matriz RF02)

---

## Passo 0 — `server/src/types/indexTypes.ts`

Acrescentar a interface da `Divisao`, espelhando `schema.sql`. Segue o
mesmo padrão da `Usuario`/`TokenPayload` da S2: o tipo existe pra pegar erro
de coluna errada em tempo de compilação, não em runtime.

```ts
export interface Divisao {
  id_divisao: string;
  fk_usuario: string;
  dia_semana: number;
  nome: string;
}
```

**O formato que o front manda no `PUT`** não tem `id_divisao` nem
`fk_usuario` — quem decide o dono é o token, e o id é gerado (ou mantido)
pelo backend. Separar esse tipo evita que o controller aceite um payload
tentando escrever a divisão de outro usuário.

```ts
export interface DivisaoInput {
  dia_semana: number;
  nome: string;
}
```

### Trecho novo em `server/src/types/indexTypes.ts`

```ts
export interface Divisao {
  id_divisao: string;
  fk_usuario: string;
  dia_semana: number;
  nome: string;
}

export interface DivisaoInput {
  dia_semana: number;
  nome: string;
}
```

---

## Passo 1 — `server/src/models/divisionModel.ts`

Só SQL aqui — igual ao `userModel.ts` da S2. O ponto novo é a
**transação**: o `PUT /divisions` substitui a semana inteira de uma vez
(apaga tudo que era do usuário e insere de novo), e isso só é seguro dentro
de `BEGIN`/`COMMIT` — se o insert do terceiro dia falhar, os dois primeiros
não podem ter ficado gravados sozinhos.

**`buscarPorUsuario`** — lista as divisões do usuário logado, ordenadas por
dia da semana (facilita o front montar a grade sem reordenar no cliente).

```ts
export async function buscarPorUsuario(fkUsuario: string): Promise<Divisao[]> {
  const resultado = await pool.query<Divisao>(
    'SELECT * FROM Divisao WHERE fk_usuario = $1 ORDER BY dia_semana',
    [fkUsuario]
  );
  return resultado.rows;
}
```

**`substituirSemana`** — recebe a lista completa da semana e troca tudo
numa transação. Pega um client do pool (não o `pool.query` direto) porque
`BEGIN`/`COMMIT`/`ROLLBACK` precisam rodar na **mesma conexão** — usar o
pool normal poderia mandar cada comando pra uma conexão diferente.

```ts
export async function substituirSemana(
  fkUsuario: string,
  divisoes: DivisaoInput[]
): Promise<Divisao[]> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM Divisao WHERE fk_usuario = $1', [fkUsuario]);

    const inseridas: Divisao[] = [];
    for (const divisao of divisoes) {
      const resultado = await client.query<Divisao>(
        `INSERT INTO Divisao (fk_usuario, dia_semana, nome)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [fkUsuario, divisao.dia_semana, divisao.nome]
      );
      inseridas.push(resultado.rows[0]);
    }

    await client.query('COMMIT');
    return inseridas;
  } catch (erro) {
    await client.query('ROLLBACK');
    throw erro;
  } finally {
    client.release();
  }
}
```

### Arquivo completo — `server/src/models/divisionModel.ts`

```ts
import { pool } from '../config/db';
import { Divisao, DivisaoInput } from '../types/indexTypes';

export async function buscarPorUsuario(fkUsuario: string): Promise<Divisao[]> {
  const resultado = await pool.query<Divisao>(
    'SELECT * FROM Divisao WHERE fk_usuario = $1 ORDER BY dia_semana',
    [fkUsuario]
  );
  return resultado.rows;
}

export async function substituirSemana(
  fkUsuario: string,
  divisoes: DivisaoInput[]
): Promise<Divisao[]> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM Divisao WHERE fk_usuario = $1', [fkUsuario]);

    const inseridas: Divisao[] = [];
    for (const divisao of divisoes) {
      const resultado = await client.query<Divisao>(
        `INSERT INTO Divisao (fk_usuario, dia_semana, nome)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [fkUsuario, divisao.dia_semana, divisao.nome]
      );
      inseridas.push(resultado.rows[0]);
    }

    await client.query('COMMIT');
    return inseridas;
  } catch (erro) {
    await client.query('ROLLBACK');
    throw erro;
  } finally {
    client.release();
  }
}
```

---

## Passo 2 — `server/src/controllers/divisionController.ts`

Regra de negócio: validar o payload inteiro **antes** de abrir a
transação — se algo estiver errado, nem chega a apagar a semana antiga do
usuário.

**`listar`** — rota protegida, usa `req.userId` (posto pelo middleware
`autenticar` da S2) pra filtrar só as divisões do dono do token. Nunca
recebe o id do usuário como parâmetro de URL/query — isso abriria brecha
pra um usuário ler a divisão de outro só trocando um id na requisição.

```ts
export async function listar(req: AuthenticatedRequest, res: Response) {
  const divisoes = await divisionModel.buscarPorUsuario(req.userId as string);
  return res.status(200).json({ divisoes });
}
```

**`salvar`** — valida cada item da lista: `nome` obrigatório, `dia_semana`
entre 0 e 6, e sem dois dias repetidos no mesmo payload (`Set` do tamanho
da lista de dias — se encolher, tem duplicata). Essas três checagens
espelham o CHECK do banco (`dia_semana BETWEEN 0 AND 6`) e a regra de
negócio que o banco sozinho não garante (não repetir dia).

```ts
export async function salvar(req: AuthenticatedRequest, res: Response) {
  const { divisoes } = req.body as { divisoes: DivisaoInput[] };

  if (!Array.isArray(divisoes)) {
    return res.status(400).json({ erro: 'Corpo precisa ter um array "divisoes"' });
  }

  for (const divisao of divisoes) {
    if (!divisao.nome || !divisao.nome.trim()) {
      return res.status(400).json({ erro: 'Todo dia precisa de um nome' });
    }
    if (
      typeof divisao.dia_semana !== 'number' ||
      divisao.dia_semana < 0 ||
      divisao.dia_semana > 6
    ) {
      return res.status(400).json({ erro: 'dia_semana precisa estar entre 0 e 6' });
    }
  }

  const dias = divisoes.map((d) => d.dia_semana);
  if (new Set(dias).size !== dias.length) {
    return res.status(400).json({ erro: 'Não pode haver dois registros no mesmo dia' });
  }

  try {
    const salvas = await divisionModel.substituirSemana(req.userId as string, divisoes);
    return res.status(200).json({ divisoes: salvas });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao salvar divisão semanal' });
  }
}
```

### Arquivo completo — `server/src/controllers/divisionController.ts`

```ts
import { Response } from 'express';
import * as divisionModel from '../models/divisionModel';
import { AuthenticatedRequest } from '../middlewares/auth';
import { DivisaoInput } from '../types/indexTypes';

export async function listar(req: AuthenticatedRequest, res: Response) {
  const divisoes = await divisionModel.buscarPorUsuario(req.userId as string);
  return res.status(200).json({ divisoes });
}

export async function salvar(req: AuthenticatedRequest, res: Response) {
  const { divisoes } = req.body as { divisoes: DivisaoInput[] };

  if (!Array.isArray(divisoes)) {
    return res.status(400).json({ erro: 'Corpo precisa ter um array "divisoes"' });
  }

  for (const divisao of divisoes) {
    if (!divisao.nome || !divisao.nome.trim()) {
      return res.status(400).json({ erro: 'Todo dia precisa de um nome' });
    }
    if (
      typeof divisao.dia_semana !== 'number' ||
      divisao.dia_semana < 0 ||
      divisao.dia_semana > 6
    ) {
      return res.status(400).json({ erro: 'dia_semana precisa estar entre 0 e 6' });
    }
  }

  const dias = divisoes.map((d) => d.dia_semana);
  if (new Set(dias).size !== dias.length) {
    return res.status(400).json({ erro: 'Não pode haver dois registros no mesmo dia' });
  }

  try {
    const salvas = await divisionModel.substituirSemana(req.userId as string, divisoes);
    return res.status(200).json({ divisoes: salvas });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao salvar divisão semanal' });
  }
}
```

---

## Passo 3 — `server/src/routes/divisionRoutes.ts`

Mesmo padrão de `authRoutes.ts`: rota fina, e as duas rotas passam por
`autenticar` — diferente de `/auth/register` e `/auth/login`, aqui não
existe versão pública.

```ts
router.get('/divisions', autenticar, listar);
router.put('/divisions', autenticar, salvar);
```

### Arquivo completo — `server/src/routes/divisionRoutes.ts`

```ts
import { Router } from 'express';
import { listar, salvar } from '../controllers/divisionController';
import { autenticar } from '../middlewares/auth';

const router = Router();

router.get('/divisions', autenticar, listar);
router.put('/divisions', autenticar, salvar);

export default router;
```

**Registrar no `server/src/app.ts`** ao lado das rotas que já existem:

```ts
import divisionRoutes from './routes/divisionRoutes';
// ...
app.use(divisionRoutes);
```

**Teste manual nesse ponto:** logar (S2) pra pegar um token, chamar
`PUT /divisions` com um array de 2–3 dias, depois `GET /divisions` e
conferir se voltou igual. Tentar `PUT` com dois dias repetidos e confirmar
`400`.

---

## Passo 4 — Testes de unidade (matriz RF02)

Segue o mesmo runner da S2 (`node:test` + `supertest`), no mesmo arquivo de
padrão (`server/src/__tests__/`). Cada teste registra um usuário novo
(`Date.now()` no e-mail) pra não colidir com dado de execuções anteriores,
igual à S2.

```ts
test('PUT /divisions salva a semana e GET devolve igual', async () => {
  const { token } = await registrarELogar();

  const resposta = await request(app)
    .put('/divisions')
    .set('Authorization', `Bearer ${token}`)
    .send({ divisoes: [
      { dia_semana: 1, nome: 'Peito e tríceps' },
      { dia_semana: 3, nome: 'Costas e bíceps' },
    ] });

  assert.equal(resposta.status, 200);
  assert.equal(resposta.body.divisoes.length, 2);

  const listagem = await request(app)
    .get('/divisions')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(listagem.body.divisoes.length, 2);
  assert.equal(listagem.body.divisoes[0].dia_semana, 1);
});
```

```ts
test('PUT /divisions com dia_semana fora de 0-6 retorna 400', async () => {
  const { token } = await registrarELogar();

  const resposta = await request(app)
    .put('/divisions')
    .set('Authorization', `Bearer ${token}`)
    .send({ divisoes: [{ dia_semana: 7, nome: 'Inválido' }] });

  assert.equal(resposta.status, 400);
});
```

```ts
test('PUT /divisions sem nome retorna 400', async () => {
  const { token } = await registrarELogar();

  const resposta = await request(app)
    .put('/divisions')
    .set('Authorization', `Bearer ${token}`)
    .send({ divisoes: [{ dia_semana: 0, nome: '' }] });

  assert.equal(resposta.status, 400);
});
```

```ts
test('PUT /divisions com dois registros no mesmo dia retorna 400', async () => {
  const { token } = await registrarELogar();

  const resposta = await request(app)
    .put('/divisions')
    .set('Authorization', `Bearer ${token}`)
    .send({ divisoes: [
      { dia_semana: 2, nome: 'Pernas' },
      { dia_semana: 2, nome: 'Pernas de novo' },
    ] });

  assert.equal(resposta.status, 400);
});
```

```ts
test('GET /divisions sem token retorna 401', async () => {
  const resposta = await request(app).get('/divisions');
  assert.equal(resposta.status, 401);
});
```

**Segunda chamada de `PUT` substitui a primeira** — cobre a regra
"substituir a semana inteira", não só "adicionar":

```ts
test('segundo PUT /divisions substitui a semana anterior', async () => {
  const { token } = await registrarELogar();

  await request(app)
    .put('/divisions')
    .set('Authorization', `Bearer ${token}`)
    .send({ divisoes: [{ dia_semana: 0, nome: 'Primeira versão' }] });

  const segunda = await request(app)
    .put('/divisions')
    .set('Authorization', `Bearer ${token}`)
    .send({ divisoes: [{ dia_semana: 5, nome: 'Segunda versão' }] });

  assert.equal(segunda.status, 200);
  assert.equal(segunda.body.divisoes.length, 1);
  assert.equal(segunda.body.divisoes[0].dia_semana, 5);
});
```

**Helper compartilhado** no topo do arquivo de teste, pra não repetir
registro+login em cada `test`:

```ts
async function registrarELogar() {
  const email = `div${Date.now()}${Math.random()}@exemplo.com`;
  await request(app).post('/auth/register').send({ nome: 'T', email, senha: '123456' });
  const login = await request(app).post('/auth/login').send({ email, senha: '123456' });
  return { token: login.body.token as string };
}
```

**Saída pro TCC:** print da suíte verde entra na matriz de rastreabilidade
(RF02), igual ao que já foi guardado na S2 pro RF01.

---

## Passo 5 — Front: `client/src/services/api.ts`

Acrescentar as duas funções de divisão, reaproveitando o `apiFetch` que já
injeta token — nenhuma mudança estrutural no arquivo, só cresce.

```ts
export interface Divisao {
  id_divisao: string;
  dia_semana: number;
  nome: string;
}

export function buscarDivisoes() {
  return apiFetch('/divisions') as Promise<{ divisoes: Divisao[] }>;
}

export function salvarDivisoes(divisoes: { dia_semana: number; nome: string }[]) {
  return apiFetch('/divisions', {
    method: 'PUT',
    body: { divisoes },
  }) as Promise<{ divisoes: Divisao[] }>;
}
```

---

## Passo 6 — Front: `client/src/views/DivisionView.tsx`

Já implementada usando a base de design (MUI + `AppShell`) — se você ainda
não tem `theme.ts`, `PageLayout`, `FeedbackAlert`, `Sidebar` e `AppShell`,
faça isso primeiro seguindo `DESIGN-BASE.md` (Passos 0 a 7). O resto desta
seção assume que essa base já existe.

**Grade fixa de 7 dias** (domingo=0 a sábado=6) — cada linha tem um
`TextField`; dia sem nome preenchido simplesmente não entra no array
mandado pro backend. Isso evita ter que gerenciar "adicionar linha"/
"remover linha" manualmente: a grade sempre tem 7 posições, só varia o que
está preenchido.

**Ao montar a tela**, busca as divisões salvas e popula os nomes nos dias
correspondentes — se o usuário já tinha configurado a semana antes, ela
recarrega igual (item do critério de aceite). A tela já vive dentro do
`AppShell` (sidebar + `PageLayout`), então não precisa se preocupar com
saudação/logout — só com o conteúdo em si. Erro/sucesso usam
`<FeedbackAlert>` em vez de `<p role="alert">` cru, e a lista de dias fica
dentro de um `<Card>` do MUI.

```tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, Typography, TextField, Button, Stack } from '@mui/material';
import * as api from '../services/api';
import { FeedbackAlert } from '../components/FeedbackAlert';

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function DivisionView() {
  const [nomes, setNomes] = useState<string[]>(Array(7).fill(''));
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    async function carregar() {
      try {
        const { divisoes } = await api.buscarDivisoes();
        const novosNomes = Array(7).fill('');
        for (const divisao of divisoes) {
          novosNomes[divisao.dia_semana] = divisao.nome;
        }
        setNomes(novosNomes);
      } catch (erro) {
        setErro(erro instanceof Error ? erro.message : 'Erro ao carregar');
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  async function handleSalvar() {
    setErro('');
    setSucesso(false);
    setSalvando(true);
    try {
      const divisoes = nomes
        .map((nome, dia_semana) => ({ dia_semana, nome: nome.trim() }))
        .filter((d) => d.nome.length > 0);
      await api.salvarDivisoes(divisoes);
      setSucesso(true);
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <Typography>Carregando...</Typography>;
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h2" gutterBottom>
          Minha Divisão
        </Typography>
        <Stack spacing={2}>
          {DIAS.map((dia, i) => (
            <TextField
              key={i}
              label={dia}
              placeholder="Ex.: Peito e tríceps"
              value={nomes[i]}
              onChange={(e) => {
                const novos = [...nomes];
                novos[i] = e.target.value;
                setNomes(novos);
              }}
              fullWidth
            />
          ))}
          <FeedbackAlert
            erro={erro}
            sucesso={sucesso ? 'Divisão salva com sucesso!' : undefined}
          />
          <Button variant="contained" onClick={handleSalvar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar semana'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
```

> **Resumo de músculos por dia** (aparece no card do Trello como referência
> visual) fica **fora de escopo desta semana** — depende de
> `DivisaoExercicio` existir (S4). Não implementar um placeholder fake; a
> ausência é esperada pela Decisão D.

**Ligar no `App.tsx`** — decide entre `AuthView` (deslogado) e `AppShell`
envolvendo `<DivisionView />` (logado). A saudação e o "Sair" já ficam
cobertos pelo chip de usuário no rodapé da sidebar, então `App.tsx` não
precisa mais deles:

```tsx
import { useAuth } from './context/AuthContext'
import { AuthView } from './views/AuthView'
import { DivisionView } from './views/DivisionView'
import { AppShell } from './components/AppShell'
import { PageLayout } from './components/PageLayout'
import { Typography } from '@mui/material'

function App() {
  const { usuario, carregando } = useAuth()

  if (carregando) {
    return (
      <PageLayout>
        <Typography>Carregando...</Typography>
      </PageLayout>
    )
  }

  if (!usuario) {
    return <AuthView />
  }

  return (
    <AppShell>
      <DivisionView />
    </AppShell>
  )
}

export default App
```

> Quando a S4 em diante adicionar mais telas (roteamento de verdade, com
> `react-router` — ainda não existe no projeto, avaliar só quando houver
> mais de uma tela logada pra navegar), o `App.tsx` passa a decidir **qual**
> tela renderizar dentro do `<AppShell>` de acordo com a rota, mas o
> `AppShell` em si não muda.

---

## Passo 7 — Fechar a semana

1. Testar o fluxo pela interface: logar → sidebar aparece (colapsada,
   expande no hover/Tab, "Minha divisão" ativa em verde, os outros três
   itens esmaecidos) → preencher 2–3 dias → salvar → F5 → os dias continuam
   preenchidos → apagar um dia e salvar de novo → confirma que sumiu (prova
   que é substituição, não soma).
2. Rodar `npm run test` no server — suíte verde (S2 + S3 juntas).
3. Rodar `npm run build` nos dois lados — sem erro de tipo.
4. Print da tela "Minha Divisão" preenchida (já com sidebar) — vira figura
   do capítulo de resultados.
5. Commit + push. Sugestão de mensagem: descrever as frentes (CRUD backend
   em transação + tela com a base de design) já que normalmente viram um
   commit por sessão.

---

## Ordem sugerida pra essa sessão

1. **Sessão A (backend):** Passos 0 → 4 (types → model com transação →
   controller → rotas → testes). Testar cada endpoint com o cliente HTTP
   antes do teste automatizado, igual à S2.
2. **Sessão B (frontend):** Passos 5 → 6 (api.ts → tela), já contra o
   backend funcionando da Sessão A.
3. Passo 7 fecha a semana, idealmente ao final da Sessão B.

## Armadilhas comuns desta semana

- Usar `pool.query` direto dentro do `substituirSemana` em vez de
  `pool.connect()` + `client.query` — sem isso, `BEGIN`/`COMMIT` não têm
  garantia de rodar na mesma conexão e a transação não protege nada de
  verdade.
- Esquecer o `client.release()` no `finally` — cada conexão não liberada
  fica presa até o pool esgotar.
- Validar `dia_semana` só no front — o backend precisa rejeitar sozinho
  (RNF03 vale aqui igual valeu pra senha na S2).
- Tentar "adicionar" um `muscles[]`/resumo de grupamentos nesta semana — a
  decisão já descartou isso (Opção D); a coluna simplesmente não existe até
  a S4 trazer `DivisaoExercicio`.
- Deixar `GET`/`PUT /divisions` sem `autenticar` — diferente de
  `/auth/register` e `/auth/login`, aqui não existe rota pública.
