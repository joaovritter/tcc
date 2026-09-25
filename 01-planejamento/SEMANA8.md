# Semana 8 · 21–27/09 · F5b Tela Diagnóstico + F6 Histórico (RF07)

> Entregável: **fluxo principal ponta a ponta** (login → rotina → treino → volume →
> diagnóstico → histórico) — [card do entregável](https://trello.com/c/MLlAbzpN). Ver
> S8 no [`TASKS.md`](./TASKS.md) e a linha S8 do cronograma no
> [`PLANEJAMENTO.md`](./PLANEJAMENTO.md).
> Decisões novas desta semana (**confirmadas em 23/09**): **D16** (finalizar e
> avaliar num botão só, em duas chamadas, e só treino finalizado vira
> diagnóstico), **D17** (progressão de carga = maior carga válida por sessão) e
> **D18** (recorte do histórico).

> **Revisão de 25/09 (grilling):** (1) a D16 **fica como está**: treino sem série
> válida é salvo e **não** é avaliado pela IA. O rótulo "deload" foi descartado,
> porque na literatura deload é redução planejada *das* séries válidas, não a
> ausência delas. (2) A **D17 foi ampliada**: cada ponto da progressão traz também
> as reps da série mais pesada, as séries válidas e a tonelagem (Σ carga × reps),
> no tooltip. (3) A **D18-3 foi reescrita**: a aba Sessões vira um **calendário
> mês a mês com o histórico completo**. Tocar num dia mostra os treinos dele, e
> tocar num treino abre o detalhe (os registros e embaixo a avaliação da IA). Sai
> a lista dos "20 diagnósticos mais recentes". Passos afetados: 4, 7, 11, 12, 14
> a 21 e 22.

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
> abas da `HistoryView` (Passo 20): **Cargas**, **Volume** e **Sessões** (um
> calendário mês a mês; cada sessão abre com os registros e o diagnóstico dela).

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
> exercício (confirmada 23/09; ampliada 25/09).** Um ponto no gráfico = uma
> sessão, e a linha = a maior carga `work`. Avaliado e **descartado**: estimar
> 1RM (Epley/Brzycki). Seria uma fórmula nova que o texto do TCC não cita, e
> abriria divergência TCC × sistema (ver [`INSTRUCOES.md`](./INSTRUCOES.md)) por
> um ganho pequeno. Só entram séries `work` (aquecimento com 100 kg não é
> progressão), e, pela mesma lógica da D11, série registrada conta, com o treino
> finalizado ou não.
>
> **Ampliada em 25/09:** só a maior carga esconde a progressão por repetições
> (70 kg × 8 → 70 kg × 12 fica uma linha reta). Cada ponto passa a trazer
> também, das séries `work` daquele exercício na sessão: `reps_carga_maxima`
> (reps da série mais pesada; com empate de carga, a de mais reps),
> `series_validas` e `tonelagem` (Σ carga × reps). Os três aparecem no
> **tooltip**, e não como segunda linha, porque a escala é outra. O nome é
> **tonelagem**, nunca "volume": no TCC, volume = contagem de séries válidas por
> semana (RF04/D10), e duas coisas com o mesmo nome confundem a banca. É soma,
> não estimativa, então não abre a divergência do 1RM. O mesmo resumo aparece no
> detalhe da sessão (D18-3), calculado por **uma** subconsulta só.

> **D18 — Recorte do histórico (confirmada 23/09; item 3 reescrito 25/09).** (1)
> A aba **Sessões** mostra só treino **finalizado**: o treino aberto é assunto do
> "Treino de hoje", e só treino finalizado pode ter diagnóstico (D16). (2) O
> **volume histórico** mostra as últimas **8 semanas de calendário** (segunda a
> domingo, D10), configurável por `?semanas=1..26`, com **todos** os grupamentos
> em cada semana (zerado também, a mesma regra do painel da S6). (3) **Sessões =
> calendário mês a mês, com o histórico completo.** `GET
> /history/sessions?mes=AAAA-MM` devolve **todas** as sessões finalizadas do mês
> (sem `LIMIT`) e o dia do primeiro treino finalizado (`primeira_sessao`), que
> trava a navegação para trás. Tocar num dia mostra os treinos dele. Tocar num
> treino chama `GET /history/sessions/:id`, que traz os registros (séries válidas
> e de preparação, por exercício, com o resumo da D17) e embaixo o diagnóstico
> mais novo da sessão (D14). **Descartados:** a lista dos "20 diagnósticos mais
> recentes" (`/history/diagnostics`), porque escondia o histórico antigo; o
> calendário como tela própria no menu, porque seriam duas portas para os mesmos
> diagnósticos; os cards de métricas do mês e o gráfico de frequência; a coluna
> de descanso, porque o sistema não grava esse dado.

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
  vinda de um `JOIN Treino`. Usado no `latest`.

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

- [ ] `npm run test` → **44/44** (43 da S7 + o 409).

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

- [ ] `npm run test` → **46/46** (44 + 2).

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

- [x] Cronograma (seção 4), linha S8: trocar "Tela *Diagnóstico da **Semana***"
  por "Tela *Diagnóstico da **Sessão***". É resíduo de antes da D15 (17/09) — o
  diagnóstico é por sessão desde então, e a seção 5 (Fig. 4) já fala em
  "Diagnóstico da Sessão".
- [x] Seção 2 (decisões), acrescentar depois da D15, no mesmo formato das
  anteriores:
  - **D16 — "Finalizar e avaliar treino" é um botão só, em duas chamadas (23/09)**:
    o front chama `POST /sessions/:id/finish` e, se der certo, `POST
    /sessions/:id/diagnostics/generate`. Juntar as duas no backend foi descartado
    (falha do Gemini derrubaria o encerramento do treino, contra a RNF06). O
    backend recusa (409) diagnóstico de treino aberto.
  - **D17 — Progressão de carga = maior carga de série `work` por sessão, por
    exercício (23/09; ampliada 25/09)**: 1RM estimada descartada (fórmula que o
    texto do TCC não cita). Série registrada conta, treino finalizado ou não
    (mesma lógica da D11). Cada ponto traz também as reps da série mais pesada,
    as séries válidas e a tonelagem (Σ carga × reps, que não se chama "volume").
  - **D18 — Recorte do histórico (23/09; item 3 reescrito 25/09)**: sessões =
    só treino finalizado; volume histórico = últimas 8 semanas de calendário
    (`?semanas=1..26`), todos os grupamentos em cada semana; sessões e
    diagnósticos anteriores = calendário mês a mês, com o histórico completo
    (sem corte). Cada sessão abre com os registros e o diagnóstico mais novo
    dela.
  - (D16, **revisão 25/09**): treino sem série válida continua **sem**
    avaliação. O rótulo "deload" foi descartado (deload = redução planejada das
    séries válidas, não a ausência delas).
- [x] Seção 3 (arquitetura): acrescentar `history` na lista de controllers e
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

Só começar com a Parte 1 verde: **46/46** no `npm run test` e o Passo 5 do
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
  "Diagnóstico" (o atual) e no detalhe de cada sessão do calendário do
  histórico (`SessionDetail`, Passo 20). Escrever uma vez só.
- [ ] O `corDoScore` é **exportado**: o calendário (Passo 20) pinta o ponto do
  dia e o selo do card com a mesma faixa do círculo. Uma fonte só.
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

//faixa de cor e so apresentacao: o score ja chegou pronto do backend (D13).
//exportada: o calendario do historico usa a mesma faixa no ponto do dia
export function corDoScore(score: number): 'success' | 'warning' | 'error' {
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
  problema: o detalhe da sessão no calendário do histórico (Passo 20) tem o
  botão "Avaliar treino" para qualquer sessão finalizada, com série válida e sem
  diagnóstico.
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

- [ ] O volume histórico **não** ganha tipo novo: cada semana é um
  `VolumeSemanal`, o mesmo formato do `GET /metrics/weekly-volume`. A tela
  reaproveita a leitura, e o teste compara os dois direto (Passo 18).
- [ ] `SessaoHistorico` ganha o campo `dia` (`'YYYY-MM-DD'`, vindo do
  `to_char` no banco). É ele que posiciona a sessão no calendário (D18). A
  `data` (timestamp) continua existindo, só para mostrar a hora.
- [ ] `SessoesDoMes` é a resposta do calendário: as sessões do mês +
  `primeira_sessao` (o dia do treino finalizado mais antigo), que trava a seta
  ‹ no mês em que tudo começou.
- [ ] `ResumoSeriesValidas` é a D17 ampliada: carga máxima, reps dessa carga,
  séries válidas e tonelagem. **Um tipo só** para o ponto do gráfico
  (`PontoProgressaoCarga` estende ele) e para o resumo de cada exercício no
  detalhe. São os mesmos números, então é o mesmo tipo.
- [ ] `ExercicioDaSessao.resumo` é `null` quando o exercício só teve
  preparação (aquecimento/feeder): não existe "carga máxima válida" de nada.
- [ ] `DetalheSessao` é a resposta do `GET /history/sessions/:id`: a sessão,
  os exercícios com as séries e o diagnóstico mais novo (ou `null`).
- [ ] Os campos numéricos saem da query com `::float`/`::int`. Sem isso, o
  `NUMERIC` volta como string (`"80"`), a mesma armadilha do `COUNT` na S6.

Código completo do bloco (colar no fim do arquivo):

```ts
//============== histórico (RF07) =====================================

//uma sessao finalizada (D18) com o resumo do que aconteceu nela
export interface SessaoHistorico {
    id_treino: string;
    data: string; // timestamp - a tela usa so pra mostrar a hora
    dia: string; // 'YYYY-MM-DD' (to_char no banco) - posiciona a sessao no calendario
    duracao_total: number | null;
    nome_divisao: string | null; // fk_divisao é nullable no schema
    series_validas: number; // COUNT(...)::int
    id_diagnostico: string | null; // o mais recente da sessao (D14); null se nunca gerou
    score_geral: number | null;
}

//resposta do calendario: GET /history/sessions?mes=AAAA-MM (D18)
export interface SessoesDoMes {
    primeira_sessao: string | null; // 'YYYY-MM-DD' do treino finalizado mais antigo; null se nunca finalizou
    sessoes: SessaoHistorico[];
}

//exercicios com pelo menos uma serie work - popula o seletor da aba Cargas
export interface ExercicioTreinado {
    id_exercicio: number;
    nome_exercicio: string;
    nome_grupamento: string;
}

//D17: o resumo das series work de UM exercicio em UMA sessao.
//mesmo tipo no grafico de progressao e no detalhe da sessao - sao os mesmos numeros
export interface ResumoSeriesValidas {
    series_validas: number;
    carga_maxima: number; // ::float na query - NUMERIC voltaria string
    reps_carga_maxima: number; // reps da serie mais pesada (empate de carga: a de mais reps)
    tonelagem: number; // soma de carga x reps. NAO e "volume" - volume e contagem de series (RF04)
}

//um ponto do grafico de progressao: uma sessao (D17)
export interface PontoProgressaoCarga extends ResumoSeriesValidas {
    id_treino: string;
    data: string;
}

//uma serie como aparece no detalhe - valida ou de preparacao
export interface SerieDaSessao {
    id_serie: number;
    tipo: TipoSerie;
    carga: number;
    repeticoes: number;
    rir: number | null; // null em aquecimento/feeder (D9)
}

export interface ExercicioDaSessao {
    id_exercicio: number;
    nome_exercicio: string;
    nome_grupamento: string;
    resumo: ResumoSeriesValidas | null; // null = o exercicio so teve preparacao
    series: SerieDaSessao[]; // na ordem em que foram registradas
}

//resposta do GET /history/sessions/:id - o que abre ao tocar no treino do dia
export interface DetalheSessao {
    sessao: SessaoHistorico;
    exercicios: ExercicioDaSessao[];
    diagnostico: DiagnosticoIA | null; // o mais novo da sessao (D14)
}
```

### Passo 12 — `server/src/models/historyModel.ts` (novo)

- [ ] Todas as consultas filtram por `t.fk_usuario`. O histórico é a rota que
  vaza dado de outro usuário com mais facilidade, porque a lista do mês não tem
  id de recurso na URL para conferir o dono.
- [ ] `SELECT_SESSAO` é a base das duas consultas de sessão (a lista do mês e
  o cabeçalho do detalhe). `COUNT(...) FILTER (WHERE s.tipo = 'work')` conta só
  série válida, sem subconsulta. O `LEFT JOIN LATERAL` pega **só o diagnóstico
  mais recente** de cada sessão (D14). Um `LEFT JOIN DiagnosticoIA` comum
  duplicaria a sessão uma vez por diagnóstico e multiplicaria o `COUNT`.
- [ ] `listarSessoesDoMes` **não tem `LIMIT`** (D18). Um mês tem poucas
  sessões, e o histórico inteiro se vê navegando mês a mês. O intervalo é
  `[primeiro dia do mês, primeiro dia do mês seguinte)`. O `to_date($2,
  'YYYY-MM')` dá o dia 1, e com `$2` nulo o `COALESCE` cai no mês atual do
  banco. É a mesma régua do `date_trunc('week', current_date)` do volume.
- [ ] `dia` sai do banco com `to_char(t.data, 'YYYY-MM-DD')`, e o calendário
  compara texto com texto. Assim ninguém faz `new Date('2026-09-18')` no front,
  que viraria UTC e jogaria o treino para o dia anterior.
- [ ] `buscarPrimeiraSessao`: o `MIN` sem nenhuma linha devolve **uma** linha
  com `NULL` (não devolve zero linhas), então o `rows[0]` é seguro.
- [ ] `RESUMO_SERIES_WORK` é a **única** definição da D17. O gráfico
  (`progressaoDeCarga`) e o detalhe (`listarExerciciosDaSessao`) usam a mesma
  subconsulta, então nunca mostram números diferentes para a mesma sessão. O
  teste do Passo 18 compara os dois.
  - `reps_carga_maxima`: `ARRAY_AGG(... ORDER BY s.carga DESC, s.repeticoes
    DESC)[1]` pega as reps da série mais pesada. Com empate de carga, fica a
    de mais reps (70×12 ganha de 70×8).
  - `tonelagem`: `SUM(s.carga * s.repeticoes)`.
  - A subconsulta sozinha **não tem dono**: ela agrega séries de todo mundo.
    Por isso ela **sempre** vem com `JOIN Treino t` + `t.fk_usuario = $…`.
- [ ] `listarExerciciosDaSessao` faz duas consultas em paralelo (as séries e
  os resumos) e agrupa por exercício no JS. O `Map` preserva a ordem de
  inserção, e como as séries vêm `ORDER BY s.id_serie`, os exercícios ficam
  na ordem em que foram feitos.
- [ ] Esse agrupamento no model é só formato de resposta, não métrica: a conta
  (máximo, tonelagem) já veio pronta do SQL.

Código completo:

```ts
import { pool } from '../config/db';
import {
  SessaoHistorico, ExercicioTreinado, PontoProgressaoCarga, ResumoSeriesValidas,
  SerieDaSessao, ExercicioDaSessao,
} from '../types/indexTypes';


//============================ sessoes (D18) ============================

//base da lista do mes e do cabecalho do detalhe: sessao FINALIZADA do usuario,
//com a contagem de series validas e o diagnostico mais novo (D14).
//$1 e sempre o fk_usuario - quem usa continua o WHERE a partir do $2
const SELECT_SESSAO = `
  SELECT t.id_treino,
         t.data,
         to_char(t.data, 'YYYY-MM-DD') AS dia,
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
    AND t.completed = TRUE`;

const GROUP_BY_SESSAO = `GROUP BY t.id_treino, d.nome, ult.id_diagnostico, ult.score_geral`;


//mes = 'AAAA-MM' (o controller ja validou) ou null = mes atual.
//sem LIMIT (D18): e navegando mes a mes que se ve o historico inteiro
export async function listarSessoesDoMes(fkUsuario: string, mes: string | null): Promise<SessaoHistorico[]> {
  const resultado = await pool.query<SessaoHistorico>(
    `${SELECT_SESSAO}
       AND t.data >= COALESCE(to_date($2, 'YYYY-MM'), date_trunc('month', current_date)::date)
       AND t.data <  COALESCE(to_date($2, 'YYYY-MM'), date_trunc('month', current_date)::date) + INTERVAL '1 month'
     ${GROUP_BY_SESSAO}
     ORDER BY t.data ASC`,
    [fkUsuario, mes]
  );
  return resultado.rows;
}


//dia do treino finalizado mais antigo - trava a seta de voltar do calendario.
//MIN sem linha nenhuma devolve UMA linha com NULL, entao rows[0] sempre existe
export async function buscarPrimeiraSessao(fkUsuario: string): Promise<string | null> {
  const resultado = await pool.query<{ primeira: string | null }>(
    `SELECT to_char(MIN(data), 'YYYY-MM-DD') AS primeira
     FROM Treino
     WHERE fk_usuario = $1
       AND completed = TRUE`,
    [fkUsuario]
  );
  return resultado.rows[0].primeira;
}


//cabecalho do detalhe. treino aberto ou de outro usuario -> null (o controller devolve 404)
export async function buscarSessao(fkUsuario: string, idTreino: string): Promise<SessaoHistorico | null> {
  const resultado = await pool.query<SessaoHistorico>(
    `${SELECT_SESSAO}
       AND t.id_treino = $2
     ${GROUP_BY_SESSAO}`,
    [fkUsuario, idTreino]
  );
  return resultado.rows[0] ?? null;
}


//====================== resumo das series validas (D17) ======================

//UMA definicao so, usada pelo grafico e pelo detalhe - os dois nunca podem
//mostrar numeros diferentes pra mesma sessao.
//- reps_carga_maxima: reps da serie mais pesada; empate de carga -> a de mais reps
//- tonelagem: soma de carga x reps. NAO chamar de volume (volume = contagem de series, RF04)
//- ::float/::int: NUMERIC voltaria string pro front
//ATENCAO: esta subconsulta nao tem dono. usar SEMPRE com JOIN Treino + t.fk_usuario
const RESUMO_SERIES_WORK = `
  SELECT s.fk_treino,
         s.fk_exercicio,
         COUNT(*)::int AS series_validas,
         MAX(s.carga)::float AS carga_maxima,
         (ARRAY_AGG(s.repeticoes ORDER BY s.carga DESC, s.repeticoes DESC))[1]::int AS reps_carga_maxima,
         SUM(s.carga * s.repeticoes)::float AS tonelagem
  FROM SerieTreino s
  WHERE s.tipo = 'work'
  GROUP BY s.fk_treino, s.fk_exercicio`;


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


//D17: um ponto por sessao, com o resumo das series work daquele exercicio.
//ordem cronologica (ASC) porque vira o eixo x do grafico.
//serie registrada conta, treino finalizado ou nao (mesma logica da D11)
export async function progressaoDeCarga(
  fkUsuario: string,
  idExercicio: number
): Promise<PontoProgressaoCarga[]> {
  const resultado = await pool.query<PontoProgressaoCarga>(
    `SELECT t.id_treino,
            t.data,
            r.series_validas,
            r.carga_maxima,
            r.reps_carga_maxima,
            r.tonelagem
     FROM (${RESUMO_SERIES_WORK}) r
     JOIN Treino t ON t.id_treino = r.fk_treino
     WHERE t.fk_usuario = $1
       AND r.fk_exercicio = $2
     ORDER BY t.data ASC`,
    [fkUsuario, idExercicio]
  );
  return resultado.rows;
}


//detalhe da sessao: todas as series (validas e de preparacao) agrupadas por
//exercicio, cada exercicio com o resumo D17 (null se so teve preparacao)
export async function listarExerciciosDaSessao(
  fkUsuario: string,
  idTreino: string
): Promise<ExercicioDaSessao[]> {
  type LinhaSerie = SerieDaSessao & { id_exercicio: number; nome_exercicio: string; nome_grupamento: string };
  type LinhaResumo = ResumoSeriesValidas & { fk_exercicio: number };

  const [series, resumos] = await Promise.all([
    pool.query<LinhaSerie>(
      `SELECT s.id_serie,
              s.tipo,
              s.carga::float AS carga,
              s.repeticoes,
              s.rir,
              e.id_exercicio,
              e.nome_exercicio,
              g.nome AS nome_grupamento
       FROM SerieTreino s
       JOIN Treino t ON t.id_treino = s.fk_treino
       JOIN Exercicio e ON e.id_exercicio = s.fk_exercicio
       JOIN GrupamentoMuscular g ON g.id_grupamento = e.fk_grupamento
       WHERE s.fk_treino = $1
         AND t.fk_usuario = $2
       ORDER BY s.id_serie`,
      [idTreino, fkUsuario]
    ),
    pool.query<LinhaResumo>(
      `SELECT r.fk_exercicio,
              r.series_validas,
              r.carga_maxima,
              r.reps_carga_maxima,
              r.tonelagem
       FROM (${RESUMO_SERIES_WORK}) r
       JOIN Treino t ON t.id_treino = r.fk_treino
       WHERE r.fk_treino = $1
         AND t.fk_usuario = $2`,
      [idTreino, fkUsuario]
    ),
  ]);

  const resumoPorExercicio = new Map(
    resumos.rows.map(({ fk_exercicio, ...resumo }) => [fk_exercicio, resumo])
  );

  //agrupa as series por exercicio. Map preserva a ordem de insercao e as series
  //vem por id_serie, entao os exercicios ficam na ordem em que foram feitos
  const porExercicio = new Map<number, ExercicioDaSessao>();
  for (const { id_exercicio, nome_exercicio, nome_grupamento, ...serie } of series.rows) {
    if (!porExercicio.has(id_exercicio)) {
      porExercicio.set(id_exercicio, {
        id_exercicio,
        nome_exercicio,
        nome_grupamento,
        resumo: resumoPorExercicio.get(id_exercicio) ?? null,
        series: [],
      });
    }
    porExercicio.get(id_exercicio)!.series.push(serie);
  }

  return [...porExercicio.values()];
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

### Passo 14 — `server/src/models/diagnosticModel.ts`: `buscarUltimoDaSessao`

- [ ] Uma função nova, que traz o diagnóstico **mais novo de uma sessão** (D14).
  É o que o detalhe da sessão mostra embaixo das séries.
- [ ] Ela **substitui** o `listarDoUsuario` da versão anterior deste roteiro (os
  20 diagnósticos mais recentes, de `/history/diagnostics`). A D18-3 foi
  reescrita em 25/09: o diagnóstico antigo chega pelo calendário, por data, e
  não por uma lista com corte. Se você já tinha escrito o `listarDoUsuario`,
  apague.
- [ ] `fk_usuario` também entra no `WHERE`. O controller já conferiu o dono da
  sessão antes, mas a consulta não depende disso para não vazar dado.
- [ ] Nenhum import novo: `DiagnosticoIA` já está no import do arquivo.

Código (acrescentar no fim do arquivo):

```ts
//o diagnostico mais novo de UMA sessao (D14) - aparece no detalhe da sessao,
//embaixo das series. null = a sessao nunca foi avaliada
export async function buscarUltimoDaSessao(idTreino: string, fkUsuario: string): Promise<DiagnosticoIA | null> {
  const resultado = await pool.query<DiagnosticoIA>(
    `SELECT * FROM DiagnosticoIA
     WHERE fk_treino = $1
       AND fk_usuario = $2
     ORDER BY data_geracao DESC
     LIMIT 1`,
    [idTreino, fkUsuario]
  );
  return resultado.rows[0] ?? null;
}
```

### Passo 15 — `server/src/controllers/historyController.ts` (novo)

- [ ] A mesma régua do `metricsController`: nenhum SQL, nenhuma conta. Só
  validação de entrada e chamada de model/service.
- [ ] `sessoesDoMes`: o `?mes` é opcional. Sem ele, vale o mês atual. Com ele,
  tem que casar com `AAAA-MM` (mês de `01` a `12`). Qualquer outra coisa
  (`2026-9`, `2026-13`, `abc`, `2026-09-01`) devolve 400, sem chegar no banco.
- [ ] `req.query.mes` pode chegar como string, array ou objeto (`?mes=a&mes=b`
  vira array). O `typeof mes !== 'string'` barra os dois últimos.
- [ ] A lista do mês e a `primeira_sessao` vão em paralelo (`Promise.all`): são
  duas consultas independentes.
- [ ] `detalheSessao`: o id já chega validado pelo `validarUuid` (Passo 2) na
  rota. Treino aberto e treino de outro usuário dão **o mesmo 404**, porque o
  histórico é só de treino finalizado (D18) e a API não conta que o recurso
  existe para quem não é dono.
- [ ] Exercício que o usuário nunca treinou dá `200` com lista vazia, não 404:
  é um histórico vazio, não um recurso inexistente.
- [ ] O `diagnosticosAnteriores` da versão anterior **sai** (D18-3 reescrita).

Código completo:

```ts
import { Response } from 'express';
import { AuthenticateRequest } from '../middlewares/auth';
import * as historyModel from '../models/historyModel';
import * as diagnosticModel from '../models/diagnosticModel';
import * as volumeService from '../services/volumeService';

//so le e devolve. se aparecer conta aqui, e regra vazando do service/model

const FORMATO_MES = /^\d{4}-(0[1-9]|1[0-2])$/;


//calendario (D18): ?mes=AAAA-MM; sem o parametro, o mes atual.
//todas as sessoes do mes (sem LIMIT) + o dia do primeiro treino, que trava a seta de voltar
export async function sessoesDoMes(req: AuthenticateRequest, res: Response) {
    const { mes } = req.query;
    //?mes=a&mes=b chega como array: typeof barra antes do regex
    if (mes !== undefined && (typeof mes !== 'string' || !FORMATO_MES.test(mes))) {
        return res.status(400).json({ erro: 'mes precisa estar no formato AAAA-MM' });
    }

    try {
        const fkUsuario = req.userId as string;
        const [sessoes, primeira_sessao] = await Promise.all([
            historyModel.listarSessoesDoMes(fkUsuario, typeof mes === 'string' ? mes : null),
            historyModel.buscarPrimeiraSessao(fkUsuario),
        ]);
        return res.status(200).json({ primeira_sessao, sessoes });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao carregar as sessões do mês' });
    }
}


//o que abre ao tocar no treino do dia: series por exercicio + resumo D17 + diagnostico
export async function detalheSessao(req: AuthenticateRequest, res: Response) {
    const fkUsuario = req.userId as string;
    const idTreino = req.params.id as string; //ja passou pelo validarUuid na rota

    try {
        const sessao = await historyModel.buscarSessao(fkUsuario, idTreino);
        //treino aberto ou de outro usuario: o mesmo 404 - historico e so treino finalizado (D18)
        if (!sessao) {
            return res.status(404).json({ erro: 'Sessão não encontrada' });
        }

        const [exercicios, diagnostico] = await Promise.all([
            historyModel.listarExerciciosDaSessao(fkUsuario, idTreino),
            diagnosticModel.buscarUltimoDaSessao(idTreino, fkUsuario),
        ]);
        return res.status(200).json({ sessao, exercicios, diagnostico });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao carregar a sessão' });
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
```

### Passo 16 — `server/src/routes/historyRoutes.ts` (novo) + `app.ts`

- [ ] Todas as rotas atrás de `autenticar`, todas `GET`: o histórico não
  escreve nada.
- [ ] A rota do detalhe leva o `validarUuid('id')` do Passo 2, **depois** do
  `autenticar`. Sem ele, `/history/sessions/abc` vira erro 22P02 no Postgres e
  500.
- [ ] `/history/sessions` e `/history/sessions/:id` não conflitam: o Express
  compara o caminho inteiro, e `/history/sessions` não casa com `:id`.
- [ ] Sai a rota `/history/diagnostics` (D18-3 reescrita).
- [ ] `app.use(historyRoutes)` no `app.ts`. É a **terceira semana seguida** em
  que esse é o erro silencioso candidato: a rota existe, compila e devolve 404.

Código completo do `historyRoutes.ts`:

```ts
import { Router } from 'express';
import { autenticar } from '../middlewares/auth';
import { validarUuid } from '../middlewares/validarUuid';
import {
    sessoesDoMes, detalheSessao, exerciciosTreinados, progressaoCarga, volumeHistorico,
} from '../controllers/historyController';

const router = Router();

router.get('/history/sessions', autenticar, sessoesDoMes);
router.get('/history/sessions/:id', autenticar, validarUuid('id'), detalheSessao);
router.get('/history/exercises', autenticar, exerciciosTreinados);
router.get('/history/exercises/:id/load-progression', autenticar, progressaoCarga);
router.get('/history/weekly-volume', autenticar, volumeHistorico);

export default router;
```

`server/src/app.ts` (acrescentar):

```ts
import historyRoutes from './routes/historyRoutes';
// ...
app.use(diagnosticoRoutes);
app.use(historyRoutes);
```

### Passo 17 — Postman: histórico com dados de três semanas

O histórico só prova alguma coisa com **mais de uma sessão em dias
diferentes**. Com um treino só, o gráfico é um ponto, o calendário tem um dia
marcado e o volume histórico é uma semana cheia e sete vazias. A API não deixa
escolher a data do treino (`data DEFAULT NOW()`, de propósito), então as
sessões antigas são criadas hoje pelo Postman e "empurradas para o passado" com
um `UPDATE` direto no banco. É só dado de teste: o sistema nunca faz isso.

### 17.1 — Montar os dados (continua do Passo 5, mesmo usuário e ambiente)

- [ ] Ponto de partida: o treino do Passo 5 (hoje; séries válidas 80×8 e 80×7,
  mais aquecimento e feeder; finalizado, com diagnóstico).
- [ ] **Sessão "duas semanas atrás"**: `POST {{baseUrl}}/sessions/start` (o
  script do 5.7 atualiza o `idTreino`), depois `POST
  {{baseUrl}}/sessions/{{idTreino}}/sets` duas vezes:

```json
{ "fk_exercicio": {{idExercicio}}, "tipo": "work", "carga": 70, "repeticoes": 10, "rir": 2 }
```

```json
{ "fk_exercicio": {{idExercicio}}, "tipo": "work", "carga": 70, "repeticoes": 9, "rir": 1 }
```

Depois `POST {{baseUrl}}/sessions/{{idTreino}}/finish` e `POST
{{baseUrl}}/sessions/{{idTreino}}/diagnostics/generate`. Copie o `idTreino` do
ambiente e rode no `psql` (ou pgAdmin):

```sql
UPDATE Treino SET data = data - INTERVAL '14 days'
WHERE id_treino = '<idTreino da sessão de 70 kg>';
```

- [ ] **Sessão "semana passada"**: o mesmo caminho, com carga **75** e **sem**
  gerar diagnóstico. É ela que testa o botão "Avaliar treino" no detalhe da
  sessão.

```json
{ "fk_exercicio": {{idExercicio}}, "tipo": "work", "carga": 75, "repeticoes": 8, "rir": 2 }
```

```json
{ "fk_exercicio": {{idExercicio}}, "tipo": "work", "carga": 75, "repeticoes": 8, "rir": 1 }
```

Depois o `finish` (sem `generate`) e:

```sql
UPDATE Treino SET data = data - INTERVAL '7 days'
WHERE id_treino = '<idTreino da sessão de 75 kg>';
```

> Depois do `finish`, o `POST /sessions/start` cria um treino **novo** no mesmo
> dia (a S6 já conferiu isso). É o que permite montar as três sessões de uma vez.

> **Mês:** os valores esperados abaixo supõem as três sessões no mês atual (na
> semana da S8, dias 09, 16 e 23/09). Se você rodar isto antes do dia 15 de
> algum mês, a sessão de 14 dias atrás cai no mês anterior: o 17.2 mostra 2
> sessões, e ela aparece em `?mes=` do mês anterior.

### 17.2 — `GET {{baseUrl}}/history/sessions?mes={{mesAtual}}`

- [ ] **Pre-request** (aba *Scripts → Pre-request*), que calcula o mês atual:

```js
const hoje = new Date();
pm.environment.set('mesAtual', `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`);
```

- [ ] **Post-response**:

```js
pm.test('sessões do mês 200', () => pm.response.to.have.status(200));
const { primeira_sessao, sessoes } = pm.response.json();
pm.test('as três, em ordem de horário (a mais antiga primeiro)', () => {
  pm.expect(sessoes.length).to.eql(3);
  pm.expect(new Date(sessoes[0].data) < new Date(sessoes[2].data)).to.be.true;
});
pm.test('dia é texto AAAA-MM-DD, sem T…Z', () => sessoes.forEach(s => pm.expect(s.dia).to.match(/^\d{4}-\d{2}-\d{2}$/)));
pm.test('primeira_sessao = dia da mais antiga', () => pm.expect(primeira_sessao).to.eql(sessoes[0].dia));
pm.test('series_validas conta só work', () => pm.expect(sessoes[2].series_validas).to.eql(2));
//guarda os ids pro detalhe (17.4) e pro D14 (17.8)
pm.environment.set('idSessaoHoje', sessoes[2].id_treino);
pm.environment.set('idSessao75', sessoes[1].id_treino);
```

Esperado:

```json
{
  "primeira_sessao": "2026-09-09",
  "sessoes": [
    { "id_treino": "…", "data": "2026-09-09T22:02:13.370Z", "dia": "2026-09-09", "duracao_total": 1, "nome_divisao": "Peito e tríceps", "series_validas": 2, "id_diagnostico": "a41f…", "score_geral": 58 },
    { "id_treino": "…", "data": "2026-09-16T22:04:51.800Z", "dia": "2026-09-16", "duracao_total": 1, "nome_divisao": "Peito e tríceps", "series_validas": 2, "id_diagnostico": null, "score_geral": null },
    { "id_treino": "…", "data": "2026-09-23T21:58:02.114Z", "dia": "2026-09-23", "duracao_total": 1, "nome_divisao": "Peito e tríceps", "series_validas": 2, "id_diagnostico": "7b1e…", "score_geral": 52 }
  ]
}
```

- A ordem é **ASC** (a mais antiga primeiro), o contrário da lista antiga. No
  calendário, os cards de um dia com dois treinos aparecem em ordem de horário.
- A sessão de hoje tem `series_validas: 2`, e não 4: o aquecimento e o feeder
  do 5.8 não contam.
- O `score_geral` da sessão antiga pode não ser 58. Ele foi calculado **quando
  ela ainda era de hoje**, com o volume da semana daquele momento. É o
  comportamento certo: o diagnóstico é uma foto (D14) e não é recalculado
  quando o dado muda.
- Se existir um treino **aberto**, ele **não** aparece (D18-1).
- `data` com `T…Z` e `dia` podem parecer de dias diferentes (ex.: um treino às
  22h de Brasília vira `01:00Z` do dia seguinte). O calendário usa **só** o
  `dia`, que vem do banco.

### 17.3 — Variações do `?mes`

| URL | Resposta |
|---|---|
| `{{baseUrl}}/history/sessions` | `200`, igual ao 17.2 (sem parâmetro = mês atual) |
| `{{baseUrl}}/history/sessions?mes=2020-01` | `200 { "primeira_sessao": "2026-09-09", "sessoes": [] }`: mês vazio, mas a `primeira_sessao` continua lá |
| `{{baseUrl}}/history/sessions?mes=2026-13` | `400 { "erro": "mes precisa estar no formato AAAA-MM" }` |
| `{{baseUrl}}/history/sessions?mes=2026-9` | `400` |
| `{{baseUrl}}/history/sessions?mes=2026-09-01` | `400` |
| `{{baseUrl}}/history/sessions?mes=abc` | `400` |

### 17.4 — `GET {{baseUrl}}/history/sessions/{{idSessaoHoje}}` (detalhe)

```js
pm.test('detalhe 200', () => pm.response.to.have.status(200));
const { sessao, exercicios, diagnostico } = pm.response.json();
pm.test('é a sessão pedida', () => pm.expect(sessao.id_treino).to.eql(pm.environment.get('idSessaoHoje')));
pm.test('um exercício, com as 4 séries na ordem de registro', () => {
  pm.expect(exercicios.length).to.eql(1);
  pm.expect(exercicios[0].series.map(s => s.tipo)).to.eql(['aquecimento', 'feeder', 'work', 'work']);
});
pm.test('resumo D17 (só work)', () => pm.expect(exercicios[0].resumo).to.eql(
  { series_validas: 2, carga_maxima: 80, reps_carga_maxima: 8, tonelagem: 1200 }
));
pm.test('carga é number, não string', () => pm.expect(exercicios[0].series[0].carga).to.be.a('number'));
pm.test('traz o diagnóstico do Passo 5', () => pm.expect(diagnostico).to.not.eql(null));
```

Esperado (cortado):

```json
{
  "sessao": { "id_treino": "…", "data": "2026-09-23T21:58:02.114Z", "dia": "2026-09-23", "duracao_total": 1, "nome_divisao": "Peito e tríceps", "series_validas": 2, "id_diagnostico": "7b1e…", "score_geral": 52 },
  "exercicios": [
    {
      "id_exercicio": 1,
      "nome_exercicio": "Supino Reto com Barra",
      "nome_grupamento": "Peito",
      "resumo": { "series_validas": 2, "carga_maxima": 80, "reps_carga_maxima": 8, "tonelagem": 1200 },
      "series": [
        { "id_serie": 54, "tipo": "aquecimento", "carga": 40, "repeticoes": 12, "rir": null },
        { "id_serie": 55, "tipo": "feeder", "carga": 60, "repeticoes": 5, "rir": null },
        { "id_serie": 56, "tipo": "work", "carga": 80, "repeticoes": 8, "rir": 1 },
        { "id_serie": 57, "tipo": "work", "carga": 80, "repeticoes": 7, "rir": 2 }
      ]
    }
  ],
  "diagnostico": { "id_diagnostico": "7b1e…", "fk_treino": "…", "score_geral": 52, "data_geracao": "…", "conteudo_json": { … } }
}
```

- [ ] Conta à mão: `tonelagem = 80×8 + 80×7 = 640 + 560 = 1200`. A série mais
  pesada empata em 80 kg, e fica a de **mais reps** (8, não 7).
- [ ] `GET {{baseUrl}}/history/sessions/{{idSessao75}}` → `200` com
  `"diagnostico": null` e `resumo` `{ 2, 75, 8, 1200 }`.
- [ ] `GET {{baseUrl}}/history/sessions/abc` → `404 { "erro": "Recurso não
  encontrado" }` (`validarUuid`).
- [ ] **Treino aberto não tem detalhe, e o caso da D16 na tela:** `POST
  {{baseUrl}}/sessions/start` → `GET {{baseUrl}}/history/sessions/{{idTreino}}`
  → `404 { "erro": "Sessão não encontrada" }`. Depois registre **só** um
  aquecimento nele e finalize (sem `generate`, que daria 400):

```json
{ "fk_exercicio": {{idExercicio}}, "tipo": "aquecimento", "carga": 40, "repeticoes": 12 }
```

  Repita o `GET …/history/sessions/{{idTreino}}`: agora dá `200`, com
  `series_validas: 0`, `resumo: null` e `diagnostico: null`. **A partir daqui,
  hoje tem duas sessões** (a do Passo 5 e esta). É o caso "mais de um treino no
  dia" do calendário, e esta sessão é a que mostra "sem séries válidas para
  avaliar" na tela. O 17.2, se for rodado de novo, passa a mostrar 4.

### 17.5 — `GET {{baseUrl}}/history/exercises`

```js
pm.test('exercícios 200', () => pm.response.to.have.status(200));
const ex = pm.response.json().exercicios;
pm.test('só o supino (único com série work)', () => pm.expect(ex.map(e => e.id_exercicio)).to.eql([Number(pm.environment.get('idExercicio'))]));
```

Esperado: `200 { "exercicios": [ { "id_exercicio": 1, "nome_exercicio": "Supino Reto com Barra", "nome_grupamento": "Peito" } ] }`.

### 17.6 — `GET {{baseUrl}}/history/exercises/{{idExercicio}}/load-progression`

```js
pm.test('progressão 200', () => pm.response.to.have.status(200));
const p = pm.response.json().progressao;
pm.test('ordem cronológica, maior carga por sessão (D17)', () => pm.expect(p.map(x => x.carga_maxima)).to.eql([70, 75, 80]));
pm.test('reps da série mais pesada', () => pm.expect(p.map(x => x.reps_carga_maxima)).to.eql([10, 8, 8]));
pm.test('tonelagem = soma de carga x reps das work', () => pm.expect(p.map(x => x.tonelagem)).to.eql([1330, 1200, 1200]));
pm.test('carga é number, não string', () => pm.expect(p[0].carga_maxima).to.be.a('number'));
```

Esperado:

```json
{
  "progressao": [
    { "id_treino": "…", "data": "2026-09-09T22:02:13.370Z", "series_validas": 2, "carga_maxima": 70, "reps_carga_maxima": 10, "tonelagem": 1330 },
    { "id_treino": "…", "data": "2026-09-16T22:04:51.800Z", "series_validas": 2, "carga_maxima": 75, "reps_carga_maxima": 8, "tonelagem": 1200 },
    { "id_treino": "…", "data": "2026-09-23T21:58:02.114Z", "series_validas": 2, "carga_maxima": 80, "reps_carga_maxima": 8, "tonelagem": 1200 }
  ]
}
```

- [ ] Conta à mão da primeira: `70×10 + 70×9 = 700 + 630 = 1330`.
- [ ] A sessão só de aquecimento do 17.4 **não** vira ponto, e o aquecimento
  de 40 kg e o feeder de 60 kg de hoje não mexem no máximo. Para ver a D17 de
  verdade, registre num treino aberto um **aquecimento de 100 kg** e confira
  que o ponto de hoje continua 80.
- [ ] O último ponto tem que ser **idêntico** ao `resumo` do 17.4 (tirando
  `id_treino` e `data`). É a mesma subconsulta (`RESUMO_SERIES_WORK`).
- [ ] Negativos: `…/history/exercises/abc/load-progression` → `400 { "erro":
  "id do exercicio invalido" }`; `…/history/exercises/999/load-progression` →
  `200 { "progressao": [] }`.

### 17.7 — `GET {{baseUrl}}/history/weekly-volume`

```js
pm.test('volume histórico 200', () => pm.response.to.have.status(200));
const h = pm.response.json().historico;
pm.test('8 semanas por padrão (D18)', () => pm.expect(h.length).to.eql(8));
pm.test('todo grupamento em toda semana', () => h.forEach(s => pm.expect(s.grupamentos.length).to.eql(7)));
const peito = h.map(s => s.grupamentos.find(g => g.nome_grupamento === 'Peito').series_validas);
pm.test('Peito: 2 nesta, 2 na passada, 2 na retrasada', () => pm.expect(peito.slice(0, 3)).to.eql([2, 2, 2]));
```

Esperado (cortado; são 8 semanas × 7 grupamentos):

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
  `YYYY-MM-DD`, nunca com `T…Z`. (O calendário começa no domingo, mas isso é
  só a grade visual. A semana do volume continua de segunda a domingo.)
- [ ] Variações do parâmetro:

| URL | Resposta |
|---|---|
| `{{baseUrl}}/history/weekly-volume?semanas=3` | `200`, `historico.length === 3` |
| `{{baseUrl}}/history/weekly-volume?semanas=26` | `200`, 26 semanas |
| `{{baseUrl}}/history/weekly-volume?semanas=0` | `400 { "erro": "semanas precisa ser um inteiro entre 1 e 26" }` |
| `{{baseUrl}}/history/weekly-volume?semanas=27` | `400` |
| `{{baseUrl}}/history/weekly-volume?semanas=abc` | `400` |

- [ ] Compare o `historico[0]` com o `volume` de `GET
  {{baseUrl}}/metrics/weekly-volume`: têm que ser **idênticos**, campo a campo.

### 17.8 — D14 na prática (diagnóstico refeito)

- [ ] `POST {{baseUrl}}/sessions/{{idSessaoHoje}}/diagnostics/generate` de novo
  (atenção: o `{{idTreino}}` agora é o da sessão só de aquecimento, por isso o
  id vem do `idSessaoHoje` que o 17.2 guardou).
- [ ] `GET {{baseUrl}}/history/sessions?mes={{mesAtual}}`: a sessão de hoje
  aparece **uma vez só** (o `LATERAL … LIMIT 1` não duplica), com o
  `id_diagnostico` do **novo**.
- [ ] `GET {{baseUrl}}/history/sessions/{{idSessaoHoje}}`: o `diagnostico` é o
  novo. O antigo continua gravado no banco (`SELECT COUNT(*) FROM DiagnosticoIA
  WHERE fk_treino = '…'` → 2), só não é o que a tela mostra.

### 17.9 — Isolamento entre usuários

- [ ] Registre e logue um segundo usuário (`postman.outro@teste.com`). Com o
  token dele:
  - `GET …/history/sessions` → `200 { "primeira_sessao": null, "sessoes": [] }`
  - `GET …/history/sessions/{{idSessaoHoje}}` → `404` (a sessão existe, mas
    não é dele)
  - `GET …/history/exercises` → `{ "exercicios": [] }`
  - `GET …/history/exercises/{{idExercicio}}/load-progression` com o id do
    supino que o primeiro usuário treinou → `{ "progressao": [] }`
  - `GET …/history/weekly-volume` → 8 semanas zeradas

### 17.10 — Conferir no banco (cálculo manual)

- [ ] Pegue o UUID do usuário com `GET {{baseUrl}}/me` e confira a progressão
  inteira, com a mesma conta do `RESUMO_SERIES_WORK`:

```sql
SELECT t.data::date,
       COUNT(*) AS series_validas,
       MAX(s.carga) AS carga_maxima,
       (ARRAY_AGG(s.repeticoes ORDER BY s.carga DESC, s.repeticoes DESC))[1] AS reps_carga_maxima,
       SUM(s.carga * s.repeticoes) AS tonelagem
FROM SerieTreino s
JOIN Treino t ON t.id_treino = s.fk_treino
WHERE s.tipo = 'work'
  AND t.fk_usuario = '<uuid>'
  AND s.fk_exercicio = <idExercicio>
GROUP BY t.id_treino, t.data
ORDER BY t.data;
```

- [ ] (Opcional) Na coleção, use **Run collection** com as requisições na ordem
  5.3 → 5.12 → 17.2 → 17.8. O Collection Runner mostra todos os `pm.test`
  verdes de uma vez. Os passos com `UPDATE` no banco ficam fora do runner.

### Passo 18 — `server/src/__tests__/history.test.ts` (novo)

- [ ] Não mexe no `testHelpers.ts`: o `registrarComTreinoAberto` já dá usuário
  novo + divisão de hoje + exercício + treino aberto. Cada teste cria o próprio
  usuário, então um não interfere no outro.
- [ ] O helper `registrarSerie` local recebe `repeticoes` (padrão 8), porque os
  testes da D17 precisam de reps diferentes para testar o desempate e a
  tonelagem.
- [ ] Os testes que mais valem são os de **duas consultas para a mesma regra**:
  (1) semana atual do histórico == `/metrics/weekly-volume`; (2) ponto da
  progressão == resumo do detalhe. São eles que acusam quando uma consulta
  muda e a outra não.
- [ ] O mês é testado **sem depender da data de hoje**: o teste pega o `dia`
  que o próprio backend devolveu (`sessao.dia.slice(0, 7)`) e pede esse mês
  explicitamente. Nunca calcula o mês com `new Date()` no teste, porque perto
  da meia-noite do dia 1 o teste e o banco podem discordar.
- [ ] São 16 testes. `npm run test` → **62/62** (46 da Parte 1 + 16 deste
  arquivo), com `GEMINI_MOCK=true` (o teste de D14 gera diagnóstico).

Código completo:

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
  carga: number,
  repeticoes = 8
) {
  await request(app)
    .post(`/sessions/${idTreino}/sets`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      fk_exercicio: fkExercicio,
      tipo,
      carga,
      repeticoes,
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


//============================ sessoes do mes (D18) ============================

test('GET /history/sessions sem token retorna 401', async () => {
  const resposta = await request(app).get('/history/sessions');
  assert.equal(resposta.status, 401);
});


test('sessões do mês: só treino finalizado, series_validas só work, dia em texto (D18)', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 60);
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 60);
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'aquecimento', 30);

  //treino aberto e assunto do "Treino de hoje", nao do historico
  const aberto = await buscar('/history/sessions', token);
  assert.equal(aberto.status, 200);
  assert.deepEqual(aberto.body.sessoes, []);
  assert.equal(aberto.body.primeira_sessao, null);

  await finalizar(token, idTreino);
  const resposta = await buscar('/history/sessions', token); //sem ?mes = mes atual
  assert.equal(resposta.status, 200);
  assert.equal(resposta.body.sessoes.length, 1);

  const sessao = resposta.body.sessoes[0];
  assert.equal(sessao.series_validas, 2);
  assert.equal(sessao.nome_divisao, 'Treino de hoje');
  assert.equal(sessao.id_diagnostico, null);
  assert.match(sessao.dia, /^\d{4}-\d{2}-\d{2}$/); //texto do to_char, sem T...Z
  assert.equal(resposta.body.primeira_sessao, sessao.dia);

  //o mesmo mes pedido explicitamente - o mes vem do backend, nao do relogio do teste
  const explicito = await buscar(`/history/sessions?mes=${sessao.dia.slice(0, 7)}`, token);
  assert.equal(explicito.body.sessoes.length, 1);
  assert.equal(explicito.body.sessoes[0].id_treino, idTreino);
});


test('sessões do mês: mês sem treino volta vazio, mas primeira_sessao continua', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 60);
  await finalizar(token, idTreino);

  const resposta = await buscar('/history/sessions?mes=2020-01', token);
  assert.equal(resposta.status, 200);
  assert.deepEqual(resposta.body.sessoes, []);
  assert.ok(resposta.body.primeira_sessao); //e ela que trava a seta de voltar do calendario
});


