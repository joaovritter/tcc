# Semana 8 · 21–27/09 · F5b Tela Diagnóstico + F6 Histórico (RF07)

> Entregável: **fluxo principal ponta a ponta** (login → rotina → treino → volume →
> diagnóstico → histórico) — [card do entregável](https://trello.com/c/MLlAbzpN). Ver
> S8 no [`TASKS.md`](./TASKS.md) e a linha S8 do cronograma no
> [`PLANEJAMENTO.md`](./PLANEJAMENTO.md).
> Decisões novas desta semana (**confirmadas em 23/09**): **D16** (finalizar e
> avaliar num botão só, em duas chamadas, e só treino finalizado vira
> diagnóstico), **D17** (progressão de carga = maior carga válida por sessão) e
> **D18** (recorte do histórico).

> **Como este roteiro está dividido:** a **Parte 1** (Passos 0–5) só corrige o
> que ficou pendente das semanas passadas — nada de feature nova. A **Parte 2**
> (Passos 6–22) é a implementação da S8 de fato. A Parte 2 começa só com a
> Parte 1 verde, porque a tela nova depende das correções (o 409 e o
> `data_treino` do Passo 1, o `ApiErro` do Passo 3).

> **O que muda de natureza aqui:** a S7 deixou o diagnóstico pronto no backend, mas
> ninguém consegue vê-lo sem Postman. A S8 é a semana que **fecha o ciclo pro
> usuário**: a tela do diagnóstico (RF05/RF06 visíveis) e o histórico (RF07). Do
> lado do backend, o histórico é só **leitura** — nenhuma tabela nova, nenhuma
> coluna nova. Tudo o que o RF07 mostra já está gravado desde a S5.

> **O que o texto do TCC pede (Tabela II):** *"RF07 — Exibir o histórico de cargas
> registradas, volume semanal e diagnósticos anteriores."* São exatamente as três
> abas da `HistoryView` (Passo 20): **Cargas**, **Volume** e **Sessões** (onde
> ficam os diagnósticos anteriores, um por sessão).

> **Escopo da semana (o que NÃO entra):** responsividade da sidebar (D6) e testes
> de integração ponta a ponta são S9. Aqui a tela precisa funcionar e caber no
> celular numa coluna, mas a barra inferior ainda não existe.

Critério de aceite (card 🎯 ENTREGÁVEL S8):
- [ ] Tela Diagnóstico com score visual 0–100 (círculo/barra)
- [ ] Análises por grupamento/exercício + recomendações exibidas
- [ ] Histórico: sessões, progressão de carga, volume semanal e diagnósticos
  anteriores (RF07)
- [ ] Demo ponta a ponta gravada (login → rotina → treino → volume → diagnóstico →
  histórico)

---

## Decisões novas desta semana

> **D16 — "Finalizar e avaliar treino" é um botão só, mas são duas chamadas
> (confirmada 23/09).** Na tela, a pessoa toca **um** botão no fim do treino. Por
> baixo, o front faz **em sequência**: `POST /sessions/:id/finish` e, só se ele
> der certo, `POST /sessions/:id/diagnostics/generate`. O backend **não muda de
> contrato** — continuam dois endpoints separados.
>
> Avaliado e **descartado**: juntar as duas coisas no backend (o `finish`
> chamando o Gemini por dentro). O Gemini leva segundos e pode falhar (502); com
> tudo numa chamada só, uma falha da IA derrubaria junto o encerramento do treino
> — contra a RNF06, que pede o contrário (falha da IA não pode arriscar o
> registro de treino). Com duas chamadas encadeadas no front, o treino já está
> **salvo e fechado** quando a IA é chamada. Se ela falhar, a tela mostra o erro
> e troca o botão por "Tentar avaliar de novo", que refaz **só** o `generate`.
>
> Consequências aceitas: (1) todo treino finalizado pela tela gasta uma chamada
> do Gemini; (2) sessão sem série válida finaliza normalmente e o `generate`
> devolve 400 — a tela avisa "treino salvo, sem séries válidas para avaliar" e
> não oferece nova tentativa.
>
> E o backend passa a **recusar (409)** diagnóstico de treino aberto. A D15 já
> dizia *"acionado por sessão de treino **finalizada**"*, mas o controller da S7
> não conferia `completed` — é a correção do Passo 1. Com o botão único isso
> importa ainda mais: é o 409 que garante a ordem finish → generate mesmo se
> alguém chamar a API fora da tela.

> **D17 — Progressão de carga = maior carga de série válida, por sessão, por
> exercício (confirmada 23/09).** Um ponto no gráfico = uma sessão. Avaliado e
> **descartado**: estimar 1RM (Epley/Brzycki). Seria uma fórmula nova que o texto
> do TCC não cita — abriria divergência TCC × sistema (ver
> [`INSTRUCOES.md`](./INSTRUCOES.md)) por um ganho pequeno. Só entram séries `work`
> (aquecimento com 100 kg não é progressão), e — mesma lógica da D11 — série
> registrada conta, treino finalizado ou não.

> **D18 — Recorte do histórico (confirmada 23/09).** (1) A aba **Sessões** lista
> só treino **finalizado** — o treino aberto é assunto do "Treino de hoje", e só
> treino finalizado pode ter diagnóstico (D16). (2) O **volume histórico** mostra
> as últimas **8 semanas de calendário** (segunda a domingo, D10), configurável
> por `?semanas=1..26`, com **todos** os grupamentos em cada semana (zerado
> também, mesma regra do painel da S6). (3) A lista de diagnósticos anteriores
> traz os **20 mais recentes**; cada sessão mostra o diagnóstico mais novo dela
> (D14).

---

# Parte 1 — Correções das semanas passadas

Tudo o que ficou para trás das S5–S7 e foi encontrado no planejamento desta
semana. Nenhum destes passos cria feature: eles deixam o chão firme para a Parte
2.

| Passo | Correção | Origem |
|---|---|---|
| 1 | Diagnóstico só de treino finalizado (409) + `data_treino` no `latest` + limpeza do `diagnostic.test.ts` | S7 |
| 2 | Id que não é UUID na URL devolve 500 em vez de 404 | S3–S7 |
| 3 | Front decide fluxo comparando texto de mensagem de erro (`includes('já foi finalizado')`) | S6 |
| 4 | `PLANEJAMENTO.md`: cronograma ainda diz "Diagnóstico da **Semana**" + registrar D16–D18 | S7/S8 |
| 5 | Postman: validar as correções + deixar o fluxo base pronto para a Parte 2 | — |

## Passo 0 — Conferir que a S7 está mesmo fechada

- [ ] `npm run test` no `server` sai **42/42 verde** (8 auth + 7 divisão + 3
  exercício + 9 sessão + 11 volume + 4 diagnóstico). A S8 lê as tabelas que a
  S5, a S6 e a S7 escreveram — se alguma estiver vermelha, resolver antes.
- [ ] `server/.env` com `GEMINI_MOCK=true` enquanto desenvolve e roda a suíte. A
  chave real só volta pra gravar a demo (Passo 22).

---

## Passo 1 — Correção (S7): diagnóstico só de treino finalizado + `data_treino`

- [ ] Duas mudanças pequenas no que a S7 entregou, feitas **antes** da tela
  porque a tela depende delas: (1) o guard de `completed` no
  `gerarDiagnostico` (409), e (2) o `GET /diagnostics/latest` passa a trazer a
  data do treino (`data_treino`) — a tela precisa dizer *de qual sessão* é o
  diagnóstico, e hoje o JSON só tem `fk_treino` (um UUID) e `data_geracao`
  (quando a IA respondeu, não quando a pessoa treinou).

### `server/src/types/indexTypes.ts` (acrescentar no bloco de diagnóstico)

- [ ] Tipo novo `DiagnosticoComTreino` — é o diagnóstico com a data da sessão
  vinda de um `JOIN Treino`. Usado aqui no `latest` e de novo no Passo 14.

```ts
// diagnostico + data da sessao que o gerou (JOIN Treino) - a tela mostra
// "Sessao de 23/09", e data_geracao e quando a IA respondeu, nao quando treinou
export interface DiagnosticoComTreino extends DiagnosticoIA {
    data_treino: string;
}
```

### `server/src/models/diagnosticModel.ts` (substituir `buscarUltimoDoUsuario`)

- [ ] Import muda: `DiagnosticoComTreino` entra ao lado dos outros tipos.
- [ ] `d.*` + `t.data AS data_treino` — continua devolvendo todos os campos de
  antes, então o teste da S7 (`id_diagnostico` igual) segue passando.

```ts
import { DiagnosticoIA, DiagnosticoConteudoPersistido, DiagnosticoComTreino } from '../types/indexTypes';

// diagnóstico atual = o mais recente do usuário, já com a data da sessão (D14)
export async function buscarUltimoDoUsuario(fkUsuario: string): Promise<DiagnosticoComTreino | null> {
  const resultado = await pool.query<DiagnosticoComTreino>(
    `SELECT d.*, t.data AS data_treino
     FROM DiagnosticoIA d
     JOIN Treino t ON t.id_treino = d.fk_treino
     WHERE d.fk_usuario = $1
     ORDER BY d.data_geracao DESC
     LIMIT 1`,
    [fkUsuario]
  );
  return resultado.rows[0] ?? null;
}
```

### `server/src/controllers/diagnosticController.ts` (acrescentar o guard)

- [ ] Logo depois do 404 do treino, **antes** de buscar séries. A ordem dos
  guards importa: 404 (não existe/não é seu) → 409 (existe mas está aberto) →
  400 (fechado mas sem série válida).

```ts
  const treino = await sessionModel.buscarPorId(idTreino, fkUsuario);
  if (!treino) {
    return res.status(404).json({ erro: 'Treino não encontrado' });
  }

  // D15/D16: diagnóstico é da sessão ENCERRADA. com o treino aberto, as séries
  // ainda mudam e o texto da IA descreveria um treino que não existe mais
  if (!treino.completed) {
    return res.status(409).json({ erro: 'Finalize o treino antes de gerar o diagnóstico' });
  }

  const series = await sessionModel.buscarSeriesValidasDaSessao(idTreino, fkUsuario);
```

### `server/src/__tests__/diagnostic.test.ts` (completo)

- [ ] Os dois testes que geravam diagnóstico em treino aberto agora finalizam
  antes — sem isso eles tomam 409 e ficam vermelhos (é o guard funcionando, não
  bug).
- [ ] Teste novo: treino aberto → 409.
- [ ] O fluxo completo passa a conferir `data_treino` no `latest`.
- [ ] Limpeza: sai o `import { response } from 'express'` que não era usado, e o
  último teste tinha o nome errado (`calcularPi` testando `calcularPv`).

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app';
import { registrarComTreinoAberto } from './testHelpers';
import { calcularPv, calcularPi, calcularScoreGeral } from '../services/scoreService';


async function finalizar(token: string, idTreino: string) {
    await request(app)
        .post(`/sessions/${idTreino}/finish`)
        .set('Authorization', `Bearer ${token}`);
}


test('POST /sessions/:id/diagnostics/generate com treino aberto retorna 409 (D16)', async () => {
    const { token, idTreino, exercicio } = await registrarComTreinoAberto();
    await request(app)
        .post(`/sessions/${idTreino}/sets`)
        .set('Authorization', `Bearer ${token}`)
        .send({ fk_exercicio: exercicio.id_exercicio, tipo: 'work', carga: 80, repeticoes: 8, rir: 1 });

    const resposta = await request(app)
        .post(`/sessions/${idTreino}/diagnostics/generate`)
        .set('Authorization', `Bearer ${token}`);
    assert.equal(resposta.status, 409);
});


test('POST /sessions/:id/diagnostics/generate sem série válida retorna 400', async () => {
    const { token, idTreino } = await registrarComTreinoAberto(); //treino sem série válida
    await finalizar(token, idTreino);

    const resposta = await request(app)
        .post(`/sessions/${idTreino}/diagnostics/generate`)
        .set('Authorization', `Bearer ${token}`);
    assert.equal(resposta.status, 400);
});


test('Fluxo completo: registrar work set, finalizar, gerar diagnóstico, score bate com o cálculo manual', async () => {
    const { token, idTreino, exercicio } = await registrarComTreinoAberto();

    await request(app)
        .post(`/sessions/${idTreino}/sets`)
        .set('Authorization', `Bearer ${token}`)
        .send({ fk_exercicio: exercicio.id_exercicio, tipo: 'work', carga: 80, repeticoes: 8, rir: 1 });
    await finalizar(token, idTreino);

    const geracao = await request(app)
        .post(`/sessions/${idTreino}/diagnostics/generate`)
        .set('Authorization', `Bearer ${token}`);
    assert.equal(geracao.status, 201);

    const { score_geral, conteudo_json } = geracao.body.diagnostico;
    //com 1 serie com RPE=9 em 1 grupamento fora do limiar: pv baixo, pi = 100
    const piEsperado = calcularPi([{ rpe: 9 } as any]);
    assert.equal(conteudo_json.score_detalhe.pi, piEsperado);
    assert.equal(score_geral, calcularScoreGeral(conteudo_json.score_detalhe.pv, piEsperado));

    const atual = await request(app)
        .get('/diagnostics/latest')
        .set('Authorization', `Bearer ${token}`);
    assert.equal(atual.status, 200);
    assert.equal(atual.body.diagnostico.id_diagnostico, geracao.body.diagnostico.id_diagnostico);
    assert.ok(atual.body.diagnostico.data_treino); //JOIN Treino (Passo 1 da S8)
});


//testes puros de ScoreService, não toca no banco nem gemini

test('calcularPi: RPE 6 vale 0, RPE 9 vale 100', () => {
    assert.equal(calcularPi([{ rpe: 6 } as any]), 0);
    assert.equal(calcularPi([{ rpe: 9 } as any]), 100);
});


test('calcularPv: grupamento fora da rotina não entra na média', () => {
    const volume = {
        semana_referencia: '2026-09-14',
        limiar: 10,
        grupamentos: [
            { id_grupamento: 1, nome_grupamento: 'Peito', series_validas: 10, atingiu_limiar: true },
            { id_grupamento: 2, nome_grupamento: 'Panturrilha', series_validas: 0, atingiu_limiar: false },
        ],
    };
    // só o grupamento 1 está na rotina: Pv = 100, não (100+0)/2 = 50
    assert.equal(calcularPv(volume as any, new Set([1])), 100);
});
```

- [ ] `npm run test` → **43/43** (42 + o 409).

---

## Passo 2 — Correção (S3–S7): id que não é UUID na URL devolve 500

- [ ] O problema: `POST /sessions/abc/finish`, `…/sessions/abc/sets`,
  `…/sessions/abc/diagnostics/generate` e `GET /divisions/abc/exercises`
  respondem **500**. O Postgres recusa `'abc'` como UUID (erro `22P02`) antes de
  o `WHERE` rodar, a exceção sobe sem tratamento e o Express devolve o 500
  padrão. O correto é **404** — o recurso não existe, igual a um UUID válido que
  não é do usuário.
- [ ] A correção é um middleware só, reusado em toda rota com `:id` UUID, em vez
  de repetir o `if` em cada controller. Roda **depois** do `autenticar` (sem
  token continua sendo 401, como antes).
- [ ] 404 e não 400, de propósito: mesma resposta do "treino de outro usuário" —
  a API não diferencia "não existe" de "id malformado" pra quem está sondando.

### `server/src/middlewares/validarUuid.ts` (novo)

```ts
import { Request, Response, NextFunction } from 'express';

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

//barra id malformado ANTES de chegar no Postgres: sem isso, 'abc' vira erro
//22P02 do banco e o Express responde 500. 404 igual a "nao e seu" - nao
//diferencia "nao existe" de "id invalido"
export function validarUuid(parametro: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!FORMATO_UUID.test(String(req.params[parametro]))) {
            return res.status(404).json({ erro: 'Recurso não encontrado' });
        }
        next();
    };
}
```

### `server/src/routes/sessionRoutes.ts` (completo)

```ts
import { Router } from "express";
import { autenticar } from "../middlewares/auth";
import { validarUuid } from "../middlewares/validarUuid";
import {
    treinoDeHoje, comecarTreino, registrarSerie, apagarSerie, finalizarTreino
} from '../controllers/sessionController';


