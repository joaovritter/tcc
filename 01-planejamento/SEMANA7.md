# Semana 7 · 14–20/09 · F5a Diagnóstico IA Gemini (RF05/RF06)

> Entregável: **Diagnóstico semanal gerado e persistido**, com `score_geral` calculado
> no backend — [card do entregável](https://trello.com/c/JJLbz4Jl). Ver S7 no
> [`TASKS.md`](./TASKS.md) e a linha S7 do cronograma no [`PLANEJAMENTO.md`](./PLANEJAMENTO.md).
> Decisões novas desta semana: **D13** (fórmula do `score_geral`) e **D14** (diagnóstico
> é histórico, não singleton) — ver seção 2 do `PLANEJAMENTO.md`.

## Passo 0 — Conferir que a S6 está mesmo fechada

Antes de abrir arquivo novo: `npm run test` no `server` tem que sair **39/39
verde** (era 28 no fim da S5, mais 8 do volume + 3 do finish). Se alguma coisa
da S6 estiver vermelha, é regressão — resolver antes de começar a S7, porque
o diagnóstico desta semana **lê** a tabela que a S6 escreveu (`volumeService`)
e a que a S5 escreveu (`SerieTreino.rpe`). Sem os dois em pé, não tem o que
mandar pro Gemini.

Também confirmar rapidamente:

- `GET /metrics/weekly-volume` devolve os grupamentos com `series_validas` e
  `atingiu_limiar` — é a fonte do bloco 3 do prompt e do cálculo de Pv.
- Existe pelo menos um usuário de teste com séries `work` registradas nesta
  semana civil (segunda a domingo corrente, D10) — sem isso, o passo 12
  (teste com chave real) não tem dado pra mandar.

---

## Contexto: o que esta semana resolve

O protótipo antigo (`servidorHipertrofia`) pedia pra IA **inventar** o score.
Essa é a lacuna nº1 listada na seção 1 do `PLANEJAMENTO.md` e é exatamente o
que a S7 fecha: o Gemini devolve só a parte **qualitativa** (texto analítico),
e o `score_geral` — um número — é calculado **inteiramente no Node.js**, a
partir de dados que já estão no banco antes mesmo de a API ser chamada. Se o
Gemini cair, o score continua existindo (RNF06 parcial: a métrica não depende
da IA, só o texto do diagnóstico depende).

Duas peças novas de domínio nascem aqui e não existem em nenhuma tabela ainda:

- **Pv / Pi** — as duas sub-pontuações da Equação 1 (D13). Não vêm do banco,
  são calculadas em memória a partir do que `volumeService` e uma nova
  consulta de séries da semana devolvem.
- **O prompt de 5 blocos** (Tabela V do artigo) — não é código de negócio, é
  um template de string. Fica isolado em `geminiService.ts` justamente pra
  não vazar regra de negócio pro meio de um parágrafo de prompt.

---

## Sessão A — `geminiService`: prompt de 5 blocos + chamada à API

### Passo 1 — Tipos novos em `types/indexTypes.ts`

```ts
//============== diagnóstico (RF05/RF06) =====================================

// uma linha da consulta "séries válidas da semana com grupamento" — é o
// dado cru que vira o bloco 3 do prompt e a entrada do cálculo de Pi
export interface SerieValidaDaSemana {
  id_grupamento: number;
  nome_grupamento: string;
  nome_exercicio: string;
  carga: string; // NUMERIC volta como string no driver pg, igual SerieTreino
  repeticoes: number;
  rpe: number; // 6–10, nunca null aqui (a consulta já filtra tipo = 'work')
  rir: number; // 0–4
}

// o que a IA devolve — só a parte qualitativa. Nunca tem campo numérico de
// score: quem calcula é o scoreService, não o prompt.
export interface DiagnosticoConteudo {
  diagnostico_exercicios: { nome_exercicio: string; comentario: string }[];
  analise_grupamentos: { nome_grupamento: string; comentario: string }[];
  recomendacoes_proxima_sessao: string[];
}

// o que fica gravado em conteudo_json: o texto da IA + as duas sub-notas,
// pra auditar depois COMO o score_geral saiu daquele número (D13)
export interface DiagnosticoConteudoPersistido extends DiagnosticoConteudo {
  score_detalhe: { pv: number; pi: number };
}

export interface DiagnosticoIA {
  id_diagnostico: string;
  fk_usuario: string;
  score_geral: number;
  semana_referencia: string;
  data_geracao: string;
  conteudo_json: DiagnosticoConteudoPersistido;
}
```

### Passo 2 — `config/gemini.ts`

Segue o mesmo padrão do `scripts/test-gemini.ts` da S1 (já validado com
`gemini-3.1-flash-lite`), só que exportado pra reuso e com o flag de mock:

```ts
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

// GEMINI_MOCK=true evita gastar cota/depender de rede em dev e nos testes
// automatizados (regra anti-atraso do PLANEJAMENTO: "Gemini sempre atrás de mock")
export const GEMINI_MOCK = process.env.GEMINI_MOCK === 'true';

export const GEMINI_MODEL = 'gemini-3.1-flash-lite';

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
```

Conferir que `server/.env` tem `GEMINI_MOCK=true` para rodar a suíte — sem
isso o `npm run test` bate na API real (Passo 11 depende disso).

### Passo 3 — nova consulta em `models/sessionModel.ts`

O volume (S6) já sabe contar séries por grupamento; falta buscar as séries
**com o dado de esforço**, pra virar o bloco 3 do prompt e a entrada do Pi.
Reaproveita `inicioDaSemana()` do `volumeService` — **não** reimplementar o
cálculo da semana aqui, senão vira duas fontes da verdade pra "semana atual"
que podem divergir (mesmo raciocínio da D10).

```ts
import { SerieValidaDaSemana } from '../types/indexTypes';

// mesma janela da semana do volumeService (D10): reusa inicioDaSemana() em
// vez de recalcular — uma fonte só de verdade pra "semana atual"
export async function buscarSeriesValidasDaSemana(
  fkUsuario: string,
  semana: string
): Promise<SerieValidaDaSemana[]> {
  const resultado = await pool.query<SerieValidaDaSemana>(
    `SELECT g.id_grupamento,
            g.nome AS nome_grupamento,
            e.nome_exercicio,
            s.carga,
            s.repeticoes,
            s.rpe,
            s.rir
     FROM SerieTreino s
     JOIN Exercicio e ON e.id_exercicio = s.fk_exercicio
     JOIN GrupamentoMuscular g ON g.id_grupamento = e.fk_grupamento
     JOIN Treino t ON t.id_treino = s.fk_treino
     WHERE s.tipo = 'work'
       AND t.fk_usuario = $1
       AND t.data >= $2::date
       AND t.data <  $2::date + INTERVAL '7 days'
     ORDER BY g.nome, e.nome_exercicio`,
    [fkUsuario, semana]
  );
  return resultado.rows;
}
```

> Import circular: `sessionModel` passa a depender de `volumeService` só pela
> função `inicioDaSemana`. Se isso incomodar, mover `inicioDaSemana` pra um
> `services/dateService.ts` neutro é um refactor válido — mas **não** fazer
> isso na S7 sem necessidade: os dois arquivos já estão testados hoje, mexer
> neles é risco que a semana não precisa correr.

### Passo 4 — o template de prompt (Tabela V)

Cada bloco é uma responsabilidade separada dentro da mesma função, pra ficar
fácil de auditar contra a Tabela V do artigo na hora de escrever o capítulo
de metodologia do TCC2.

```ts
import { VolumeSemanal, SerieValidaDaSemana } from '../types/indexTypes';
import { LIMIAR_SERIES } from './volumeService';

function montarPrompt(volume: VolumeSemanal, series: SerieValidaDaSemana[]): string {
  // Bloco 1 — Persona: domínio restrito, sem ficar solto respondendo qualquer coisa
  const persona = `Você é um especialista em fisiologia do exercício e treinamento de força, `
    + `focado exclusivamente em analisar dados objetivos de treino de hipertrofia. `
    + `Não responda perguntas fora desse domínio.`;

  // Bloco 2 — Contexto: semana de referência + grupamentos treinados
  const grupamentosTreinados = volume.grupamentos
    .filter((g) => g.series_validas > 0)
    .map((g) => g.nome_grupamento);
  const contexto = `Semana de referência: ${volume.semana_referencia} (segunda a domingo). `
    + `Grupamentos treinados nesta semana: ${grupamentosTreinados.join(', ') || 'nenhum'}.`;

  // Bloco 3 — Dados de treino: volume de séries válidas + RPE/RIR por série
  const linhasVolume = volume.grupamentos
    .map((g) => `- ${g.nome_grupamento}: ${g.series_validas} séries válidas `
      + `(limiar ${LIMIAR_SERIES}, ${g.atingiu_limiar ? 'atingido' : 'não atingido'})`)
    .join('\n');
  const linhasSeries = series
    .map((s) => `- ${s.nome_exercicio} (${s.nome_grupamento}): ${s.carga}kg x `
      + `${s.repeticoes} reps, RPE ${s.rpe} (RIR ${s.rir})`)
    .join('\n');
  const dados = `Volume semanal por grupamento:\n${linhasVolume}\n\n`
    + `Séries válidas registradas:\n${linhasSeries}`;

  // Bloco 4 — Diretrizes científicas: os dois limiares do referencial teórico
  const diretrizes = `Considere: (1) 10 ou mais séries semanais por grupamento é o limiar `
    + `mínimo associado a ganhos hipertróficos [Schoenfeld, Ogborn, Krieger]; grupamentos `
    + `abaixo disso estão com volume insuficiente. (2) Na escala RPE/RIR, RPE 9 (1 RIR) `
    + `indica estímulo otimizado; quanto mais perto de RPE 6 (4 RIR) ao longo da semana, `
    + `menor a intensidade relativa efetiva do treino [Zourdos; Helms].`;

  // Bloco 5 — Formato de saída: só JSON, sem texto fora do schema
  const formato = `Responda apenas em JSON com os campos: diagnostico_exercicios `
    + `(array de {nome_exercicio, comentario}), analise_grupamentos (array de `
    + `{nome_grupamento, comentario}) e recomendacoes_proxima_sessao (array de strings). `
    + `Não inclua nenhum campo numérico de pontuação — isso é calculado fora da IA.`;

  return [persona, contexto, dados, diretrizes, formato].join('\n\n');
}
```

O último parágrafo do bloco 5 não é só estilo — é o que impede a IA de
"inventar" um score que depois alguém copia pro `score_geral` por engano.

### Passo 5 — schema estruturado + mock + chamada

O SDK (`@google/genai`, já instalado desde a S1) aceita `responseSchema` +
`responseMimeType: 'application/json'` — usar isso em vez de confiar em o
texto vir bem formatado sozinho é o que evita repetir o parsing frágil do
protótipo antigo (`split('kg')`, RNF05).

```ts
import { ai, GEMINI_MOCK, GEMINI_MODEL } from '../config/gemini';
import { VolumeSemanal, SerieValidaDaSemana, DiagnosticoConteudo } from '../types/indexTypes';

const SCHEMA = {
  type: 'object',
  properties: {
    diagnostico_exercicios: {
      type: 'array',
      items: {
        type: 'object',
        properties: { nome_exercicio: { type: 'string' }, comentario: { type: 'string' } },
        required: ['nome_exercicio', 'comentario'],
      },
    },
    analise_grupamentos: {
      type: 'array',
      items: {
        type: 'object',
        properties: { nome_grupamento: { type: 'string' }, comentario: { type: 'string' } },
        required: ['nome_grupamento', 'comentario'],
      },
    },
    recomendacoes_proxima_sessao: { type: 'array', items: { type: 'string' } },
  },
  required: ['diagnostico_exercicios', 'analise_grupamentos', 'recomendacoes_proxima_sessao'],
};

// resposta determinística a partir do dado real — não é lorem ipsum fixo,
// senão o teste de "score bate com o cálculo manual" (Passo 11) não prova nada
function mockDiagnostico(volume: VolumeSemanal, series: SerieValidaDaSemana[]): DiagnosticoConteudo {
  return {
    diagnostico_exercicios: series.slice(0, 3).map((s) => ({
      nome_exercicio: s.nome_exercicio,
      comentario: `Mock: ${s.repeticoes} reps a RPE ${s.rpe}.`,
    })),
    analise_grupamentos: volume.grupamentos.map((g) => ({
      nome_grupamento: g.nome_grupamento,
      comentario: g.atingiu_limiar
        ? `Mock: limiar de ${LIMIAR_SERIES} séries atingido.`
        : `Mock: abaixo do limiar (${g.series_validas}/${LIMIAR_SERIES}).`,
    })),
    recomendacoes_proxima_sessao: ['Mock: manter a intensidade nas séries válidas.'],
  };
}

export async function gerarDiagnostico(
  volume: VolumeSemanal,
  series: SerieValidaDaSemana[]
): Promise<DiagnosticoConteudo> {
  if (GEMINI_MOCK) return mockDiagnostico(volume, series);

  const prompt = montarPrompt(volume, series);
  const resposta = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: { responseMimeType: 'application/json', responseSchema: SCHEMA },
  });

  const texto = resposta.text;
  if (!texto) throw new Error('Gemini não retornou conteúdo');

  // mesmo com responseSchema, o JSON.parse pode falhar (resposta truncada,
  // filtro de segurança do modelo etc.) — deixa o erro subir, quem decide o
  // que fazer com ele é o controller (Passo 8), não o service
  return JSON.parse(texto) as DiagnosticoConteudo;
}
```

---

## Sessão B — `scoreService` + `diagnosticController` + persistência

### Passo 6 — `services/scoreService.ts` (D13)

Funções puras, sem tocar no banco — dá pra testar sem `GEMINI_MOCK` nem
Postgres, só com números conhecidos (matriz RF05/RF06 pede exatamente isso).

```ts
import { VolumeSemanal, SerieValidaDaSemana } from '../types/indexTypes';
import { LIMIAR_SERIES } from './volumeService';

// Pv: média, só sobre os grupamentos que fazem parte da rotina da semana
// (não o catálogo inteiro — quem treina push/pull/legs não deve ser
// penalizado por não treinar um grupamento que nem está no seu plano)
export function calcularPv(volume: VolumeSemanal, grupamentosDaRotina: Set<number>): number {
  const relevantes = volume.grupamentos.filter((g) => grupamentosDaRotina.has(g.id_grupamento));
  if (relevantes.length === 0) return 0;

  const soma = relevantes.reduce(
    (acc, g) => acc + Math.min(g.series_validas / LIMIAR_SERIES, 1) * 100,
    0
  );
  return soma / relevantes.length;
}

// Pi: média sobre todas as séries válidas da semana. RPE 6 (menor valor
// possível no schema) vale 0; RPE 9 ou 10 vale 100 (teto) — a régua linear
// entre eles reflete Zourdos/Helms (RPE 9 = 1 RIR = estímulo otimizado)
export function calcularPi(series: SerieValidaDaSemana[]): number {
  if (series.length === 0) return 0;

  const soma = series.reduce(
    (acc, s) => acc + Math.min(((s.rpe - 6) / 3) * 100, 100),
    0
  );
  return soma / series.length;
}

export function calcularScoreGeral(pv: number, pi: number): number {
  return Math.round((pv + pi) / 2);
}
```

### Passo 7 — `models/diagnosticModel.ts` (D14)

Sem upsert: cada geração é uma linha nova, igual ao `SerieTreino` da D8.

```ts
import { pool } from '../config/db';
import { DiagnosticoIA, DiagnosticoConteudoPersistido } from '../types/indexTypes';

export async function salvar(
  fkUsuario: string,
  scoreGeral: number,
  semanaReferencia: string,
  conteudo: DiagnosticoConteudoPersistido
): Promise<DiagnosticoIA> {
  const resultado = await pool.query<DiagnosticoIA>(
    `INSERT INTO DiagnosticoIA (fk_usuario, score_geral, semana_referencia, conteudo_json)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [fkUsuario, scoreGeral, semanaReferencia, conteudo]
  );
  return resultado.rows[0];
}