test('sessões do mês: mes fora do formato AAAA-MM retorna 400', async () => {
  const { token } = await registrarELogar();
  for (const valor of ['2026-13', '2026-9', '2026-09-01', 'abc']) {
    const resposta = await buscar(`/history/sessions?mes=${valor}`, token);
    assert.equal(resposta.status, 400, `mes=${valor}`);
  }
});


test('D14: gerar duas vezes - a sessão aparece uma vez só e aponta pro diagnóstico mais novo', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 60);
  await finalizar(token, idTreino);

  await gerarDiagnostico(token, idTreino);
  const segundo = await gerarDiagnostico(token, idTreino);
  const idMaisNovo = segundo.body.diagnostico.id_diagnostico;

  const sessoes = await buscar('/history/sessions', token);
  //um LEFT JOIN comum (sem LATERAL ... LIMIT 1) duplicaria a sessao aqui
  assert.equal(sessoes.body.sessoes.length, 1);
  assert.equal(sessoes.body.sessoes[0].id_diagnostico, idMaisNovo);
  assert.equal(sessoes.body.sessoes[0].series_validas, 1);

  const detalhe = await buscar(`/history/sessions/${idTreino}`, token);
  assert.equal(detalhe.body.diagnostico.id_diagnostico, idMaisNovo);
});