const router = Router();

router.get('/sessions/today', autenticar, treinoDeHoje);
router.post('/sessions/start', autenticar, comecarTreino);
router.post('/sessions/:id/sets', autenticar, validarUuid('id'), registrarSerie);
router.delete('/sessions/:id/sets/:idSerie', autenticar, validarUuid('id'), apagarSerie);
router.post('/sessions/:id/finish', autenticar, validarUuid('id'), finalizarTreino);


export default router;
```

### `server/src/routes/diagnosticRoutes.ts` (completo)

```ts
import { Router } from 'express';
import { autenticar } from '../middlewares/auth';
import { validarUuid } from '../middlewares/validarUuid';
import { gerarDiagnostico, diagnosticoAtual } from '../controllers/diagnosticController';

const router = Router();

router.post('/sessions/:id/diagnostics/generate', autenticar, validarUuid('id'), gerarDiagnostico);
router.get('/diagnostics/latest', autenticar, diagnosticoAtual);

export default router;
```

### `server/src/routes/divisionRoutes.ts` (só as duas rotas com `:id`)

- [ ] `/divisions/muscle-summary` não muda — é outro caminho, não passa pelo
  `:id`.

```ts
import { validarUuid } from '../middlewares/validarUuid';

router.get('/divisions/:id/exercises', autenticar, validarUuid('id'), listarExerciciosDivisao);
router.put('/divisions/:id/exercises', autenticar, validarUuid('id'), salvarExerciciosDivisao);
```

### Testes (acrescentar)

- [ ] No fim do `server/src/__tests__/session.test.ts` (o `registrarELogar` já
  está no import):

```ts
test('id de treino que não é UUID retorna 404, não 500', async () => {
  const { token } = await registrarELogar();

  const finish = await request(app)
    .post('/sessions/abc/finish')
    .set('Authorization', `Bearer ${token}`);
  const diagnostico = await request(app)
    .post('/sessions/abc/diagnostics/generate')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(finish.status, 404);
  assert.equal(diagnostico.status, 404);
});
```

- [ ] No fim do `server/src/__tests__/division.test.ts` — esse arquivo **não**
  importa o helper ainda; acrescentar `import { registrarELogar } from
  './testHelpers';` no topo:

```ts
test('id de divisão que não é UUID retorna 404, não 500', async () => {
  const { token } = await registrarELogar();
  const resposta = await request(app)
    .get('/divisions/abc/exercises')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(resposta.status, 404);
});
```

- [ ] `npm run test` → **45/45** (43 + 2).

---

## Passo 3 — Correção (S6): front decide fluxo comparando texto de erro

- [ ] O problema: o `finalizar` da `TodaySessionView` (S6) ignora o 409 fazendo
  `mensagem.includes('já foi finalizado')`. Qualquer ajuste de redação no
  backend (tirar o acento, trocar a frase) quebra isso em silêncio — o erro
  volta a aparecer na tela e ninguém sabe por quê. O `apiFetch` joga só a
  mensagem; o **status HTTP se perde** no caminho.
- [ ] A correção: um `ApiErro` que carrega o `status`. Continua sendo `Error`,
  então todo `catch` existente que faz `erro instanceof Error ? erro.message :
  …` segue funcionando sem mudança. A Parte 2 usa o mesmo `ApiErro` pra separar
  o 404 "ainda não tem diagnóstico" (Passo 8) e o 400/502 do botão único
  (Passo 9).
- [ ] Classe com campo declarado (não `constructor(public status: number)`) —
  o `tsconfig.app.json` tem `erasableSyntaxOnly`, que proíbe parameter
  properties.

### `client/src/services/api.ts` (acrescentar antes do `apiFetch` + trocar o `throw`)

```ts
//erro com o status HTTP junto: a tela decide pelo status, nao comparando texto
export class ApiErro extends Error {
    status: number;

    constructor(mensagem: string, status: number) {
        super(mensagem);
        this.status = status;
    }
}
```

```ts
    const dados = resposta.status === 204 ? null : await resposta.json();
    if (!resposta.ok) {
        throw new ApiErro(dados?.erro ?? 'Erro na requisição', resposta.status);
    }
