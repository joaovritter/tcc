# Semana 6 — Roteiro de implementação (F3b Finalizar Treino + F4 Volume Semanal — RF04)

> Mesmo formato da S5, com uma mudança pedida pelo autor: **o arquivo completo
> aparece no fim do próprio Passo que mexe nele**, não num anexo no fim do
> documento. E todo Passo abre pelos **imports** — é a primeira coisa a
> atualizar, porque é ela que revela o que o Passo vai usar.
> Cards correspondentes no Trello: S6.

> **Ponto de partida:** S5 escrita — `GET /sessions/today`, `POST
> /sessions/start`, `POST /sessions/:id/sets`, `DELETE
> /sessions/:id/sets/:idSerie` e a `TodaySessionView` existem no repositório.
> **Mas a suíte não está verde e o banco vivo não é o do `schema.sql`.** O
> Passo 0 trata disso antes de qualquer coisa nova — sem ele a S6 constrói em
> cima de chão falso, porque o volume lê exatamente as séries que a S5 grava.

> **O que muda de natureza aqui:** até agora tudo era CRUD — escrever e ler de
> volta o que o usuário digitou. A S6 é a primeira semana com **regra de
> negócio de verdade**: contar séries válidas por grupamento e comparar com o
> limiar de 10 séries semanais [Schoenfeld]. Por isso ela estreia a pasta
> `server/src/services/` — o lugar da arquitetura MVC do TCC onde mora cálculo,
> não SQL de entidade nem HTTP.

> **Escopo da semana (o que NÃO entra):** o diagnóstico da IA é S7. Aqui o
> volume é só calculado e mostrado; ninguém manda nada pro Gemini ainda. Também
> não entra histórico de semanas passadas (S8) — o endpoint responde sempre a
> semana corrente.

Critério de aceite (card 🎯 ENTREGÁVEL S6):
- [ ] Finalizar sessão grava `data` + `duracao_total` (fecha RF03)
- [ ] `GET /metrics/weekly-volume` conta só séries válidas (`tipo = 'work'`) por
  grupamento
- [ ] Comparação com o limiar de 10 séries semanais [Schoenfeld]
- [ ] Testes de unidade = resultado igual ao cálculo manual (matriz RF04)
- [ ] Nenhum cálculo de volume/RPE/RIR no frontend (RNF03)

---

## Decisões novas desta semana

> **D10 — Semana de referência vai de segunda a domingo.** O limiar do
> [Schoenfeld] é "séries por grupamento **por semana**", então alguém precisa
> dizer onde a semana começa. Duas opções reais: janela móvel dos últimos 7
> dias, ou semana de calendário. **Fica semana de calendário, começando na
> segunda** — é o `date_trunc('week', ...)` do Postgres, que já é ISO
> (segunda-feira) sem configuração nenhuma. Motivo: janela móvel faz o número
> mudar sozinho todo dia à meia-noite, e o usuário não consegue "fechar" uma
> semana; com semana de calendário, segunda-feira zera o painel e a conta tem
> um começo e um fim que a pessoa reconhece. A S7 vai gravar esse mesmo valor
> em `DiagnosticoIA.semana_referencia`, então a definição precisa estar
> resolvida aqui.
>
> ⚠️ Não confundir com o `dia_semana` da `Divisao`, que é `0–6` com **domingo =
> 0** (vem do `getDay()` do JavaScript). São duas convenções diferentes vivendo
> no mesmo sistema de propósito: uma é posição na grade da rotina, a outra é
> recorte temporal de contagem. Nenhuma das duas se converte na outra.

> **D11 — Volume conta série registrada, treino finalizado ou não.** Tentador
> só contar treino com `completed = true`, mas isso significaria que o treino
> de hoje, em andamento, não aparece no painel — e a pessoa abre o painel
> justamente durante a semana pra decidir o que treinar amanhã. Série gravada é
> trabalho feito; `completed` serve pra fechar a duração (RF03), não pra
> validar volume (RF04). Consequência aceita: se o usuário esquecer de
> finalizar, o volume continua certo.

> **D12 — A duração é calculada pelo backend, não mandada pelo front.** `POST
> /sessions/:id/finish` não recebe corpo nenhum: o servidor faz `NOW() - data`
> no próprio `UPDATE`. Deixar o front mandar `duracao_total` seria mandar o
> cliente calcular um dado de conta (contra a RNF03) e, pior, deixaria o
> relógio do celular — fuso errado, horário adiantado — definir o histórico.

---

## Passo 0 — ⚠️ Reparos pendentes da S5 (fazer antes de escrever qualquer linha da S6)

- [x] **A suíte da S5 não está verde.** Rodando `npm run test` no `server`
hoje: **8 testes falham** (`division`, `exercise` e `session`). Nenhuma das
falhas é do teste — todas são de código de produção. E a S6 lê exatamente as
séries que a S5 grava, então consertar depois significaria testar o volume
contra dado errado. São quatro reparos pequenos e um comando.

- [x] **Reparo 1 — o banco vivo não é o do `schema.sql`.** O `schema.sql` já
tem `rpe INTEGER GENERATED ALWAYS AS (10 - rir) STORED`, mas no banco em uso a
coluna `rpe` ainda é comum (`is_generated = 'NEVER'`). O `npm run db:reset` do
Passo 0 da S5 nunca chegou a rodar. Sintoma exato: registrar série com `rir: 2`
volta `rpe: null` em vez de `8` — porque o `INSERT` do model (corretamente) não
preenche `rpe`, e sem a coluna gerada ninguém preenche. Conferir e corrigir:

```powershell
# 1) confirma o estado atual da coluna (tem que sair ALWAYS depois do reset)
psql -U postgres -d sistema_tcc -c "SELECT column_name, is_generated FROM information_schema.columns WHERE table_name = 'serietreino';"

# 2) recria o schema inteiro + seed (o projeto nao usa migrations)
cd server
npm run db:reset
```

> ⚠️ **Não use `$env:DATABASE_URL` no PowerShell.** A variável mora no
> `server/.env`, e o `.env` só é lido pelo Node, via `dotenv` — o terminal não
> enxerga nada dele. Com a variável vazia, o `psql` cai no padrão e tenta
> conectar com o **usuário do Windows**, pedindo uma senha que não existe. Por
> isso o comando acima passa `-U postgres -d sistema_tcc` explicitamente. Se
> preferir usar a URL, carregue-a antes, de dentro da pasta `server`:
> `$env:DATABASE_URL = (Select-String '^DATABASE_URL=' .env).Line.Split('=', 2)[1]`

> ⚠️ `db:reset` **apaga todos os dados** — é `DROP TABLE ... CASCADE` no topo
> do `schema.sql`. É de propósito e é seguro agora (só tem dado de teste), mas
> é a última semana em que isso vale sem pensar: depois que você começar a
> registrar treinos reais pra tirar as figuras do capítulo de resultados, um
> reset joga fora o dado das 5 figuras.

- [x] **Reparo 2 — `divisionController` chama uma função que não existe.** O
model exporta `buscarDivisaoPorUsuario`; o controller chama
`divisionModel.buscarPorUsuario` em dois lugares (`listarDivisoes` e
`confirmarDonoDivisao`). O erro só aparece em runtime: `TypeError:
divisionModel.buscarPorUsuario is not a function`. É a causa **sozinha** de 4
das 8 falhas — `GET /divisions`, `GET /divisions/muscle-summary` e as duas do
`PUT /divisions/:id/exercises` (que viram 500 em vez de 404, porque o
`confirmarDonoDivisao` estoura antes de responder). Arquivo completo no fim do
Passo.

- [x] **Reparo 3 — `validarSerie` recusa aquecimento sem nota.** A checagem é
`if (serie.rir !== null || serie.rpe !== null)`, mas quando o front **não manda
a chave**, o valor é `undefined`, e `undefined !== null` é `true`. Resultado:
série de aquecimento sem nota nenhuma — exatamente o caso que a D9 manda
aceitar — toma 400. O operador certo é o "loose" `!= null`, o único que trata
`null` e `undefined` como a mesma coisa:

```ts
// errado: undefined !== null é true, entao aquecimento SEM nota vira erro
if (serie.rir !== null || serie.rpe !== null) { ... }

// certo: `!= null` pega null E undefined de uma vez
if (serie.rir != null || serie.rpe != null) { ... }
```

> Vale reparar que o resto da função **já usa** a forma certa (`const
> informouRir = serie.rir != null`). É um deslize de uma linha só, não um
> mal-entendido — mas é o tipo de coisa que só o teste pega.

- [x] **Reparo 4 — o nome do parâmetro da rota não bate com o controller.** A
rota declara `/sessions/:id/sets/:idSerie` e o controller lê
`req.params.idSeries` (com "s"). `Number(undefined)` é `NaN`, então **todo
`DELETE` de série responde 400 "id da serie invalido"** — o botão da lixeira na
tela nunca funcionou. Nenhum teste da S5 cobre o `DELETE`, por isso passou
batido; o Passo 8 desta semana fecha esse buraco.

- [x] **Reparo 5 — decidir o nome da chave: `divisao` ou `divisaoHoje`.** Três
lugares discordavam: o tipo `TreinoDeHoje` (backend), o `sessionController` e o
`session.test.ts`, que lê `hoje.divisao` e por isso falha com `Cannot read
properties of undefined`.
**Fica `divisaoHoje`** (decidido em 10/09). O tipo, o controller, o `api.ts` e a
`TodaySessionView` já usam esse nome — então o desempate custa **uma linha**: em
`session.test.ts`, `resposta.body.hoje.divisao` vira
`resposta.body.hoje.divisaoHoje`. A alternativa era padronizar em `divisao`
(`hoje.divisaoHoje` é redundante, já que o wrapper se chama `hoje`), mas isso
custaria mexer em quatro arquivos por questão de estética.

- [x] Os reparos 3, 4 e 5 **não têm passo próprio** — entram junto nos Passos
3, 4, 9 e 11, que já reescrevem esses arquivos inteiros. Não faça duas vezes.

- [x] Só depois disso: `npm run test` no `server` tem que sair **verde nos 28
testes** antes de começar o Passo 1. Se ainda houver falha, ela é da S5 e não
da S6 — resolver antes de seguir.

### `server/src/controllers/divisionController.ts` (completo, com o Reparo 2)

```ts
import { Response } from "express";
import * as divisionModel from '../models/divisionModel';
import { AuthenticateRequest } from "../middlewares/auth";
import { DivisaoExercicioInput, DivisaoInput } from "../types/indexTypes";


export async function listarDivisoes(req: AuthenticateRequest, res: Response) {
    //REPARO 2: o model exporta buscarDivisaoPorUsuario, nao buscarPorUsuario
    const divisoes = await divisionModel.buscarDivisaoPorUsuario(req.userId as string);
    return res.status(200).json({ divisoes });
}


//valida os dados recebidos e substitui toda semana
export async function salvarDivisoes(req: AuthenticateRequest, res: Response) {
    const { divisoes } = req.body as { divisoes: DivisaoInput[] } //pega array do json

    if (!Array.isArray(divisoes)) {  //garante que o payload é array
        return res.status(400).json({ erro: 'Corpo precisa ter um array "divisoes"' });
    }

    for (const divisao of divisoes) { //garante campos preenchidos e valores no intervalo correto
        if (!divisao.nome || !divisao.nome.trim()) {
            return res.status(400).json({ erro: 'Todo dia precisa de um nome' });
        }
        if (typeof divisao.dia_semana !== 'number' || divisao.dia_semana < 0 || divisao.dia_semana > 6) {
            return res.status(400).json({ erro: 'dia_semana precisa estar entre 0 e 6' })
        }
    }

    //garante que não existe dois itens para o mesmo dia da semana
    const dias = divisoes.map((d) => d.dia_semana);
    if (new Set(dias).size !== dias.length) {
        return res.status(400).json({ erro: 'nao pode haver dois registros no mesmo dia' });
    }

    try { //tenta persistir no banco usando a funcao de substituição transacional
        const divisoesSalvas = await divisionModel.substituirSemana(req.userId as string, divisoes);
        return res.status(200).json({ divisoes: divisoesSalvas })
    } catch (erro) {
        console.error(erro)
        return res.status(500).json({ erro: 'erro ao salvar divisao semanal' });
    }
}


//confirma o dono antes de divisaoExercicio, confere que id_divisao da URL pertence ao usuario do token
async function confirmarDonoDivisao(idDivisao: string, fkUsuario: string) {
    //REPARO 2: mesma correcao aqui - era daqui que saia o 500 no lugar do 404
    const divisoes = await divisionModel.buscarDivisaoPorUsuario(fkUsuario);
    return divisoes.some((d) => d.id_divisao === idDivisao);
}

//lista exercicios de uma divisao
export async function listarExerciciosDivisao(req: AuthenticateRequest, res: Response) {
    const id = req.params.id as string;
    if (!(await confirmarDonoDivisao(id, req.userId as string))) {
        return res.status(404).json({ erro: 'Divisão não encontrada' });
    }
    const exercicios = await divisionModel.buscarExerciciosDoDia(id);
    return res.status(200).json({ exercicios });
}

//salva os exericios na divisao
export async function salvarExerciciosDivisao(req: AuthenticateRequest, res: Response) {
    const id = req.params.id as string;
    const { exercicios } = req.body as { exercicios: DivisaoExercicioInput[] }

    if (!(await confirmarDonoDivisao(id, req.userId as string))) {
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

//lista todos musculos da divisao
export async function listarResumoMusculos(req: AuthenticateRequest, res: Response) {
    const resumo = await divisionModel.buscarResumoMusculos(req.userId as string);
    return res.status(200).json({ resumo });
}
```