// "diagnóstico atual" = o mais recente dentro da semana corrente (D14)
export async function buscarUltimoDaSemana(
  fkUsuario: string,
  semanaReferencia: string
): Promise<DiagnosticoIA | null> {
  const resultado = await pool.query<DiagnosticoIA>(
    `SELECT * FROM DiagnosticoIA
     WHERE fk_usuario = $1 AND semana_referencia = $2
     ORDER BY data_geracao DESC
     LIMIT 1`,
    [fkUsuario, semanaReferencia]
  );
  return resultado.rows[0] ?? null;
}
```

### Passo 8 — `controllers/diagnosticController.ts`

O controller só orquestra: busca dado, calcula score, chama a IA, persiste.
Nenhum SQL e nenhuma conta aqui — se crescer além disso, é sinal de regra
vazando (mesma régua do `metricsController`).

```ts
import { Response } from 'express';
import { AuthenticateRequest } from '../middlewares/auth';
import * as volumeService from '../services/volumeService';
import * as sessionModel from '../models/sessionModel';
import * as geminiService from '../services/geminiService';
import * as diagnosticModel from '../models/diagnosticModel';
import { calcularPv, calcularPi, calcularScoreGeral } from '../services/scoreService';

export async function gerarDiagnostico(req: AuthenticateRequest, res: Response) {
  const fkUsuario = req.userId as string;

  const volume = await volumeService.calcularVolumeSemanal(fkUsuario);
  const series = await sessionModel.buscarSeriesValidasDaSemana(fkUsuario, volume.semana_referencia);

  if (series.length === 0) {
    return res.status(400).json({ erro: 'Nenhuma série válida registrada nesta semana ainda' });
  }

  const grupamentosDaRotina = new Set(series.map((s) => s.id_grupamento));
  const pv = calcularPv(volume, grupamentosDaRotina);
  const pi = calcularPi(series);
  const scoreGeral = calcularScoreGeral(pv, pi);

  try {
    const conteudo = await geminiService.gerarDiagnostico(volume, series);
    const diagnostico = await diagnosticModel.salvar(fkUsuario, scoreGeral, volume.semana_referencia, {
      ...conteudo,
      score_detalhe: { pv, pi },
    });
    return res.status(201).json({ diagnostico });
  } catch (erro) {
    // nenhuma tabela de treino é tocada neste bloco — a falha da IA não
    // arrisca dado nenhum de Treino/SerieTreino (RNF06)
    console.error(erro);
    return res.status(502).json({ erro: 'Falha ao gerar diagnóstico com a IA' });
  }
}

