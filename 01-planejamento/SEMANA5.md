# Semana 5 — Roteiro de implementação (F3a Execução do Treino — RF03)

> Mesmo formato da S4: roteiro com código de exemplo, não copia-e-cola cego.
> Cards correspondentes no Trello: S5.

> **Ponto de partida:** S4 fechada — o catálogo (`GET /exercises`) responde, o
> vínculo `DivisaoExercicio` grava com `ordem`, o resumo de músculos sai do
> JOIN (Decisão D) e o `DayExercisesDialog` monta a rotina de cada dia. Ou
> seja: **existe uma rotina montada no banco**. Esta semana é a primeira que
> escreve dado gerado *durante* o treino, e não configuração.

> **O que muda de natureza aqui:** até a S4, tudo era CRUD de configuração
> (a semana ideal do usuário). `Treino`/`SerieTreino` é registro de
> acontecimento: cada série gravada é um fato datado que nunca mais deveria
> ser reescrito em lote. Por isso o padrão "apaga-e-reinsere" das S3/S4 **não
> se repete aqui** — série entra por `INSERT` individual (`POST`), e o único
> jeito de tirar uma é o `DELETE` explícito de uma série específica.

> **Escopo da semana (o que NÃO entra):** finalizar o treino (`completed` +
> `duracao_total`) e o cálculo de volume ficam na S6, conforme o cronograma.
> Aqui o treino nasce aberto e continua aberto — o suficiente pra RF03.

Critério de aceite (card 🎯 ENTREGÁVEL S5):
- [ ] `GET /sessions/today` monta o treino a partir da divisão do dia
- [ ] Registro de série com tipo, carga, reps, RPE e RIR
- [ ] Validações de faixa no backend: RPE 6–10, RIR 0–5 (RNF03)
- [ ] Tela usável no celular durante o treino (RNF01)
- [ ] Campos persistidos corretamente + teste de unidade (matriz RF03)

---

> ⚠️ **Divergência a resolver (INSTRUCOES.md).** O card do Trello e o
> `TASKS.md` escrevem o tipo da série como `aquecimento | válida`; o
> `schema.sql` (S1) já está criado com `CHECK (tipo IN
> ('aquecimento','feeder','work'))` — três valores, e o terceiro em inglês.
> O roteiro segue **o banco** (`aquecimento | feeder | work`), porque mudar
> o CHECK agora exigiria recriar tabela. O que precisa ser decidido: se o
> texto do TCC fala em "série válida", ou o texto passa a citar `work`, ou
> o schema é renomeado numa semana de folga (S9). Card `⚠️ Divergência TCC ×
> Sistema — nome do tipo de série` a criar na lista 📌 do Trello. A `S5` não
> depende dessa decisão pra rodar.

---

## Passo 0 — `server/src/types/indexTypes.ts`

- [ ] Acrescentar os tipos de `Treino` e `SerieTreino`, espelhando o
`schema.sql`. `carga` é `NUMERIC` no Postgres e o driver `pg` devolve
`NUMERIC` **como string** (pra não perder precisão) — por isso o tipo aqui é
`string`, não `number`. Ignorar isso é a causa nº 1 de `"50" + "10" = "5010"`
no front.

```ts
export interface Treino {
  id_treino: string;
  fk_usuario: string;
  fk_divisao: string | null;
  completed: boolean;
  data: string;
  duracao_total: number | null;
}

// os três valores vêm do CHECK do schema.sql — repetir aqui como union type
// faz o TS barrar um tipo inválido antes mesmo de o Postgres reclamar
export type TipoSerie = 'aquecimento' | 'feeder' | 'work';

export interface SerieTreino {
  id_serie: number;
  fk_treino: string;
  fk_exercicio: number;
  tipo: TipoSerie;
  carga: string; // NUMERIC volta como string no driver pg
  repeticoes: number;
  rpe: number | null;
  rir: number | null;
}

// o que o front manda ao registrar uma série: sem id_serie (SERIAL) e sem
// fk_treino (vem da URL, não do corpo — assim não dá pra gravar série no
// treino de outro usuário só trocando o body)
export interface SerieTreinoInput {
  fk_exercicio: number;
  tipo: TipoSerie;
  carga: number;
  repeticoes: number;
  rpe?: number | null;
  rir?: number | null;
}

// resposta do GET /sessions/today: junta o treino aberto (ou null), a divisão
// do dia e a lista de exercícios já na ordem da rotina, com as séries que já
// foram registradas hoje em cada um
export interface SerieComExercicio extends SerieTreino {
  nome_exercicio: string;
}

export interface TreinoDeHoje {
  dia_semana: number;
  divisao: Divisao | null;
  treino: Treino | null;
  exercicios: ExercicioDoDia[];
  series: SerieComExercicio[];
}
```

---

## Passo 1 — `server/src/models/sessionModel.ts`

- [ ] Arquivo novo. Quatro funções: achar/criar o treino de hoje, listar as
séries dele, inserir uma série e apagar uma série.

- [ ] **`buscarTreinoAberto`** — o treino de hoje é o do usuário com
`completed = false` e `data` no dia corrente. `data::date = CURRENT_DATE`
compara só a parte de data do `TIMESTAMP`, ignorando a hora:

```ts
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
```

- [ ] **`criarTreino`** — insere um treino vazio ligado (opcionalmente) à
divisão do dia. `fk_divisao` é nullable no schema de propósito: dá pra treinar
num dia sem divisão cadastrada, e se a divisão for apagada depois o treino
histórico não some.

```ts
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
```

- [ ] **`buscarSeries`** — as séries de um treino, com o nome do exercício
junto (mesmo motivo da S4: o front não deve cruzar catálogo na mão). Ordem
por `id_serie` = ordem cronológica de registro, que é exatamente a ordem em
que a pessoa treinou.

```ts
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
```

- [ ] **`registrarSerie`** — um `INSERT` só, sem transação: é uma linha em uma
tabela, o próprio `INSERT` já é atômico. Transação aqui seria ruído (diferente
da S3/S4, onde eram N operações que precisavam valer ou falhar juntas).

```ts
export async function registrarSerie(
  fkTreino: string,
  serie: SerieTreinoInput
): Promise<SerieTreino> {
  const resultado = await pool.query<SerieTreino>(
    `INSERT INTO SerieTreino
       (fk_treino, fk_exercicio, tipo, carga, repeticoes, rpe, rir)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      fkTreino,
      serie.fk_exercicio,
      serie.tipo,
      serie.carga,
      serie.repeticoes,
      serie.rpe ?? null,
      serie.rir ?? null,
    ]
  );
  return resultado.rows[0];
}
```

- [ ] **`apagarSerie`** — apagar errando o dedo acontece o tempo todo durante o
treino. O `fk_treino` entra no `WHERE` junto com o id: assim uma série só pode
ser apagada pelo treino a que pertence, e o controller confirma o dono do
treino antes (mesma ideia do `confirmarDonoDivisao` da S4). `rowCount` diz se
apagou de fato — é o que vira 404 no controller.

```ts
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
```

- [ ] **`buscarPorId`** — usada só pra confirmar dono antes de mexer nas
séries (o equivalente ao `confirmarDonoDivisao` da S4, mas aqui dá pra
resolver numa consulta só, porque `Treino` tem `fk_usuario` direto):

```ts
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
```

---

## Passo 2 — `server/src/controllers/sessionController.ts`

- [ ] **`treinoDeHoje` (GET)** — monta a tela inteira numa requisição só:
descobre o dia da semana, acha a divisão daquele dia, puxa os exercícios da
rotina (reaproveitando `divisionModel.buscarExerciciosDoDia` da S4 — não
duplicar a query) e devolve o treino aberto com as séries já registradas, se
houver.

- [ ] **O GET não cria treino.** Tentador fazer `GET /sessions/today` criar a
linha em `Treino` quando não existe, mas isso deixa um `INSERT` escondido
atrás de um verbo de leitura: abrir a tela por curiosidade passaria a sujar o
histórico com treinos vazios todo dia. Quem cria é o `POST /sessions/start`,
disparado pelo botão "Começar treino".

```ts
export async function treinoDeHoje(req: AuthenticateRequest, res: Response) {
  const fkUsuario = req.userId as string;
  const diaSemana = new Date().getDay(); // 0 = domingo, igual ao CHECK do schema

  const divisoes = await divisionModel.buscarPorUsuario(fkUsuario);
  const divisao = divisoes.find((d) => d.dia_semana === diaSemana) ?? null;

  const exercicios = divisao
    ? await divisionModel.buscarExerciciosDoDia(divisao.id_divisao)
    : [];

  const treino = await sessionModel.buscarTreinoAberto(fkUsuario);
  const series = treino ? await sessionModel.buscarSeries(treino.id_treino) : [];

  return res.status(200).json({
    hoje: { dia_semana: diaSemana, divisao, treino, exercicios, series },
  });
}
```

- [ ] **`comecarTreino` (POST)** — idempotente de propósito: se já existe
treino aberto hoje, devolve o mesmo em vez de criar outro. Sem isso, recarregar
a tela e clicar de novo geraria dois treinos no mesmo dia e o volume da S6
contaria a semana errada.

```ts
export async function comecarTreino(req: AuthenticateRequest, res: Response) {
  const fkUsuario = req.userId as string;

  const aberto = await sessionModel.buscarTreinoAberto(fkUsuario);
  if (aberto) {
    return res.status(200).json({ treino: aberto });
  }

  const diaSemana = new Date().getDay();
  const divisoes = await divisionModel.buscarPorUsuario(fkUsuario);
  const divisao = divisoes.find((d) => d.dia_semana === diaSemana) ?? null;

  const treino = await sessionModel.criarTreino(
    fkUsuario,
    divisao ? divisao.id_divisao : null
  );
  return res.status(201).json({ treino });
}
```

- [ ] **`validarSerie`** — as validações de faixa da RNF03 (`RPE 6–10`,
`RIR 0–5`) ficam **no backend**, não só no `<TextField>`. O banco já tem os
`CHECK`s, mas um CHECK violado sobe como erro 500 genérico do Postgres; a
validação aqui devolve 400 com mensagem legível. Os dois níveis coexistem de
propósito: o CHECK é a garantia (RNF02), a validação é a mensagem.

```ts
function validarSerie(serie: SerieTreinoInput): string | null {
  const tipos: TipoSerie[] = ['aquecimento', 'feeder', 'work'];

  if (!tipos.includes(serie.tipo)) {
    return 'tipo precisa ser aquecimento, feeder ou work';
  }
  if (typeof serie.fk_exercicio !== 'number') {
    return 'fk_exercicio precisa ser um número';
  }
  if (typeof serie.carga !== 'number' || serie.carga < 0) {
    return 'carga precisa ser um número maior ou igual a zero';
  }
  if (!Number.isInteger(serie.repeticoes) || serie.repeticoes <= 0) {
    return 'repeticoes precisa ser um inteiro maior que zero';
  }
  // rpe e rir são opcionais (aquecimento normalmente não leva nota), mas se
  // vierem precisam estar na faixa da RNF03
  if (serie.rpe != null && (serie.rpe < 6 || serie.rpe > 10)) {
    return 'rpe precisa estar entre 6 e 10';
  }
  if (serie.rir != null && (serie.rir < 0 || serie.rir > 5)) {
    return 'rir precisa estar entre 0 e 5';
  }
  return null;
}
```

- [ ] **`registrarSerie` (POST)** — confirma dono, valida, insere. O `404` pra
treino de outro usuário é o mesmo padrão da S4: não confirmar que existe e não
pertence, só "não encontrado".

```ts
export async function registrarSerie(req: AuthenticateRequest, res: Response) {
  const idTreino = req.params.id as string;
  const serie = req.body as SerieTreinoInput;

  const treino = await sessionModel.buscarPorId(idTreino, req.userId as string);
  if (!treino) {
    return res.status(404).json({ erro: 'Treino não encontrado' });
  }

  const erroValidacao = validarSerie(serie);
  if (erroValidacao) {
    return res.status(400).json({ erro: erroValidacao });
  }

  try {
    const salva = await sessionModel.registrarSerie(idTreino, serie);
    return res.status(201).json({ serie: salva });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao registrar série' });
  }
}
```

- [ ] **`apagarSerie` (DELETE)** — `req.params.idSerie` chega como string;
`Number()` + `Number.isNaN` antes de ir pro banco evita mandar `NaN` pro
Postgres (que erra com uma mensagem bem menos clara que um 400):

```ts
export async function apagarSerie(req: AuthenticateRequest, res: Response) {
  const idTreino = req.params.id as string;
  const idSerie = Number(req.params.idSerie);

  if (Number.isNaN(idSerie)) {
    return res.status(400).json({ erro: 'id da série inválido' });
  }

  const treino = await sessionModel.buscarPorId(idTreino, req.userId as string);
  if (!treino) {
    return res.status(404).json({ erro: 'Treino não encontrado' });
  }

  const apagou = await sessionModel.apagarSerie(idTreino, idSerie);
  if (!apagou) {
    return res.status(404).json({ erro: 'Série não encontrada' });
  }
  return res.status(204).send();
}
```

---

## Passo 3 — `server/src/routes/sessionRoutes.ts`

- [ ] Todas autenticadas, como as demais desde a S2.

```ts
import { Router } from 'express';
import {
  treinoDeHoje, comecarTreino, registrarSerie, apagarSerie,
} from '../controllers/sessionController';
import { autenticar } from '../middlewares/auth';