---

## Passo 1 — `server/src/types/indexTypes.ts`

- [x] **Imports: nenhum.** Este arquivo é a base da pirâmide — todo mundo
importa dele e ele não importa de ninguém. Se um dia ele precisar importar
algo do projeto, é sinal de que um tipo foi parar no lugar errado.

- [ ] **Só acrescentar, no fim do arquivo, o bloco de métricas.** Nada do que
já existe muda nesta semana — `Treino` já tem `completed` e `duracao_total`
(vieram do `schema.sql` da S1), então finalizar treino não pede tipo novo.

- [x] **`VolumeGrupamento`** — uma linha do painel. `series_validas` é
`number`, não `string`: o `COUNT` do Postgres é `BIGINT`, que o driver `pg`
devolveria como **string** pelo mesmo motivo do `NUMERIC` (precisão além do
`Number` do JS). O `::int` no `SELECT` do Passo 5 resolve isso na origem —
`INTEGER` o driver converte pra `number` normalmente. É a mesma armadilha da
`carga`, resolvida do outro lado.

- [x] **`atingiu_limiar` é campo do backend, não do front.** Poderia sair de
`series_validas >= 10` numa linha de JSX, mas aí a regra científica do TCC
(limiar de 10 séries [Schoenfeld]) passaria a morar na camada de Visão, contra
a RNF03. O backend manda a comparação já feita; a tela só pinta.

```ts
//============== metricas (RF04) =====================================

//uma linha do painel de volume semanal: quantas series validas o usuario
//acumulou naquele grupamento na semana de referencia (D10)
export interface VolumeGrupamento {
  id_grupamento: number;
  nome_grupamento: string;
  series_validas: number; // COUNT(...)::int - sem o ::int viria string (BIGINT)
  atingiu_limiar: boolean; // comparacao feita no backend (RNF03), nao na tela
}

//resposta inteira do GET /metrics/weekly-volume
export interface VolumeSemanal {
  semana_referencia: string; // 'YYYY-MM-DD' da segunda-feira da semana (D10)
  limiar: number; // 10 series/grupamento [Schoenfeld] - vai junto pra tela nao ter numero magico
  grupamentos: VolumeGrupamento[];
}
```

- [x] **`TreinoDeHoje` fica como está** (`divisaoHoje`) — quem se ajusta é o
teste, pelo Reparo 5. Nada muda neste arquivo além do bloco de métricas.

### `server/src/types/indexTypes.ts` (completo)

```ts
//============== usuario =====================================

export interface Usuario {
    id_usuario: string; //driver do pg sempre devolve UUID como string
    nome: string;
    email: string;
    senha_hash: string;
}

export interface UsuarioPublico {
    id_usuario: string;
    nome: string;
    email: string;
}

// Tipo de retorno do jwt.verify(), por padrão não tem formato definido
// Evita usar "any", garante que o TS reconheça "id"
export interface TokenPayload {
    id: string;
}



//============== divisao =====================================

export interface Divisao {
    id_divisao: string;
    fk_usuario: string;
    dia_semana: number;
    nome: string;
}

//formato que o front manda no put não tem id_divisao nem fk_usuario. esse tipo evita aceitar um payload que escreve divisao de outro usuario
export interface DivisaoInput {
    dia_semana: string;
    nome: string;
}



//============== divisao_exercicio e exercicio =====================================

export interface Exercicio {
    id_exercicio: number;
    nome_exercicio: string;
    fk_grupamento: number;
}

// GET /exercises devolve ja com nome do grupamento (JOIN), não só id
//evita o front buscar GrupamentoMuscular à parte pra exibir o filtro
export interface ExercicioComGrupamento extends Exercicio {
    nome_grupamento: string;
}

export interface DivisaoExercicio {
    id_divisao_exercicio: number;
    fk_divisao: string;
    fk_exercicio: number;
    ordem: number;
}

//payload do front pro PUT: sí o id do exercicio, evita mandar ordem duplicado
export interface DivisaoExercicioInput {
    fk_exercicio: number;
}

// GET /divisions/:id/exercises devolve já com nome do exercicio e do grupamento (JOIN)
// evita o front cruzar catalogo + DivisaoExercicio na mão pra montar a lista do dia
export interface ExercicioDoDia extends DivisaoExercicio {
    nome_exercicio: string;
    nome_grupamento: string;
}



//============== treino e serie =====================================

export interface Treino {
    id_treino: string;
    fk_usuario: string;
    fk_divisao: string | null;
    completed: boolean;
    data: string;
    duracao_total: number | null; // em minutos, calculado no backend ao finalizar (D12)
}

// faz o TS barrar um tipo inválido antes mesmo de o Postgres reclamar
export type TipoSerie = 'aquecimento' | 'feeder' | 'work';

export interface SerieTreino {
    id_serie: number;
    fk_treino: string;
    fk_exercicio: number;
    tipo: TipoSerie;
    carga: string; // NUMERIC volta como string no driver pg
    rpe: number | null;
    rir: number | null;
    repeticoes: number;
}

//rir/rpe: o usuário escolhe: UM dos dois pra reportar (nunca os dois, nunca nenhum em série válida)
// o controller resolve qual foi mandado e converte pro canônico antes de chamar o model.
export interface SerieTreinoInput {
    fk_exercicio: number;
    tipo: TipoSerie;
    carga: number; // NUMERIC volta como string no driver pg
    repeticoes: number;
    rpe?: number | null;
    rir?: number | null;

}

//nunca tem `rpe` (é coluna gerada, o Postgres calcula sozinho), só o canônico `rir`, ou `null` quando a série não é válida
export interface NovaSerieTreino {
  fk_exercicio: number;
  tipo: TipoSerie;
  carga: number;
  repeticoes: number;
  rir: number | null;
}

//serie com nome do exercicio, usada na resposta do GET /sessions/today para listar séries ja registradas na rotina do dia
export interface SerieComExercicio extends SerieTreino {
  nome_exercicio: string;
}

export interface TreinoDeHoje {
  dia_semana: number;
  divisaoHoje: Divisao | null;
  treino: Treino | null;
  exercicios: ExercicioDoDia[];
  series: SerieComExercicio[];
}



//============== metricas (RF04) =====================================

//uma linha do painel de volume semanal: quantas series validas o usuario
//acumulou naquele grupamento na semana de referencia (D10)
export interface VolumeGrupamento {
  id_grupamento: number;
  nome_grupamento: string;
  series_validas: number; // COUNT(...)::int - sem o ::int viria string (BIGINT)
  atingiu_limiar: boolean; // comparacao feita no backend (RNF03), nao na tela
}

//resposta inteira do GET /metrics/weekly-volume
export interface VolumeSemanal {
  semana_referencia: string; // 'YYYY-MM-DD' da segunda-feira da semana (D10)
  limiar: number; // 10 series/grupamento [Schoenfeld]
  grupamentos: VolumeGrupamento[];
}
```

---

## Passo 2 — `server/src/models/sessionModel.ts`

- [x] **Imports: nada novo.** O `Treino` já estava na lista de tipos importados
e o `pool` já está lá. Só entra uma função no fim do arquivo.

- [x] **`finalizarTreino`** — um `UPDATE` só, que faz três coisas de uma vez:
marca `completed`, calcula a duração e confirma o dono. Colocar `fk_usuario` no
`WHERE` (em vez de checar antes em outra query) fecha a corrida entre "conferi
o dono" e "gravei": não existe janela entre as duas.

- [x] **A duração sai do próprio banco** (D12): `NOW() - data` é um `INTERVAL`,
`EXTRACT(EPOCH FROM ...)` transforma em segundos, dividido por 60 vira minuto.
O `::int` no fim é obrigatório porque `duracao_total` é `INTEGER` e o `ROUND`
devolve `NUMERIC`.

- [x] **`GREATEST(1, ...)` não é frescura:** um treino de teste registrado e
finalizado em 20 segundos arredondaria pra `0`, e `0` é indistinguível de "não
sei a duração" na hora de ler o histórico. O piso de 1 minuto mantém a coluna
com significado.

- [x] **`AND completed = FALSE` no `WHERE`** é o que torna a operação
idempotente ao contrário do `start`: finalizar duas vezes não recalcula a
duração (o que a esticaria até o momento do segundo clique). A segunda chamada
não acha linha, `rows[0]` é `undefined`, e o controller devolve 409.

```ts
export async function finalizarTreino(
  idTreino: string,
  fkUsuario: string
): Promise<Treino | null> {
  const resultado = await pool.query<Treino>(
    `UPDATE Treino
     SET completed = TRUE,
         duracao_total = GREATEST(1, ROUND(EXTRACT(EPOCH FROM (NOW() - data)) / 60)::int)
     WHERE id_treino = $1 AND fk_usuario = $2 AND completed = FALSE
     RETURNING *`,
    [idTreino, fkUsuario]
  );
  return resultado.rows[0] ?? null;
}
```

### `server/src/models/sessionModel.ts` (completo)

```ts
import { pool } from '../config/db';
import { Treino, SerieTreino, NovaSerieTreino, SerieComExercicio } from '../types/indexTypes';


//o treino de hoje é o do usuário com completed = false e data no dia corrente
export async function buscarTreinoAberto(
    fkUsuario: string
): Promise<Treino | null> {
    const resultado = await pool.query<Treino>(
        `SELECT * FROM Treino
        WHERE fk_usuario = $1 AND completed = FALSE AND data::date = CURRENT_DATE
        ORDER BY data DESC
        LIMIT 1`,
        [fkUsuario]
    );
    return resultado.rows[0] ?? null;
}

// insere um treino vazio ligado (opcionalmente) à divisão do dia
export async function criarTreino(
  fkUsuario: string,
  fkDivisao: string | null
): Promise<Treino> {
  const resultado = await pool.query<Treino>(
    `INSERT INTO Treino (fk_usuario, fk_divisao)
     VALUES ($1, $2)
     RETURNING *`,
    [fkUsuario, fkDivisao]
  );
  return resultado.rows[0];
}

export async function buscarSeries(
  fkTreino: string
): Promise<SerieComExercicio[]> {
  const resultado = await pool.query<SerieComExercicio>(
    `SELECT s.*, e.nome_exercicio
     FROM SerieTreino s
     JOIN Exercicio e ON e.id_exercicio = s.fk_exercicio
     WHERE s.fk_treino = $1
     ORDER BY s.id_serie`,
    [fkTreino]
  );
  return resultado.rows;
}

//um insert sem transação ja basta
export async function registrarSerie(
  fkTreino: string,
  serie: NovaSerieTreino
): Promise<SerieTreino> {
  const resultado = await pool.query<SerieTreino>(
    `INSERT INTO SerieTreino
       (fk_treino, fk_exercicio, tipo, carga, repeticoes, rir)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      fkTreino,
      serie.fk_exercicio,
      serie.tipo,
      serie.carga,
      serie.repeticoes,
      serie.rir,
    ]
  );
  return resultado.rows[0]; // já vem com o rpe derivado, calculado pelo banco
}

export async function apagarSerie(
  fkTreino: string,
  idSerie: number
): Promise<boolean> {
  const resultado = await pool.query(
    'DELETE FROM SerieTreino WHERE fk_treino = $1 AND id_serie = $2',
    [fkTreino, idSerie]
  );
  return (resultado.rowCount ?? 0) > 0;
}