export async function diagnosticoAtual(req: AuthenticateRequest, res: Response) {
  const fkUsuario = req.userId as string;
  const volume = await volumeService.calcularVolumeSemanal(fkUsuario); // só pra pegar semana_referencia pronta

  const diagnostico = await diagnosticModel.buscarUltimoDaSemana(fkUsuario, volume.semana_referencia);
  if (!diagnostico) {
    return res.status(404).json({ erro: 'Nenhum diagnóstico gerado ainda para esta semana' });
  }
  return res.status(200).json({ diagnostico });
}
```

> Chamar `calcularVolumeSemanal` de novo só pra pegar `semana_referencia` no
> `diagnosticoAtual` é levemente redundante (é uma query rápida, mas ainda
> assim). Alternativa mais barata: exportar `inicioDaSemana()` direto do
> `volumeService` e chamar só ela aqui. Qualquer uma resolve — decidir na
> hora sem travar o passo.

### Passo 9 — rotas + `app.ts`

```ts
// routes/diagnosticRoutes.ts
import { Router } from 'express';
import { autenticar } from '../middlewares/auth';
import { gerarDiagnostico, diagnosticoAtual } from '../controllers/diagnosticController';

const router = Router();

router.post('/diagnostics/generate', autenticar, gerarDiagnostico);
router.get('/diagnostics/latest', autenticar, diagnosticoAtual);