const router = Router();

router.get('/sessions/today', autenticar, treinoDeHoje);
router.post('/sessions/start', autenticar, comecarTreino);
router.post('/sessions/:id/sets', autenticar, registrarSerie);
router.delete('/sessions/:id/sets/:idSerie', autenticar, apagarSerie);

export default router;
```

> **Ordem de rota — de novo, não importa.** `/sessions/today` e
> `/sessions/start` têm 2 segmentos e são literais; `/sessions/:id/sets` tem 3.
> Nenhum conflito, pelo mesmo motivo explicado na S4. Mas repare que se um dia
> aparecer `GET /sessions/:id` (2 segmentos, paramétrico), aí `/today` e
> `/start` **precisam** vir registrados antes.

- [ ] Registrar em `app.ts` ao lado das outras:

```ts
import sessionRoutes from './routes/sessionRoutes';
// ...
app.use(sessionRoutes);
```

- [ ] **Teste manual (Postman):** com um dia da semana que tenha divisão +
exercícios salvos, `GET /sessions/today` devolve `divisao` preenchida,
`exercicios` na ordem e `treino: null`. `POST /sessions/start` cria (201) e,
chamado de novo, devolve o mesmo (200). `POST /sessions/:id/sets` com
`rpe: 12` devolve 400; com `rpe: 9` devolve 201. `GET /sessions/today` de
novo já traz a série na lista.

---

## Passo 4 — Testes de unidade (matriz RF03)

- [ ] Arquivo novo `server/src/__tests__/session.test.ts`, mesmo runner das
S2/S3/S4. O helper precisa ir mais longe que o da S4: registra, loga, cria
divisão **no dia de hoje** (senão `GET /sessions/today` não acha nada) e
pluga um exercício nela.

```ts
async function registrarComRotinaDeHoje() {
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
```

```ts
test('GET /sessions/today monta o treino a partir da divisão do dia', async () => {
  const { token, exercicio } = await registrarComRotinaDeHoje();

  const resposta = await request(app)
    .get('/sessions/today')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(resposta.status, 200);
  assert.equal(resposta.body.hoje.divisao.dia_semana, new Date().getDay());
  assert.equal(resposta.body.hoje.exercicios[0].fk_exercicio, exercicio.id_exercicio);
  assert.equal(resposta.body.hoje.treino, null); // GET não cria treino
});
```

```ts
test('POST /sessions/start é idempotente no mesmo dia', async () => {
  const { token } = await registrarComRotinaDeHoje();

  const primeira = await request(app)
    .post('/sessions/start')
    .set('Authorization', `Bearer ${token}`);
  const segunda = await request(app)
    .post('/sessions/start')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(primeira.status, 201);
  assert.equal(segunda.status, 200);
  assert.equal(segunda.body.treino.id_treino, primeira.body.treino.id_treino);
});
```

```ts
test('POST /sessions/:id/sets grava tipo, carga, reps, RPE e RIR', async () => {
  const { token, exercicio } = await registrarComRotinaDeHoje();
  const inicio = await request(app)
    .post('/sessions/start')
    .set('Authorization', `Bearer ${token}`);
  const idTreino = inicio.body.treino.id_treino as string;

  const resposta = await request(app)
    .post(`/sessions/${idTreino}/sets`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      fk_exercicio: exercicio.id_exercicio,
      tipo: 'work',
      carga: 60,
      repeticoes: 10,
      rpe: 9,
      rir: 1,
    });

  assert.equal(resposta.status, 201);
  assert.equal(resposta.body.serie.repeticoes, 10);
  assert.equal(resposta.body.serie.rpe, 9);
  assert.equal(resposta.body.serie.rir, 1);
  assert.equal(Number(resposta.body.serie.carga), 60); // NUMERIC volta string
});
```

```ts
test('RPE e RIR fora da faixa da RNF03 são recusados com 400', async () => {
  const { token, exercicio } = await registrarComRotinaDeHoje();
  const inicio = await request(app)
    .post('/sessions/start')
    .set('Authorization', `Bearer ${token}`);
  const idTreino = inicio.body.treino.id_treino as string;

  const base = { fk_exercicio: exercicio.id_exercicio, tipo: 'work', carga: 60, repeticoes: 10 };

  const rpeAlto = await request(app)
    .post(`/sessions/${idTreino}/sets`)
    .set('Authorization', `Bearer ${token}`)
    .send({ ...base, rpe: 12 });
  const rirAlto = await request(app)
    .post(`/sessions/${idTreino}/sets`)
    .set('Authorization', `Bearer ${token}`)
    .send({ ...base, rir: 9 });

  assert.equal(rpeAlto.status, 400);
  assert.equal(rirAlto.status, 400);
});
```

```ts
test('registrar série no treino de outro usuário retorna 404', async () => {
  const { token, exercicio } = await registrarComRotinaDeHoje();
  const inicio = await request(app)
    .post('/sessions/start')
    .set('Authorization', `Bearer ${token}`);
  const idTreino = inicio.body.treino.id_treino as string;

  const { token: tokenOutro } = await registrarELogar();
  const resposta = await request(app)
    .post(`/sessions/${idTreino}/sets`)
    .set('Authorization', `Bearer ${tokenOutro}`)
    .send({ fk_exercicio: exercicio.id_exercicio, tipo: 'work', carga: 60, repeticoes: 10 });

  assert.equal(resposta.status, 404);
});
```

- [ ] Os helpers `registrarELogar`/`registrarComDivisao` já estão duplicados em
`division.test.ts` e `exercise.test.ts`. Com o terceiro arquivo, vale extrair
pra `server/src/__tests__/testHelpers.ts` agora (era só uma sugestão na S4) —
`registrarELogar` fica lá e cada arquivo mantém só o helper específico dele.

---

## Passo 5 — Front: `client/src/services/api.ts` (acrescentar)

- [ ] Bloco novo `//====== treino ======`, seguindo a divisão por comentários
já usada no arquivo. `carga` entra como `number` na chamada e volta como
`string` na resposta — a assimetria é real (é o `NUMERIC` do Postgres), então
os tipos refletem isso em vez de mentir.