export async function buscarPorId(
  idTreino: string,
  fkUsuario: string
): Promise<Treino | null> {
  const resultado = await pool.query<Treino>(
    'SELECT * FROM Treino WHERE id_treino = $1 AND fk_usuario = $2',
    [idTreino, fkUsuario]
  );
  return resultado.rows[0] ?? null;
}

//S6 - fecha o treino: marca completed e grava a duracao calculada pelo proprio
//banco (D12: NOW() - data, nunca um numero vindo do celular do usuario).
//fk_usuario no WHERE confirma o dono na mesma query que grava - sem janela
//entre "conferi" e "escrevi". completed = FALSE torna a operacao unica: chamar
//de novo nao acha linha (rows[0] undefined) e vira 409 no controller, em vez de
//esticar a duracao ate o segundo clique.
export async function finalizarTreino(
  idTreino: string,
  fkUsuario: string
): Promise<Treino | null> {
  const resultado = await pool.query<Treino>(
    `UPDATE Treino
     SET completed = TRUE,
         duracao_total = GREATEST(1, ROUND(EXTRACT(EPOCH FROM (NOW() - data)) / 60)::int)
     WHERE id_treino = $1 AND fk_usuario = $2 AND completed = FALSE
     RETURNING *`,
    [idTreino, fkUsuario]
  );
  return resultado.rows[0] ?? null;
}
```

---

## Passo 3 — `server/src/controllers/sessionController.ts`

- [x] **Imports primeiro.** A lista atual importa quatro tipos que ninguém usa
(`Treino`, `SerieTreino`, `SerieComExercicio`) e o `Request` do express, que
também não aparece — o controller inteiro usa `AuthenticateRequest`. Limpar
agora, porque a partir da S7 esse arquivo só cresce:

```ts
import { Response } from 'express';
import * as sessionModel from '../models/sessionModel';
import * as divisionModel from '../models/divisionModel';
import { AuthenticateRequest } from '../middlewares/auth';
import {
  TipoSerie, SerieTreinoInput, NovaSerieTreino, TreinoDeHoje,
} from '../types/indexTypes';
```

- [x] **`TreinoDeHoje` passa a ser usado de verdade** (Reparo 5). Hoje ele é
importado e ignorado, e a resposta é montada num objeto literal solto — foi por
isso que a chave pôde divergir do tipo sem ninguém perceber. Tipar a variável
antes de responder faz o TS reclamar na hora se acontecer de novo:

```ts
const hoje: TreinoDeHoje = { dia_semana: diaSemana, divisaoHoje, treino, exercicios, series };
return res.status(200).json({ hoje });
```

- [x] **`validarSerie` recebe o Reparo 3** (`!= null` no lugar de `!== null`).
Uma linha, e ela é a diferença entre aceitar e recusar uma série de
aquecimento.

- [x] **`apagarSerie` recebe o Reparo 4** (`req.params.idSerie`, sem o "s"). O
nome tem que bater **exatamente** com o `:idSerie` declarado no Passo 4 — o
express não avisa quando não bate, só entrega `undefined`.

- [x] **`finalizarTreino` (POST)** — a única função nova do arquivo. Três
respostas possíveis, e a ordem das checagens importa: primeiro 404 (não existe
ou não é seu — a mesma resposta pros dois casos, pra não vazar a existência de
treino alheio), depois 409 se já estava fechado, e só então o `UPDATE`.

- [x] **Por que 409 e não 400 ou 200:** 400 diria que o corpo está malformado,
e não está — não tem corpo. 200 mentiria dizendo que finalizou agora. `409
Conflict` é literalmente "o estado atual do recurso não permite essa operação",
que é o caso. O front trata isso no Passo 11 recarregando a tela em vez de
mostrar erro vermelho.

```ts
export async function finalizarTreino(req: AuthenticateRequest, res: Response) {
  const idTreino = req.params.id as string;

  const treino = await sessionModel.buscarPorId(idTreino, req.userId as string);
  if (!treino) {
    return res.status(404).json({ erro: 'Treino não encontrado' });
  }
  if (treino.completed) {
    return res.status(409).json({ erro: 'Treino já foi finalizado' });
  }

  const finalizado = await sessionModel.finalizarTreino(idTreino, req.userId as string);
  return res.status(200).json({ treino: finalizado });
}
```

- [x] **Nada de `duracao_total` no corpo da requisição** (D12). Se um dia
alguém quiser deixar o usuário corrigir a duração na mão, isso é um `PATCH`
separado com validação própria — não este endpoint.

### `server/src/controllers/sessionController.ts` (completo, com os Reparos 3, 4 e 5)

```ts
import { Response } from 'express';
import * as sessionModel from '../models/sessionModel';
import * as divisionModel from '../models/divisionModel';
import { AuthenticateRequest } from '../middlewares/auth';
import {
    TipoSerie, SerieTreinoInput, NovaSerieTreino, TreinoDeHoje,
} from '../types/indexTypes';


//monta a tela inteira numa requisição: descobre dia da semana, divisao daquele dia,
//puxa os exercicios da rotina, devolve o treino aberto com series registradas (se ja tiver)
export async function treinoDeHoje(req: AuthenticateRequest, res: Response) {
    const fkUsuario = req.userId as string;
    const diaSemana = new Date().getDay(); // 0 = domingo

    const divisoes = await divisionModel.buscarDivisaoPorUsuario(fkUsuario);
    const divisaoHoje = divisoes.find((d) => d.dia_semana === diaSemana) ?? null;

    const exercicios = divisaoHoje ? await divisionModel.buscarExerciciosDoDia(divisaoHoje.id_divisao) : [];

    const treino = await sessionModel.buscarTreinoAberto(fkUsuario);
    const series = treino ? await sessionModel.buscarSeries(treino.id_treino) : [];

    //REPARO 5: a chave e 'divisaoHoje' em todo lugar. tipar a resposta faz o TS
    //travar se ela divergir do contrato de novo
    const hoje: TreinoDeHoje = { dia_semana: diaSemana, divisaoHoje, treino, exercicios, series };
    return res.status(200).json({ hoje });
}


//comeca o treino com divisao do dia, se ja tiver treino aberto devolve ele.
export async function comecarTreino(req: AuthenticateRequest, res: Response) {
    const fkUsuario = req.userId as string;

    const aberto = await sessionModel.buscarTreinoAberto(fkUsuario);
    if (aberto) {
        return res.status(200).json({ treino: aberto });
    }

    const diaSemana = new Date().getDay();
    const divisoes = await divisionModel.buscarDivisaoPorUsuario(fkUsuario);
    const divisaoHoje = divisoes.find((d) => d.dia_semana === diaSemana) ?? null;

    const treino = await sessionModel.criarTreino(
        fkUsuario,
        divisaoHoje ? divisaoHoje.id_divisao : null
    );
    return res.status(201).json({ treino });
}


//valida os campos basicos e resolve a nota de esforço.
//recebe rir/rpe do SerieTreinoInput e devolve um NovaSerieTreino ja com rir pronto pro model.
function validarSerie(
    serie: SerieTreinoInput
): { valor: NovaSerieTreino } | { erro: string } {
    const tipos: TipoSerie[] = ['aquecimento', 'feeder', 'work'];

    if (!tipos.includes(serie.tipo)) {
        return { erro: `Tipo de série inválido. Deve ser um dos seguintes: ${tipos.join(', ')}` };
    }
    if (typeof serie.fk_exercicio !== 'number') {
        return { erro: 'fk_exercicio deve ser um número.' };
    }
    if (typeof serie.carga !== 'number' || serie.carga < 0) {
        return { erro: 'carga precisa ser um número maior ou igual a zero' };
    }
    if (!Number.isInteger(serie.repeticoes) || serie.repeticoes <= 0) {
        return { erro: 'repeticoes precisa ser um inteiro maior que zero' };
    }

    const base = {
        fk_exercicio: serie.fk_exercicio,
        tipo: serie.tipo,
        carga: serie.carga,
        repeticoes: serie.repeticoes,
    };

    //só serie valida leva nota.
    if (serie.tipo !== 'work') {
        //REPARO 3: != null (loose) pega null E undefined. com !== null, uma serie
        //de aquecimento SEM as chaves rir/rpe caia aqui e tomava 400
        if (serie.rir != null || serie.rpe != null) {
            return { erro: 'Séries de aquecimento e feeder não recebem rir/rpe' };
        }
        return { valor: { ...base, rir: null } };
    }

    //serie valida: escolhe rir ou rpe, converte pra rir e devolve.
    const informouRir = serie.rir != null;
    const informouRpe = serie.rpe != null;

    if (informouRir === informouRpe) {
        return { erro: 'Informe rir ou rpe' }
    }

    if (informouRir) {
        if (serie.rir! < 0 || serie.rir! > 4) {
            return { erro: 'rir deve ser um número entre 0 e 4' };
        }
        return { valor: { ...base, rir: serie.rir! } };
    }

    const rirCalculado = 10 - serie.rpe!;
    if (rirCalculado < 0 || rirCalculado > 4) {
        return { erro: 'rpe deve resultar em um rir entre 0 e 4 (ou seja, rpe entre 6 e 10)' };
    }
    return { valor: { ...base, rir: rirCalculado } };
}


//Post: confirma dono, valida, insere
export async function registrarSerie(req: AuthenticateRequest, res: Response) {
    const idTreino = req.params.id as string;
    const serie = req.body as SerieTreinoInput;

    const treino = await sessionModel.buscarPorId(idTreino, req.userId as string);
    if (!treino) {
        return res.status(404).json({ erro: 'Treino não encontrado' });
    }

    const validado = validarSerie(serie);
    if ('erro' in validado) {
        return res.status(400).json({ erro: validado.erro });
    }

    try {
        const serieSalva = await sessionModel.registrarSerie(idTreino, validado.valor);
        return res.status(201).json({ serie: serieSalva });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao registrar série' });
    }
}


// Delete: req.params.idSerie chega como string
// Number() + Number.isNaN antes de ir pro banco evita mandar NaN pro Postgres
export async function apagarSerie(req: AuthenticateRequest, res: Response) {
    const idTreino = req.params.id as string;
    //REPARO 4: a rota declara :idSerie (sem "s"). com o nome errado isso era
    //sempre undefined -> NaN -> 400, e o botao da lixeira nunca apagou nada
    const idSerie = Number(req.params.idSerie);

    if (Number.isNaN(idSerie)) {
        return res.status(400).json({ erro: 'id da serie invalido' });
    }

    const treino = await sessionModel.buscarPorId(idTreino, req.userId as string);
    if (!treino) {
        return res.status(404).json({ erro: 'serie nao encontrada' });
    }

    const apagou = await sessionModel.apagarSerie(idTreino, idSerie);
    if (!apagou) {
        return res.status(404).json({ erro: 'serie nao encontrada' });
    }
    return res.status(204).send();
}


//S6 - fecha o treino (RF03). Sem corpo: a duracao e calculada pelo banco (D12).
//404 cobre "nao existe" e "nao e seu" com a mesma resposta, pra nao vazar a
//existencia de treino alheio. 409 e o estado errado, nao payload errado.
export async function finalizarTreino(req: AuthenticateRequest, res: Response) {
    const idTreino = req.params.id as string;

    const treino = await sessionModel.buscarPorId(idTreino, req.userId as string);
    if (!treino) {
        return res.status(404).json({ erro: 'Treino não encontrado' });
    }
    if (treino.completed) {
        return res.status(409).json({ erro: 'Treino já foi finalizado' });
    }

    const finalizado = await sessionModel.finalizarTreino(idTreino, req.userId as string);
    return res.status(200).json({ treino: finalizado });
}
```

---

## Passo 4 — `server/src/routes/sessionRoutes.ts`

- [ ] **Imports:** acrescentar `finalizarTreino` à lista que já vem do
controller. Nada mais muda.

- [ ] **Uma linha nova.** `POST /sessions/:id/finish`. `POST` e não `PUT`
porque não é substituição de recurso, é uma ação que muda estado uma vez só —
o mesmo raciocínio do `/sessions/start`.

- [ ] **Conferir o `:idSerie` do `DELETE`** contra o que o controller lê
(Reparo 4). Os dois nomes têm que ser idênticos, letra por letra.

- [ ] **Rota nova vai depois das de `sets`?** Tanto faz aqui — `finish` e
`sets` não colidem, são segmentos literais diferentes. Ordem só importaria se
uma delas fosse um parâmetro (`/sessions/:id/:acao`), que é justamente o que
não se deve fazer.

### `server/src/routes/sessionRoutes.ts` (completo)

```ts
import { Router } from "express";
import { autenticar } from "../middlewares/auth";
import {
    treinoDeHoje, comecarTreino, registrarSerie, apagarSerie, finalizarTreino
} from '../controllers/sessionController';