//============================ detalhe da sessao ============================

test('detalhe: séries agrupadas por exercício, com a preparação e o resumo D17', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  const id = exercicio.id_exercicio;
  await registrarSerie(token, idTreino, id, 'aquecimento', 40, 12);
  await registrarSerie(token, idTreino, id, 'work', 70, 8);
  await registrarSerie(token, idTreino, id, 'work', 70, 10);
  await registrarSerie(token, idTreino, id, 'work', 60, 12);
  await finalizar(token, idTreino);

  const resposta = await buscar(`/history/sessions/${idTreino}`, token);
  assert.equal(resposta.status, 200);
  assert.equal(resposta.body.sessao.id_treino, idTreino);
  assert.equal(resposta.body.diagnostico, null);
  assert.equal(resposta.body.exercicios.length, 1);

  const ex = resposta.body.exercicios[0];
  //a preparacao tambem vem, na ordem de registro - a tela e que separa por tipo
  assert.deepEqual(
    ex.series.map((s: { tipo: string }) => s.tipo),
    ['aquecimento', 'work', 'work', 'work']
  );
  //empate em 70 kg: fica a de mais reps (10). tonelagem = 70x8 + 70x10 + 60x12
  assert.deepEqual(ex.resumo, {
    series_validas: 3,
    carga_maxima: 70,
    reps_carga_maxima: 10,
    tonelagem: 1980,
  });
});