```ts
//============================treino===================================

export type TipoSerie = 'aquecimento' | 'feeder' | 'work';

export interface Treino {
  id_treino: string;
  fk_divisao: string | null;
  completed: boolean;
  data: string;
}

export interface Serie {
  id_serie: number;
  fk_exercicio: number;
  tipo: TipoSerie;
  carga: string; // NUMERIC do Postgres chega como string
  repeticoes: number;
  rpe: number | null;
  rir: number | null;
  nome_exercicio: string;
}

export interface TreinoDeHoje {
  dia_semana: number;
  divisao: Divisao | null;
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
    rpe?: number | null;
    rir?: number | null;
  }
) {
  return apiFetch(`/sessions/${idTreino}/sets`, {
    method: 'POST',
    body: serie,
  }) as Promise<{ serie: Serie }>;
}

export function apagarSerie(idTreino: string, idSerie: number) {
  return apiFetch(`/sessions/${idTreino}/sets/${idSerie}`, { method: 'DELETE' });
}
```

> ⚠️ **`apiFetch` e o 204.** O `DELETE` responde `204 No Content` — corpo
> vazio. O `apiFetch` atual faz `await resposta.json()` sempre, e `.json()` de
> corpo vazio **lança** `SyntaxError`. Antes de usar o `apagarSerie`, ajustar
> o helper:
>
> ```ts
> const dados = resposta.status === 204 ? null : await resposta.json();
> if (!resposta.ok) {
>   throw new Error(dados?.erro ?? 'Erro na requisição');
> }
> ```
>
> É a primeira vez no projeto que uma rota devolve 204 — por isso o problema
> só aparece agora.