const router = Router();

router.get('/sessions/today', autenticar, treinoDeHoje);
router.post('/sessions/start', autenticar, comecarTreino);
router.post('/sessions/:id/sets', autenticar, registrarSerie);
router.delete('/sessions/:id/sets/:idSerie', autenticar, apagarSerie);
//S6 - fecha o treino do dia (RF03). o nome :idSerie acima tem que bater
//exatamente com o req.params.idSerie do controller (Reparo 4)
router.post('/sessions/:id/finish', autenticar, finalizarTreino);


export default router;
```

---

## Passo 5 — `server/src/services/volumeService.ts`

- [ ] **Imports.** Arquivo e pasta novos — `server/src/services/` estreia aqui.
Importa o `pool` e os dois tipos do Passo 1, nada mais. Um service **não**
importa `express`: ele não sabe que existe HTTP, e é isso que o torna testável
e reaproveitável pelo `geminiService` da S7.

```ts
import { pool } from '../config/db';
import { VolumeGrupamento, VolumeSemanal } from '../types/indexTypes';
```

- [ ] **Por que o SQL mora no service e não num model.** A regra da arquitetura
(seção 3 do `PLANEJAMENTO.md`) é model = SQL de **entidade**, service =
**regra**. Volume não é entidade: não tem tabela, não tem `id`, não se insere
nem se apaga — é uma pergunta feita ao banco. Espalhar isso num `metricsModel`
só pra cumprir a forma criaria um model de uma função que nunca vai crescer.
Fica no service, junto da regra do limiar que dá sentido ao número.

- [ ] **`LIMIAR_SERIES` é constante exportada, não literal.** A S7 vai precisar
do mesmo 10 pra montar o bloco 4 do prompt (diretrizes científicas) e pro
cálculo do `Pv` da Equação 1. Duas cópias do número é o começo de duas
respostas diferentes pra mesma pergunta.

- [ ] **`inicioDaSemana` — o `to_char` não é enfeite.** `date_trunc('week',
CURRENT_DATE)` já resolve a D10 (o Postgres usa a semana ISO, que começa na
segunda). Mas o driver `pg` converte `DATE` numa `Date` do JavaScript à
meia-noite **local**, e essa `Date` serializada em JSON vira UTC — em Brasília
(UTC-3) a segunda-feira dia 07 sai como `2026-09-06T03:00:00.000Z` e o front
mostra domingo. Devolver `'YYYY-MM-DD'` já como texto elimina a conversão
inteira.

```ts
export async function inicioDaSemana(): Promise<string> {
  const resultado = await pool.query<{ inicio: string }>(
    "SELECT to_char(date_trunc('week', CURRENT_DATE), 'YYYY-MM-DD') AS inicio"
  );
  return resultado.rows[0].inicio;
}
```

- [ ] **A consulta do volume, e por que ela usa subconsulta.** O caminho é
`SerieTreino → Exercicio → GrupamentoMuscular`, filtrando por `tipo = 'work'`
(D9), pelo dono e pela semana. Mas a lista precisa sair com **os 7 grupamentos
sempre**, inclusive os que ficaram em zero — grupamento não treinado é o achado
mais importante do painel, e some se o `FROM` começar pela série. Então o
`FROM` começa em `GrupamentoMuscular` e tudo o mais é `LEFT JOIN`.

```sql
SELECT g.id_grupamento,
       g.nome AS nome_grupamento,
       COUNT(sv.id_serie)::int AS series_validas
FROM GrupamentoMuscular g
LEFT JOIN (
  SELECT s.id_serie, e.fk_grupamento
  FROM SerieTreino s
  JOIN Exercicio e ON e.id_exercicio = s.fk_exercicio
  JOIN Treino t     ON t.id_treino   = s.fk_treino
  WHERE s.tipo = 'work'
    AND t.fk_usuario = $1
    AND t.data >= $2::date
    AND t.data <  $2::date + INTERVAL '7 days'
) sv ON sv.fk_grupamento = g.id_grupamento
GROUP BY g.id_grupamento, g.nome
ORDER BY g.nome
```

- [ ] **A versão sem subconsulta está errada, e erra silenciosamente.** É
tentador encadear quatro `LEFT JOIN` direto e jogar as condições do `Treino` no
`ON`. O problema: as séries de **outros usuários** ainda casam no `LEFT JOIN
SerieTreino`, só falham no join com `Treino` — e `COUNT(s.id_serie)` conta elas
do mesmo jeito, porque `s.id_serie` não é nulo. O painel mostraria o volume do
banco inteiro. Filtrar tudo dentro de uma subconsulta e só depois pendurá-la no
catálogo de grupamentos torna esse erro impossível.

- [ ] **`COUNT(sv.id_serie)`, nunca `COUNT(*)`.** Em `LEFT JOIN` sem casamento
o Postgres devolve **uma linha** com colunas nulas, e `COUNT(*)` conta linhas —
grupamento sem série nenhuma sairia com `1`. `COUNT(coluna)` ignora nulos, que
é exatamente o que se quer.

- [ ] **`>= $2 AND < $2 + 7 dias`, não `BETWEEN`.** `data` é `TIMESTAMP`:
`BETWEEN` com duas datas incluiria o domingo só até `00:00:00`, jogando fora o
treino de domingo à tarde. Meio-aberto no fim é o único jeito que não perde
nem duplica dia.

- [ ] **`atingiu_limiar` é calculado aqui**, depois da consulta, em JS. Poderia
sair de um `CASE` no SQL, mas a regra científica fica mais legível — e mais
citável no TCC — como uma linha ao lado da constante que ela usa.

### `server/src/services/volumeService.ts` (completo)

```ts
import { pool } from '../config/db';
import { VolumeGrupamento, VolumeSemanal } from '../types/indexTypes';


//limiar de series semanais por grupamento [Schoenfeld]. constante exportada
//porque a S7 usa o mesmo numero no bloco 4 do prompt (diretrizes cientificas)
//e no calculo do Pv da Equacao 1 - duas copias viram duas respostas diferentes
export const LIMIAR_SERIES = 10;


//segunda-feira da semana corrente, em texto 'YYYY-MM-DD' (D10).
//date_trunc('week') do Postgres ja e ISO (comeca na segunda), sem configuracao.
//to_char e obrigatorio: o driver pg converteria DATE numa Date do JS a meia-noite
//LOCAL, que serializada em JSON vira UTC e volta um dia pra tras em Brasilia.
export async function inicioDaSemana(): Promise<string> {
  const resultado = await pool.query<{ inicio: string }>(
    "SELECT to_char(date_trunc('week', CURRENT_DATE), 'YYYY-MM-DD') AS inicio"
  );
  return resultado.rows[0].inicio;
}


//RF04 - conta as series validas (tipo = 'work', D9) de cada grupamento na
//semana de referencia. Conta series registradas, o treino estando finalizado ou
//nao (D11): completed fecha a duracao (RF03), nao valida volume.
export async function calcularVolumeSemanal(
  fkUsuario: string
): Promise<VolumeSemanal> {
  const semana = await inicioDaSemana();

  //FROM comeca em GrupamentoMuscular pra que grupamento nao treinado apareca
  //com 0 - e justamente o achado mais util do painel.
  //A subconsulta filtra dono/semana/tipo ANTES do LEFT JOIN: encadear os joins
  //direto contaria serie de outro usuario (ela casa em SerieTreino e so falha
  //no join com Treino, mas COUNT(s.id_serie) conta assim mesmo).
  //COUNT(sv.id_serie) e nao COUNT(*): sem casamento o LEFT JOIN devolve uma
  //linha de nulos, e COUNT(*) contaria 1 onde o certo e 0.
  //>= inicio AND < inicio + 7 dias em vez de BETWEEN: data e TIMESTAMP, e
  //BETWEEN jogaria fora o treino de domingo depois das 00:00.
  const resultado = await pool.query<Omit<VolumeGrupamento, 'atingiu_limiar'>>(
    `SELECT g.id_grupamento,
            g.nome AS nome_grupamento,
            COUNT(sv.id_serie)::int AS series_validas
     FROM GrupamentoMuscular g
     LEFT JOIN (
       SELECT s.id_serie, e.fk_grupamento
       FROM SerieTreino s
       JOIN Exercicio e ON e.id_exercicio = s.fk_exercicio
       JOIN Treino t     ON t.id_treino   = s.fk_treino
       WHERE s.tipo = 'work'
         AND t.fk_usuario = $1
         AND t.data >= $2::date
         AND t.data <  $2::date + INTERVAL '7 days'
     ) sv ON sv.fk_grupamento = g.id_grupamento
     GROUP BY g.id_grupamento, g.nome
     ORDER BY g.nome`,
    [fkUsuario, semana]
  );

  //a comparacao com o limiar sai daqui pronta: a tela nunca refaz essa conta (RNF03)
  const grupamentos: VolumeGrupamento[] = resultado.rows.map((linha) => ({
    ...linha,
    atingiu_limiar: linha.series_validas >= LIMIAR_SERIES,
  }));

  return { semana_referencia: semana, limiar: LIMIAR_SERIES, grupamentos };
}
```

---

## Passo 6 — `server/src/controllers/metricsController.ts`

- [ ] **Imports.** Arquivo novo, três linhas. Repare no que **não** está aqui:
nenhum `pool`, nenhum SQL. Controller de métrica não fala com o banco — ele
pega o usuário do token, chama o service e responde.

```ts
import { Response } from 'express';
import { AuthenticateRequest } from '../middlewares/auth';
import * as volumeService from '../services/volumeService';
```

- [ ] **Uma função, e ela é curta de propósito.** Se este controller crescer,
é sinal de que uma regra vazou do service pra cá. A S8 vai acrescentar
histórico ao lado; o formato se mantém.

- [ ] **`try/catch` aqui, e não no service.** O service estoura a exceção do
`pg`; quem sabe traduzir isso em código HTTP é o controller. Sem o `catch`, uma
falha de banco derruba a resposta com o stack do Postgres.

### `server/src/controllers/metricsController.ts` (completo)

```ts
import { Response } from 'express';
import { AuthenticateRequest } from '../middlewares/auth';
import * as volumeService from '../services/volumeService';


//RF04 - volume semanal por grupamento. O controller nao calcula nada: pega o
//usuario do token, chama o service e responde. Todo o SQL e a regra do limiar
//ficam no volumeService.
export async function volumeSemanal(req: AuthenticateRequest, res: Response) {
    try {
        const volume = await volumeService.calcularVolumeSemanal(req.userId as string);
        return res.status(200).json({ volume });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao calcular o volume semanal' });
    }
}
```

---

## Passo 7 — `server/src/routes/metricsRoutes.ts` + `server/src/app.ts`

- [ ] **Imports das rotas:** `Router`, o `autenticar` e o controller do Passo 6.
Mesmo formato das outras quatro rotas do projeto — rota fina, só URL →
controller, sem `if` nenhum no meio.

- [ ] **`/metrics/weekly-volume` com `autenticar`.** Sem o middleware,
`req.userId` é `undefined`, o `$1` da consulta vira `null` e o endpoint devolve
sete zeros em vez de 401 — falha silenciosa, a pior espécie. O Passo 8 tem um
teste só pra isso.

- [ ] **Registrar no `app.ts`:** um `import` e um `app.use`. Esquecer essa
segunda linha é o erro clássico — a rota existe, o arquivo compila, e o
`GET` responde 404 sem explicação.

### `server/src/routes/metricsRoutes.ts` (completo)

```ts
import { Router } from 'express';
import { autenticar } from '../middlewares/auth';
import { volumeSemanal } from '../controllers/metricsController';


const router = Router();

//RF04 - sempre a semana corrente (D10). semanas passadas ficam pro historico (S8).
//autenticar e obrigatorio: sem ele req.userId sai undefined e a consulta
//devolveria sete zeros em vez de 401
router.get('/metrics/weekly-volume', autenticar, volumeSemanal);


export default router;
```

### `server/src/app.ts` (completo)

```ts
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import divisionRoutes from './routes/divisionRoutes';
import exerciseRoutes from './routes/exerciseRoutes';
import sessionRoutes from './routes/sessionRoutes';
import metricsRoutes from './routes/metricsRoutes';

//separa o listen no index.js para que os testes importem a aplicação express sem que ela suba
const app = express ();