test('detalhe: sessão só com preparação vem com resumo null e series_validas 0', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'aquecimento', 40, 12);
  await finalizar(token, idTreino);

  const resposta = await buscar(`/history/sessions/${idTreino}`, token);
  assert.equal(resposta.status, 200);
  assert.equal(resposta.body.sessao.series_validas, 0);
  assert.equal(resposta.body.exercicios[0].resumo, null);
  assert.equal(resposta.body.exercicios[0].series.length, 1);
});


test('detalhe: treino aberto, de outro usuário ou id malformado dão 404', async () => {
  const { token, idTreino } = await registrarComTreinoAberto();

  const aberto = await buscar(`/history/sessions/${idTreino}`, token);
  assert.equal(aberto.status, 404); //historico e so treino finalizado (D18)

  await finalizar(token, idTreino);
  const outro = await registrarELogar();
  const alheio = await buscar(`/history/sessions/${idTreino}`, outro.token);
  assert.equal(alheio.status, 404);

  const malformado = await buscar('/history/sessions/abc', token);
  assert.equal(malformado.status, 404); //validarUuid (Passo 2) - sem ele seria 500
});


//============================ progressao (D17) ============================

test('progressão: um ponto por sessão com o resumo D17; aquecimento pesado não conta', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 60, 12);
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 70, 8);
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'aquecimento', 100, 5);

  const resposta = await buscar(`/history/exercises/${exercicio.id_exercicio}/load-progression`, token);
  assert.equal(resposta.status, 200);
  assert.equal(resposta.body.progressao.length, 1);

  const ponto = resposta.body.progressao[0];
  //number, nao '70': sem o ::float o NUMERIC voltaria string
  assert.equal(ponto.carga_maxima, 70);
  assert.equal(ponto.reps_carga_maxima, 8);
  assert.equal(ponto.series_validas, 2);
  assert.equal(ponto.tonelagem, 60 * 12 + 70 * 8); //1280 - os 100 kg de aquecimento ficam de fora
});