---

## Passo 6 — Front: navegação entre telas

- [ ] Até a S4 o `App.tsx` renderizava `DivisionView` e ponto. Com a segunda
tela logada, precisa de alguma navegação — e o `react-router` continua adiado
(decisão da S3, reafirmada na S4). Caminho mais barato: um estado de tela no
`App.tsx` e a `Sidebar` recebendo qual está ativa + o que fazer no clique.
São ~10 linhas, contra uma dependência nova e uma refatoração de rotas.

```tsx
// App.tsx
export type Tela = 'divisao' | 'treino';

function App() {
  const { usuario, carregando } = useAuth();
  const [tela, setTela] = useState<Tela>('divisao');

  // ...carregando / !usuario iguais aos de hoje

  return (
    <AppShell tela={tela} onNavegar={setTela}>
      {tela === 'divisao' ? <DivisionView /> : <TodaySessionView />}
    </AppShell>
  );
}
```

- [ ] `AppShell` só repassa as duas props pra `Sidebar` (segue sendo casca,
não ganha lógica). Na `Sidebar`, o `NAV_ITEMS` deixa de ter `ativo` fixo e
`disponivel: false` no "Treino de hoje": cada item ganha uma chave `tela`,
e `ativo` passa a ser comparação com a prop.

```tsx
// Sidebar.tsx
interface NavItem {
  label: string;
  icon: ReactNode;
  tela?: Tela;          // itens sem tela ainda não existem (S7/S8)
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Minha divisão', icon: <CalendarViewWeekIcon fontSize="small" />, tela: 'divisao' },
  { label: 'Treino de hoje', icon: <FitnessCenterIcon fontSize="small" />, tela: 'treino' },
  { label: 'Diagnóstico', icon: <InsightsIcon fontSize="small" /> },
  { label: 'Histórico', icon: <TimelineIcon fontSize="small" /> },
];

// no map, trocar item.ativo / item.disponivel === false por:
const ativo = item.tela === telaAtual;
const disponivel = item.tela !== undefined;
// ...e no Stack: onClick={() => item.tela && onNavegar(item.tela)}
```

> Não trocar isso por `react-router` "já que vamos precisar depois": o
> roteamento real (com URL, back do navegador e rota protegida) é uma decisão
> de S9, e fazer meio-caminho agora custa duas refatorações em vez de uma.

---

## Passo 7 — Front: `client/src/views/TodaySessionView.tsx`

- [ ] **Mobile-first de verdade (RNF01).** Essa é a única tela usada *dentro*
da academia, de pé, com o celular numa mão. Consequências de design que valem
mais que estética: campos numéricos com `inputMode="decimal"` (abre o teclado
numérico no celular), botão de registrar série grande e sempre visível,
uma coluna só (`Stack`), e nada de tabela larga com rolagem horizontal.

- [ ] **Fluxo da tela:** carrega `GET /sessions/today` → se não há divisão no
dia, mostra estado vazio ("Hoje é dia de descanso") → se há, lista os
exercícios da rotina → botão "Começar treino" cria o `Treino` → a partir daí
cada exercício abre um formulário curto (tipo/carga/reps/RPE/RIR) e as séries
já registradas aparecem embaixo dele.

- [ ] **Estado do formulário por exercício, não global.** Um `formulario`
único quebra assim que a pessoa alterna entre dois exercícios (perde o que
digitou). Guardar num objeto indexado por `fk_exercicio`:

```tsx
const [rascunhos, setRascunhos] = useState<Record<number, Rascunho>>({});

function atualizarRascunho(fk: number, campo: keyof Rascunho, valor: string) {
  setRascunhos((atual) => ({
    ...atual,
    [fk]: { ...RASCUNHO_VAZIO, ...atual[fk], [campo]: valor },
  }));
}
```

- [ ] **Campos ficam como `string` no estado, viram `number` só no envio.**
Se o `useState` for `number`, apagar o campo pra digitar de novo dá `NaN` e o
input trava. `Number(rascunho.carga)` no `registrar()` resolve, e `rpe`/`rir`
em branco viram `null` (aquecimento não leva nota).