app.use(cors());
app.use(express.json());
app.use(healthRoutes);
app.use(authRoutes);
app.use(divisionRoutes);
app.use(exerciseRoutes);
app.use(sessionRoutes);
app.use(metricsRoutes);

export default app;
```

---

## Passo 8 — Testes: `server/src/__tests__/testHelpers.ts` + `volume.test.ts`

- [ ] **Imports do helper:** nada novo — `supertest` e o `app` já estão lá. Só
entra uma função, que encurta as cinco linhas de setup que **todo** teste desta
semana precisaria repetir (registrar → divisão de hoje → exercício → começar
treino).

- [ ] **Imports do teste:** `node:test`, `node:assert/strict`, `supertest`, o
`app` e os helpers. Mesma abertura dos outros quatro arquivos de teste.

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app';
import { registrarELogar, registrarComTreinoAberto } from './testHelpers';
```

- [ ] **O teste que a matriz RF04 exige é o "igual ao cálculo manual".** Não
basta o endpoint responder: o número tem que bater com a contagem feita à mão.
O jeito honesto de escrever isso é registrar uma quantidade **conhecida** de
séries de cada tipo e conferir o total — se o teste calculasse o esperado com a
mesma lógica do service, ele passaria mesmo com a lógica errada.

- [ ] **Cobrir os três jeitos de a conta sair errada**, que são exatamente as
armadilhas do Passo 5: contar aquecimento/feeder junto, perder o grupamento
zerado, e vazar série de outro usuário.

- [ ] **O `DELETE` de série entra aqui.** A S5 não testou, e por isso o Reparo
4 passou meses invisível. O teste faz o caminho inteiro: registra, confere no
volume, apaga, confere que o volume caiu — assim ele valida a rota e a conta
de uma vez.

- [ ] **Um teste só pro 401.** Endpoint de métrica sem `autenticar` não quebra:
responde 200 com zeros. É o tipo de bug que nenhum teste "de caminho feliz"
pega.

### `server/src/__tests__/testHelpers.ts` (completo)

```ts
import request from 'supertest';
import app from '../app'

//arquivo com funcoes utilizadas em diversos testes, para evitar repeticao de codigo


export async function registrarELogar() {
    const email = `div${Date.now()}${Math.random()}@exemplo.com`;
    await request(app).post('/auth/register').send({ nome: 'T', email, senha: '123456' });

    const login = await request(app).post('/auth/login').send({ email, senha: '123456' });
    return { token: login.body.token as string };
}



export async function registrarComDivisao() {
    const { token } = await registrarELogar();
    const divisao = await request(app)
        .put('/divisions')
        .set('Authorization', `Bearer ${token}`)
        .send({ divisoes: [{ dia_semana: 1, nome: 'Peito e triceps' }] });
    return { token, idDivisao: divisao.body.divisoes[0].id_divisao as string };
}



export async function registrarComRotinaDeHoje() {
  const { token } = await registrarELogar();
  const diaHoje = new Date().getDay();

  const divisao = await request(app)
    .put('/divisions')
    .set('Authorization', `Bearer ${token}`)
    .send({ divisoes: [{ dia_semana: diaHoje, nome: 'Treino de hoje' }] });
  const idDivisao = divisao.body.divisoes[0].id_divisao as string;

  const catalogo = await request(app)
    .get('/exercises')
    .set('Authorization', `Bearer ${token}`);
  const exercicio = catalogo.body.exercicios[0];

  await request(app)
    .put(`/divisions/${idDivisao}/exercises`)
    .set('Authorization', `Bearer ${token}`)
    .send({ exercicios: [{ fk_exercicio: exercicio.id_exercicio }] });

  return { token, idDivisao, exercicio };
}


//S6 - o mesmo de cima, ja com o treino do dia aberto. evita repetir o
//POST /sessions/start em todo teste de volume
export async function registrarComTreinoAberto() {
  const base = await registrarComRotinaDeHoje();

  const inicio = await request(app)
    .post('/sessions/start')
    .set('Authorization', `Bearer ${base.token}`);

  return { ...base, idTreino: inicio.body.treino.id_treino as string };
}
```

### `server/src/__tests__/volume.test.ts` (completo)

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app';
import { registrarELogar, registrarComTreinoAberto } from './testHelpers';


//registra n series do tipo pedido, no exercicio da rotina de hoje
async function registrarSeries(
  token: string,
  idTreino: string,
  fkExercicio: number,
  tipo: 'aquecimento' | 'feeder' | 'work',
  quantidade: number
) {
  for (let i = 0; i < quantidade; i++) {
    await request(app)
      .post(`/sessions/${idTreino}/sets`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        fk_exercicio: fkExercicio,
        tipo,
        carga: 60,
        repeticoes: 10,
        //D9: so serie valida leva nota
        ...(tipo === 'work' ? { rir: 2 } : {}),
      });
  }
}

function acharGrupamento(volume: any, nome: string) {
  return volume.grupamentos.find((g: any) => g.nome_grupamento === nome);
}


test('GET /metrics/weekly-volume sem token retorna 401', async () => {
  const resposta = await request(app).get('/metrics/weekly-volume');
  assert.equal(resposta.status, 401);
});


test('volume conta só séries válidas (work) — aquecimento e feeder não entram', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();

  await registrarSeries(token, idTreino, exercicio.id_exercicio, 'work', 3);
  await registrarSeries(token, idTreino, exercicio.id_exercicio, 'aquecimento', 2);
  await registrarSeries(token, idTreino, exercicio.id_exercicio, 'feeder', 1);

  const resposta = await request(app)
    .get('/metrics/weekly-volume')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(resposta.status, 200);
  const grupamento = acharGrupamento(resposta.body.volume, exercicio.nome_grupamento);
  //6 series gravadas no total, so 3 valem volume
  assert.equal(grupamento.series_validas, 3);
});


test('soma do volume é igual à contagem manual de séries válidas (matriz RF04)', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();

  const VALIDAS = 7; //contagem manual: o numero que a gente registrou de proposito
  await registrarSeries(token, idTreino, exercicio.id_exercicio, 'work', VALIDAS);
  await registrarSeries(token, idTreino, exercicio.id_exercicio, 'aquecimento', 4);

  const resposta = await request(app)
    .get('/metrics/weekly-volume')
    .set('Authorization', `Bearer ${token}`);

  const total = resposta.body.volume.grupamentos.reduce(
    (soma: number, g: any) => soma + g.series_validas,
    0
  );
  assert.equal(total, VALIDAS);
});


test('todos os grupamentos aparecem, e os não treinados vêm com 0', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  await registrarSeries(token, idTreino, exercicio.id_exercicio, 'work', 2);

  const resposta = await request(app)
    .get('/metrics/weekly-volume')
    .set('Authorization', `Bearer ${token}`);

  //7 grupamentos do seed - grupamento zerado nao pode sumir da lista
  assert.equal(resposta.body.volume.grupamentos.length, 7);

  const naoTreinados = resposta.body.volume.grupamentos.filter(
    (g: any) => g.nome_grupamento !== exercicio.nome_grupamento
  );
  for (const g of naoTreinados) {
    assert.equal(g.series_validas, 0); //COUNT(coluna), nao COUNT(*)
    assert.equal(g.atingiu_limiar, false);
  }
});


test('atingiu_limiar vira true só a partir de 10 séries [Schoenfeld]', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();

  await registrarSeries(token, idTreino, exercicio.id_exercicio, 'work', 9);
  const antes = await request(app)
    .get('/metrics/weekly-volume')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(antes.body.volume.limiar, 10);
  assert.equal(acharGrupamento(antes.body.volume, exercicio.nome_grupamento).atingiu_limiar, false);

  await registrarSeries(token, idTreino, exercicio.id_exercicio, 'work', 1);
  const depois = await request(app)
    .get('/metrics/weekly-volume')
    .set('Authorization', `Bearer ${token}`);
  const grupamento = acharGrupamento(depois.body.volume, exercicio.nome_grupamento);
  assert.equal(grupamento.series_validas, 10);
  assert.equal(grupamento.atingiu_limiar, true);
});


test('volume de um usuário não conta séries de outro', async () => {
  const outro = await registrarComTreinoAberto();
  await registrarSeries(outro.token, outro.idTreino, outro.exercicio.id_exercicio, 'work', 5);

  const meu = await registrarComTreinoAberto();
  await registrarSeries(meu.token, meu.idTreino, meu.exercicio.id_exercicio, 'work', 2);

  const resposta = await request(app)
    .get('/metrics/weekly-volume')
    .set('Authorization', `Bearer ${meu.token}`);

  //se o filtro de dono estivesse no ON de um LEFT JOIN em vez da subconsulta,
  //aqui sairia 7 em vez de 2
  assert.equal(acharGrupamento(resposta.body.volume, meu.exercicio.nome_grupamento).series_validas, 2);
});


test('apagar série tira a série do volume (cobre o DELETE, Reparo 4)', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  await registrarSeries(token, idTreino, exercicio.id_exercicio, 'work', 3);

  const hoje = await request(app)
    .get('/sessions/today')
    .set('Authorization', `Bearer ${token}`);
  const idSerie = hoje.body.hoje.series[0].id_serie;

  const apagou = await request(app)
    .delete(`/sessions/${idTreino}/sets/${idSerie}`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(apagou.status, 204);

  const resposta = await request(app)
    .get('/metrics/weekly-volume')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(acharGrupamento(resposta.body.volume, exercicio.nome_grupamento).series_validas, 2);
});


test('POST /sessions/:id/finish grava completed e duracao_total (RF03)', async () => {
  const { token, idTreino } = await registrarComTreinoAberto();

  const resposta = await request(app)
    .post(`/sessions/${idTreino}/finish`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(resposta.status, 200);
  assert.equal(resposta.body.treino.completed, true);
  //GREATEST(1, ...): treino de teste dura segundos e arredondaria pra 0
  assert.ok(resposta.body.treino.duracao_total >= 1);
});


test('finalizar duas vezes retorna 409 e não recalcula a duração', async () => {
  const { token, idTreino } = await registrarComTreinoAberto();

  const primeira = await request(app)
    .post(`/sessions/${idTreino}/finish`)
    .set('Authorization', `Bearer ${token}`);
  const segunda = await request(app)
    .post(`/sessions/${idTreino}/finish`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(primeira.status, 200);
  assert.equal(segunda.status, 409);
});


test('finalizar treino de outro usuário retorna 404', async () => {
  const dono = await registrarComTreinoAberto();
  const { token: intruso } = await registrarELogar();

  const resposta = await request(app)
    .post(`/sessions/${dono.idTreino}/finish`)
    .set('Authorization', `Bearer ${intruso}`);

  assert.equal(resposta.status, 404);
});


test('séries de treino finalizado continuam contando no volume (D11)', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  await registrarSeries(token, idTreino, exercicio.id_exercicio, 'work', 4);

  await request(app)
    .post(`/sessions/${idTreino}/finish`)
    .set('Authorization', `Bearer ${token}`);

  const resposta = await request(app)
    .get('/metrics/weekly-volume')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(acharGrupamento(resposta.body.volume, exercicio.nome_grupamento).series_validas, 4);
});
```

- [ ] Rodar `npm run test` no `server`: **28 testes antigos + 11 novos**, todos
verdes. Se o "soma igual à contagem manual" falhar por 1 ou 2, o suspeito é
sempre o mesmo — alguma série de aquecimento entrando na conta.

---

## Passo 9 — Front: `client/src/services/api.ts`

- [ ] **Imports: nenhum, de novo.** O `api.ts` é a fronteira do front com o
mundo — só `fetch`, que é global. Se ele começar a importar de `views/` ou
`components/`, a dependência está invertida.

- [ ] **Três mudanças pequenas e duas funções novas.** As mudanças: `Treino`
ganha `duracao_total`. O nome `divisaoHoje` **fica como está** (Reparo 5): o
front já estava certo, quem se ajustou foi o teste.

- [ ] **`finalizarTreino` não manda corpo** (D12). O `apiFetch` já trata isso:
`body: opcoes.body ? JSON.stringify(...) : undefined`.

- [ ] **Os tipos de volume são cópia dos do backend, de propósito.** O projeto
não compartilha tipos entre `server/` e `client/` (são dois `tsconfig`
separados, sem workspace). A duplicação é consciente e vale a pena: se o
backend mudar o formato, o TS do front não avisa — quem avisa é o teste da
tela. É a mesma escolha já feita pra `Divisao` e `Serie`.

- [ ] **Nenhuma conta aqui.** `atingiu_limiar` chega pronto do backend (RNF03);
o `api.ts` só repassa.

### `client/src/services/api.ts` (completo)

```ts
const API_URL = 'http://localhost:3000';

//Estende as opções de configurações padrão do fetch (method, headers, etc.)
//e flexibiliza o 'body' para aceitar objetos JS antes da conversão para JSON.
interface OpcoesFetch extends RequestInit {
    body?: any;
}

//funcao que monta url, injeta o token quando existe, e transforma resposta de erro numa exceção
// ...(spread) tira a embalagem de objeto ou lista e despeja só o conteudo.
async function apiFetch(caminho: string, opcoes: OpcoesFetch = {}) {
    const token = localStorage.getItem('token');

    //junta url, injeta cabeçalho de autorizacao e converte o corpo da requisicao
    const resposta = await fetch(`${API_URL}${caminho}`, {
        ...opcoes, //repassa qualquer propriedade recebida em opcoes
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...opcoes.headers,
        },
        body: opcoes.body ? JSON.stringify(opcoes.body) : undefined,
    })

    const dados = resposta.status === 204 ? null : await resposta.json();
    if (!resposta.ok) {
        throw new Error(dados?.erro ?? 'Erro na requisição');
    }

    return dados;
}