test('progressão e detalhe mostram os mesmos números pra mesma sessão (uma régua só, D17)', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 80, 6);
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 80, 8);
  await finalizar(token, idTreino);

  const progressao = await buscar(`/history/exercises/${exercicio.id_exercicio}/load-progression`, token);
  const detalhe = await buscar(`/history/sessions/${idTreino}`, token);

  const p = progressao.body.progressao[0];
  assert.deepEqual(detalhe.body.exercicios[0].resumo, {
    series_validas: p.series_validas,
    carga_maxima: p.carga_maxima,
    reps_carga_maxima: p.reps_carga_maxima,
    tonelagem: p.tonelagem,
  });
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
  assert.deepEqual(sessoes.body, { primeira_sessao: null, sessoes: [] });
});


//============================ volume (D18) ============================

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

- [ ] `npm run test` → **62/62**.

### Passo 19 — `client/src/services/api.ts` (acrescentar no fim)

- [ ] Espelho dos tipos do Passo 11. O volume histórico reusa o `VolumeSemanal`
  que já existe desde a S6, e o `DetalheSessao` reusa o `DiagnosticoIA` do
  Passo 6 e o `TipoSerie` que já existe.
- [ ] `buscarSessoesDoMes(mes)`: o front **sempre** manda o mês. O padrão "mês
  atual" do backend fica para quem chama a API sem a tela (Postman).