```

### `client/src/views/TodaySessionView.tsx` (o `catch` do `finalizar`)

```tsx
    } catch (erro) {
      //409 do backend: ja estava finalizado (dois toques rapidos, ou outro
      //aparelho). o estado desejado foi alcancado - decide pelo status, nao pelo texto
      if (!(erro instanceof api.ApiErro && erro.status === 409)) {
        setErro(erro instanceof Error ? erro.message : 'Erro ao finalizar treino');
      }
    } finally {
```

- [ ] Conferir pela tela: finalizar um treino, e no DevTools (aba Network)
  reenviar o `POST …/finish` → nenhum alerta vermelho aparece.
- [ ] `npm run build` no `client` sem erro.

---

## Passo 4 — Correção (documentação): `PLANEJAMENTO.md`

- [ ] Cronograma (seção 4), linha S8: trocar "Tela *Diagnóstico da **Semana***"
  por "Tela *Diagnóstico da **Sessão***". É resíduo de antes da D15 (17/09) — o
  diagnóstico é por sessão desde então, e a seção 5 (Fig. 4) já fala em
  "Diagnóstico da Sessão".
- [ ] Seção 2 (decisões), acrescentar depois da D15, no mesmo formato das
  anteriores:
  - **D16 — "Finalizar e avaliar treino" é um botão só, em duas chamadas (23/09)**:
    o front chama `POST /sessions/:id/finish` e, se der certo, `POST
    /sessions/:id/diagnostics/generate`. Juntar as duas no backend foi descartado
    (falha do Gemini derrubaria o encerramento do treino, contra a RNF06). O
    backend recusa (409) diagnóstico de treino aberto.
  - **D17 — Progressão de carga = maior carga de série `work` por sessão, por
    exercício (23/09)**: 1RM estimada descartada (fórmula que o texto do TCC não
    cita). Série registrada conta, treino finalizado ou não (mesma lógica da D11).
  - **D18 — Recorte do histórico (23/09)**: sessões = só treino finalizado;
    volume histórico = últimas 8 semanas de calendário (`?semanas=1..26`), todos
    os grupamentos em cada semana; diagnósticos anteriores = os 20 mais recentes.
- [ ] Seção 3 (arquitetura): acrescentar `history` na lista de controllers e
  `historyModel` na de models — a Parte 2 cria os dois.

---

## Passo 5 — Postman: ambiente, coleção e o fluxo base até o diagnóstico

Este passo fecha a Parte 1: ele **valida as correções dos Passos 1 e 2** (5.9 e
5.13) e deixa um usuário com treino e diagnóstico prontos pra desenvolver a Parte 2
contra dado real. O 5.10 + 5.11 são exatamente as duas chamadas que o botão
"Finalizar e avaliar treino" (D16, Passo 9) vai fazer em sequência.

Até a S7 o Postman era "abre, cola o token, manda". Nesta semana o fluxo tem
**nove requisições encadeadas** (cada uma usa um id que a anterior devolveu), então
vale montar direito uma vez: ambiente com variáveis + scripts que guardam os ids
sozinhos. O mesmo ambiente serve pro Passo 17 (histórico) e pra S9.

### 5.1 — Ambiente `TCC local`

- [ ] Postman → **Environments** → **+** → nome `TCC local`, com as variáveis
  abaixo (deixar em branco as que os scripts preenchem). Selecionar o ambiente
  no canto superior direito antes de mandar qualquer requisição.

| Variável | Valor inicial | Quem preenche |
|---|---|---|
| `baseUrl` | `http://localhost:3000` | você (porta do `PORT` no `server/.env`) |
| `token` | — | script do login (5.3) |
| `diaHoje` | — | pre-request do PUT /divisions (5.4) |
| `idDivisao` | — | script do PUT /divisions (5.4) |
| `idExercicio` | — | script do GET /exercises (5.5) |
| `idTreino` | — | script do POST /sessions/start (5.7) |
| `idDiagnostico` | — | script do POST …/diagnostics/generate (5.11) |

> Não tem prefixo `/api` — as rotas estão montadas direto na raiz no `app.ts`.
> `{{baseUrl}}/sessions/start` vira `http://localhost:3000/sessions/start`.

### 5.2 — Coleção `TCC — S8` com auth herdada

- [ ] **Collections** → **+** → `TCC — S8`. Na coleção (não na requisição), aba
  **Authorization** → Type **Bearer Token** → Token `{{token}}`. Toda
  requisição criada dentro dela fica com **Auth Type: Inherit auth from parent**
  e manda `Authorization: Bearer <token>` sozinha.
- [ ] Nas duas de autenticação (register e login), trocar pra **No Auth**.
- [ ] Body sempre em **raw → JSON**: com isso o Postman já põe o
  `Content-Type: application/json`, que é o que o `express.json()` exige. Body
  em `form-data` chega vazio no controller e tudo vira 400.
- [ ] ⚠️ **Usar um usuário só pro Postman** (`postman.s8@teste.com`). O `PUT
  /divisions` do 5.4 **substitui a semana inteira** (padrão apaga-e-reinsere da
  S3) — rodar ele com o seu usuário de uso real apaga a sua rotina.

> Os scripts abaixo vão na aba **Scripts → Post-response** (nas versões antigas
> do Postman, aba **Tests**). O que está em **Pre-request** roda antes de enviar.

### 5.3 — Registrar e logar

- [ ] **`GET {{baseUrl}}/health`** (No Auth) → `200 { "status": "ok" }`. Se der
  `ECONNREFUSED`, o `npm run dev` do server não está de pé.

- [ ] **`POST {{baseUrl}}/auth/register`** (No Auth)

```json
{
  "nome": "Postman S8",
  "email": "postman.s8@teste.com",
  "senha": "123456"
}
```

Esperado: `201` com `{ "usuario": { "id_usuario": "...", "nome": "Postman S8", "email": "postman.s8@teste.com" } }`.
Da segunda vez em diante: `400 { "erro": "Email ja cadastrao" }` — normal, é só
pular pro login.

- [ ] **`POST {{baseUrl}}/auth/login`** (No Auth)

```json
{
  "email": "postman.s8@teste.com",
  "senha": "123456"
}
```

Post-response:

```js
pm.test('login 200', () => pm.response.to.have.status(200));
pm.environment.set('token', pm.response.json().token);
```

Esperado: `200 { "token": "eyJhbGciOi...", "usuario": { ... } }`. Conferir no
ambiente (ícone do olho) que `token` foi preenchido.

### 5.4 — Divisão de hoje

- [ ] **`PUT {{baseUrl}}/divisions`**

Pre-request (calcula o dia de hoje do mesmo jeito que o backend: `getDay()`,
domingo = 0):

```js
pm.environment.set('diaHoje', new Date().getDay());
```

Body:

```json
{
  "divisoes": [
    { "dia_semana": {{diaHoje}}, "nome": "Peito e tríceps" }
  ]
}
```

> O Postman pinta `{{diaHoje}}` de vermelho por não estar entre aspas — ignorar,
> ele substitui antes de enviar e o JSON final fica `"dia_semana": 3`.

Post-response:

```js
pm.test('divisões 200', () => pm.response.to.have.status(200));
const hoje = pm.response.json().divisoes.find(d => d.dia_semana === Number(pm.environment.get('diaHoje')));
pm.environment.set('idDivisao', hoje.id_divisao);
```

Esperado: `200 { "divisoes": [ { "id_divisao": "…", "fk_usuario": "…", "dia_semana": 3, "nome": "Peito e tríceps" } ] }`.

### 5.5 — Escolher o exercício

- [ ] **`GET {{baseUrl}}/exercises?grupamento=1`** (1 = Peito no seed; sem o
  `?grupamento` vem o catálogo inteiro)

Post-response:

```js
pm.test('exercícios 200', () => pm.response.to.have.status(200));
const supino = pm.response.json().exercicios.find(e => e.nome_exercicio === 'Supino Reto com Barra');
pm.environment.set('idExercicio', supino.id_exercicio);
```

Esperado: `200 { "exercicios": [ { "id_exercicio": 1, "nome_exercicio": "Supino Reto com Barra", "fk_grupamento": 1, "nome_grupamento": "Peito" }, … ] }`.
Não assumir que o id é 1 — o script procura pelo nome.

### 5.6 — Pôr o exercício na divisão

- [ ] **`PUT {{baseUrl}}/divisions/{{idDivisao}}/exercises`**

```json
{
  "exercicios": [
    { "fk_exercicio": {{idExercicio}} }
  ]
}
```

Esperado: `200 { "exercicios": [ { "id_divisao_exercicio": …, "fk_exercicio": 1, "ordem": 1, "nome_exercicio": "Supino Reto com Barra", "nome_grupamento": "Peito" } ] }`.

### 5.7 — Começar o treino

- [ ] **`POST {{baseUrl}}/sessions/start`** — **sem body** (aba Body em
  *none*).

Post-response:

```js
pm.test('start 200/201', () => pm.expect(pm.response.code).to.be.oneOf([200, 201]));
pm.environment.set('idTreino', pm.response.json().treino.id_treino);
```

Esperado na primeira vez: `201 { "treino": { "id_treino": "…", "fk_divisao": "…", "completed": false, "data": "2026-09-23T21:58:02.114Z", "duracao_total": null } }`.
Mandar de novo com o treino aberto devolve `200` com **o mesmo** `id_treino`
(idempotente por dia, D8).

### 5.8 — Registrar séries (4 bodies, um de cada caso)

- [ ] **`POST {{baseUrl}}/sessions/{{idTreino}}/sets`** — mandar os quatro
  bodies abaixo, um de cada vez, **nesta ordem**. Os números do Passo 5.11
  dependem deles.

Aquecimento (sem nota — D9):

```json
{ "fk_exercicio": {{idExercicio}}, "tipo": "aquecimento", "carga": 40, "repeticoes": 12 }
```

Feeder (sem nota):

```json
{ "fk_exercicio": {{idExercicio}}, "tipo": "feeder", "carga": 60, "repeticoes": 5 }
```

Válida reportando **RIR**:

```json
{ "fk_exercicio": {{idExercicio}}, "tipo": "work", "carga": 80, "repeticoes": 8, "rir": 1 }
```

Válida reportando **RPE**:

```json
{ "fk_exercicio": {{idExercicio}}, "tipo": "work", "carga": 80, "repeticoes": 7, "rpe": 8 }
```

Post-response (serve pros quatro):

```js
pm.test('série 201', () => pm.response.to.have.status(201));
const s = pm.response.json().serie;
if (s.tipo === 'work') {
  pm.test('rpe = 10 - rir (coluna gerada)', () => pm.expect(s.rpe).to.eql(10 - s.rir));
} else {
  pm.test('aquecimento/feeder sem nota', () => pm.expect(s.rir).to.eql(null));
}
```

Esperado (a última): `201 { "serie": { "id_serie": 57, "fk_treino": "…", "fk_exercicio": 1, "tipo": "work", "carga": "80", "repeticoes": 7, "rir": 2, "rpe": 8 } }`
— `carga` volta **string** (`NUMERIC` no driver `pg`) e o `rir: 2` foi o
backend que converteu do `rpe: 8`.

- [ ] Casos negativos (devem dar **400** e **não** gravar nada):

| Body | Resposta |
|---|---|
| `{ "fk_exercicio": {{idExercicio}}, "tipo": "work", "carga": 80, "repeticoes": 8 }` | `Informe rir ou rpe` |
| `{ "fk_exercicio": {{idExercicio}}, "tipo": "work", "carga": 80, "repeticoes": 8, "rir": 1, "rpe": 9 }` | `Informe rir ou rpe` |
| `{ "fk_exercicio": {{idExercicio}}, "tipo": "aquecimento", "carga": 40, "repeticoes": 12, "rir": 3 }` | `Séries de aquecimento e feeder não recebem rir/rpe` |
| `{ "fk_exercicio": {{idExercicio}}, "tipo": "work", "carga": 80, "repeticoes": 8, "rpe": 5 }` | `rpe deve resultar em um rir entre 0 e 4 …` |

### 5.9 — Tentar diagnosticar o treino aberto (valida a correção do Passo 1)

- [ ] **`POST {{baseUrl}}/sessions/{{idTreino}}/diagnostics/generate`** — sem
  body.

Esperado: `409 { "erro": "Finalize o treino antes de gerar o diagnóstico" }`.
Se vier `201`, o guard do Passo 1 não está no controller (ou o `tsx watch` não
recarregou).

### 5.10 — Finalizar

- [ ] **`POST {{baseUrl}}/sessions/{{idTreino}}/finish`** — sem body (D12: a
  duração é o servidor que calcula).

```js
pm.test('finish 200', () => pm.response.to.have.status(200));
pm.test('fechou com duração', () => {
  const t = pm.response.json().treino;
  pm.expect(t.completed).to.eql(true);
  pm.expect(t.duracao_total).to.be.at.least(1);
});
```

Esperado: `200 { "treino": { …, "completed": true, "duracao_total": 1 } }`.
Mandar de novo: `409 { "erro": "Treino já foi finalizado" }`.

### 5.11 — Gerar o diagnóstico

- [ ] **`POST {{baseUrl}}/sessions/{{idTreino}}/diagnostics/generate`** — sem
  body, agora com o treino finalizado.

Post-response:

```js
pm.test('diagnóstico 201', () => pm.response.to.have.status(201));
const d = pm.response.json().diagnostico;
pm.environment.set('idDiagnostico', d.id_diagnostico);
pm.test('score é inteiro 0–100', () => {
  pm.expect(Number.isInteger(d.score_geral)).to.be.true;
  pm.expect(d.score_geral).to.be.within(0, 100);
});
pm.test('score = round((pv + pi) / 2)  (D13)', () => {
  const { pv, pi } = d.conteudo_json.score_detalhe;
  pm.expect(d.score_geral).to.eql(Math.round((pv + pi) / 2));
});
pm.test('IA não devolveu campo numérico de score', () => {
  const { score_detalhe, ...texto } = d.conteudo_json;
  pm.expect(JSON.stringify(texto)).to.not.include('score');
});
```

Esperado com `GEMINI_MOCK=true` (e em **menos de 1 s** — se demorar, o mock não
está ligado):

```json
{
  "diagnostico": {
    "id_diagnostico": "7b1e0c3a-…",
    "fk_usuario": "…",
    "fk_treino": "…",
    "score_geral": 52,
    "data_geracao": "2026-09-23T21:59:40.512Z",
    "conteudo_json": {
      "diagnostico_exercicios": [
        { "nome_exercicio": "Supino Reto com Barra", "comentario": "Mock: 8 reps a RPE 9." },
        { "nome_exercicio": "Supino Reto com Barra", "comentario": "Mock: 7 reps a RPE 8." }
      ],
      "analise_grupamentos": [
        { "nome_grupamento": "Abdômen", "comentario": "Mock: abaixo do limiar (0/10)." },
        { "nome_grupamento": "Peito", "comentario": "Mock: abaixo do limiar (2/10)." }
      ],
      "recomendacoes_proxima_sessao": ["Mock: manter a intensidade nas séries válidas."],
      "score_detalhe": { "pv": 20, "pi": 83.33333333333334 }
    }
  }
}
```

(`analise_grupamentos` vem com os 7 grupamentos — cortado acima.)

- [ ] **Conferir a conta na mão** — é isso que a matriz chama de "resultado
  igual ao cálculo manual":
  - Só as 2 séries `work` contam (aquecimento e feeder ficam de fora).
  - `Pi` = média de `((rpe − 6) / 3) × 100` → RPE 9 = 100, RPE 8 = 66,67 →
    **83,33**.
  - `Pv` = Peito tem 2 séries válidas na semana → `min(2/10, 1) × 100` = **20**
    (só Peito entra: é o único grupamento da sessão).
  - `score_geral` = `round((20 + 83,33) / 2)` = `round(51,67)` = **52**.
  - Se o usuário do Postman já tinha séries de Peito de outro treino nesta
    semana, o `Pv` sobe — refazer a conta com o número real do `GET
    /metrics/weekly-volume`.

### 5.12 — Ler o diagnóstico atual

- [ ] **`GET {{baseUrl}}/diagnostics/latest`**

```js
pm.test('latest 200', () => pm.response.to.have.status(200));
const d = pm.response.json().diagnostico;
pm.test('é o que acabou de ser gerado', () => pm.expect(d.id_diagnostico).to.eql(pm.environment.get('idDiagnostico')));
pm.test('traz a data da sessão (Passo 1)', () => pm.expect(d.data_treino).to.be.a('string'));
```

Esperado: o mesmo objeto do 5.11 + `"data_treino": "2026-09-23T21:58:02.114Z"`.

### 5.13 — Casos negativos do diagnóstico

- [ ] Sem token: na requisição, aba Authorization → **No Auth** → `401 {
  "erro": "Token nao informado" }`.
- [ ] Treino inexistente: `POST
  {{baseUrl}}/sessions/00000000-0000-0000-0000-000000000000/diagnostics/generate`
  → `404 { "erro": "Treino não encontrado" }`.
- [ ] Treino de **outro** usuário: registrar/logar um segundo usuário, copiar o
  token dele e mandar com o `{{idTreino}}` do primeiro → `404` (não `403`: não
  confirma nem que o treino existe).
- [ ] Treino finalizado **sem série `work`**: `POST /sessions/start` → só um
  aquecimento → `finish` → `generate` → `400 { "erro": "Nenhuma série válida
  registrada nesta sessão ainda" }`.
- [ ] Id que nem é UUID (valida a correção do Passo 2): `POST
  {{baseUrl}}/sessions/abc/diagnostics/generate` e `POST
  {{baseUrl}}/sessions/abc/finish` → `404 { "erro": "Recurso não encontrado" }`.
  Antes do Passo 2 isso dava **500**. Sem token, continua `401` (o `autenticar`
  roda antes do `validarUuid`).

---

# Parte 2 — Implementação da S8

Só começar com a Parte 1 verde: **45/45** no `npm run test` e o Passo 5 do
Postman todo passando.

## Sessão A — Frontend F5b: tela "Diagnóstico da Sessão"

### Passo 6 — `client/src/services/api.ts`

- [ ] O `ApiErro` já existe desde o Passo 3 (Parte 1) — aqui entram só os tipos
  e as funções do diagnóstico, no fim do arquivo. Espelho dos tipos do backend.
  `score_detalhe` fica dentro de `conteudo_json`, igual está gravado no JSONB.

```ts
//============================diagnostico (RF05/RF06)===========================

export interface DiagnosticoConteudo {
    diagnostico_exercicios: { nome_exercicio: string; comentario: string }[];
    analise_grupamentos: { nome_grupamento: string; comentario: string }[];
    recomendacoes_proxima_sessao: string[];
    score_detalhe: { pv: number; pi: number }; //sub-notas do scoreService (D13), nao da IA
}

export interface DiagnosticoIA {
    id_diagnostico: string;
    fk_treino: string;
    score_geral: number; //0-100, calculado no backend (D13) - a tela so desenha
    data_geracao: string;
    conteudo_json: DiagnosticoConteudo;
}

export interface DiagnosticoComTreino extends DiagnosticoIA {
    data_treino: string; //quando a pessoa treinou (JOIN Treino)
}

//D16: so funciona com treino finalizado - aberto volta 409
export function gerarDiagnostico(idTreino: string) {
    return apiFetch(`/sessions/${idTreino}/diagnostics/generate`, {
        method: 'POST',
    }) as Promise<{ diagnostico: DiagnosticoIA }>;
}

export function buscarDiagnosticoAtual() {
    return apiFetch('/diagnostics/latest') as Promise<{ diagnostico: DiagnosticoComTreino }>;
}
```

### Passo 7 — `client/src/components/DiagnosticContent.tsx` (novo)

- [ ] Componente separado da view porque ele aparece **duas vezes**: na tela
  "Diagnóstico" (o atual) e dentro de cada sessão da aba "Sessões" do histórico
  (Passo 20). Escrever uma vez só.
- [ ] O círculo é um `CircularProgress` determinado (0–100) sobre outro cinza de
  fundo, com o número no meio — o "score visual" do critério de aceite, sem
  biblioteca nova.
- [ ] A cor por faixa (≥70 verde, ≥40 amarelo, abaixo vermelho) é
  **apresentação**, não métrica: o número já veio pronto do `scoreService`. O
  `Math.round` do Pv/Pi também é só formatação — o JSONB guarda o valor cheio.

```tsx
import type { ReactNode } from 'react';
import { Box, Stack, Typography, Chip, CircularProgress } from '@mui/material';
import type { DiagnosticoIA } from '../services/api';

//mostra UM diagnostico: score em circulo + sub-notas + o texto da IA.
//usado na DiagnosticView (o atual) e na aba Sessoes do historico (os anteriores)

//faixa de cor e so apresentacao: o score ja chegou pronto do backend (D13)
function corDoScore(score: number): 'success' | 'warning' | 'error' {
  if (score >= 70) return 'success';
  if (score >= 40) return 'warning';
  return 'error';
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Stack spacing={1}>
      <Typography sx={{ fontWeight: 700 }}>{titulo}</Typography>
      {children}
    </Stack>
  );
}

export function DiagnosticContent({ diagnostico }: { diagnostico: DiagnosticoIA }) {
  const { score_geral, conteudo_json: conteudo } = diagnostico;

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3} alignItems="center">
        <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
          {/* trilho cinza de fundo + arco colorido por cima */}
          <CircularProgress
            variant="determinate"
            value={100}
            size={112}
            thickness={5}
            sx={{ color: 'action.hover' }}
          />
          <CircularProgress
            variant="determinate"
            value={score_geral}
            size={112}
            thickness={5}
            color={corDoScore(score_geral)}
            sx={{ position: 'absolute', left: 0 }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ fontFamily: '"Sora", sans-serif', fontSize: 30, fontWeight: 700, lineHeight: 1 }}>
              {score_geral}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              de 100
            </Typography>
          </Box>
        </Box>

        <Stack spacing={1}>
          <Chip size="small" variant="outlined" label={`Volume (Pv): ${Math.round(conteudo.score_detalhe.pv)}`} />
          <Chip size="small" variant="outlined" label={`Intensidade (Pi): ${Math.round(conteudo.score_detalhe.pi)}`} />
        </Stack>
      </Stack>

      <Secao titulo="Por grupamento">
        {conteudo.analise_grupamentos.map((a) => (
          <Typography key={a.nome_grupamento} variant="body2">
            <strong>{a.nome_grupamento}:</strong> {a.comentario}
          </Typography>
        ))}
      </Secao>

      <Secao titulo="Por exercício">
        {/* index na key: o mesmo exercicio pode ter mais de um comentario */}
        {conteudo.diagnostico_exercicios.map((d, i) => (
          <Typography key={`${d.nome_exercicio}-${i}`} variant="body2">
            <strong>{d.nome_exercicio}:</strong> {d.comentario}
          </Typography>
        ))}
      </Secao>

      <Secao titulo="Recomendações para a próxima sessão">
        <Box component="ol" sx={{ pl: 2.5, m: 0 }}>
          {conteudo.recomendacoes_proxima_sessao.map((r, i) => (
            <Typography component="li" key={i} variant="body2" sx={{ mb: 0.5 }}>
              {r}
            </Typography>
          ))}
        </Box>
      </Secao>
    </Stack>
  );
}
```

### Passo 8 — `client/src/views/DiagnosticView.tsx` (novo)

- [ ] Carrega o `GET /diagnostics/latest` ao abrir. **404 não é erro** — é o
  estado "ainda não gerou nenhum", com instrução de como gerar.
- [ ] Mostra de qual sessão é (`data_treino`) e quando foi gerado
  (`data_geracao`) — são coisas diferentes quando o diagnóstico é refeito dias
  depois pelo histórico.
- [ ] Datas com `new Date(...).toLocaleString('pt-BR')`: o timestamp vem em UTC
  (`…Z`), e o `new Date` é o que converte pro fuso local. Cortar a string
  (`slice(0, 10)`) mostraria o dia **seguinte** pra treino depois das 21h.

```tsx
import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import * as api from '../services/api';
import { FeedbackAlert } from '../components/FeedbackAlert';
import { DiagnosticContent } from '../components/DiagnosticContent';

//timestamp do banco chega em UTC (…Z): new Date converte pro fuso local
function formatarDataHora(timestamp: string) {
  return new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DiagnosticView() {
  const [diagnostico, setDiagnostico] = useState<api.DiagnosticoComTreino | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        const { diagnostico } = await api.buscarDiagnosticoAtual();
        setDiagnostico(diagnostico);
      } catch (erro) {
        //404 = nenhum diagnostico gerado ainda: estado vazio, nao falha
        if (!(erro instanceof api.ApiErro && erro.status === 404)) {
          setErro(erro instanceof Error ? erro.message : 'Erro ao carregar o diagnóstico');
        }
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
          Diagnóstico da Sessão
        </Typography>

        <FeedbackAlert erro={erro} />

        {!diagnostico && !erro && (
          <Typography color="text.secondary">
            Nenhum diagnóstico ainda. Em "Treino de hoje", toque em "Finalizar e
            avaliar treino" no fim da sessão.
          </Typography>
        )}

        {diagnostico && (
          <>
            <Typography color="text.secondary" gutterBottom>
              Sessão de {formatarDataHora(diagnostico.data_treino)} · gerado em{' '}
              {formatarDataHora(diagnostico.data_geracao)}
            </Typography>
            <Box sx={{ mt: 3 }}>
              <DiagnosticContent diagnostico={diagnostico} />
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

### Passo 9 — `client/src/views/TodaySessionView.tsx`: botão "Finalizar e avaliar treino" (D16)

- [ ] O botão "Finalizar treino" da S6 vira **"Finalizar e avaliar treino"**.
  Continua com o toque duplo de confirmação da S6 (o primeiro toque só arma; o
  segundo, "Confirmar: encerrar e avaliar", executa).
- [ ] Por baixo, **duas chamadas em sequência**: `finalizarTreino` e, só se ela
  der certo (ou der 409 = já estava finalizado), `gerarDiagnostico`. Se o finish
  falhar por outro motivo, **não** chama a IA: o backend recusaria com 409
  mesmo (Passo 1).
- [ ] Depois do finish, o `GET /sessions/today` não devolve mais o treino
  (`completed = true`), então a tela perde o `id_treino`. Por isso ele é
  guardado numa variável **antes** da primeira chamada e passado adiante.
- [ ] Enquanto roda, um bloco de status mostra a etapa ("Salvando o treino…" →
  "Analisando a sessão com a IA…") — com a chave real, a segunda etapa leva
  alguns segundos e a tela não pode parecer travada.
- [ ] Resultados possíveis da segunda chamada:
  - **201** → leva a pessoa pra aba "Diagnóstico" (callback `onVerDiagnostico`,
    que o `App` injeta no Passo 10).
  - **400** (sessão sem série válida) → mensagem "treino salvo, sem séries
    válidas pra avaliar", sem nova tentativa (tentar de novo não muda nada).
  - **502/rede** (IA fora) → mensagem de erro + botão **"Tentar avaliar de
    novo"**, que refaz **só** o `gerarDiagnostico`. O treino já está fechado
    (RNF06).
- [ ] Se a pessoa sair da tela antes de tentar de novo, o estado se perde — sem
  problema: a aba "Sessões" do histórico (Passo 20) tem o botão "Gerar
  diagnóstico" pra qualquer sessão sem diagnóstico.
- [ ] Este passo **substitui a função `finalizar` inteira**, inclusive o `catch`
  que o Passo 3 corrigiu (a lógica do 409 por status continua, agora dentro da
  função nova).

Imports (acrescentar `CircularProgress` e o ícone):

```tsx
import {
  Card, CardContent, Typography, TextField, Button, Stack, Chip,
  IconButton, MenuItem, Divider, ToggleButton, ToggleButtonGroup, CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InsightsIcon from '@mui/icons-material/Insights';
```

Assinatura + estado novo:

```tsx
export function TodaySessionView({ onVerDiagnostico }: { onVerDiagnostico: () => void }) {
  // ...estados que ja existem...
  //etapa do botao unico (D16): mostra o que esta acontecendo e trava cliques repetidos
  const [etapa, setEtapa] = useState<'finalizando' | 'avaliando' | null>(null);
  //treino ja fechado cuja avaliacao falhou (502): e o id que o "Tentar avaliar de novo" usa
  const [pendenteAvaliacao, setPendenteAvaliacao] = useState<string | null>(null);
```

A função `finalizar` inteira sai e entram estas duas no lugar:

```tsx
  //D16: um botao, duas chamadas em sequencia. o finish grava e fecha o treino
  //ANTES de a IA ser chamada - se o Gemini falhar, nada do treino se perde (RNF06)
  async function finalizarEAvaliar() {
    if (!hoje?.treino) return;

    if (!confirmandoFim) {
      setConfirmandoFim(true);
      return;
    }

    //guarda o id antes: depois do finish o GET /sessions/today nao devolve mais o treino
    const idTreino = hoje.treino.id_treino;
    setErro('');
    setSucesso('');
    setConfirmandoFim(false);

    //1a chamada: fechar o treino
    setEtapa('finalizando');
    try {
      const { treino } = await api.finalizarTreino(idTreino);
      setSucesso(`Treino finalizado — ${treino.duracao_total} min registrados.`);
    } catch (erro) {
      //409 = ja estava finalizado (toque duplo, outro aparelho): segue pra avaliacao
      if (!(erro instanceof api.ApiErro && erro.status === 409)) {
        setErro(erro instanceof Error ? erro.message : 'Erro ao finalizar treino');
        setEtapa(null);
        return; //sem finish nao tem avaliacao - o backend recusaria com 409
      }
    }
    await recarregar(); //a tela volta pro "Comecar treino"

    //2a chamada: avaliar
    await avaliar(idTreino);
  }

  //separada do finish: e ela que o "Tentar avaliar de novo" chama sozinha
  async function avaliar(idTreino: string) {
    setErro('');
    setEtapa('avaliando');
    try {
      await api.gerarDiagnostico(idTreino);
      setPendenteAvaliacao(null);
      onVerDiagnostico();
    } catch (erro) {
      if (erro instanceof api.ApiErro && erro.status === 400) {
        //sem serie valida: treino salvo, nada a avaliar - nao oferece nova tentativa
        setSucesso('Treino salvo. Sem séries válidas nesta sessão, então não há o que avaliar.');
        setPendenteAvaliacao(null);
      } else {
        //502 (IA fora) ou rede: o treino ja esta fechado, so a avaliacao ficou pra tras
        const mensagem = erro instanceof Error ? erro.message : 'erro desconhecido';
        setErro(`Treino salvo, mas a avaliação falhou: ${mensagem}`);
        setPendenteAvaliacao(idTreino);
      }
    } finally {
      setEtapa(null);
    }
  }
```

No JSX, **logo antes** do `{!hoje.treino ? (` — fica fora do bloco do treino de
propósito, porque depois do finish o `hoje.treino` já é `null` e aquele bloco
some:

```tsx
        {etapa && (
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ mt: 2, p: 2, borderRadius: 3, bgcolor: 'action.hover' }}
          >
            <CircularProgress size={20} />
            <Typography>
              {etapa === 'finalizando' ? 'Salvando o treino…' : 'Analisando a sessão com a IA…'}
            </Typography>
          </Stack>
        )}

        {pendenteAvaliacao && !etapa && (
          <Button
            variant="contained"
            fullWidth
            startIcon={<InsightsIcon />}
            onClick={() => avaliar(pendenteAvaliacao)}
            sx={{ mt: 2 }}
          >
            Tentar avaliar de novo
          </Button>
        )}
```

- [ ] No botão "Começar treino", acrescentar `disabled={etapa !== null}` — sem
  isso dá pra abrir um treino novo enquanto a IA ainda avalia o anterior.

O botão do fim da lista (o da S6) fica assim:

```tsx
            {/* no fim da lista de proposito: no topo, perto do polegar, vira
                toque acidental no meio do treino */}
            <Button
              variant={confirmandoFim ? 'contained' : 'outlined'}
              color={confirmandoFim ? 'error' : 'primary'}
              size="large"
              fullWidth
              startIcon={<CheckCircleIcon />}
              onClick={finalizarEAvaliar}
              onBlur={() => setConfirmandoFim(false)}
              disabled={etapa !== null}
            >
              {confirmandoFim ? 'Confirmar: encerrar e avaliar' : 'Finalizar e avaliar treino'}
            </Button>
```

### Passo 10 — `App.tsx` + `Sidebar.tsx`: tela "diagnostico"

- [ ] `Tela` ganha `'diagnostico'`. O mapa de telas sai de constante de módulo
  pra dentro do `App`, porque o `TodaySessionView` agora precisa do `setTela`
  (D7: navegação continua por estado, sem router).

### `client/src/App.tsx` (completo)

```tsx
import { useState, type ReactNode } from 'react'
import { useAuth } from './context/AuthContext'
import { AuthView } from './views/AuthView'
import { DivisionView } from './views/DivisionView'
import { TodaySessionView } from './views/TodaySessionView'
import { WeeklyVolumeView } from './views/WeeklyVolumeView'
import { DiagnosticView } from './views/DiagnosticView'
import { AppShell } from './components/AppShell'
import { PageLayout } from './components/PageLayout'
import { Typography } from '@mui/material'

export type Tela = 'divisao' | 'treino' | 'volume' | 'diagnostico'

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

  //dentro do App (nao mais constante de modulo): o Treino de Hoje precisa do
  //setTela pra levar a pessoa ao diagnostico recem-gerado (D7)
  const telas: Record<Tela, ReactNode> = {
    divisao: <DivisionView />,
    treino: <TodaySessionView onVerDiagnostico={() => setTela('diagnostico')} />,
    volume: <WeeklyVolumeView />,
    diagnostico: <DiagnosticView />,
  }

  return (
    <AppShell tela={tela} onNavegar={setTela}>
      {telas[tela]}
    </AppShell>
  )
}

export default App
```

### `client/src/components/Sidebar.tsx` (só o `NAV_ITEMS`)

```tsx
//ordem = ordem de uso: monta a rotina, treina, confere o volume, le o diagnostico
const NAV_ITEMS: NavItem[] = [
  { label: 'Minha divisão', icon: <CalendarViewWeekIcon fontSize="small" />, tela: 'divisao' },
  { label: 'Treino de hoje', icon: <FitnessCenterIcon fontSize="small" />, tela: 'treino' },
  { label: 'Volume da semana', icon: <BarChartIcon fontSize="small" />, tela: 'volume' },
  { label: 'Diagnóstico', icon: <InsightsIcon fontSize="small" />, tela: 'diagnostico' },
  { label: 'Histórico', icon: <TimelineIcon fontSize="small" /> },
];
```

- [ ] Testar pela interface (com `GEMINI_MOCK=true`): Treino de hoje → começar →
  2 séries válidas → "Finalizar e avaliar treino" → "Confirmar: encerrar e
  avaliar" → aparece "Salvando…" e depois "Analisando…" → cai na aba Diagnóstico
  com o círculo e os três blocos de texto.
- [ ] Sessão sem série válida (só aquecimento) → mesmo botão → mensagem "Treino
  salvo. Sem séries válidas…", sem botão de nova tentativa.
- [ ] Forçar o 502 uma vez: `GEMINI_MOCK=false` e `GEMINI_API_KEY=invalida` no
  `.env`, reiniciar o server, finalizar e avaliar → "Treino salvo, mas a
  avaliação falhou…" + botão "Tentar avaliar de novo". O treino **continua
  finalizado** no volume (RNF06). Voltar o `.env`, reiniciar o server, tocar em
  "Tentar avaliar de novo" → cai na aba Diagnóstico.

---

## Sessão B — F6: histórico de progressão (backend + frontend)

### Passo 11 — `server/src/types/indexTypes.ts` (acrescentar no fim)

- [ ] Três formatos novos. O volume histórico **não** ganha tipo novo: cada
  semana é um `VolumeSemanal`, o mesmo formato do `GET /metrics/weekly-volume` —
  a tela reaproveita a leitura e o teste compara os dois direto (Passo 18).

```ts
//============== histórico (RF07) =====================================

//uma sessao finalizada (D18) com o resumo do que aconteceu nela
export interface SessaoHistorico {
    id_treino: string;
    data: string;
    duracao_total: number | null;
    nome_divisao: string | null; // fk_divisao é nullable no schema
    series_validas: number; // COUNT(...)::int
    id_diagnostico: string | null; // o mais recente da sessao (D14); null se nunca gerou
    score_geral: number | null;
}

//exercicios com pelo menos uma serie work - popula o seletor da aba Cargas
export interface ExercicioTreinado {
    id_exercicio: number;
    nome_exercicio: string;
    nome_grupamento: string;
}

//um ponto do grafico de progressao: uma sessao, a maior carga valida (D17)
export interface PontoProgressaoCarga {
    id_treino: string;
    data: string;
    carga_maxima: number; // ::float na query - NUMERIC voltaria string
    series_validas: number;
}
```

### Passo 12 — `server/src/models/historyModel.ts` (novo)

- [ ] Três consultas de leitura, todas com `t.fk_usuario = $1` — o histórico é
  a rota que mais facilmente vazaria dado de outro usuário, porque não tem id de
  recurso na URL pra conferir dono.
- [ ] `listarSessoes`: `COUNT(...) FILTER (WHERE s.tipo = 'work')` conta só
  série válida sem precisar de subconsulta; `LEFT JOIN LATERAL` pega **só o
  diagnóstico mais recente** de cada sessão (D14) — um `LEFT JOIN DiagnosticoIA`
  comum duplicaria a sessão uma vez por diagnóstico e multiplicaria o
  `COUNT`.
- [ ] `progressaoDeCarga`: `MAX(s.carga)::float` — sem o cast, `NUMERIC` volta
  como string (`"80"`) e o gráfico recebe texto. Mesma família do `::int` do
  `COUNT` na S6.

```ts
import { pool } from '../config/db';
import { SessaoHistorico, ExercicioTreinado, PontoProgressaoCarga } from '../types/indexTypes';

const LIMITE_SESSOES = 30;

//sessoes finalizadas (D18), da mais recente pra mais antiga, com a contagem de
//series validas e o diagnostico mais novo de cada uma (D14)
export async function listarSessoes(fkUsuario: string): Promise<SessaoHistorico[]> {
  const resultado = await pool.query<SessaoHistorico>(
    `SELECT t.id_treino,
            t.data,
            t.duracao_total,
            d.nome AS nome_divisao,
            COUNT(s.id_serie) FILTER (WHERE s.tipo = 'work')::int AS series_validas,
            ult.id_diagnostico,
            ult.score_geral
     FROM Treino t
     LEFT JOIN Divisao d ON d.id_divisao = t.fk_divisao
     LEFT JOIN SerieTreino s ON s.fk_treino = t.id_treino
     LEFT JOIN LATERAL (
       SELECT dg.id_diagnostico, dg.score_geral
       FROM DiagnosticoIA dg
       WHERE dg.fk_treino = t.id_treino
       ORDER BY dg.data_geracao DESC
       LIMIT 1
     ) ult ON TRUE
     WHERE t.fk_usuario = $1
       AND t.completed = TRUE
     GROUP BY t.id_treino, d.nome, ult.id_diagnostico, ult.score_geral
     ORDER BY t.data DESC
     LIMIT $2`,
    [fkUsuario, LIMITE_SESSOES]
  );
  return resultado.rows;
}

//so exercicio com serie work - aquecimento sozinho nao gera progressao (D17)
export async function listarExerciciosTreinados(fkUsuario: string): Promise<ExercicioTreinado[]> {
  const resultado = await pool.query<ExercicioTreinado>(
    `SELECT DISTINCT e.id_exercicio,
            e.nome_exercicio,
            g.nome AS nome_grupamento
     FROM SerieTreino s
     JOIN Treino t ON t.id_treino = s.fk_treino
     JOIN Exercicio e ON e.id_exercicio = s.fk_exercicio
     JOIN GrupamentoMuscular g ON g.id_grupamento = e.fk_grupamento
     WHERE s.tipo = 'work'
       AND t.fk_usuario = $1
     ORDER BY g.nome, e.nome_exercicio`,
    [fkUsuario]
  );
  return resultado.rows;
}

//D17: um ponto por sessao = maior carga de serie work daquele exercicio.
//ordem cronologica (ASC) porque vira o eixo x do grafico
export async function progressaoDeCarga(
  fkUsuario: string,
  idExercicio: number
): Promise<PontoProgressaoCarga[]> {
  const resultado = await pool.query<PontoProgressaoCarga>(
    `SELECT t.id_treino,
            t.data,
            MAX(s.carga)::float AS carga_maxima,
            COUNT(*)::int AS series_validas
     FROM SerieTreino s
     JOIN Treino t ON t.id_treino = s.fk_treino
     WHERE s.tipo = 'work'
       AND t.fk_usuario = $1
       AND s.fk_exercicio = $2
     GROUP BY t.id_treino, t.data
     ORDER BY t.data ASC`,
    [fkUsuario, idExercicio]
  );
  return resultado.rows;
}
```

### Passo 13 — `server/src/services/volumeService.ts`: `calcularHistoricoVolume`

- [ ] Fica no `volumeService`, não no `historyModel`: é a **mesma regra** do
  RF04 (só `work`, semana de segunda a domingo, limiar de 10) repetida pra N
  semanas. Morando no mesmo arquivo do `LIMIAR_SERIES`, a comparação
  `atingiu_limiar` continua tendo uma fonte só.
- [ ] `generate_series` cria as N segundas-feiras; `CROSS JOIN
  GrupamentoMuscular` garante **todas** as semanas × **todos** os grupamentos,
  mesmo zerados (D18) — sem ele, semana sem treino simplesmente sumiria.
- [ ] O filtro de dono continua **dentro da subconsulta**, igual a S6 — as
  condições de data no `ON` são seguras porque a subconsulta já só tem série
  deste usuário.
- [ ] O teste do Passo 18 compara a semana atual daqui com o `GET
  /metrics/weekly-volume` — é o que garante que as duas contas de "semana"
  (`inicioDaSemana()` e o `date_trunc` daqui) não divergem.

```ts
export const SEMANAS_HISTORICO_PADRAO = 8;

//RF07: a mesma conta do calcularVolumeSemanal, para as ultimas N semanas de
//calendario (D10). cada semana volta como um VolumeSemanal completo - todos os
//grupamentos, zerado tambem, com o limiar ja comparado (D18)
export async function calcularHistoricoVolume(
  fkUsuario: string,
  semanas: number
): Promise<VolumeSemanal[]> {
  const resultado = await pool.query<
    Omit<VolumeGrupamento, 'atingiu_limiar'> & { semana_referencia: string }
  >(
    `WITH semanas AS (
       SELECT generate_series(
                date_trunc('week', current_date) - ($2::int - 1) * INTERVAL '1 week',
                date_trunc('week', current_date),
                INTERVAL '1 week'
              )::date AS inicio
     )
     SELECT to_char(sm.inicio, 'YYYY-MM-DD') AS semana_referencia,
            g.id_grupamento,
            g.nome AS nome_grupamento,
            COUNT(sv.id_serie)::int AS series_validas
     FROM semanas sm
     CROSS JOIN GrupamentoMuscular g
     LEFT JOIN (
       SELECT s.id_serie, e.fk_grupamento, t.data
       FROM SerieTreino s
       JOIN Exercicio e ON e.id_exercicio = s.fk_exercicio
       JOIN Treino t    ON t.id_treino   = s.fk_treino
       WHERE s.tipo = 'work'
         AND t.fk_usuario = $1
     ) sv ON sv.fk_grupamento = g.id_grupamento
         AND sv.data >= sm.inicio
         AND sv.data <  sm.inicio + INTERVAL '7 days'
     GROUP BY sm.inicio, g.id_grupamento, g.nome
     ORDER BY sm.inicio DESC, g.nome`,
    [fkUsuario, semanas]
  );

  //agrupa as linhas (semana x grupamento) num VolumeSemanal por semana
  const porSemana = new Map<string, VolumeSemanal>();
  for (const { semana_referencia, ...linha } of resultado.rows) {
    if (!porSemana.has(semana_referencia)) {
      porSemana.set(semana_referencia, { semana_referencia, limiar: LIMIAR_SERIES, grupamentos: [] });
    }
    porSemana.get(semana_referencia)!.grupamentos.push({
      ...linha,
      atingiu_limiar: linha.series_validas >= LIMIAR_SERIES,
    });
  }

  //Map preserva a ordem de insercao: semana mais recente primeiro
  return [...porSemana.values()];
}
```

### Passo 14 — `server/src/models/diagnosticModel.ts`: `listarDoUsuario`

- [ ] Mesmo `JOIN Treino` do Passo 1, sem o `LIMIT 1`. Traz o `conteudo_json`
  inteiro: a aba Sessões mostra o diagnóstico ao expandir, sem uma segunda
  requisição por sessão.

```ts
const LIMITE_DIAGNOSTICOS = 20;

//diagnosticos anteriores (RF07), do mais recente pro mais antigo - todos,
//inclusive os refeitos pro mesmo treino (D14)
export async function listarDoUsuario(fkUsuario: string): Promise<DiagnosticoComTreino[]> {
  const resultado = await pool.query<DiagnosticoComTreino>(
    `SELECT d.*, t.data AS data_treino
     FROM DiagnosticoIA d
     JOIN Treino t ON t.id_treino = d.fk_treino
     WHERE d.fk_usuario = $1
     ORDER BY d.data_geracao DESC
     LIMIT $2`,
    [fkUsuario, LIMITE_DIAGNOSTICOS]
  );
  return resultado.rows;
}
```

### Passo 15 — `server/src/controllers/historyController.ts` (novo)

- [ ] Mesma régua do `metricsController`: nenhum SQL, nenhuma conta. Só
  validação de entrada (id numérico, faixa de `semanas`) e chamada de
  model/service.
- [ ] `req.params.id` e `req.query.semanas` chegam como **string**: `Number()` +
  `Number.isInteger` antes de ir pro banco, igual ao `apagarSerie` da S5.
- [ ] Exercício que o usuário nunca treinou → `200` com lista vazia, não 404: é
  um histórico vazio, não um recurso inexistente.

```ts
import { Response } from 'express';
import { AuthenticateRequest } from '../middlewares/auth';
import * as historyModel from '../models/historyModel';
import * as diagnosticModel from '../models/diagnosticModel';
import * as volumeService from '../services/volumeService';

//so le e devolve. se aparecer conta aqui, e regra vazando do service/model


export async function sessoes(req: AuthenticateRequest, res: Response) {
    try {
        const sessoes = await historyModel.listarSessoes(req.userId as string);
        return res.status(200).json({ sessoes });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao carregar o histórico de sessões' });
    }
}


export async function exerciciosTreinados(req: AuthenticateRequest, res: Response) {
    try {
        const exercicios = await historyModel.listarExerciciosTreinados(req.userId as string);
        return res.status(200).json({ exercicios });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao carregar os exercícios treinados' });
    }
}


export async function progressaoCarga(req: AuthenticateRequest, res: Response) {
    const idExercicio = Number(req.params.id);
    if (!Number.isInteger(idExercicio)) {
        return res.status(400).json({ erro: 'id do exercicio invalido' });
    }

    try {
        const progressao = await historyModel.progressaoDeCarga(req.userId as string, idExercicio);
        return res.status(200).json({ progressao });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao carregar a progressão de carga' });
    }
}


//?semanas=N (1 a 26); sem o parametro, o padrao de 8 (D18)
export async function volumeHistorico(req: AuthenticateRequest, res: Response) {
    const semanas = req.query.semanas === undefined
        ? volumeService.SEMANAS_HISTORICO_PADRAO
        : Number(req.query.semanas);

    if (!Number.isInteger(semanas) || semanas < 1 || semanas > 26) {
        return res.status(400).json({ erro: 'semanas precisa ser um inteiro entre 1 e 26' });
    }

    try {
        const historico = await volumeService.calcularHistoricoVolume(req.userId as string, semanas);
        return res.status(200).json({ historico });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao carregar o histórico de volume' });
    }
}


export async function diagnosticosAnteriores(req: AuthenticateRequest, res: Response) {
    try {
        const diagnosticos = await diagnosticModel.listarDoUsuario(req.userId as string);
        return res.status(200).json({ diagnosticos });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao carregar os diagnósticos anteriores' });
    }
}
```

### Passo 16 — `server/src/routes/historyRoutes.ts` (novo) + `app.ts`

- [ ] Todas atrás de `autenticar`, todas `GET` — o histórico não escreve nada.
- [ ] `app.use(historyRoutes)` no `app.ts`. **Terceira semana seguida** que
  esse é o erro silencioso candidato: rota existe, compila, devolve 404.

```ts
import { Router } from 'express';
import { autenticar } from '../middlewares/auth';
import {
    sessoes, exerciciosTreinados, progressaoCarga, volumeHistorico, diagnosticosAnteriores,
} from '../controllers/historyController';

const router = Router();

router.get('/history/sessions', autenticar, sessoes);
router.get('/history/exercises', autenticar, exerciciosTreinados);
router.get('/history/exercises/:id/load-progression', autenticar, progressaoCarga);
router.get('/history/weekly-volume', autenticar, volumeHistorico);
router.get('/history/diagnostics', autenticar, diagnosticosAnteriores);

export default router;
```

### `server/src/app.ts` (acrescentar)

```ts
import historyRoutes from './routes/historyRoutes';
// ...
app.use(diagnosticoRoutes);
app.use(historyRoutes);
```

### Passo 17 — Postman: histórico com dados de três semanas

O histórico só prova alguma coisa com **mais de uma sessão em semanas
diferentes** — com um treino só, o gráfico é um ponto e o volume histórico é uma
semana cheia e sete vazias. Como a API não deixa escolher a data do treino
(`data DEFAULT NOW()`, de propósito), as sessões antigas são criadas hoje pelo
Postman e "empurradas pro passado" com um `UPDATE` direto no banco. É só dado de
teste — o sistema nunca faz isso.

### 17.1 — Montar os dados (continua do Passo 5, mesmo usuário e ambiente)

- [ ] Ponto de partida: o treino do Passo 5 (hoje, 2 séries válidas a 80 kg,
  finalizado, com diagnóstico).
- [ ] **Sessão "duas semanas atrás"**: `POST {{baseUrl}}/sessions/start` (o
  script do 5.7 atualiza `idTreino`) → `POST
  {{baseUrl}}/sessions/{{idTreino}}/sets` duas vezes:

```json
{ "fk_exercicio": {{idExercicio}}, "tipo": "work", "carga": 70, "repeticoes": 10, "rir": 2 }
```

```json
{ "fk_exercicio": {{idExercicio}}, "tipo": "work", "carga": 70, "repeticoes": 9, "rir": 1 }
```

→ `POST {{baseUrl}}/sessions/{{idTreino}}/finish` → `POST
{{baseUrl}}/sessions/{{idTreino}}/diagnostics/generate`. Copiar o `idTreino` do
ambiente e, no `psql` (ou pgAdmin):

```sql
UPDATE Treino SET data = data - INTERVAL '14 days'
WHERE id_treino = '<idTreino da sessão de 70 kg>';
```

- [ ] **Sessão "semana passada"**: mesmo caminho, com carga **75**, e **sem**
  gerar diagnóstico (é ela que testa o botão "Gerar diagnóstico" na aba
  Sessões):

```json
{ "fk_exercicio": {{idExercicio}}, "tipo": "work", "carga": 75, "repeticoes": 8, "rir": 2 }
```

```json
{ "fk_exercicio": {{idExercicio}}, "tipo": "work", "carga": 75, "repeticoes": 8, "rir": 1 }
```

→ `finish` (sem `generate`) →

```sql
UPDATE Treino SET data = data - INTERVAL '7 days'
WHERE id_treino = '<idTreino da sessão de 75 kg>';
```

> Depois do `finish`, o `POST /sessions/start` cria um treino **novo** no mesmo
> dia (a S6 já conferiu isso) — é o que permite montar as três sessões de uma vez.

### 17.2 — `GET {{baseUrl}}/history/sessions`

```js
pm.test('sessões 200', () => pm.response.to.have.status(200));
const sessoes = pm.response.json().sessoes;
pm.test('só finalizadas, mais recente primeiro', () => {
  pm.expect(sessoes.length).to.eql(3);
  pm.expect(new Date(sessoes[0].data) > new Date(sessoes[1].data)).to.be.true;
});
pm.test('series_validas conta só work', () => pm.expect(sessoes[0].series_validas).to.eql(2));
```

Esperado:

```json
{
  "sessoes": [
    { "id_treino": "…", "data": "2026-09-23T21:58:02.114Z", "duracao_total": 1, "nome_divisao": "Peito e tríceps", "series_validas": 2, "id_diagnostico": "7b1e…", "score_geral": 52 },
    { "id_treino": "…", "data": "2026-09-16T22:04:51.800Z", "duracao_total": 1, "nome_divisao": "Peito e tríceps", "series_validas": 2, "id_diagnostico": null, "score_geral": null },
    { "id_treino": "…", "data": "2026-09-09T22:02:13.370Z", "duracao_total": 1, "nome_divisao": "Peito e tríceps", "series_validas": 2, "id_diagnostico": "a41f…", "score_geral": 58 }
  ]
}
```

- A sessão de hoje tem `series_validas: 2`, não 4: aquecimento e feeder do 5.8
  não contam.
- O `score_geral` da sessão antiga pode não ser 58 — ele foi calculado **quando
  ela ainda era de hoje**, com o volume da semana daquele momento. É o
  comportamento certo: o diagnóstico é uma foto (D14), não é recalculado quando o
  dado muda.
- Se mandar isso com um treino **aberto** existindo, ele **não** aparece (D18).

### 17.3 — `GET {{baseUrl}}/history/exercises`

```js
pm.test('exercícios 200', () => pm.response.to.have.status(200));
const ex = pm.response.json().exercicios;
pm.test('só o supino (única com série work)', () => pm.expect(ex.map(e => e.id_exercicio)).to.eql([Number(pm.environment.get('idExercicio'))]));
```

Esperado: `200 { "exercicios": [ { "id_exercicio": 1, "nome_exercicio": "Supino Reto com Barra", "nome_grupamento": "Peito" } ] }`.

### 17.4 — `GET {{baseUrl}}/history/exercises/{{idExercicio}}/load-progression`

```js
pm.test('progressão 200', () => pm.response.to.have.status(200));
const p = pm.response.json().progressao;
pm.test('ordem cronológica, maior carga por sessão (D17)', () => pm.expect(p.map(x => x.carga_maxima)).to.eql([70, 75, 80]));
pm.test('carga é number, não string', () => pm.expect(p[0].carga_maxima).to.be.a('number'));
```

Esperado:

```json
{
  "progressao": [
    { "id_treino": "…", "data": "2026-09-09T22:02:13.370Z", "carga_maxima": 70, "series_validas": 2 },
    { "id_treino": "…", "data": "2026-09-16T22:04:51.800Z", "carga_maxima": 75, "series_validas": 2 },
    { "id_treino": "…", "data": "2026-09-23T21:58:02.114Z", "carga_maxima": 80, "series_validas": 2 }
  ]
}
```

- [ ] Na sessão de hoje teve aquecimento de 40 kg e feeder de 60 kg — nenhum
  dos dois aparece nem mexe no máximo. Pra ver a D17 de verdade: registrar num
  treino aberto um **aquecimento de 100 kg** e conferir que o ponto de hoje
  continua 80.
- [ ] Negativos: `…/history/exercises/abc/load-progression` → `400 { "erro":
  "id do exercicio invalido" }`; `…/history/exercises/999/load-progression` →
  `200 { "progressao": [] }`.

### 17.5 — `GET {{baseUrl}}/history/weekly-volume`

```js
pm.test('volume histórico 200', () => pm.response.to.have.status(200));
const h = pm.response.json().historico;
pm.test('8 semanas por padrão (D18)', () => pm.expect(h.length).to.eql(8));
pm.test('todo grupamento em toda semana', () => h.forEach(s => pm.expect(s.grupamentos.length).to.eql(7)));
const peito = h.map(s => s.grupamentos.find(g => g.nome_grupamento === 'Peito').series_validas);
pm.test('Peito: 2 nesta, 2 na passada, 2 na retrasada', () => pm.expect(peito.slice(0, 3)).to.eql([2, 2, 2]));
```

Esperado (cortado — são 8 semanas × 7 grupamentos):

```json
{
  "historico": [
    {
      "semana_referencia": "2026-09-21",
      "limiar": 10,
      "grupamentos": [
        { "id_grupamento": 7, "nome_grupamento": "Abdômen", "series_validas": 0, "atingiu_limiar": false },
        { "id_grupamento": 1, "nome_grupamento": "Peito", "series_validas": 2, "atingiu_limiar": false }
      ]
    },
    { "semana_referencia": "2026-09-14", "limiar": 10, "grupamentos": [ … ] },
    { "semana_referencia": "2026-09-07", "limiar": 10, "grupamentos": [ … ] },
    { "semana_referencia": "2026-08-31", "limiar": 10, "grupamentos": [ … ] }
  ]
}
```

- [ ] `semana_referencia` é sempre **segunda-feira** (D10), em texto
  `YYYY-MM-DD` — nunca com `T…Z`.
- [ ] Variações do parâmetro:

| URL | Resposta |
|---|---|
| `{{baseUrl}}/history/weekly-volume?semanas=3` | `200`, `historico.length === 3` |
| `{{baseUrl}}/history/weekly-volume?semanas=26` | `200`, 26 semanas |
| `{{baseUrl}}/history/weekly-volume?semanas=0` | `400 { "erro": "semanas precisa ser um inteiro entre 1 e 26" }` |
| `{{baseUrl}}/history/weekly-volume?semanas=27` | `400` |
| `{{baseUrl}}/history/weekly-volume?semanas=abc` | `400` |

- [ ] Comparar o `historico[0]` com o `volume` de `GET
  {{baseUrl}}/metrics/weekly-volume` — têm que ser **idênticos**, campo a campo.

### 17.6 — `GET {{baseUrl}}/history/diagnostics`

```js
pm.test('diagnósticos 200', () => pm.response.to.have.status(200));
const d = pm.response.json().diagnosticos;
pm.test('mais recente primeiro', () => pm.expect(new Date(d[0].data_geracao) >= new Date(d[1].data_geracao)).to.be.true);
pm.test('cada um com a data da sessão', () => d.forEach(x => pm.expect(x.data_treino).to.be.a('string')));
```

Esperado: `200 { "diagnosticos": [ { "id_diagnostico": "…", "fk_treino": "…", "score_geral": 52, "data_geracao": "…", "conteudo_json": { … }, "data_treino": "…" }, … ] }`
— dois itens (a sessão de 75 kg ficou sem).

- [ ] **D14 na prática:** mandar o `POST …/diagnostics/generate` de novo pra
  sessão de hoje (o `{{idTreino}}` agora é o da de 75 kg — usar o id da de hoje,
  que está no `GET /history/sessions`). A lista passa a ter **três** itens, e o
  `GET /history/sessions` mostra, na sessão de hoje, o `id_diagnostico` do
  **novo**.

### 17.7 — Isolamento entre usuários

- [ ] Registrar e logar um segundo usuário (`postman.outro@teste.com`) e, com o
  token dele, mandar os cinco `GET /history/...` → todos `200` com listas
  vazias (e 8 semanas zeradas no volume). Em especial
  `…/history/exercises/{{idExercicio}}/load-progression` com o id do supino que
  o primeiro usuário treinou → `{ "progressao": [] }`.

### 17.8 — Conferir no banco (cálculo manual)

- [ ] Pegar o UUID do usuário com `GET {{baseUrl}}/me` e bater a progressão:

```sql
SELECT t.data::date, MAX(s.carga) AS carga_maxima, COUNT(*) AS series_validas
FROM SerieTreino s
JOIN Treino t ON t.id_treino = s.fk_treino
WHERE s.tipo = 'work'
  AND t.fk_usuario = '<uuid>'
  AND s.fk_exercicio = <idExercicio>
GROUP BY t.id_treino, t.data
ORDER BY t.data;
```

- [ ] (Opcional) Na coleção, **Run collection** com as requisições na ordem 5.3
  → 5.12 → 17.2 → 17.6: o Collection Runner mostra todos os `pm.test` verdes de
  uma vez. Os passos com `UPDATE` no banco ficam de fora do runner.

### Passo 18 — `server/src/__tests__/history.test.ts` (novo)

- [ ] Não mexe no `testHelpers.ts` — `registrarComTreinoAberto` já dá usuário
  novo + divisão de hoje + exercício + treino aberto. Cada teste cria o seu
  usuário, então não tem interferência entre eles.
- [ ] O teste que mais vale da semana é o da **semana atual do histórico ==
  `/metrics/weekly-volume`**: duas consultas diferentes pra mesma regra, e é
  ele que acusa se uma mudar e a outra não.

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app';
import { registrarELogar, registrarComTreinoAberto } from './testHelpers';


//registra uma serie; so work leva nota (D9)
async function registrarSerie(
  token: string,
  idTreino: string,
  fkExercicio: number,
  tipo: 'aquecimento' | 'feeder' | 'work',
  carga: number
) {
  await request(app)
    .post(`/sessions/${idTreino}/sets`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      fk_exercicio: fkExercicio,
      tipo,
      carga,
      repeticoes: 8,
      ...(tipo === 'work' ? { rir: 2 } : {}),
    });
}

async function finalizar(token: string, idTreino: string) {
  await request(app)
    .post(`/sessions/${idTreino}/finish`)
    .set('Authorization', `Bearer ${token}`);
}

function gerarDiagnostico(token: string, idTreino: string) {
  return request(app)
    .post(`/sessions/${idTreino}/diagnostics/generate`)
    .set('Authorization', `Bearer ${token}`);
}

function buscar(caminho: string, token: string) {
  return request(app).get(caminho).set('Authorization', `Bearer ${token}`);
}


test('GET /history/sessions sem token retorna 401', async () => {
  const resposta = await request(app).get('/history/sessions');
  assert.equal(resposta.status, 401);
});


test('sessões: só treino finalizado entra, e series_validas conta só work (D18)', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 60);
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 60);
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'aquecimento', 30);

  //treino aberto e assunto do "Treino de hoje", nao do historico
  const aberto = await buscar('/history/sessions', token);
  assert.equal(aberto.body.sessoes.length, 0);

  await finalizar(token, idTreino);
  const resposta = await buscar('/history/sessions', token);
  assert.equal(resposta.status, 200);
  assert.equal(resposta.body.sessoes.length, 1);

  const sessao = resposta.body.sessoes[0];
  assert.equal(sessao.series_validas, 2);
  assert.equal(sessao.nome_divisao, 'Treino de hoje');
  assert.equal(sessao.id_diagnostico, null);
});


test('diagnósticos: gerar duas vezes guarda os dois, e a sessão aponta pro mais recente (D14)', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 60);
  await finalizar(token, idTreino);

  const primeiro = await gerarDiagnostico(token, idTreino);
  const segundo = await gerarDiagnostico(token, idTreino);

  const sessoes = await buscar('/history/sessions', token);
  //um LEFT JOIN comum (sem LATERAL ... LIMIT 1) duplicaria a sessao aqui
  assert.equal(sessoes.body.sessoes.length, 1);
  assert.equal(sessoes.body.sessoes[0].id_diagnostico, segundo.body.diagnostico.id_diagnostico);
  assert.equal(sessoes.body.sessoes[0].series_validas, 1);

  const diagnosticos = await buscar('/history/diagnostics', token);
  assert.equal(diagnosticos.status, 200);
  assert.deepEqual(
    diagnosticos.body.diagnosticos.map((d: any) => d.id_diagnostico),
    [segundo.body.diagnostico.id_diagnostico, primeiro.body.diagnostico.id_diagnostico]
  );
  assert.ok(diagnosticos.body.diagnosticos[0].data_treino);
});


test('progressão: maior carga de série work por sessão; aquecimento pesado não conta (D17)', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 60);
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 70);
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'aquecimento', 100);

  const resposta = await buscar(`/history/exercises/${exercicio.id_exercicio}/load-progression`, token);
  assert.equal(resposta.status, 200);
  assert.equal(resposta.body.progressao.length, 1);
  //number, nao '70': sem o ::float o NUMERIC voltaria string
  assert.equal(resposta.body.progressao[0].carga_maxima, 70);
  assert.equal(resposta.body.progressao[0].series_validas, 2);
});


test('progressão: id de exercício não numérico retorna 400', async () => {
  const { token } = await registrarELogar();
  const resposta = await buscar('/history/exercises/abc/load-progression', token);
  assert.equal(resposta.status, 400);
});


test('exercícios treinados: só entra exercício com série work', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();

  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'aquecimento', 40);
  const antes = await buscar('/history/exercises', token);
  assert.equal(antes.body.exercicios.length, 0);

  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 60);
  const depois = await buscar('/history/exercises', token);
  assert.equal(depois.body.exercicios.length, 1);
  assert.equal(depois.body.exercicios[0].id_exercicio, exercicio.id_exercicio);
});


test('histórico não vaza dado de outro usuário', async () => {
  const outro = await registrarComTreinoAberto();
  await registrarSerie(outro.token, outro.idTreino, outro.exercicio.id_exercicio, 'work', 90);
  await finalizar(outro.token, outro.idTreino);

  const { token } = await registrarELogar();
  const progressao = await buscar(
    `/history/exercises/${outro.exercicio.id_exercicio}/load-progression`,
    token
  );
  assert.deepEqual(progressao.body.progressao, []);

  const exercicios = await buscar('/history/exercises', token);
  assert.deepEqual(exercicios.body.exercicios, []);

  const sessoes = await buscar('/history/sessions', token);
  assert.deepEqual(sessoes.body.sessoes, []);
});


test('volume histórico: semana atual é idêntica ao GET /metrics/weekly-volume (mesma régua, D10)', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  for (let i = 0; i < 3; i++) {
    await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 60);
  }

  const historico = await buscar('/history/weekly-volume', token);
  const atual = await buscar('/metrics/weekly-volume', token);

  assert.equal(historico.status, 200);
  assert.deepEqual(historico.body.historico[0], atual.body.volume);
});


test('volume histórico: 8 semanas por padrão, todos os grupamentos em cada uma (D18)', async () => {
  const { token } = await registrarELogar();

  const padrao = await buscar('/history/weekly-volume', token);
  assert.equal(padrao.body.historico.length, 8);
  for (const semana of padrao.body.historico) {
    assert.equal(semana.grupamentos.length, 7); //grupamento zerado nao some
  }

  const tres = await buscar('/history/weekly-volume?semanas=3', token);
  assert.equal(tres.body.historico.length, 3);
});


test('volume histórico: semanas fora de 1–26 retorna 400', async () => {
  const { token } = await registrarELogar();
  for (const valor of ['0', '27', 'abc']) {
    const resposta = await buscar(`/history/weekly-volume?semanas=${valor}`, token);
    assert.equal(resposta.status, 400, `semanas=${valor}`);
  }
});
```

- [ ] `npm run test` → **55/55** (45 da Parte 1 + 10 do histórico), com `GEMINI_MOCK=true`
  (o teste de D14 gera diagnóstico).

### Passo 19 — `client/src/services/api.ts` (acrescentar no fim)

- [ ] Espelho dos tipos do Passo 11. O volume histórico reusa o
  `VolumeSemanal` que já existe desde a S6.
- [ ] Instalar a biblioteca de gráfico do próprio MUI (já é a UI do projeto,
  herda o tema, licença MIT): `npm install @mui/x-charts` dentro de `client/`.

```ts
//============================historico (RF07)===========================

export interface SessaoHistorico {
    id_treino: string;
    data: string;
    duracao_total: number | null;
    nome_divisao: string | null;
    series_validas: number;
    id_diagnostico: string | null; //o mais recente da sessao (D14)
    score_geral: number | null;
}

export interface ExercicioTreinado {
    id_exercicio: number;
    nome_exercicio: string;
    nome_grupamento: string;
}

export interface PontoProgressaoCarga {
    id_treino: string;
    data: string;
    carga_maxima: number; //maior carga de serie valida da sessao (D17)
    series_validas: number;
}

export function buscarHistoricoSessoes() {
    return apiFetch('/history/sessions') as Promise<{ sessoes: SessaoHistorico[] }>;
}

export function buscarExerciciosTreinados() {
    return apiFetch('/history/exercises') as Promise<{ exercicios: ExercicioTreinado[] }>;
}

export function buscarProgressaoCarga(idExercicio: number) {
    return apiFetch(`/history/exercises/${idExercicio}/load-progression`) as Promise<{
        progressao: PontoProgressaoCarga[];
    }>;
}

//cada item tem o mesmo formato do GET /metrics/weekly-volume
export function buscarHistoricoVolume(semanas?: number) {
    const query = semanas ? `?semanas=${semanas}` : '';
    return apiFetch(`/history/weekly-volume${query}`) as Promise<{ historico: VolumeSemanal[] }>;
}

export function buscarDiagnosticosAnteriores() {
    return apiFetch('/history/diagnostics') as Promise<{ diagnosticos: DiagnosticoComTreino[] }>;
}
```

### Passo 20 — `client/src/views/HistoryView.tsx` (novo)

- [ ] Três abas = as três coisas do RF07: **Cargas** (progressão), **Volume**
  (semanal) e **Sessões** (com os diagnósticos anteriores). Cada aba é um
  componente próprio no mesmo arquivo e só carrega o dado dela quando é aberta.
- [ ] **Cargas:** o eixo x é o **índice** da sessão, com a data só no rótulo
  (`valueFormatter`). Com a data direto no eixo, duas sessões no mesmo dia
  viram uma categoria só no `scaleType: 'point'` e um ponto some.
- [ ] **Volume:** chip por grupamento, cheio quando teve série, contornado
  quando zerou, verde quando `atingiu_limiar` — o booleano vem pronto do backend
  (RNF03); a tela não compara nada.
- [ ] **Sessões:** cada sessão é um `Accordion`. Com diagnóstico → abre o
  `DiagnosticContent` (Passo 7). Sem → botão "Gerar diagnóstico desta sessão"
  (é a segunda porta da D16: cobre quem saiu da tela antes de gerar, ou tomou
  502).
- [ ] Duas funções de data diferentes de propósito: `semana_referencia` é texto
  `YYYY-MM-DD` (split, **nunca** `new Date` — viraria UTC e voltaria um dia,
  armadilha da S6); `data` do treino é timestamp com `Z` (aí **sim** `new Date`,
  pra converter pro fuso local).

```tsx
import { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography, Tabs, Tab, Stack, Chip, TextField, MenuItem,
  Accordion, AccordionSummary, AccordionDetails, Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { LineChart } from '@mui/x-charts/LineChart';
import * as api from '../services/api';
import { FeedbackAlert } from '../components/FeedbackAlert';
import { DiagnosticContent } from '../components/DiagnosticContent';

type Aba = 'cargas' | 'volume' | 'sessoes';

//'YYYY-MM-DD' (texto do to_char): split, nunca new Date - viraria UTC e voltaria um dia
function formatarDia(iso: string) {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

//timestamp do Treino (UTC, com Z): new Date converte pro fuso local
function formatarData(timestamp: string) {
  return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function HistoryView() {
  const [aba, setAba] = useState<Aba>('cargas');

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h2" gutterBottom>
          Histórico
        </Typography>

        <Tabs value={aba} onChange={(_, nova: Aba) => setAba(nova)} variant="fullWidth" sx={{ mb: 3 }}>
          <Tab value="cargas" label="Cargas" />
          <Tab value="volume" label="Volume" />
          <Tab value="sessoes" label="Sessões" />
        </Tabs>

        {aba === 'cargas' && <AbaCargas />}
        {aba === 'volume' && <AbaVolume />}
        {aba === 'sessoes' && <AbaSessoes />}
      </CardContent>
    </Card>
  );
}


//============================ cargas (D17) ============================

function AbaCargas() {
  const [exercicios, setExercicios] = useState<api.ExercicioTreinado[] | null>(null);
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const [progressao, setProgressao] = useState<api.PontoProgressaoCarga[]>([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        const { exercicios } = await api.buscarExerciciosTreinados();
        setExercicios(exercicios);
        setSelecionado(exercicios[0]?.id_exercicio ?? null);
      } catch (erro) {
        setErro(erro instanceof Error ? erro.message : 'Erro ao carregar exercícios');
      }
    }
    carregar();
  }, []);

  useEffect(() => {
    if (selecionado === null) return;
    const idExercicio = selecionado;
    //trocar de exercicio rapido: a resposta atrasada do anterior nao pode
    //sobrescrever o grafico do atual
    let ativo = true;

    async function carregar() {
      try {
        const { progressao } = await api.buscarProgressaoCarga(idExercicio);
        if (ativo) setProgressao(progressao);
      } catch (erro) {
        if (ativo) setErro(erro instanceof Error ? erro.message : 'Erro ao carregar a progressão');
      }
    }
    carregar();
    return () => {
      ativo = false;
    };
  }, [selecionado]);

  if (erro) return <FeedbackAlert erro={erro} />;
  if (!exercicios) return <Typography>Carregando...</Typography>;
  if (exercicios.length === 0) {
    return <Typography color="text.secondary">Nenhuma série válida registrada ainda.</Typography>;
  }

  return (
    <Stack spacing={2}>
      <TextField
        select
        label="Exercício"
        value={selecionado ?? ''}
        onChange={(e) => setSelecionado(Number(e.target.value))}
      >
        {exercicios.map((e) => (
          <MenuItem key={e.id_exercicio} value={e.id_exercicio}>
            {e.nome_exercicio} · {e.nome_grupamento}
          </MenuItem>
        ))}
      </TextField>

      {progressao.length > 0 && (
        <LineChart
          height={260}
          //eixo x = indice da sessao: data direto no eixo juntaria duas sessoes do mesmo dia
          xAxis={[{
            scaleType: 'point',
            data: progressao.map((_, i) => i),
            valueFormatter: (i: number) => formatarData(progressao[i].data),
          }]}
          series={[{
            data: progressao.map((p) => p.carga_maxima),
            label: 'Maior carga válida da sessão (kg)',
            color: '#1E6F5C',
          }]}
        />
      )}

      {progressao.length === 1 && (
        <Typography variant="caption" color="text.secondary">
          Uma sessão só — a linha aparece a partir da segunda.
        </Typography>
      )}
    </Stack>
  );
}


//============================ volume (D18) ============================

function AbaVolume() {
  const [historico, setHistorico] = useState<api.VolumeSemanal[] | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        const { historico } = await api.buscarHistoricoVolume();
        setHistorico(historico);
      } catch (erro) {
        setErro(erro instanceof Error ? erro.message : 'Erro ao carregar o volume');
      }
    }
    carregar();
  }, []);

  if (erro) return <FeedbackAlert erro={erro} />;
  if (!historico) return <Typography>Carregando...</Typography>;

  return (
    <Stack spacing={2.5}>
      <Typography variant="body2" color="text.secondary">
        Séries válidas por grupamento nas últimas {historico.length} semanas · limiar de{' '}
        {historico[0]?.limiar} séries [Schoenfeld]
      </Typography>

      {historico.map((semana) => (
        <Stack key={semana.semana_referencia} spacing={1}>
          <Typography sx={{ fontWeight: 700 }}>
            Semana de {formatarDia(semana.semana_referencia)}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {semana.grupamentos.map((g) => (
              <Chip
                key={g.id_grupamento}
                size="small"
                //atingiu_limiar vem pronto do backend (RNF03)
                color={g.atingiu_limiar ? 'success' : 'default'}
                variant={g.series_validas === 0 ? 'outlined' : 'filled'}
                label={`${g.nome_grupamento} ${g.series_validas}/${semana.limiar}`}
              />
            ))}
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}


//=================== sessoes + diagnosticos anteriores ===================

function AbaSessoes() {
  const [sessoes, setSessoes] = useState<api.SessaoHistorico[] | null>(null);
  const [diagnosticos, setDiagnosticos] = useState<Map<string, api.DiagnosticoComTreino>>(new Map());
  const [gerando, setGerando] = useState<string | null>(null);
  const [erro, setErro] = useState('');

  async function recarregar() {
    const [{ sessoes }, { diagnosticos }] = await Promise.all([
      api.buscarHistoricoSessoes(),
      api.buscarDiagnosticosAnteriores(),
    ]);
    setSessoes(sessoes);
    //indexa por id: cada sessao ja diz qual e o diagnostico mais recente dela (D14)
    setDiagnosticos(new Map(diagnosticos.map((d) => [d.id_diagnostico, d])));
  }

  useEffect(() => {
    async function carregar() {
      try {
        await recarregar();
      } catch (erro) {
        setErro(erro instanceof Error ? erro.message : 'Erro ao carregar as sessões');
      }
    }
    carregar();
  }, []);

  //segunda porta da D16: sessao que ficou sem diagnostico (saiu da tela, ou 502)
  async function gerar(idTreino: string) {
    setErro('');
    setGerando(idTreino);
    try {
      await api.gerarDiagnostico(idTreino);
      await recarregar();
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : 'Erro ao gerar diagnóstico');
    } finally {
      setGerando(null);
    }
  }

  if (!sessoes) {
    return erro ? <FeedbackAlert erro={erro} /> : <Typography>Carregando...</Typography>;
  }
  if (sessoes.length === 0) {
    return <Typography color="text.secondary">Nenhum treino finalizado ainda.</Typography>;
  }

  return (
    <Stack spacing={1}>
      <FeedbackAlert erro={erro} />

      {sessoes.map((s) => {
        const diagnostico = s.id_diagnostico ? diagnosticos.get(s.id_diagnostico) : undefined;

        return (
          <Accordion key={s.id_treino} disableGutters variant="outlined">
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography sx={{ fontWeight: 700 }}>{formatarData(s.data)}</Typography>
                <Typography color="text.secondary">{s.nome_divisao ?? 'Sem divisão'}</Typography>
                <Chip size="small" label={`${s.series_validas} séries válidas`} />
                {s.duracao_total !== null && (
                  <Chip size="small" variant="outlined" label={`${s.duracao_total} min`} />
                )}
                {s.score_geral !== null && (
                  <Chip size="small" color="primary" label={`Score ${s.score_geral}`} />
                )}
              </Stack>
            </AccordionSummary>

            <AccordionDetails>
              {diagnostico ? (
                <DiagnosticContent diagnostico={diagnostico} />
              ) : s.id_diagnostico ? (
                //existe, mas ficou fora dos 20 mais recentes da lista (D18)
                <Typography variant="body2" color="text.secondary">
                  Diagnóstico antigo — fora dos 20 mais recentes.
                </Typography>
              ) : (
                <Button
                  variant="outlined"
                  onClick={() => gerar(s.id_treino)}
                  //sem serie valida o backend responde 400 - nem oferece
                  disabled={gerando !== null || s.series_validas === 0}
                >
                  {gerando === s.id_treino ? 'Analisando a sessão…' : 'Gerar diagnóstico desta sessão'}
                </Button>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Stack>
  );
}
```

### Passo 21 — `App.tsx` + `Sidebar.tsx`: tela "historico"

- [ ] `Tela` ganha `'historico'`, o mapa ganha `historico: <HistoryView />`, e o
  item "Histórico" da sidebar ganha `tela: 'historico'`. Com isso **todos** os
  itens da sidebar ficam navegáveis — o `disponivel`/`opacity: 0.45` do
  `Sidebar.tsx` deixa de ter uso; pode ficar por enquanto, a limpeza é da S9.

```tsx
import { HistoryView } from './views/HistoryView'

export type Tela = 'divisao' | 'treino' | 'volume' | 'diagnostico' | 'historico'

  const telas: Record<Tela, ReactNode> = {
    divisao: <DivisionView />,
    treino: <TodaySessionView onVerDiagnostico={() => setTela('diagnostico')} />,
    volume: <WeeklyVolumeView />,
    diagnostico: <DiagnosticView />,
    historico: <HistoryView />,
  }
```

```tsx
  { label: 'Histórico', icon: <TimelineIcon fontSize="small" />, tela: 'historico' },
```

- [ ] Testar pela interface com o usuário do Passo 17 (o login é o
  `postman.s8@teste.com`): aba **Cargas** com a linha 70 → 75 → 80; aba
  **Volume** com Peito `2/10` nas três últimas semanas; aba **Sessões** com três
  sessões, a de 75 kg com o botão "Gerar diagnóstico" — clicar e ver o score
  aparecer no resumo sem recarregar a página.

---

## Passo 22 — Fechar a semana

1. [ ] `npm run test` no `server` verde na suíte inteira — **55/55** (42 da S7
   + 1 do Passo 1 + 2 do Passo 2 + 10 do Passo 18), com `GEMINI_MOCK=true`.
2. [ ] `npm run build` nos **dois** lados sem erro de tipo. No front, o
   `noUnusedLocals` pega import sobrando (ex.: o `InsightsIcon` se o Passo 9
   ficou pela metade).
3. [ ] Passo 5 e Passo 17 do Postman rodados de ponta a ponta, com todos os
   `pm.test` verdes e as contas manuais do 5.11 e do 17.8 conferidas.
4. [ ] Conferir a RNF06 pela tela: com a chave inválida (Passo 10), "Finalizar e
   avaliar treino" → "Treino salvo, mas a avaliação falhou…" → abrir Histórico →
   a sessão está lá, finalizada, com as séries — só sem score. Voltar a chave.
5. [ ] Testar no DevTools em modo celular (RNF01): Diagnóstico e Histórico numa
   coluna, sem rolagem horizontal — o gráfico da aba Cargas tem que encolher
   junto. (A barra inferior da D6 continua sendo S9.)
6. [ ] **Gravar a demo ponta a ponta** (critério de aceite): `Win + Alt + R`
   (Xbox Game Bar) ou OBS. Roteiro: login → Minha divisão → Treino de hoje
   (registrar 3–4 séries) → Volume da semana → volta pro Treino de hoje →
   "Finalizar e avaliar treino" → cai na aba Diagnóstico → Histórico (as três
   abas). Com `GEMINI_MOCK=false` e a chave real — a demo precisa mostrar texto
   da IA de verdade, não o "Mock: …".
7. [ ] Prints provisórios da **Fig. 4** (Diagnóstico da Sessão) e da **Fig. 5**
   (Histórico: progressão de carga + diagnósticos anteriores), pra garantir que
   as telas fecham o critério. As versões finais saem depois do code freeze, com
   os mesmos dados das outras figuras (seção 5 do `PLANEJAMENTO.md`).
8. [ ] Commit + push. Sugestão: **um commit por correção da Parte 1** (Passos 1,
   2, 3 e 4 — fica fácil de achar depois), um do front do diagnóstico (Passos
   6–10), um do backend do histórico (Passos 11–18) e um do front do histórico
   (Passos 19–21).
9. [ ] Marcar os cards da S8 no Trello (`/trello-sync`).

---

## Ordem sugerida pra essa semana

1. **Parte 1 inteira primeiro (Passos 0 → 5).** São as correções das semanas
   passadas; a Parte 2 depende de duas delas (o 409 e o `data_treino` do Passo
   1, o `ApiErro` do Passo 3). O Postman do Passo 5 fecha a Parte 1 e deixa um
   usuário com diagnóstico pronto pra desenvolver a `DiagnosticView` contra dado
   real.
2. **Parte 2, Sessão A (front, diagnóstico):** Passos 6 → 10 (`api.ts` →
   `DiagnosticContent` → `DiagnosticView` → botão único no Treino de hoje →
   navegação).
3. **Parte 2, Sessão B (histórico):** Passos 11 → 18 no backend (types →
   `historyModel` → `volumeService` → `diagnosticModel` → controller → rotas →
   **Postman** → testes), depois Passos 19 → 21 no front, contra o backend
   pronto.
4. Passo 22 fecha a semana.

> **Se o tempo apertar**, a ordem de corte é: (1) o botão "Gerar diagnóstico" da
> aba Sessões (o botão único do Treino de hoje já fecha o fluxo); (2) o gráfico
> da aba Cargas vira uma lista `data · carga` (sem `@mui/x-charts`). **Não**
> cortar nenhuma das três abas: cada uma é um pedaço literal do texto do RF07, e
> a Fig. 5 depende de cargas + diagnósticos anteriores. E **não** pular a Parte
> 1: são correções de coisa que já está errada.

## Armadilhas comuns desta semana

- **Esquecer que a correção do Passo 1 quebra dois testes da S7.** Depois do
  guard de 409, os testes que geravam diagnóstico em treino aberto ficam
  vermelhos — é o comportamento novo certo, não regressão. Atualizar o teste,
  não tirar o guard.
- **Pôr o `validarUuid` antes do `autenticar` na rota.** Aí um pedido sem token
  com id malformado recebe 404 em vez de 401 — a ordem é `autenticar,
  validarUuid('id'), controller`.
- **Juntar finish e diagnóstico numa chamada só no backend** "já que é um botão
  só". É o que a D16 descartou: uma falha do Gemini derrubaria o encerramento do
  treino (RNF06). O botão é único na tela; as chamadas continuam duas.
- **Chamar o `generate` mesmo quando o `finish` falhou.** O backend devolve 409
  e a tela mostra dois erros seguidos. O `return` dentro do `catch` do finish
  existe pra isso — exceto no 409 do próprio finish, que significa "já estava
  finalizado" e pode seguir.
- **Ler `hoje.treino.id_treino` depois do `recarregar()`.** Depois do finish o
  `hoje.treino` é `null`; o id tem que ser guardado numa variável **antes** da
  primeira chamada.
- **Deixar o status "Analisando…" dentro do bloco do treino.** Depois do finish
  o bloco some (`hoje.treino` é `null`) e a tela parece travada durante a
  chamada da IA. O status fica fora, antes do `{!hoje.treino ? (`.
- **Rodar o `PUT /divisions` do Postman com o seu usuário real.** Ele substitui
  a semana inteira; a sua rotina vira um dia só. Usuário dedicado pro Postman.
- **Body do Postman em `form-data` ou `x-www-form-urlencoded`.** O
  `express.json()` só lê `raw → JSON`; o controller recebe `{}` e devolve 400
  com uma mensagem que parece erro de validação.
- **Comparar texto de mensagem pra decidir fluxo** (`includes('já foi
  finalizado')`). Um ajuste de acento no backend quebra a tela em silêncio. É
  por isso que o `ApiErro` (Passo 3) carrega o `status`.
- **Tratar o 404 do `/diagnostics/latest` como erro.** A tela abre com alerta
  vermelho pra quem só ainda não gerou nenhum diagnóstico — é o estado vazio.
- **Recalcular o score, o Pv ou o Pi na tela.** O `score_geral` e o
  `score_detalhe` vêm prontos (D13/RNF03); a tela só arredonda pra exibir. E não
  somar os Pv/Pi arredondados esperando bater com o score: o score é o
  arredondamento da média dos valores **cheios**.
- **`LEFT JOIN DiagnosticoIA` comum na lista de sessões.** Sessão com dois
  diagnósticos (D14) aparece duplicada, e o `COUNT` de séries dobra. É pra isso
  o `LATERAL … LIMIT 1` — e o teste de D14 do Passo 18 pega.
- **Esquecer o `::float` no `MAX(s.carga)`.** `NUMERIC` volta string, o gráfico
  recebe `"80"` e o eixo y ou quebra ou ordena como texto (`"100" < "80"`).
- **Contar aquecimento/feeder na progressão.** Aquecimento pesado vira "recorde"
  falso no gráfico. `WHERE s.tipo = 'work'` (D17).
- **Semana sem treino sumindo do volume histórico.** Sem o `generate_series` +
  `CROSS JOIN`, as semanas vazias não existem no resultado e o histórico pula
  de 07/09 pra 21/09 como se fossem consecutivas.
- **`new Date('2026-09-21')` pra `semana_referencia`, ou `slice(0, 10)` pra
  `data` do treino.** São os dois erros de fuso opostos: o primeiro mostra
  domingo 20/09 (UTC → Brasília), o segundo mostra o dia seguinte pra treino
  depois das 21h. Texto de data → split; timestamp → `new Date`.
- **Data no eixo x do gráfico.** Duas sessões no mesmo dia viram uma categoria
  só e um ponto some — no Postman do Passo 17 isso acontece antes do `UPDATE`.
  Eixo por índice.
- **Esquecer o `app.use(historyRoutes)`.** Terceira semana seguida do mesmo
  erro silencioso: rota existe, compila, devolve 404.
- **Esquecer o `npm install @mui/x-charts` no `client/`.** O `import` do
  `LineChart` quebra o `vite` inteiro, não só a aba Cargas.
- **Gravar a demo com `GEMINI_MOCK=true`.** O texto "Mock: 8 reps a RPE 9" na
  tela do diagnóstico não prova o RF05 pra banca. Chave real na demo e nos
  prints.