//============================usuario===================================

export interface Usuario {
    id_usuario: string;
    nome: string;
    email: string;
}

//funcao de registrar 
export function registrar(nome: string, email: string, senha: string) {
    return apiFetch('/auth/register', {
        method: 'POST',
        body: { nome, email, senha },
    }) as Promise<{ usuario: Usuario }>;
}

//funcao de login
export function login(email: string, senha: string) {
    return apiFetch('/auth/login', {
        method: 'POST',
        body: { email, senha },
    }) as Promise<{ token: string; usuario: Usuario }>;
}

//funcao de /me, traz informacoes do usuario
export function buscarPerfil() {
    return apiFetch('/me') as Promise<{ usuario: Usuario }>;
}


//============================divisao===================================

export interface Divisao {
    id_divisao: string;
    dia_semana: number;
    nome: string;
}

export function buscarDivisoes() {
    return apiFetch('/divisions') as Promise<{ divisoes: Divisao[] }>
}

export function salvarDivisoes(divisoes: { dia_semana: number; nome: string }[]) {
    return apiFetch('/divisions', {
        method: 'PUT',
        body: { divisoes },
    }) as Promise<{ divisoes: Divisao[] }>;
}


//============================exercicio===================================

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

export function buscarExerciciosDivisao(idDivisao: string) {
    return apiFetch(`/divisions/${idDivisao}/exercises`) as Promise<{
        exercicios: ExercicioDoDia[]
    }>;
}

export function salvarExerciciosDivisao(idDivisao: string, exercicios: { fk_exercicio: number }[]) {
    return apiFetch(`/divisions/${idDivisao}/exercises`, {
        method: 'PUT',
        body: { exercicios },
    }) as Promise<{ exercicios: ExercicioDoDia[] }>;

}

export function buscarResumoMusculos() {
    return apiFetch('/divisions/muscle-summary') as Promise<{
        resumo: { dia_semana: number; grupamentos: string[] }[];
    }>;
}


//============================treino===================================

export type TipoSerie = 'aquecimento' | 'feeder' | 'work';

export interface Treino {
    id_treino: string;
    fk_divisao: string | null;
    completed: boolean;
    data: string;
    duracao_total: number | null; //minutos, calculados pelo backend ao finalizar (D12)
}

export interface Serie {
    id_serie: number;
    fk_exercicio: number;
    tipo: TipoSerie;
    carga: string; //numeric do postgres chega como string
    repeticoes: number;
    rpe: number | null;
    rir: number | null;
    nome_exercicio: string;
}

export interface TreinoDeHoje {
    dia_semana: number;
    divisaoHoje: Divisao | null; //o backend devolve a chave com esse nome (Reparo 5)
    treino: Treino | null;
    exercicios: ExercicioDoDia[];
    series: Serie[];
}

export function buscarTreinoDeHoje() {
    return apiFetch('/sessions/today') as Promise<{ hoje: TreinoDeHoje }>;
}

export function comecarTreino() {
    return apiFetch('/sessions/start', { method: 'POST' }) as Promise<{ treino: Treino }>;
}

export function registrarSerie(
    idTreino: string,
    serie: {
        fk_exercicio: number;
        tipo: TipoSerie;
        carga: number;
        repeticoes: number;
        // manda SÓ UM dos dois em série válida. se for aquecimento/feeder, manda nenhum dos dois.
        rir?: number | null;
        rpe?: number | null;
    }
) {
    return apiFetch(`/sessions/${idTreino}/sets`, {
        method: 'POST',
        body: serie,
    }) as Promise<{ serie: Serie }>;
}


export function apagarSerie(idTreino: string, idSerie: number) {
    return apiFetch(`/sessions/${idTreino}/sets/${idSerie}`, {
        method: 'DELETE'
    });
}

//S6 - fecha o treino do dia. sem corpo: a duracao e calculada pelo backend (D12)
export function finalizarTreino(idTreino: string) {
    return apiFetch(`/sessions/${idTreino}/finish`, {
        method: 'POST',
    }) as Promise<{ treino: Treino }>;
}


//============================metricas (RF04)===========================

//espelho dos tipos do backend. o projeto nao compartilha tipos entre server/ e
//client/ (dois tsconfig separados), entao a copia e consciente
export interface VolumeGrupamento {
    id_grupamento: number;
    nome_grupamento: string;
    series_validas: number;
    atingiu_limiar: boolean; //vem pronto do backend - a tela NAO refaz essa conta (RNF03)
}

export interface VolumeSemanal {
    semana_referencia: string; //'YYYY-MM-DD' da segunda-feira (D10)
    limiar: number; //10 series [Schoenfeld]
    grupamentos: VolumeGrupamento[];
}

export function buscarVolumeSemanal() {
    return apiFetch('/metrics/weekly-volume') as Promise<{ volume: VolumeSemanal }>;
}
```

---

## Passo 10 — Front: navegação (`App.tsx` + `Sidebar.tsx`)

- [ ] **Imports do `App.tsx`:** entra a `WeeklyVolumeView` do Passo 12. O resto
já está lá.

- [ ] **Imports da `Sidebar.tsx`:** entra o ícone
`@mui/icons-material/BarChart`. Os outros três já estão importados.

- [ ] **`Tela` ganha um terceiro valor.** `'divisao' | 'treino' | 'volume'`. O
`App.tsx` alterna com um `Record`, não com ternário aninhado — com três telas o
ternário já fica ilegível, e a S8 vai acrescentar mais duas.

- [ ] **A D7 continua valendo: nada de `react-router` ainda.** Três telas
continuam cabendo num `useState`. A decisão de roteamento real segue marcada
pra S9 — trocar agora custaria refazer o mesmo trabalho duas vezes.

- [ ] **O item "Volume da semana" na sidebar já existia como cinza?** Não — os
dois itens desabilitados hoje são "Diagnóstico" (S7) e "Histórico" (S8). O de
volume é novo, e entra logo depois de "Treino de hoje", que é a ordem em que a
pessoa usa: monta a rotina, treina, confere o volume.

### `client/src/App.tsx` (completo)

```tsx
import { useState, type ReactNode } from 'react'
import { useAuth } from './context/AuthContext'
import { AuthView } from './views/AuthView'
import { DivisionView } from './views/DivisionView'
import { TodaySessionView } from './views/TodaySessionView'
import { WeeklyVolumeView } from './views/WeeklyVolumeView'
import { AppShell } from './components/AppShell'
import { PageLayout } from './components/PageLayout'
import { Typography } from '@mui/material'

export type Tela = 'divisao' | 'treino' | 'volume'

//D7: navegacao por estado ate a S9. com tres telas o ternario aninhado ja fica
//ilegivel, entao vira um mapa - e a S8 ainda acrescenta diagnostico e historico
const TELAS: Record<Tela, ReactNode> = {
  divisao: <DivisionView />,
  treino: <TodaySessionView />,
  volume: <WeeklyVolumeView />,
}

function App() {
  const { usuario, carregando } = useAuth();
  const [tela, setTela] = useState<Tela>('divisao');

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
    <AppShell tela={tela} onNavegar={setTela}>
      {TELAS[tela]}
    </AppShell>
  )
}

export default App
```

### `client/src/components/Sidebar.tsx` (completo)

```tsx
import { useState, type ReactNode } from 'react';
import { Box, Stack, Typography, Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import BarChartIcon from '@mui/icons-material/BarChart';
import InsightsIcon from '@mui/icons-material/Insights';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useAuth } from '../context/AuthContext';
import type { Tela } from '../App';

//Sidebar lateral fixa, com animação de expansão suave (Frame Motion) e itens de navegação.
//icone only quando colapsada (76px)

//item sem 'tela' é item que ainda nao existe: fica cinza e nao clica
interface NavItem {
  label: string;
  icon: ReactNode;
  tela?: Tela;
}

//ordem = ordem de uso: monta a rotina, treina, confere o volume
const NAV_ITEMS: NavItem[] = [
  { label: 'Minha divisão', icon: <CalendarViewWeekIcon fontSize="small" />, tela: 'divisao' },
  { label: 'Treino de hoje', icon: <FitnessCenterIcon fontSize="small" />, tela: 'treino' },
  { label: 'Volume da semana', icon: <BarChartIcon fontSize="small" />, tela: 'volume' },
  { label: 'Diagnóstico', icon: <InsightsIcon fontSize="small" /> },
  { label: 'Histórico', icon: <TimelineIcon fontSize="small" /> },
];

const COLLAPSED = 76;
const EXPANDED = 244;