- [ ] Sai o `buscarDiagnosticosAnteriores` (D18-3 reescrita).
- [ ] Instale a biblioteca de gráfico do próprio MUI (já é a UI do projeto,
  herda o tema e tem licença MIT): `npm install @mui/x-charts` dentro de
  `client/`.

Código completo do bloco (colar no fim do arquivo):

```ts
//============================historico (RF07)===========================

export interface SessaoHistorico {
    id_treino: string;
    data: string; //timestamp com Z - so pra mostrar a hora
    dia: string; //'YYYY-MM-DD' do banco - posiciona no calendario (nunca new Date nele)
    duracao_total: number | null;
    nome_divisao: string | null;
    series_validas: number;
    id_diagnostico: string | null; //o mais recente da sessao (D14)
    score_geral: number | null;
}

export interface SessoesDoMes {
    primeira_sessao: string | null; //'YYYY-MM-DD' do primeiro treino finalizado
    sessoes: SessaoHistorico[];
}

export interface ExercicioTreinado {
    id_exercicio: number;
    nome_exercicio: string;
    nome_grupamento: string;
}

//D17: mesmos numeros no grafico e no detalhe
export interface ResumoSeriesValidas {
    series_validas: number;
    carga_maxima: number;
    reps_carga_maxima: number;
    tonelagem: number; //soma de carga x reps - nao e "volume" (volume = series/semana)
}

export interface PontoProgressaoCarga extends ResumoSeriesValidas {
    id_treino: string;
    data: string;
}

export interface SerieDaSessao {
    id_serie: number;
    tipo: TipoSerie;
    carga: number;
    repeticoes: number;
    rir: number | null;
}

export interface ExercicioDaSessao {
    id_exercicio: number;
    nome_exercicio: string;
    nome_grupamento: string;
    resumo: ResumoSeriesValidas | null; //null = so preparacao
    series: SerieDaSessao[];
}

export interface DetalheSessao {
    sessao: SessaoHistorico;
    exercicios: ExercicioDaSessao[];
    diagnostico: DiagnosticoIA | null;
}

//mes = 'AAAA-MM'
export function buscarSessoesDoMes(mes: string) {
    return apiFetch(`/history/sessions?mes=${mes}`) as Promise<SessoesDoMes>;
}

export function buscarDetalheSessao(idTreino: string) {
    return apiFetch(`/history/sessions/${idTreino}`) as Promise<DetalheSessao>;
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
```

### Passo 20 — `SessionDetail.tsx` + `HistoryView.tsx` (novos)

São dois arquivos. O detalhe da sessão fica num componente próprio, porque é
uma tela inteira (séries, tabelas, avaliação) e deixaria a `HistoryView`
enorme.

#### 20.1 — `client/src/components/SessionDetail.tsx` (novo)

É o que abre ao tocar no treino do dia no calendário: primeiro **os registros**
(o treino), depois **a avaliação da IA**. A imagem de referência vale pela
estrutura. O conteúdo é o que o sistema grava.

- [ ] **Cabeçalho:** seta ← (volta ao calendário), nome da divisão, data e hora,
  duração.
- [ ] **Exercícios:** um card por exercício, na ordem em que foram feitos.
  - Linha-resumo: `2 séries válidas · Mais pesada: 80 kg × 8 · Tonelagem:
    1.200 kg`. Os números vêm prontos no `resumo` (RNF03). A tela **não soma
    nada**.
  - Sem `resumo` (só preparação): "Só preparação — nenhuma série válida".
  - Tabela **Séries válidas** (#, Carga, Reps, RIR) e tabela **Preparação**
    (#, Carga, Reps, Tipo), essa só quando houver. Separar por `tipo` é só
    apresentação: a regra de "válida" já foi aplicada no backend.
  - **Sem coluna de descanso**: o sistema não grava tempo entre séries, e fica
    assim.
- [ ] **Avaliação da IA**, três casos:
  - com diagnóstico → `DiagnosticContent` (Passo 7), sem mudar o formato;
  - sem diagnóstico e **com** série válida → botão **"Avaliar treino"**. É a
    segunda porta da D16: cobre quem saiu da tela antes de avaliar, ou tomou
    502. Com erro, a mensagem aparece e o botão continua lá para tentar de
    novo;
  - sem série válida → texto "Treino salvo sem séries válidas, então não há o
    que avaliar." **Sem botão**: a IA só avalia série válida (D16, confirmado
    em 25/09).
- [ ] `versao` é um contador: somar 1 refaz o `useEffect` e recarrega o detalhe
  (depois de avaliar). É o mesmo efeito de chamar o carregamento de novo, sem
  duplicar a função fora do efeito.
- [ ] `ativo` no efeito: se a pessoa volta e abre outra sessão rápido, a
  resposta atrasada da anterior não sobrescreve a atual (o mesmo padrão da aba
  Cargas).
- [ ] Número em pt-BR com `toLocaleString('pt-BR')`: 72.5 vira "72,5" e 1980
  vira "1.980".

Código completo:

```tsx
import { useEffect, useState } from 'react';
import {
  Box, Button, Card, CardContent, Chip, IconButton, Stack, Table, TableBody,
  TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InsightsIcon from '@mui/icons-material/Insights';
import * as api from '../services/api';
import { FeedbackAlert } from './FeedbackAlert';
import { DiagnosticContent } from './DiagnosticContent';

//detalhe de UMA sessao finalizada: os registros (treino) e embaixo a avaliacao da IA.
//abre ao tocar no treino do dia no calendario (D18)

//72.5 -> "72,5"; 1980 -> "1.980"
function formatarNumero(valor: number) {
  return valor.toLocaleString('pt-BR');
}

//timestamp do Treino (UTC, com Z): new Date converte pro fuso local
function formatarDataHora(timestamp: string) {
  return new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ROTULO_TIPO: Record<api.TipoSerie, string> = {
  aquecimento: 'Aquecimento',
  feeder: 'Feeder',
  work: 'Válida',
};

function TabelaSeries({
  titulo,
  series,
  variante,
}: {
  titulo: string;
  series: api.SerieDaSessao[];
  variante: 'validas' | 'preparacao';
}) {
  return (
    <Box>
      <Typography
        variant="overline"
        sx={{ fontWeight: 700, color: variante === 'validas' ? 'primary.main' : 'text.secondary' }}
      >
        {titulo}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Carga</TableCell>
            <TableCell>Reps</TableCell>
            <TableCell>{variante === 'validas' ? 'RIR' : 'Tipo'}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {series.map((s, i) => (
            <TableRow key={s.id_serie}>
              <TableCell>{i + 1}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{formatarNumero(s.carga)} kg</TableCell>
              <TableCell>{s.repeticoes}</TableCell>
              <TableCell>{variante === 'validas' ? s.rir : ROTULO_TIPO[s.tipo]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

function CardExercicio({ exercicio }: { exercicio: api.ExercicioDaSessao }) {
  const { resumo, series } = exercicio;
  //separar por tipo e so apresentacao: o que e "valida" o backend ja decidiu,
  //e o resumo chegou pronto (RNF03) - a tela nao soma nada
  const validas = series.filter((s) => s.tipo === 'work');
  const preparacao = series.filter((s) => s.tipo !== 'work');

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Typography sx={{ fontWeight: 700 }}>{exercicio.nome_exercicio}</Typography>
            <Chip size="small" variant="outlined" label={exercicio.nome_grupamento} />
          </Stack>

          <Typography variant="body2" color="text.secondary">
            {resumo
              ? `${resumo.series_validas} séries válidas · Mais pesada: ${formatarNumero(resumo.carga_maxima)} kg × ${resumo.reps_carga_maxima} · Tonelagem: ${formatarNumero(resumo.tonelagem)} kg`
              : 'Só preparação — nenhuma série válida'}
          </Typography>

          {validas.length > 0 && <TabelaSeries titulo="Séries válidas" series={validas} variante="validas" />}
          {preparacao.length > 0 && <TabelaSeries titulo="Preparação" series={preparacao} variante="preparacao" />}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function SessionDetail({ idTreino, onVoltar }: { idTreino: string; onVoltar: () => void }) {
  const [detalhe, setDetalhe] = useState<api.DetalheSessao | null>(null);
  const [versao, setVersao] = useState(0); //somar 1 recarrega o detalhe
  const [avaliando, setAvaliando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    //voltar e abrir outra sessao rapido: a resposta atrasada da anterior nao sobrescreve
    let ativo = true;

    async function carregar() {
      try {
        const resposta = await api.buscarDetalheSessao(idTreino);
        if (ativo) setDetalhe(resposta);
      } catch (erro) {
        if (ativo) setErro(erro instanceof Error ? erro.message : 'Erro ao carregar a sessão');
      }
    }
    carregar();
    return () => {
      ativo = false;
    };
  }, [idTreino, versao]);

  //segunda porta da D16: sessao que ficou sem diagnostico (saiu da tela antes, ou 502)
  async function avaliar() {
    setErro('');
    setAvaliando(true);
    try {
      await api.gerarDiagnostico(idTreino);
      setVersao((v) => v + 1); //recarrega, agora com o diagnostico
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : 'Erro ao avaliar o treino');
    } finally {
      setAvaliando(false);
    }
  }

  const voltar = (
    <IconButton onClick={onVoltar} aria-label="Voltar ao calendário" edge="start">
      <ArrowBackIcon />
    </IconButton>
  );

  if (!detalhe) {
    return (
      <Stack spacing={2}>
        {voltar}
        {erro ? <FeedbackAlert erro={erro} /> : <Typography>Carregando...</Typography>}
      </Stack>
    );
  }

  const { sessao, exercicios, diagnostico } = detalhe;

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} alignItems="center">
        {voltar}
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontFamily: '"Sora", sans-serif', fontWeight: 700, fontSize: '1.2rem' }}>
            {sessao.nome_divisao ?? 'Sem divisão'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatarDataHora(sessao.data)}
            {sessao.duracao_total !== null ? ` · ${sessao.duracao_total} min` : ''}
          </Typography>
        </Box>
      </Stack>

      {/* 1) os registros: o que foi feito */}
      <Stack spacing={1.5}>
        <Typography sx={{ fontWeight: 700 }}>Exercícios</Typography>
        {exercicios.length === 0 ? (
          <Typography color="text.secondary">Nenhuma série registrada nesta sessão.</Typography>
        ) : (
          exercicios.map((e) => <CardExercicio key={e.id_exercicio} exercicio={e} />)
        )}
      </Stack>

      {/* 2) embaixo, a avaliacao da IA */}
      <Stack spacing={1.5}>
        <Typography sx={{ fontWeight: 700 }}>Avaliação da IA</Typography>
        <FeedbackAlert erro={erro} />

        {diagnostico ? (
          <DiagnosticContent diagnostico={diagnostico} />
        ) : sessao.series_validas > 0 ? (
          <Button
            variant="contained"
            startIcon={<InsightsIcon />}
            onClick={avaliar}
            disabled={avaliando}
            sx={{ alignSelf: 'flex-start' }}
          >
            {avaliando ? 'Analisando a sessão…' : 'Avaliar treino'}
          </Button>
        ) : (
          //D16: sem serie valida a IA nao avalia - nem oferece o botao
          <Typography color="text.secondary">
            Treino salvo sem séries válidas, então não há o que avaliar.
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}
```

#### 20.2 — `client/src/views/HistoryView.tsx` (novo)

Três abas, as três coisas do RF07: **Cargas** (progressão), **Volume**
(semanal) e **Sessões** (o calendário, por onde se chega aos diagnósticos
anteriores). Cada aba é um componente no mesmo arquivo e só carrega o próprio
dado quando é aberta.

**Aba Cargas (D17):**
- [ ] O eixo x é o **índice** da sessão, e a data só aparece no rótulo
  (`valueFormatter`). Com a data direto no eixo, duas sessões no mesmo dia
  virariam uma categoria só no `scaleType: 'point'`, e um ponto sumiria.
- [ ] A linha é a `carga_maxima`. O **tooltip** de cada ponto mostra `80 kg × 8
  · 2 séries · tonelagem 1.200 kg`: o `valueFormatter` da série recebe o
  `dataIndex` e lê o resto do ponto. Não é uma segunda linha, porque a escala
  é diferente.

**Aba Volume (D18-2):**
- [ ] Um chip por grupamento: cheio quando teve série, contornado quando zerou,
  verde quando `atingiu_limiar`. O booleano vem pronto do backend (RNF03), e a
  tela não compara nada.

**Aba Sessões = calendário (D18-3):**
- [ ] **Mês a mês** com as setas ‹ ›. A ‹ fica desabilitada no mês da
  `primeira_sessao` (ninguém navega até 2019 para ver meses vazios), e a ›
  no mês atual.
- [ ] Nome do mês em pt-BR (`setembro de 2026`) com `toLocaleDateString`.
- [ ] **Semana começa no domingo** (`dom … sáb`), como no calendário brasileiro
  comum. É só a grade visual: o volume (D10) continua de segunda a domingo.
- [ ] A grade é um CSS grid de 7 colunas. `new Date(ano, mes - 1, 1).getDay()`
  diz quantas células vazias vêm antes do dia 1 (0 = domingo), e `new
  Date(ano, mes, 0).getDate()` dá o último dia do mês (o dia 0 do mês seguinte).
  Os dois usam o **construtor numérico**, que é local, sem armadilha de fuso.
- [ ] **Ponto no dia** com treino, colorido pela faixa do score (a mesma do
  círculo do diagnóstico): verde ≥ 70, amarelo 40–69, vermelho < 40, **cinza**
  sem diagnóstico. Dia com mais de um treino tem **um** ponto, com a cor do
  mais recente do dia.
- [ ] **Hoje:** contorno no número. **Dia selecionado:** preenchido com a cor
  primária.
- [ ] **Ao abrir a aba ou trocar de mês:** o treino mais recente do mês já vem
  selecionado, com o card embaixo. Mês sem treino: nada selecionado e o texto
  "Nenhum treino finalizado neste mês".
- [ ] **Tocar num dia** mostra embaixo **um card por sessão**, em ordem de
  horário (selo do score, divisão, hora, séries válidas, duração). Dia sem
  treino também dá para tocar e mostra "Nenhum treino neste dia".
- [ ] **Tocar no card** abre o `SessionDetail` **no lugar** do calendário,
  dentro da mesma aba (estado `aberta`; sem router, D7). Ao voltar, o mês é
  recarregado (`recarga + 1`), então se a pessoa avaliou o treino lá dentro, o
  ponto do dia já volta com a cor nova. O dia selecionado é mantido.
- [ ] **Sem os cards de métricas** das imagens (treinos no mês, score médio,
  volume do mês) e **sem o gráfico de frequência**: ficou decidido que não
  entram.
- [ ] Datas, três funções diferentes **de propósito**:
  - `semana_referencia` e `dia` são texto `YYYY-MM-DD`: comparar como texto,
    ou `split` para montar com o construtor numérico. **Nunca** `new
    Date('2026-09-18')`, que vira UTC e mostra o dia anterior (armadilha da
    S6);
  - `data` do treino é timestamp com `Z`: aí **sim** `new Date`, que converte
    para o fuso local (só para a hora do card);
  - o mês e o dia "de hoje" no front saem de `new Date()` com
    `getFullYear/getMonth/getDate`, que são locais.
- [ ] `corDoScore` vem exportado do `DiagnosticContent` (Passo 7). É a mesma
  faixa do círculo, uma fonte só.

Código completo:

```tsx
import { useEffect, useState } from 'react';
import {
  Box, ButtonBase, Card, CardActionArea, CardContent, Chip, IconButton, MenuItem,
  Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { LineChart } from '@mui/x-charts/LineChart';
import * as api from '../services/api';
import { FeedbackAlert } from '../components/FeedbackAlert';
import { corDoScore } from '../components/DiagnosticContent';
import { SessionDetail } from '../components/SessionDetail';

type Aba = 'cargas' | 'volume' | 'sessoes';

//============================ datas ============================

function doisDigitos(n: number) {
  return String(n).padStart(2, '0');
}

//'AAAA-MM' e 'AAAA-MM-DD' pelo relogio LOCAL - mesma forma do to_char do backend
function mesDe(data: Date) {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}`;
}
function diaDe(data: Date) {
  return `${mesDe(data)}-${doisDigitos(data.getDate())}`;
}