```tsx
async function registrar(fkExercicio: number) {
  const rascunho = rascunhos[fkExercicio] ?? RASCUNHO_VAZIO;
  setErro('');
  try {
    await api.registrarSerie(treino!.id_treino, {
      fk_exercicio: fkExercicio,
      tipo: rascunho.tipo,
      carga: Number(rascunho.carga),
      repeticoes: Number(rascunho.repeticoes),
      rpe: rascunho.rpe === '' ? null : Number(rascunho.rpe),
      rir: rascunho.rir === '' ? null : Number(rascunho.rir),
    });
    await recarregar(); // relê /sessions/today: a lista de séries vem do banco
  } catch (erro) {
    setErro(erro instanceof Error ? erro.message : 'Erro ao registrar série');
  }
}
```

- [ ] **Recarregar do servidor depois de gravar, em vez de empurrar no array
local.** Uma série a mais na lista local é fácil, mas o dado que vale é o do
banco (é ele que a S6 vai contar) — e ver a série voltando do servidor é a
confirmação visual de que persistiu. O custo é um GET por série registrada,
irrelevante nessa escala.

O arquivo completo está no anexo, no fim deste roteiro.

---

## Passo 8 — Fechar a semana

1. [ ] Testar pela interface, **no celular ou no DevTools em modo mobile**:
   entrar → "Treino de hoje" → dia sem divisão mostra o estado vazio → montar
   uma divisão pra hoje na outra tela → voltar → "Começar treino" → registrar
   3-4 séries (uma de aquecimento sem RPE, o resto `work` com RPE/RIR) →
   apagar uma → recarregar a página: as séries continuam lá.
2. [ ] Tentar RPE 12 pela interface e confirmar que o erro aparece amigável
   (vem do 400 do backend, não de um `alert` do navegador).
3. [ ] Rodar `npm run test` no server — suíte verde (S2 + S3 + S4 + S5).
4. [ ] Rodar `npm run build` nos dois lados — sem erro de tipo.
5. [ ] Print da tela de treino no celular com séries registradas — é a
   **Fig. 2** das 5 do documento (RF03 + RNF01, ver seção 5 do
   `PLANEJAMENTO.md`). Vale tirar um provisório agora pra garantir que a tela
   fecha o critério; a versão final sai depois do code freeze, com os mesmos
   dados das outras figuras.
6. [ ] Commit + push. Sugestão: um commit de backend (model + controller +
   rotas + testes) e outro de frontend (navegação + `TodaySessionView`).

---

## Ordem sugerida pra essa sessão

1. **Sessão A (backend):** Passos 0 → 4 (types → sessionModel →
   sessionController → rotas → testes). Testar cada endpoint no Postman antes
   do teste automatizado, como nas semanas anteriores.
2. **Sessão B (frontend):** Passos 5 → 7 (api.ts + correção do 204 →
   navegação no App/Sidebar → `TodaySessionView`), contra o backend pronto.
3. Passo 8 fecha a semana, ao final da Sessão B.

## Armadilhas comuns desta semana

- **Tratar `carga` como número na resposta.** `NUMERIC` volta do driver `pg`
  como string. `serie.carga * 2` vira `NaN` e `serie.carga + 5` vira `"605"`.
  Sempre `Number(serie.carga)` ao calcular ou comparar.
- **Fazer o `GET /sessions/today` criar o treino.** Abrir a tela passa a
  poluir o banco com treinos vazios e a S6 conta semana errada. Criar só no
  `POST /sessions/start`, e mantê-lo idempotente.
- **Repetir o "apaga e reinsere" das S3/S4 pras séries.** Aqui o dado é
  histórico, não configuração: `INSERT` individual e `DELETE` pontual. Um
  `PUT /sessions/:id/sets` que substitui tudo apagaria séries reais toda vez
  que a tela recarregasse.
- **Confiar só no `CHECK` do banco pra RPE/RIR.** Sem a validação no
  controller o usuário recebe um 500 do Postgres em vez de "rpe precisa estar
  entre 6 e 10" — e a RNF03 pede validação, não só constraint.
- **Esquecer o `buscarPorId` antes de gravar série.** Mesmo buraco da S4: sem
  confirmar o dono, qualquer usuário logado grava série no treino de outro
  sabendo o UUID.
- **Um formulário só pra todos os exercícios.** Alternar de exercício apaga o
  que foi digitado — usar o `Record<number, Rascunho>` do Passo 7.
- **Calcular volume/total de séries na tela.** A RNF03 manda todo cálculo pro
  backend, e o `volumeService` é justamente o entregável da S6. Aqui a tela só
  registra e exibe.
- **Adicionar `react-router` agora.** Duas telas cabem num `useState` no
  `App.tsx`; roteamento real é decisão de S9.

---

# Anexo — arquivos completos

> Os arquivos abaixo saem prontos dos Passos acima, com os imports resolvidos.
> Conferir contra o que já existe antes de sobrescrever — `api.ts`, `App.tsx`
> e `Sidebar.tsx` **não** estão aqui inteiros justamente porque são edições em
> arquivos existentes (Passos 5 e 6).

## `server/src/models/sessionModel.ts`