export function Sidebar({ tela, onNavegar }: { tela: Tela; onNavegar: (tela: Tela) => void }) {
  const [aberta, setAberta] = useState(false);
  const { usuario, logout } = useAuth();

  return (
    <Box
      component={motion.nav}
      animate={{ width: aberta ? EXPANDED : COLLAPSED }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      onMouseEnter={() => setAberta(true)}
      onMouseLeave={() => setAberta(false)}
      onFocus={() => setAberta(true)}
      onBlur={() => setAberta(false)}
      sx={{
        position: 'fixed',
        top: 20,
        left: 20,
        bottom: 20,
        bgcolor: '#0F1B17',
        color: '#C7D3CE',
        borderRadius: '28px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        px: 1.75,
        py: 2.5,
        boxShadow: '0 20px 45px -18px rgba(15, 27, 23, 0.55)',
        zIndex: 10,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 0.5, pb: 2.5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '12px',
            flexShrink: 0,
            background: 'linear-gradient(155deg, #2F8A73, #1E6F5C)',
          }}
        />
        {aberta && (
          <Typography
            component={motion.span}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            sx={{ fontFamily: '"Sora", sans-serif', fontWeight: 700, fontSize: 15, color: '#F3F6F4', whiteSpace: 'nowrap' }}
          >
            HyperTrack
          </Typography>
        )}
      </Stack>

      <Stack spacing={0.5} sx={{ flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const disponivel = Boolean(item.tela);
          const ativo = item.tela === tela;

          return (
            <Stack
              key={item.label}
              direction="row"
              spacing={1.75}
              alignItems="center"
              onClick={() => item.tela && onNavegar(item.tela)}
              sx={{
                px: 1.75,
                py: 1.25,
                borderRadius: '999px',
                cursor: disponivel ? 'pointer' : 'default',
                opacity: disponivel ? 1 : 0.45,
                bgcolor: ativo ? 'primary.main' : 'transparent',
                color: ativo ? '#F3F6F4' : 'inherit',
                '&:hover': disponivel
                  ? { bgcolor: ativo ? 'primary.main' : 'rgba(255,255,255,0.07)' }
                  : undefined,
              }}
            >
              {item.icon}
              {aberta && (
                <Typography
                  component={motion.span}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  sx={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                  {item.label}
                </Typography>
              )}
            </Stack>
          );
        })}
      </Stack>

      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        onClick={logout}
        sx={{ px: 1.25, py: 1, borderRadius: '999px', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' } }}
      >
        <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(170,59,255,0.15)', color: '#D9A6FF', fontSize: 13, fontWeight: 700 }}>
          {usuario?.nome?.slice(0, 2).toUpperCase()}
        </Avatar>
        {aberta && (
          <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} sx={{ overflow: 'hidden' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#F3F6F4', whiteSpace: 'nowrap' }}>
              {usuario?.nome}
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: '#7C8B85' }}>Sair</Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
```

---

## Passo 11 — Front: `client/src/views/TodaySessionView.tsx`

- [ ] **Imports:** entra `CheckCircleIcon` de `@mui/icons-material/CheckCircle`
pro botão de finalizar. O `Button`, o `Stack` e o resto já vêm importados.

- [ ] **Reparo 5: nada muda aqui.** A tela já lê `hoje.divisaoHoje`, que é o
nome que ficou. Não trocar por `divisao` — se o `if` do estado vazio ler uma
chave que não existe, a tela mostra "dia de descanso" mesmo com divisão
cadastrada.

- [ ] **`finalizar` com confirmação em dois toques, não com `window.confirm`.**
Finalizar é irreversível (o `UPDATE` do Passo 2 só roda com `completed =
FALSE`), então merece uma confirmação — mas um `confirm()` do navegador
**trava** o JS e fica feio no celular. O botão troca de rótulo e de cor no
primeiro toque e executa no segundo. Zero componente novo.

- [ ] **Depois de finalizar, `recarregar()` resolve a tela sozinho.** O `GET
/sessions/today` só devolve treino com `completed = false`, então o treino some
da resposta e a tela volta pro botão "Começar treino" naturalmente. Não é
preciso mexer no estado local pra isso.

- [ ] **Tratar o 409 como sucesso, não como erro.** Se o usuário tocar duas
vezes rápido, ou finalizar num aparelho tendo finalizado no outro, o backend
responde 409 (Passo 3). Mostrar "Treino já foi finalizado" em vermelho seria
enganoso: o estado desejado foi alcançado. Recarregar e seguir.

- [ ] **O botão fica no fim da lista, não no topo.** No celular, durante o
treino, a pessoa rola a tela o tempo todo pra registrar série — botão de
encerrar perto do polegar, no topo, é toque acidental garantido.

- [ ] **Nada de mostrar volume aqui.** A tentação é somar as séries válidas do
dia e exibir "5 séries" no cabeçalho. Isso é cálculo de volume no front
(RNF03), e é a conta do Passo 5. A tela de treino registra; a do Passo 12 conta.

### `client/src/views/TodaySessionView.tsx` (completo)

```tsx
import { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography, TextField, Button, Stack, Chip,
  IconButton, MenuItem, Divider, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import * as api from '../services/api';
import { FeedbackAlert } from '../components/FeedbackAlert';

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const TIPOS: { valor: api.TipoSerie; label: string }[] = [
  { valor: 'aquecimento', label: 'Aquecimento' },
  { valor: 'feeder', label: 'Feeder' },
  { valor: 'work', label: 'Válida' },
];

//preferencia de regua (RIR/RPE) guardada no localStorage - conveniencia de exibicao,
//nao configuracao de conta, entao nao vira coluna no banco
const CHAVE_MODO_NOTA = 'hypertrack:modo-nota';

function lerModoNotaSalvo(): 'rir' | 'rpe' {
  try {
    return localStorage.getItem(CHAVE_MODO_NOTA) === 'rpe' ? 'rpe' : 'rir';
  } catch {
    return 'rir'; //localStorage pode falhar (modo privado); segue com o padrao
  }
}

//campos ficam como string no estado: se fossem number, apagar o campo daria NaN e travaria o input.
//um so campo de nota (`nota`), interpretado como RIR ou RPE conforme o modoNota global
interface Rascunho {
  tipo: api.TipoSerie;
  carga: string;
  repeticoes: string;
  nota: string;
}

const RASCUNHO_VAZIO: Rascunho = {
  tipo: 'work',
  carga: '',
  repeticoes: '',
  nota: '',
};

export function TodaySessionView() {
  const [hoje, setHoje] = useState<api.TreinoDeHoje | null>(null);
  const [rascunhos, setRascunhos] = useState<Record<number, Rascunho>>({});
  const [modoNota, setModoNota] = useState<'rir' | 'rpe'>(lerModoNotaSalvo);
  const [carregando, setCarregando] = useState(true);
  const [confirmandoFim, setConfirmandoFim] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  async function recarregar() {
    const { hoje } = await api.buscarTreinoDeHoje();
    setHoje(hoje);
  }

  useEffect(() => {
    async function carregar() {
      try {
        await recarregar();
      } catch (erro) {
        setErro(erro instanceof Error ? erro.message : 'Erro ao carregar');
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  function trocarModoNota(novo: 'rir' | 'rpe') {
    setModoNota(novo);
    try {
      localStorage.setItem(CHAVE_MODO_NOTA, novo);
    } catch {
      //localStorage indisponivel nao trava a tela, so nao persiste a preferencia
    }
  }

  //um rascunho por exercicio: um formulario global perderia o que foi digitado ao trocar de exercicio
  function atualizarRascunho(fk: number, campo: keyof Rascunho, valor: string) {
    setRascunhos((atual) => {
      const novo = { ...RASCUNHO_VAZIO, ...atual[fk], [campo]: valor };
      //D9: trocar pra aquecimento/feeder limpa a nota - o campo some da tela, mas o
      //que ja foi digitado continuaria no estado e iria junto no POST, tomando 400
      if (campo === 'tipo' && valor !== 'work') {
        novo.nota = '';
      }
      return { ...atual, [fk]: novo };
    });
  }

  async function comecar() {
    setErro('');
    try {
      await api.comecarTreino();
      await recarregar();
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : 'Erro ao começar treino');
    }
  }

  //converte pra number so no envio; manda so o campo do modo escolhido, o outro fica null -
  //nunca Number('') = 0, que gravaria "RIR 0" sem a pessoa ter digitado nada
  async function registrar(fkExercicio: number) {
    if (!hoje?.treino) return;
    const rascunho = rascunhos[fkExercicio] ?? RASCUNHO_VAZIO;
    const ehValida = rascunho.tipo === 'work';
    setErro('');
    try {
      await api.registrarSerie(hoje.treino.id_treino, {
        fk_exercicio: fkExercicio,
        tipo: rascunho.tipo,
        carga: Number(rascunho.carga),
        repeticoes: Number(rascunho.repeticoes),
        rir: ehValida && modoNota === 'rir' ? Number(rascunho.nota) : null,
        rpe: ehValida && modoNota === 'rpe' ? Number(rascunho.nota) : null,
      });
      setRascunhos((atual) => ({ ...atual, [fkExercicio]: RASCUNHO_VAZIO }));
      await recarregar(); //a lista de series vem do banco, nao do estado local
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : 'Erro ao registrar série');
    }
  }

  async function remover(idSerie: number) {
    if (!hoje?.treino) return;
    setErro('');
    try {
      await api.apagarSerie(hoje.treino.id_treino, idSerie);
      await recarregar();
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : 'Erro ao apagar série');
    }
  }

  //S6 - fecha o treino (RF03). confirmacao em dois toques em vez de window.confirm,
  //que trava o JS e fica ruim no celular. depois do finish o GET /sessions/today
  //nao devolve mais esse treino (so traz completed = false), entao a tela volta
  //sozinha pro botao "Comecar treino" - nao precisa mexer no estado local.
  async function finalizar() {
    if (!hoje?.treino) return;

    if (!confirmandoFim) {
      setConfirmandoFim(true);
      return;
    }

    setErro('');
    try {
      const { treino } = await api.finalizarTreino(hoje.treino.id_treino);
      setSucesso(`Treino finalizado — ${treino.duracao_total} min registrados.`);
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao finalizar treino';
      //409 do backend: ja estava finalizado (dois toques rapidos, ou outro
      //aparelho). o estado desejado foi alcancado - nao e erro pro usuario
      if (!mensagem.includes('já foi finalizado')) {
        setErro(mensagem);
      }
    } finally {
      setConfirmandoFim(false);
      await recarregar();
    }
  }

  if (carregando) {
    return <Typography>Carregando...</Typography>;
  }

  //Reparo 5: a chave e 'divisaoHoje', igual ao que o backend responde
  if (!hoje?.divisaoHoje) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h2" gutterBottom>
            Treino de Hoje
          </Typography>
          <FeedbackAlert sucesso={sucesso} />
          <Typography color="text.secondary">
            {DIAS[hoje?.dia_semana ?? new Date().getDay()]} não tem divisão cadastrada — dia de descanso.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h2" gutterBottom>
          Treino de Hoje
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          {DIAS[hoje.dia_semana]} — {hoje.divisaoHoje.nome}
        </Typography>

        <FeedbackAlert erro={erro} />
        <FeedbackAlert sucesso={sucesso} />

        {!hoje.treino ? (
          <Button variant="contained" size="large" fullWidth onClick={comecar} sx={{ mt: 2 }}>
            Começar treino
          </Button>
        ) : (
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* toggle unico pra sessao inteira, nao por exercicio - reportar em regua
                diferente por serie nao faz sentido pro usuario (D9) */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Reportar esforço em:
              </Typography>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={modoNota}
                onChange={(_, novo) => novo && trocarModoNota(novo)}
              >
                <ToggleButton value="rir">RIR</ToggleButton>
                <ToggleButton value="rpe">RPE</ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            {hoje.exercicios.map((exercicio) => {
              const rascunho = rascunhos[exercicio.fk_exercicio] ?? RASCUNHO_VAZIO;
              const series = hoje.series.filter(
                (s) => s.fk_exercicio === exercicio.fk_exercicio
              );

              return (
                <Stack key={exercicio.id_divisao_exercicio} spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography sx={{ fontWeight: 700 }}>
                      {exercicio.ordem}. {exercicio.nome_exercicio}
                    </Typography>
                    <Chip label={exercicio.nome_grupamento} size="small" />
                  </Stack>

                  {series.map((serie) => (
                    <Stack
                      key={serie.id_serie}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Typography variant="body2" color="text.secondary">
                        {Number(serie.carga)} kg × {serie.repeticoes}
                        {serie.rpe != null ? ` · RPE ${serie.rpe}` : ''}
                        {serie.rir != null ? ` · RIR ${serie.rir}` : ''}
                        {serie.tipo !== 'work' ? ` · ${serie.tipo}` : ''}
                      </Typography>
                      <IconButton size="small" onClick={() => remover(serie.id_serie)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}

                  {/* uma coluna no celular, linha no desktop: nada de tabela larga com rolagem */}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      select
                      label="Tipo"
                      size="small"
                      value={rascunho.tipo}
                      onChange={(e) =>
                        atualizarRascunho(exercicio.fk_exercicio, 'tipo', e.target.value)
                      }
                      sx={{ minWidth: 130 }}
                    >
                      {TIPOS.map((t) => (
                        <MenuItem key={t.valor} value={t.valor}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </TextField>
                    {/* inputMode decimal/numeric abre o teclado numerico no celular (RNF01) */}
                    <TextField
                      label="Carga (kg)"
                      size="small"
                      inputMode="decimal"
                      value={rascunho.carga}
                      onChange={(e) =>
                        atualizarRascunho(exercicio.fk_exercicio, 'carga', e.target.value)
                      }
                    />
                    <TextField
                      label="Reps"
                      size="small"
                      inputMode="numeric"
                      value={rascunho.repeticoes}
                      onChange={(e) =>
                        atualizarRascunho(exercicio.fk_exercicio, 'repeticoes', e.target.value)
                      }
                    />
                    {/* D9: nota de esforco so existe em serie valida - fora do DOM,
                        nao apenas disabled (campo morto ocupa espaco na tela do celular).
                        UM SO campo - o rotulo troca conforme o toggle RIR/RPE do topo */}
                    {rascunho.tipo === 'work' && (
                      <TextField
                        label={modoNota === 'rir' ? 'RIR (reps na reserva)' : 'RPE (esforço 6–10)'}
                        size="small"
                        inputMode="numeric"
                        value={rascunho.nota}
                        onChange={(e) =>
                          atualizarRascunho(exercicio.fk_exercicio, 'nota', e.target.value)
                        }
                      />
                    )}
                  </Stack>

                  <Button
                    variant="contained"
                    onClick={() => registrar(exercicio.fk_exercicio)}
                    disabled={
                      !rascunho.carga ||
                      !rascunho.repeticoes ||
                      //serie valida so fecha com a nota preenchida (D9)
                      (rascunho.tipo === 'work' && !rascunho.nota)
                    }
                  >
                    Registrar série
                  </Button>

                  <Divider />
                </Stack>
              );
            })}

            {/* S6 - no fim da lista de proposito: no topo, perto do polegar, vira
                toque acidental no meio do treino */}
            <Button
              variant={confirmandoFim ? 'contained' : 'outlined'}
              color={confirmandoFim ? 'error' : 'primary'}
              size="large"
              fullWidth
              startIcon={<CheckCircleIcon />}
              onClick={finalizar}
              onBlur={() => setConfirmandoFim(false)}
            >
              {confirmandoFim ? 'Confirmar: encerrar o treino' : 'Finalizar treino'}
            </Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Passo 12 — Front: `client/src/views/WeeklyVolumeView.tsx`

- [ ] **Imports.** Arquivo novo. `LinearProgress` é o único componente do MUI
que ainda não aparecia no projeto; o resto é o mesmo vocabulário das outras
telas (`Card`, `Stack`, `Chip`, `Typography`).

```tsx
import { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography, Stack, Chip, LinearProgress,
} from '@mui/material';
import * as api from '../services/api';
import { FeedbackAlert } from '../components/FeedbackAlert';
```

- [ ] **A tela não calcula nada** (RNF03). `series_validas` e `atingiu_limiar`
chegam prontos; `limiar` vem junto pra não existir um `10` solto no JSX. A
única aritmética é a **largura da barra**, que é geometria de desenho, não a
métrica — a barra poderia ser um número puro que o dado seria o mesmo.

- [ ] **`Math.min(100, ...)` na barra:** quem faz 15 séries num grupamento
estoura os 100% e o MUI reclama no console. Passar do limiar não é erro, então
a barra satura e o número ao lado (`15 / 10`) conta o resto da história.

- [ ] **Formatar a data sem `new Date`.** `new Date('2026-09-07')` é
interpretado como **UTC** pelo JS e, exibido em Brasília, volta pro dia 06 —
o painel mostraria domingo como início da semana e a D10 pareceria quebrada. Um
`split('-')` resolve sem biblioteca e sem armadilha de fuso.

- [ ] **Grupamento zerado é conteúdo, não vazio.** Não filtrar os que estão em
0: é justamente a linha "Costas 0/10" que faz a tela valer a pena. O texto de
apoio muda pra quem está abaixo do limiar, e é o mesmo dado que a IA vai
comentar na S7.

- [ ] **Esta é a Fig. 3** das cinco do capítulo de resultados (RF04 + limiar de
[Schoenfeld]). A versão final sai depois do code freeze, com os mesmos dados
das outras figuras — o limiar precisa aparecer visível na imagem.

### `client/src/views/WeeklyVolumeView.tsx` (completo)

```tsx
import { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography, Stack, Chip, LinearProgress,
} from '@mui/material';
import * as api from '../services/api';
import { FeedbackAlert } from '../components/FeedbackAlert';


//'2026-09-07' -> '07/09'. sem new Date de proposito: o JS interpreta a string
//ISO como UTC e, exibida em Brasilia (UTC-3), ela volta um dia - a segunda
//viraria domingo na tela e a D10 pareceria quebrada
function formatarDia(iso: string) {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

export function WeeklyVolumeView() {
  const [volume, setVolume] = useState<api.VolumeSemanal | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        const { volume } = await api.buscarVolumeSemanal();
        setVolume(volume);
      } catch (erro) {
        setErro(erro instanceof Error ? erro.message : 'Erro ao carregar o volume');
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  if (carregando) {
    return <Typography>Carregando...</Typography>;
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h2" gutterBottom>
          Volume da Semana
        </Typography>

        <FeedbackAlert erro={erro} />

        {volume && (
          <>
            <Typography color="text.secondary" gutterBottom>
              Semana de {formatarDia(volume.semana_referencia)} · séries válidas por
              grupamento · limiar de {volume.limiar} séries [Schoenfeld]
            </Typography>

            <Stack spacing={2.5} sx={{ mt: 3 }}>
              {volume.grupamentos.map((g) => (
                <Stack key={g.id_grupamento} spacing={0.75}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography sx={{ fontWeight: 600 }}>{g.nome_grupamento}</Typography>
                    <Chip
                      size="small"
                      //atingiu_limiar vem pronto do backend (RNF03) - a tela nao compara nada
                      color={g.atingiu_limiar ? 'success' : 'default'}
                      label={`${g.series_validas} / ${volume.limiar} séries`}
                    />
                  </Stack>

                  {/* a unica conta da tela e a LARGURA da barra: geometria de desenho,
                      nao a metrica. Math.min evita estourar 100% em quem passa do limiar */}
                  <LinearProgress
                    variant="determinate"
                    color={g.atingiu_limiar ? 'success' : 'primary'}
                    value={Math.min(100, (g.series_validas / volume.limiar) * 100)}
                    sx={{ height: 10, borderRadius: 999 }}
                  />

                  {/* o "faltam N" e subtracao de dois numeros que ja vieram do
                      backend, no mesmo nivel da largura da barra - a metrica e o
                      limiar continuam sendo decididos la (RNF03) */}
                  {!g.atingiu_limiar && (
                    <Typography variant="caption" color="text.secondary">
                      {g.series_validas === 0
                        ? 'Nenhuma série válida nesta semana'
                        : `Faltam ${volume.limiar - g.series_validas} séries para o limiar`}
                    </Typography>
                  )}
                </Stack>
              ))}
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Passo 13 — Fechar a semana

1. [ ] Conferir que o Passo 0 continua verde: `npm run test` no `server` com a
   suíte inteira (S2 + S3 + S4 + S5 + S6). Se alguma coisa da S5 voltou a
   falhar, é regressão dos Passos 3 e 4 — resolver antes de seguir.
2. [ ] Testar o `finish` pela interface: entrar → "Treino de hoje" → começar →
   registrar 3-4 séries → "Finalizar treino" → confirmar. A tela tem que voltar
   pro botão "Começar treino", e a mensagem tem que trazer a duração em minutos.
3. [ ] Recarregar a página depois de finalizar e conferir que **não** aparece o
   treino de novo (`completed = true` sai do `GET /sessions/today`), e que
   "Começar treino" cria um treino **novo** — não reabre o finalizado.
4. [ ] Conferir a D11 na prática: com o treino já finalizado, abrir "Volume da
   semana" e ver que as séries daquele treino continuam contadas.
5. [ ] Conferir a conta na unha uma vez, sem confiar no teste: registrar
   exatamente 5 séries `work` de peito e 3 de aquecimento, e ver `5 / 10` no
   painel. Bater esse número com um `SELECT` direto no banco é o que a matriz
   RF04 chama de "igual ao cálculo manual":

```sql
SELECT g.nome, COUNT(*)
FROM SerieTreino s
JOIN Exercicio e ON e.id_exercicio = s.fk_exercicio
JOIN GrupamentoMuscular g ON g.id_grupamento = e.fk_grupamento
JOIN Treino t ON t.id_treino = s.fk_treino
WHERE s.tipo = 'work' AND t.fk_usuario = '<seu-uuid>'
  AND t.data >= date_trunc('week', CURRENT_DATE)
GROUP BY g.nome;
```

6. [ ] Conferir o botão da lixeira nas séries (Reparo 4) — ele nunca funcionou
   até esta semana. Apagar uma série e ver o volume cair junto.
7. [ ] Testar no celular ou no DevTools em modo mobile (RNF01): o painel de
   volume tem que caber em uma coluna, sem rolagem horizontal.
8. [ ] Rodar `npm run build` nos dois lados — sem erro de tipo. No front,
   atenção especial: se sobrou algum `hoje.divisao` solto, é aqui que aparece.
9. [ ] Print do painel de volume com o limiar visível — é a **Fig. 3** das 5 do
   documento (RF04 + [Schoenfeld], ver seção 5 do `PLANEJAMENTO.md`). Vale um
   provisório agora pra garantir que a tela fecha o critério; a versão final sai
   depois do code freeze, com os mesmos dados das outras figuras.
10. [ ] Commit + push. Sugestão: um commit só pros reparos do Passo 0 (fica
    fácil de achar depois), um de backend (finish + volumeService + métricas +
    testes) e um de frontend (navegação + finalizar + painel).
11. [ ] Marcar os cards da S6 no Trello (`/trello-sync`).

---

## Ordem sugerida pra essa sessão

1. **Passo 0 primeiro, sempre.** Ele não é da S6, é dívida da S5 — mas é
   pré-requisito: o volume conta as séries que a S5 grava, e hoje ela grava
   errado (`rpe` nulo) num banco desatualizado.
2. **Sessão A (backend):** Passos 1 → 8 (types → sessionModel → sessionController
   → rotas → volumeService → metricsController → rotas + app → testes). Testar
   `POST /sessions/:id/finish` e `GET /metrics/weekly-volume` no Postman antes
   do teste automatizado, como nas semanas anteriores.
3. **Sessão B (frontend):** Passos 9 → 12 (`api.ts` → navegação → finalizar na
   `TodaySessionView` → `WeeklyVolumeView`), contra o backend pronto.
4. Passo 13 fecha a semana, ao final da Sessão B.

> **Se o tempo apertar**, o corte é o Passo 12 (a tela), não o Passo 5 (o
> cálculo). O entregável da semana é *"volume semanal calculado **no
> backend**"* — o endpoint com teste verde fecha o critério; a tela pode
> escorregar pra Sessão A da S7 sem travar nada, porque a S7 consome o
> `volumeService`, não a `WeeklyVolumeView`.

## Armadilhas comuns desta semana

- **Começar a S6 sem rodar o `db:reset`.** É a armadilha nº 1: sem a coluna
  gerada, `rpe` fica nulo em todas as séries, o painel de volume até funciona
  (ele conta `tipo`, não `rpe`), mas a S7 vai mandar RPE nulo pro Gemini e o
  diagnóstico sai sem sentido. Conferir `is_generated = 'ALWAYS'` antes.
- **Contar `aquecimento` e `feeder` no volume.** É a diferença entre o RF04 e
  um número inventado. `WHERE s.tipo = 'work'`, e o teste da soma manual existe
  pra isso.
- **Encadear `LEFT JOIN` em vez de usar a subconsulta.** As séries de outros
  usuários casam no join com `SerieTreino` e `COUNT(s.id_serie)` conta elas do
  mesmo jeito — o painel mostra o volume do banco inteiro e ninguém percebe,
  porque o número parece plausível.
- **`COUNT(*)` no lugar de `COUNT(coluna)`.** Grupamento sem série nenhuma sai
  com `1` em vez de `0`. O erro mais silencioso da semana.
- **Esquecer o `::int` no `COUNT`.** `BIGINT` volta do driver `pg` como
  **string**, e aí `series_validas >= LIMIAR_SERIES` compara string com número
  — `'9' >= 10` é `false`, mas `'9' >= 5` também dá certo por acaso, então o bug
  passa em metade dos testes. Mesma família da `carga`.
- **`BETWEEN` na janela da semana.** `data` é `TIMESTAMP`; `BETWEEN inicio AND
  fim` perde tudo que aconteceu depois da meia-noite do último dia. Usar `>=` e
  `<` com o fim exclusivo.
- **Deixar o driver converter o `DATE` da semana.** Sem o `to_char`, o `pg`
  devolve um objeto `Date` que vira UTC no JSON e volta um dia pra trás em
  Brasília. Tratar a semana como texto `'YYYY-MM-DD'` do banco até a tela.
- **`new Date('2026-09-07')` no front.** Mesmo problema pelo outro lado: a
  string ISO é lida como UTC e exibida como o dia anterior.
- **Deixar o front mandar `duracao_total`.** Vira cálculo no cliente (RNF03) e
  entrega o histórico ao relógio do celular. O `UPDATE` calcula (D12).
- **Finalizar sem `AND completed = FALSE` no `WHERE`.** Cada clique repetido
  recalcularia a duração a partir do horário de início — um treino de 50 min
  vira 3 h se a pessoa abrir a tela à noite e clicar de novo.
- **Contar só treino finalizado no volume.** O treino de hoje sumiria do painel
  justamente enquanto a pessoa está treinando (D11).
- **Somar séries válidas na `TodaySessionView` pra mostrar no cabeçalho.** É
  cálculo de volume no front (RNF03), e duplica a regra do `volumeService`.
- **Esquecer o `app.use(metricsRoutes)`.** A rota existe, o arquivo compila,
  o `GET` responde 404 e você procura o erro no controller por meia hora.
- **Esconder grupamento zerado no painel.** É o dado mais útil da tela — é ele
  que responde "o que eu não treinei essa semana", que é a pergunta que a S7 vai
  fazer pro Gemini.
- **Trocar `divisaoHoje` por `divisao` em algum canto por hábito.** A chave que
  ficou é `divisaoHoje`, nos quatro lugares (tipo, controller, `api.ts` e a
  tela) — só o teste mudou. O `npm run build` pega, mas só se você rodar. Um
  `grep -rn hoje.divisaoHoje server/src client/src` custa dois segundos.