//soma meses em 'AAAA-MM' pelo construtor numerico (local): new Date(2026, 12, 1) vira jan/2027 sozinho
function somarMes(mes: string, delta: number) {
  const [ano, numero] = mes.split('-').map(Number);
  return mesDe(new Date(ano, numero - 1 + delta, 1));
}

//'2026-09' -> "setembro de 2026"
function nomeDoMes(mes: string) {
  const [ano, numero] = mes.split('-').map(Number);
  return new Date(ano, numero - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

//'2026-09-18' -> "sexta-feira, 18 de setembro" - split + construtor numerico, nunca new Date(texto)
function nomeDoDia(dia: string) {
  const [ano, mes, numero] = dia.split('-').map(Number);
  return new Date(ano, mes - 1, numero).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

//'YYYY-MM-DD' da semana do volume: split, nunca new Date - viraria UTC e voltaria um dia
function formatarDia(iso: string) {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

//timestamp do Treino (UTC, com Z): new Date converte pro fuso local
function formatarData(timestamp: string) {
  return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
function formatarHora(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

//faixa do score (a mesma do circulo do diagnostico); cinza = sessao sem diagnostico
function corDaSessao(score: number | null) {
  return score === null ? 'grey.400' : `${corDoScore(score)}.main`;
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
            //tooltip com o resto da D17: reps da mais pesada, series e tonelagem.
            //tudo pronto do backend - a tela so formata
            valueFormatter: (valor, { dataIndex }) => {
              const p = progressao[dataIndex];
              return `${valor} kg × ${p.reps_carga_maxima} · ${p.series_validas} séries · `
                + `tonelagem ${p.tonelagem.toLocaleString('pt-BR')} kg`;
            },
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


//================ sessoes: calendario + diagnosticos anteriores (D18) ================

const DIAS_DA_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']; //comeca no domingo

function AbaSessoes() {
  const hoje = diaDe(new Date());
  const mesAtual = hoje.slice(0, 7);

  const [mes, setMes] = useState(mesAtual);
  const [dados, setDados] = useState<api.SessoesDoMes | null>(null);
  const [dia, setDia] = useState<string | null>(null);
  const [aberta, setAberta] = useState<string | null>(null); //id_treino no detalhe
  const [recarga, setRecarga] = useState(0); //somar 1 recarrega o mes
  const [erro, setErro] = useState('');

  useEffect(() => {
    //trocar de mes rapido: a resposta atrasada do anterior nao sobrescreve
    let ativo = true;

    async function carregar() {
      try {
        const resposta = await api.buscarSessoesDoMes(mes);
        if (!ativo) return;
        setDados(resposta);
        //dia ja selecionado neste mes (voltou do detalhe): mantem.
        //senao, o treino mais recente do mes - ou nada, se o mes esta vazio
        setDia((atual) =>
          atual?.startsWith(mes) ? atual : (resposta.sessoes.at(-1)?.dia ?? null)
        );
      } catch (erro) {
        if (ativo) setErro(erro instanceof Error ? erro.message : 'Erro ao carregar as sessões');
      }
    }
    carregar();
    return () => {
      ativo = false;
    };
  }, [mes, recarga]);

  if (aberta) {
    return (
      <SessionDetail
        idTreino={aberta}
        onVoltar={() => {
          setAberta(null);
          setRecarga((r) => r + 1); //se avaliou la dentro, o ponto do dia muda de cor
        }}
      />
    );
  }

  if (!dados) {
    return erro ? <FeedbackAlert erro={erro} /> : <Typography>Carregando...</Typography>;
  }

  //sessoes por dia ('YYYY-MM-DD' do banco); ja vem em ordem de horario (ASC)
  const porDia = new Map<string, api.SessaoHistorico[]>();
  for (const s of dados.sessoes) {
    porDia.set(s.dia, [...(porDia.get(s.dia) ?? []), s]);
  }

  const [ano, numeroMes] = mes.split('-').map(Number);
  const vaziasAntes = new Date(ano, numeroMes - 1, 1).getDay(); //0 = domingo
  const diasNoMes = new Date(ano, numeroMes, 0).getDate(); //dia 0 do mes seguinte = ultimo deste
  const celulas: (string | null)[] = [
    ...Array.from({ length: vaziasAntes }, () => null),
    ...Array.from({ length: diasNoMes }, (_, i) => `${mes}-${doisDigitos(i + 1)}`),
  ];

  //'AAAA-MM' compara certo como texto
  const podeVoltar = dados.primeira_sessao !== null && mes > dados.primeira_sessao.slice(0, 7);
  const podeAvancar = mes < mesAtual;
  const sessoesDoDia = dia ? (porDia.get(dia) ?? []) : [];

  return (
    <Stack spacing={3}>
      <FeedbackAlert erro={erro} />

      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <IconButton onClick={() => setMes(somarMes(mes, -1))} disabled={!podeVoltar} aria-label="Mês anterior">
            <ChevronLeftIcon />
          </IconButton>
          <Typography sx={{ fontWeight: 700 }}>{nomeDoMes(mes)}</Typography>
          <IconButton onClick={() => setMes(somarMes(mes, 1))} disabled={!podeAvancar} aria-label="Próximo mês">
            <ChevronRightIcon />
          </IconButton>
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 0.5 }}>
          {DIAS_DA_SEMANA.map((d) => (
            <Typography key={d} variant="caption" color="text.secondary" align="center" sx={{ pb: 1 }}>
              {d}
            </Typography>
          ))}

          {celulas.map((celula, i) => {
            if (!celula) return <Box key={`vazia-${i}`} />;

            const doDia = porDia.get(celula);
            const selecionado = celula === dia;
            const ehHoje = celula === hoje;

            return (
              <ButtonBase
                key={celula}
                onClick={() => setDia(celula)}
                aria-label={nomeDoDia(celula)}
                sx={{ flexDirection: 'column', py: 0.5, borderRadius: 2 }}
              >
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: selecionado || ehHoje ? 700 : 400,
                    bgcolor: selecionado ? 'primary.main' : 'transparent',
                    color: selecionado ? 'primary.contrastText' : 'text.primary',
                    //hoje: contorno; selecionado: preenchido (o preenchimento ganha)
                    border: ehHoje && !selecionado ? 2 : 0,
                    borderColor: 'primary.main',
                  }}
                >
                  {Number(celula.slice(8))}
                </Box>
                {/* um ponto por dia, com a cor do treino mais recente dele */}
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    mt: 0.5,
                    borderRadius: '50%',
                    bgcolor: doDia ? corDaSessao(doDia[doDia.length - 1].score_geral) : 'transparent',
                  }}
                />
              </ButtonBase>
            );
          })}
        </Box>
      </Box>

      {dia ? (
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
            {nomeDoDia(dia)}
          </Typography>
          {sessoesDoDia.length === 0 ? (
            <Typography color="text.secondary">Nenhum treino neste dia.</Typography>
          ) : (
            sessoesDoDia.map((s) => (
              <CardSessao key={s.id_treino} sessao={s} onAbrir={() => setAberta(s.id_treino)} />
            ))
          )}
        </Stack>
      ) : (
        <Typography color="text.secondary">Nenhum treino finalizado neste mês.</Typography>
      )}
    </Stack>
  );
}

//o card do treino embaixo do calendario; tocar abre o detalhe
function CardSessao({ sessao, onAbrir }: { sessao: api.SessaoHistorico; onAbrir: () => void }) {
  const cor = corDaSessao(sessao.score_geral);

  return (
    <Card variant="outlined">
      <CardActionArea onClick={onAbrir}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            {/* selo do score: o numero com a cor da faixa; "—" = ainda sem avaliacao */}
            <Box
              sx={{
                width: 44,
                height: 44,
                flexShrink: 0,
                borderRadius: '50%',
                border: 2,
                borderColor: cor,
                color: cor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '"Sora", sans-serif',
                fontWeight: 700,
              }}
            >
              {sessao.score_geral ?? '—'}
            </Box>

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700 }} noWrap>
                {sessao.nome_divisao ?? 'Sem divisão'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatarHora(sessao.data)} · {sessao.series_validas} séries válidas
                {sessao.duracao_total !== null ? ` · ${sessao.duracao_total} min` : ''}
              </Typography>
            </Box>

            <ChevronRightIcon color="action" />
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
```

- [ ] Se o TypeScript reclamar da assinatura do `valueFormatter` da série,
  confira a versão do `@mui/x-charts` no `package.json`. Na v7/v8 o segundo
  argumento é `{ dataIndex }`.

### Passo 21 — `App.tsx` + `Sidebar.tsx`: tela "historico"

- [ ] `Tela` ganha `'historico'`, o mapa ganha `historico: <HistoryView />`, e o
  item "Histórico" da sidebar ganha `tela: 'historico'`. Com isso **todos** os
  itens da sidebar ficam navegáveis. O `disponivel`/`opacity: 0.45` do
  `Sidebar.tsx` deixa de ter uso. Pode ficar por enquanto: a limpeza é da S9.
- [ ] O calendário **não** vira item de menu: fica dentro do Histórico, na aba
  Sessões (D18-3).

`client/src/App.tsx` (os trechos que mudam):

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

`client/src/components/Sidebar.tsx` (só o item do Histórico):

```tsx
  { label: 'Histórico', icon: <TimelineIcon fontSize="small" />, tela: 'historico' },
```

- [ ] Teste pela interface com o usuário do Passo 17 (o login é o
  `postman.s8@teste.com`):
  - **Cargas:** a linha 70 → 75 → 80. Passe o mouse no último ponto e o
    tooltip mostra "80 kg × 8 · 2 séries · tonelagem 1.200 kg".
  - **Volume:** Peito `2/10` nas três últimas semanas.
  - **Sessões:** o mês atual, com pontos em três dias (cinza no da sessão de
    75 kg). O dia de hoje tem contorno e já vem selecionado, com **dois**
    cards embaixo (o treino do Passo 5 e o só de aquecimento do 17.4).
  - A seta ‹ fica desabilitada (a `primeira_sessao` é deste mês), e a ›
    também (é o mês atual).
  - Toque num dia sem treino → "Nenhum treino neste dia".
  - Abra a sessão de 75 kg → os registros (Séries válidas 75×8, 75×8; resumo
    "Tonelagem: 1.200 kg") → "Avaliar treino" → o diagnóstico aparece
    embaixo. Toque na ← e o ponto do dia 16 deixa de ser cinza.
  - Abra a sessão só de aquecimento → só a tabela Preparação e o texto "sem
    séries válidas", **sem** botão.

---

## Passo 22 — Fechar a semana

1. [ ] `npm run test` no `server` verde na suíte inteira: **62/62** (43 da S7
   + 1 do Passo 1 + 2 do Passo 2 + 16 do Passo 18), com `GEMINI_MOCK=true`.
2. [ ] `npm run build` nos **dois** lados sem erro de tipo. No front, o
   `noUnusedLocals` pega import sobrando (ex.: o `InsightsIcon` se o Passo 9
   ficou pela metade).
3. [ ] Passo 5 e Passo 17 do Postman rodados de ponta a ponta, com todos os
   `pm.test` verdes e as contas manuais do 5.11 e do 17.8 conferidas.
4. [ ] Conferir a RNF06 pela tela: com a chave inválida (Passo 10), "Finalizar e
   avaliar treino" → "Treino salvo, mas a avaliação falhou…" → abrir Histórico →
   Sessões → o dia de hoje: a sessão está lá, finalizada, com ponto cinza. No
   detalhe, as séries estão todas lá, só sem avaliação ("Avaliar treino").
   Voltar a chave e avaliar por esse botão.
5. [ ] Testar no DevTools em modo celular (RNF01): Diagnóstico e Histórico numa
   coluna, sem rolagem horizontal. O gráfico da aba Cargas tem que encolher
   junto, o calendário tem que caber nas 7 colunas, e as tabelas de séries do
   detalhe não podem estourar a largura. (A barra inferior da D6 continua sendo S9.)
6. [ ] **Gravar a demo ponta a ponta** (critério de aceite): `Win + Alt + R`
   (Xbox Game Bar) ou OBS. Roteiro: login → Minha divisão → Treino de hoje
   (registrar 3–4 séries) → Volume da semana → volta pro Treino de hoje →
   "Finalizar e avaliar treino" → cai na aba Diagnóstico → Histórico (Cargas com
   o tooltip, Volume, e Sessões: calendário → dia → treino → registros +
   avaliação). Com `GEMINI_MOCK=false` e a chave real — a demo precisa mostrar texto
   da IA de verdade, não o "Mock: …".
7. [ ] Prints provisórios da **Fig. 4** (Diagnóstico da Sessão) e da **Fig. 5**
   (Histórico: progressão de carga + calendário + detalhe da sessão com o
   diagnóstico), pra garantir que
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

> **Se o tempo apertar**, a ordem de corte é: (1) o botão "Avaliar treino" do
> detalhe da sessão (o botão único do Treino de hoje já fecha o fluxo); (2) o
> tooltip da D17 ampliada (a linha da carga máxima basta para o RF07); (3) o
> gráfico da aba Cargas vira uma lista `data · carga` (sem `@mui/x-charts`).
> **Não** cortar nenhuma das três abas nem o detalhe da sessão: cada um é um
> pedaço literal do texto do RF07, e a Fig. 5 depende de cargas + diagnósticos
> anteriores. E **não** pular a Parte
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
  diagnósticos (D14) aparece duplicada, e o `COUNT` de séries dobra. É para isso
  que existe o `LATERAL … LIMIT 1`, e o teste de D14 do Passo 18 pega o erro.
- **Duas contas da D17** (uma no gráfico, outra no detalhe). Um dia elas
  divergem e a mesma sessão mostra 80 kg × 8 num lugar e 80 kg × 7 no outro. É
  para isso o `RESUMO_SERIES_WORK` único, e o teste "progressão == detalhe".
- **Usar `RESUMO_SERIES_WORK` sem o `JOIN Treino` + `t.fk_usuario`.** A
  subconsulta agrega séries de **todo mundo**: sem o filtro de dono, o detalhe
  mostraria o resumo de outro usuário.
- **`MAX(s.repeticoes)` no lugar das reps da série mais pesada.** Numa sessão
  com 60×12 e 70×8, isso daria "70 kg × 12", uma série que não existiu. É o
  `ARRAY_AGG(... ORDER BY carga DESC, repeticoes DESC)[1]`.
- **Chamar a tonelagem de "volume" na tela ou no texto do TCC.** Volume, no
  TCC, é contagem de séries válidas por semana (RF04). Na tela e no texto, é
  sempre "tonelagem".
- **`LIMIT` na lista do mês "por segurança".** A D18-3 pede o histórico
  completo. O corte natural é o mês, e é navegando que se vê o resto.
- **Filtrar o mês com `EXTRACT(MONTH …)`/`to_char(...) = '2026-09'`.** Funciona,
  mas não usa índice e é fácil errar o ano. O intervalo `>= dia 1` e `< dia 1
  do mês seguinte` é o padrão.
- **`new Date('2026-09-18')` para o `dia` do calendário.** Vira meia-noite UTC,
  que é 21h do dia 17 em Brasília: o ponto cai no dia anterior. O `dia` se
  compara como texto, ou se monta com `new Date(ano, mes - 1, dia)`.
- **Esquecer as células vazias antes do dia 1.** Sem o `getDay()` do dia 1, todo
  mês começa no domingo e o dia 18/09/2026 aparece numa quarta.
- **Resetar o dia selecionado ao voltar do detalhe.** A pessoa abriu o dia 16,
  avaliou e voltou para o dia mais recente do mês. O `setDia(atual =>
  atual?.startsWith(mes) ? atual : …)` mantém o dia.
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