```ts
import { pool } from '../config/db';
import type {
  Treino, SerieTreino, SerieTreinoInput, SerieComExercicio,
} from '../types/indexTypes';

//treino aberto de hoje: mesmo usuario, ainda nao finalizado e com data no dia corrente
//data::date compara so a parte de data do TIMESTAMP, ignorando a hora
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

//confirma dono antes de qualquer operacao em serie (equivalente ao confirmarDonoDivisao da S4)
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

//fk_divisao e nullable de proposito: da pra treinar em dia sem divisao cadastrada
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

//series do treino, com nome do exercicio junto (front nao cruza catalogo na mao)
//ordem por id_serie = ordem cronologica de registro
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

//uma linha, um INSERT: nao precisa de transacao (diferente da S3/S4, que eram N operacoes)
export async function registrarSerie(
  fkTreino: string,
  serie: SerieTreinoInput
): Promise<SerieTreino> {
  const resultado = await pool.query<SerieTreino>(
    `INSERT INTO SerieTreino
       (fk_treino, fk_exercicio, tipo, carga, repeticoes, rpe, rir)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      fkTreino,
      serie.fk_exercicio,
      serie.tipo,
      serie.carga,
      serie.repeticoes,
      serie.rpe ?? null,
      serie.rir ?? null,
    ]
  );
  return resultado.rows[0];
}

//fk_treino no WHERE junto do id: serie so pode ser apagada pelo treino a que pertence
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
```

## `server/src/controllers/sessionController.ts`

```ts
import { Response } from 'express';
import * as sessionModel from '../models/sessionModel';
import * as divisionModel from '../models/divisionModel';
import type { AuthenticateRequest } from '../middlewares/auth';
import type { SerieTreinoInput, TipoSerie } from '../types/indexTypes';

//validacoes de faixa da RNF03 no backend: o CHECK do banco garante, isso aqui explica
function validarSerie(serie: SerieTreinoInput): string | null {
  const tipos: TipoSerie[] = ['aquecimento', 'feeder', 'work'];

  if (!tipos.includes(serie.tipo)) {
    return 'tipo precisa ser aquecimento, feeder ou work';
  }
  if (typeof serie.fk_exercicio !== 'number') {
    return 'fk_exercicio precisa ser um número';
  }
  if (typeof serie.carga !== 'number' || serie.carga < 0) {
    return 'carga precisa ser um número maior ou igual a zero';
  }
  if (!Number.isInteger(serie.repeticoes) || serie.repeticoes <= 0) {
    return 'repeticoes precisa ser um inteiro maior que zero';
  }
  //rpe e rir sao opcionais (aquecimento nao leva nota), mas se vierem precisam estar na faixa
  if (serie.rpe != null && (serie.rpe < 6 || serie.rpe > 10)) {
    return 'rpe precisa estar entre 6 e 10';
  }
  if (serie.rir != null && (serie.rir < 0 || serie.rir > 5)) {
    return 'rir precisa estar entre 0 e 5';
  }
  return null;
}

//monta a tela inteira numa requisicao: divisao do dia + exercicios da rotina + treino aberto + series
//nao cria treino: GET nao escreve (quem cria e o POST /sessions/start)
export async function treinoDeHoje(req: AuthenticateRequest, res: Response) {
  const fkUsuario = req.userId as string;
  const diaSemana = new Date().getDay(); //0 = domingo, igual ao CHECK do schema

  const divisoes = await divisionModel.buscarPorUsuario(fkUsuario);
  const divisao = divisoes.find((d) => d.dia_semana === diaSemana) ?? null;

  const exercicios = divisao
    ? await divisionModel.buscarExerciciosDoDia(divisao.id_divisao)
    : [];

  const treino = await sessionModel.buscarTreinoAberto(fkUsuario);
  const series = treino ? await sessionModel.buscarSeries(treino.id_treino) : [];

  return res.status(200).json({
    hoje: { dia_semana: diaSemana, divisao, treino, exercicios, series },
  });
}

//idempotente: se ja existe treino aberto hoje devolve o mesmo,
//senao recarregar a tela e clicar de novo criaria dois treinos no mesmo dia
export async function comecarTreino(req: AuthenticateRequest, res: Response) {
  const fkUsuario = req.userId as string;

  const aberto = await sessionModel.buscarTreinoAberto(fkUsuario);
  if (aberto) {
    return res.status(200).json({ treino: aberto });
  }

  const diaSemana = new Date().getDay();
  const divisoes = await divisionModel.buscarPorUsuario(fkUsuario);
  const divisao = divisoes.find((d) => d.dia_semana === diaSemana) ?? null;

  const treino = await sessionModel.criarTreino(
    fkUsuario,
    divisao ? divisao.id_divisao : null
  );
  return res.status(201).json({ treino });
}

export async function registrarSerie(req: AuthenticateRequest, res: Response) {
  const idTreino = req.params.id as string;
  const serie = req.body as SerieTreinoInput;

  const treino = await sessionModel.buscarPorId(idTreino, req.userId as string);
  if (!treino) {
    return res.status(404).json({ erro: 'Treino não encontrado' });
  }

  const erroValidacao = validarSerie(serie);
  if (erroValidacao) {
    return res.status(400).json({ erro: erroValidacao });
  }

  try {
    const salva = await sessionModel.registrarSerie(idTreino, serie);
    return res.status(201).json({ serie: salva });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao registrar série' });
  }
}