export default router;
```

Em `app.ts`: importar `diagnosticRoutes` e `app.use(diagnosticRoutes)`, no
mesmo padrão das outras cinco rotas já registradas.

### Passo 10 — testar no Postman antes do automatizado

Igual às semanas anteriores: `POST /diagnostics/generate` com token válido e
pelo menos uma série `work` registrada na semana. Com `GEMINI_MOCK=true`,
conferir que a resposta vem em menos de 1s (senão o mock não está sendo
usado — provavelmente `.env` sem `GEMINI_MOCK=true` ou o servidor não
recarregou a variável). Depois `GET /diagnostics/latest` e conferir que
`score_detalhe.pv`/`pi` batem com a conta manual.

### Passo 11 — testes automatizados (`__tests__/diagnostic.test.ts`)

Confirmar `GEMINI_MOCK=true` no ambiente antes de rodar (`npm run test` já
carrega `.env` via `dotenv/config` nos módulos importados).

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app';
import { registrarComTreinoAberto } from './testHelpers';
import { calcularPv, calcularPi, calcularScoreGeral } from '../services/scoreService';

test('POST /diagnostics/generate sem série válida retorna 400', async () => {
  const { token } = await registrarComTreinoAberto(); // treino aberto, zero séries
  const resposta = await request(app)
    .post('/diagnostics/generate')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(resposta.status, 400);
});

test('fluxo completo: registra série work, gera diagnóstico, score bate com o cálculo manual', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();

  await request(app)
    .post(`/sessions/${idTreino}/sets`)
    .set('Authorization', `Bearer ${token}`)
    .send({ fk_exercicio: exercicio.id_exercicio, tipo: 'work', carga: 80, repeticoes: 8, rir: 1 }); // RPE 9

  const geracao = await request(app)
    .post('/diagnostics/generate')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(geracao.status, 201);

  const { score_geral, conteudo_json } = geracao.body.diagnostico;
  // com 1 série a RPE 9 em 1 grupamento fora do limiar: Pv baixo, Pi = 100
  const piEsperado = calcularPi([{ rpe: 9 } as any]);
  assert.equal(conteudo_json.score_detalhe.pi, piEsperado);
  assert.equal(score_geral, calcularScoreGeral(conteudo_json.score_detalhe.pv, piEsperado));

  const atual = await request(app)
    .get('/diagnostics/latest')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(atual.status, 200);
  assert.equal(atual.body.diagnostico.id_diagnostico, geracao.body.diagnostico.id_diagnostico);
});

// testes puros de scoreService — não tocam no banco nem no Gemini
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

### Passo 12 — teste com chave real: 3 cenários (item do TASKS.md)

Com `GEMINI_MOCK=false` e `GEMINI_API_KEY` válida, via Postman, três semanas
simuladas diferentes — sem alterar a suíte automatizada, é validação manual:

1. **Volume bom + RPE alto** (≥10 séries por grupamento, RPE 8–9 na maioria):
   esperado `score_geral` alto, texto da IA reconhecendo o padrão.
2. **Volume baixo** (poucas séries, 1–2 grupamentos abaixo de 10): esperado
   `score_geral` mediano/baixo puxado pelo Pv, e `analise_grupamentos`
   mencionando os grupamentos que não bateram o limiar.
3. **RPE baixo/misto** (séries com RIR 3–4, ou seja RPE 6–7, volume ok):
   esperado Pv alto mas Pi baixo — score no meio, e o texto da IA comentando
   intensidade insuficiente, não volume.

Conferir nos três: JSON sempre parseável (sem `try/catch` estourando), tempo
de resposta aceitável (Gemini Flash Lite costuma ficar bem abaixo de 5s), e
nenhum campo numérico de score vindo da IA (só texto nos três arrays).

---

## Passo 13 — Fechar a semana

1. [ ] `npm run test` no `server` verde na suíte inteira (39 + os novos de
   diagnóstico).
2. [ ] `npm run build` sem erro de tipo.
3. [ ] Os 3 cenários do Passo 12 rodados com chave real e conferidos à mão.
4. [ ] Conferir a D14 na prática: gerar o diagnóstico duas vezes na mesma
   semana e ver duas linhas em `DiagnosticoIA` (`SELECT COUNT(*) ... WHERE
   fk_usuario = ... AND semana_referencia = ...`), e que `GET
   /diagnostics/latest` devolve sempre a mais recente.
5. [ ] Commit + push. Sugestão: um commit de `geminiService` + `scoreService`
   (Sessão A + o cálculo puro), outro de `diagnosticController` +
   `diagnosticModel` + rotas + testes (Sessão B).
6. [ ] Marcar os cards da S7 no Trello (`/trello-sync`).

---

## Ordem sugerida pra essa sessão

1. **Sessão A (backend, prompt):** Passos 1 → 5 (`types` → `config/gemini.ts`
   → `sessionModel` acrescentado → `montarPrompt` → `gerarDiagnostico` com
   mock). Testar isolado antes de integrar: um script solto chamando
   `geminiService.gerarDiagnostico` com dado fake já mostra se o prompt e o
   schema fazem sentido, sem precisar do controller pronto.
2. **Sessão B (backend, persistência):** Passos 6 → 11 (`scoreService` →
   `diagnosticModel` → `diagnosticController` → rotas + `app.ts` → Postman →
   testes automatizados).
3. Passo 12 (chave real) fica pra qualquer ponta livre de tempo — não bloqueia
   o entregável, que é sobre o **fluxo com mock** funcionando e testado.
4. Passo 13 fecha a semana.

> **Se o tempo apertar**, o corte é o Passo 12 (validação com chave real e os
> 3 cenários), não o Passo 6 (o cálculo do score). O entregável da semana é
> *"score calculado no backend + diagnóstico persistido"* — isso já fecha com
> mock. A tela de diagnóstico (`DiagnosticView`, RF05/06 visível pro usuário)
> é da S8, não desta semana.

## Armadilhas comuns desta semana

- **Pedir um número de score pro Gemini.** É a lacuna nº1 do protótipo antigo
  que este TCC promete fechar — o bloco 5 do prompt proíbe isso
  explicitamente, e o `SCHEMA` do Passo 5 não tem nenhum campo numérico.
- **Calcular Pv sobre todos os grupamentos do catálogo**, e não só os da
  rotina da semana. Penaliza quem treina uma divisão que legitimamente não
  cobre todo grupamento toda semana (ex.: push/pull/legs sem antebraço).
- **Reimplementar a janela da semana em `sessionModel` na mão** em vez de
  reusar `inicioDaSemana()` do `volumeService` — duas fontes da verdade pra
  "semana atual" que podem divergir se uma mudar e a outra não (D10).
- **Rodar a suíte sem `GEMINI_MOCK=true`.** Os testes tentam bater na API
  real, ficam lentos, dependem de rede e gastam cota — e num CI sem chave
  configurada, simplesmente falham.
- **Confiar cegamente no `responseSchema`.** Ele reduz a chance de erro, não
  zera: resposta truncada, filtro de segurança do modelo ou um campo com tipo
  errado ainda podem acontecer. O `JSON.parse` dentro de um try/catch no
  controller (não no service) é o que garante RNF06 aqui.
- **Deixar o erro da API do Gemini vazar como 500 genérico.** É o retorno 502
  do Passo 8 que deixa claro pro front (S8) que foi falha da IA, não do
  sistema — e o `console.error` é o que salva o debug às 23h.
- **`carga` como string direto no prompt sem normalizar.** Vem do driver `pg`
  como string (mesmo bug de sempre); interpolar direto funciona pro texto do
  prompt, mas não pra qualquer conta numérica que usar esse campo.
- **Esquecer o `app.use(diagnosticRoutes)`.** Mesmo erro silencioso da S6 com
  `metricsRoutes` — rota existe, compila, devolve 404.
- **Gerar diagnóstico sem nenhuma série válida na semana.** Sem o guard do
  Passo 8 (`series.length === 0` → 400), o Pv e o Pi saem `0/0` (`NaN`) e um
  `NaN` vai silenciosamente pro `INSERT` como `score_geral`.
- **Achar que "diagnóstico atual" precisa de `UNIQUE` + `ON CONFLICT`.** A
  D14 decidiu o contrário de propósito: histórico por padrão, "atual" é só
  uma leitura ordenada por `data_geracao`. Não adicionar constraint que a
  decisão já descartou.