export async function apagarSerie(req: AuthenticateRequest, res: Response) {
  const idTreino = req.params.id as string;
  const idSerie = Number(req.params.idSerie);

  if (Number.isNaN(idSerie)) {
    return res.status(400).json({ erro: 'id da série inválido' });
  }

  const treino = await sessionModel.buscarPorId(idTreino, req.userId as string);
  if (!treino) {
    return res.status(404).json({ erro: 'Treino não encontrado' });
  }

  const apagou = await sessionModel.apagarSerie(idTreino, idSerie);
  if (!apagou) {
    return res.status(404).json({ erro: 'Série não encontrada' });
  }
  return res.status(204).send();
}
```

## `server/src/routes/sessionRoutes.ts`

```ts
import { Router } from 'express';
import {
  treinoDeHoje,
  comecarTreino,
  registrarSerie,
  apagarSerie,
} from '../controllers/sessionController';
import { autenticar } from '../middlewares/auth';

const router = Router();

//rotas literais de 2 segmentos e paramétrica de 4: sem conflito de ordem
router.get('/sessions/today', autenticar, treinoDeHoje);
router.post('/sessions/start', autenticar, comecarTreino);
router.post('/sessions/:id/sets', autenticar, registrarSerie);
router.delete('/sessions/:id/sets/:idSerie', autenticar, apagarSerie);

export default router;
```

## `client/src/views/TodaySessionView.tsx`

```tsx
import { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography, TextField, Button, Stack, Chip,
  IconButton, MenuItem, Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../services/api';
import { FeedbackAlert } from '../components/FeedbackAlert';

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const TIPOS: { valor: api.TipoSerie; label: string }[] = [
  { valor: 'aquecimento', label: 'Aquecimento' },
  { valor: 'feeder', label: 'Feeder' },
  { valor: 'work', label: 'Válida' },
];

//campos ficam como string no estado: se fossem number, apagar o campo daria NaN e travaria o input
interface Rascunho {
  tipo: api.TipoSerie;
  carga: string;
  repeticoes: string;
  rpe: string;
  rir: string;
}

const RASCUNHO_VAZIO: Rascunho = {
  tipo: 'work',
  carga: '',
  repeticoes: '',
  rpe: '',
  rir: '',
};

export function TodaySessionView() {
  const [hoje, setHoje] = useState<api.TreinoDeHoje | null>(null);
  const [rascunhos, setRascunhos] = useState<Record<number, Rascunho>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

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

  //um rascunho por exercicio: um formulario global perderia o que foi digitado ao trocar de exercicio
  function atualizarRascunho(fk: number, campo: keyof Rascunho, valor: string) {
    setRascunhos((atual) => ({
      ...atual,
      [fk]: { ...RASCUNHO_VAZIO, ...atual[fk], [campo]: valor },
    }));
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

  //converte pra number so no envio; rpe/rir em branco viram null (aquecimento nao leva nota)
  async function registrar(fkExercicio: number) {
    if (!hoje?.treino) return;
    const rascunho = rascunhos[fkExercicio] ?? RASCUNHO_VAZIO;
    setErro('');
    try {
      await api.registrarSerie(hoje.treino.id_treino, {
        fk_exercicio: fkExercicio,
        tipo: rascunho.tipo,
        carga: Number(rascunho.carga),
        repeticoes: Number(rascunho.repeticoes),
        rpe: rascunho.rpe === '' ? null : Number(rascunho.rpe),
        rir: rascunho.rir === '' ? null : Number(rascunho.rir),
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

  if (carregando) {
    return <Typography>Carregando...</Typography>;
  }

  if (!hoje?.divisao) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h2" gutterBottom>
            Treino de Hoje
          </Typography>
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
          {DIAS[hoje.dia_semana]} — {hoje.divisao.nome}
        </Typography>

        <FeedbackAlert erro={erro} />

        {!hoje.treino ? (
          <Button variant="contained" size="large" fullWidth onClick={comecar} sx={{ mt: 2 }}>
            Começar treino
          </Button>
        ) : (
          <Stack spacing={3} sx={{ mt: 2 }}>
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
                    <TextField
                      label="RPE"
                      size="small"
                      inputMode="numeric"
                      value={rascunho.rpe}
                      onChange={(e) =>
                        atualizarRascunho(exercicio.fk_exercicio, 'rpe', e.target.value)
                      }
                    />
                    <TextField
                      label="RIR"
                      size="small"
                      inputMode="numeric"
                      value={rascunho.rir}
                      onChange={(e) =>
                        atualizarRascunho(exercicio.fk_exercicio, 'rir', e.target.value)
                      }
                    />
                  </Stack>

                  <Button
                    variant="contained"
                    onClick={() => registrar(exercicio.fk_exercicio)}
                    disabled={!rascunho.carga || !rascunho.repeticoes}
                  >
                    Registrar série
                  </Button>

                  <Divider />
                </Stack>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
```
