# Semana 7 · 14–20/09 · F5a Diagnóstico IA Gemini (RF05/RF06)

> Entregável: **Diagnóstico da sessão de treino gerado e persistido**, com `score_geral`
> calculado no backend — [card do entregável](https://trello.com/c/JJLbz4Jl). Ver S7 no
> [`TASKS.md`](./TASKS.md) e a linha S7 do cronograma no [`PLANEJAMENTO.md`](./PLANEJAMENTO.md).
> Decisões novas desta semana: **D13** (fórmula do `score_geral`), **D14** (diagnóstico
> é histórico, não singleton) e **D15** (diagnóstico é acionado por sessão de treino
> finalizada, não por corte semanal — ver seção 2 do `PLANEJAMENTO.md`).
>
> **Correção 17/09 (D15):** o roteiro abaixo foi escrito tratando o diagnóstico como um
> corte semanal (`semana_referencia`, `VolumeSemanal` como dado central do prompt). Isso
> contradizia a **D2** (07/08), que já definia "Diagnóstico por SESSÃO". Os passos foram
> atualizados para refletir a D15: o diagnóstico é gerado a partir de UM `Treino`
> (sessão) e suas próprias séries; o volume semanal (RF04) entra só como contexto.

## Passo 0 — Conferir que a S6 está mesmo fechada

- [x] `npm run test` no `server` sai **39/39 verde** (era 28 no fim da S5,
  mais 8 do volume + 3 do finish). Se alguma coisa da S6 estiver vermelha, é
  regressão — resolver antes de começar a S7, porque o diagnóstico desta
  semana **lê** a tabela que a S6 escreveu (`volumeService`) e a que a S5
  escreveu (`SerieTreino.rpe`). Sem os dois em pé, não tem o que mandar pro
  Gemini.
- [x] `GET /metrics/weekly-volume` devolve os grupamentos com `series_validas`
  e `atingiu_limiar` — é a fonte do bloco 3 do prompt e do cálculo de Pv.
- [x] Existe pelo menos um usuário de teste com séries `work` registradas
  nesta semana civil (segunda a domingo corrente, D10) — sem isso, o Passo 12
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

- **Pv / Pi** — as duas sub-pontuações da Equação 1 (D13, ajustada pela D15).
  Não vêm do banco, são calculadas em memória: `Pv` a partir do que
  `volumeService` devolve (acumulado semanal, contexto), `Pi` a partir de uma
  nova consulta das séries **da sessão** que disparou o diagnóstico.
- **O prompt de 5 blocos** (Tabela V do artigo) — não é código de negócio, é
  um template de string. Fica isolado em `geminiService.ts` justamente pra
  não vazar regra de negócio pro meio de um parágrafo de prompt.

---

## Sessão A — `geminiService`: prompt de 5 blocos + chamada à API

### Passo 1 — Tipos novos em `types/indexTypes.ts`

- [x] `SerieValidaDaSessao` (ex-`SerieValidaDaSemana`, D15) fica com
  `rpe`/`rir` como `number` (não `number | null`) — a consulta do Passo 3 já
  filtra `tipo = 'work'`, que pela D9 sempre tem nota de esforço.
- [x] `DiagnosticoConteudo` nunca tem campo numérico de pontuação — quem
  calcula o score é o `scoreService` (Passo 6), não o prompt.
- [x] `DiagnosticoConteudoPersistido` guarda `score_detalhe: { pv, pi }`
  dentro do JSONB, pra auditar depois como o `score_geral` saiu daquele
  número (D13).
- [x] `DiagnosticoIA` troca `semana_referencia` por `fk_treino` (D15) — o
  diagnóstico referencia a sessão que o gerou, não um corte de semana.

```ts
//============== diagnóstico (RF05/RF06) =====================================

// uma linha da consulta "séries válidas da SESSÃO com grupamento" (D15) — é o
// dado cru que vira o bloco 3 do prompt e a entrada do cálculo de Pi
export interface SerieValidaDaSessao {
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
  fk_treino: string; // sessão diagnosticada (D15) — não mais semana_referencia
  score_geral: number;
  data_geracao: string;
  conteudo_json: DiagnosticoConteudoPersistido;
}
```

### Passo 2 — `config/gemini.ts`

- [x] Segue o mesmo padrão do `scripts/test-gemini.ts` da S1 (já validado com
  `gemini-3.1-flash-lite`), só que exportado pra reuso.
- [x] `GEMINI_MOCK` lido do `.env` como string — `process.env.GEMINI_MOCK ===
  'true'`, não é boolean nativo.
- [x] `server/.env` tem `GEMINI_MOCK=true` antes de rodar a suíte — sem isso
  o `npm run test` bate na API real (Passo 11 depende disso).

```ts
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

// GEMINI_MOCK=true evita gastar cota/depender de rede em dev e nos testes
// automatizados (regra anti-atraso do PLANEJAMENTO: "Gemini sempre atrás de mock")
export const GEMINI_MOCK = process.env.GEMINI_MOCK === 'true';

export const GEMINI_MODEL = 'gemini-3.1-flash-lite';

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
```

### Passo 3 — nova consulta em `models/sessionModel.ts`

- [x] Busca as séries **com o dado de esforço** (o volume da S6 só sabe
  contar, não sabe o RPE/RIR) — vira o bloco 3 do prompt e a entrada do Pi.
- [x] Filtra por `fk_treino` (a sessão avaliada, D15) em vez de janela de
  semana — o diagnóstico não reimplementa nem depende do cálculo de semana
  do `volumeService`; quem ainda usa `inicioDaSemana()` é o próprio
  `volumeService`, sem mudança.
- [x] Mesmo filtro `WHERE s.tipo = 'work'` do `volumeService` — é o que
  garante `rpe`/`rir` nunca nulos no resultado (Passo 1).
- [x] Confere `t.fk_usuario = $2` na mesma query — evita vazar séries de um
  treino que não é do usuário autenticado (o controller já valida dono do
  treino no Passo 8, mas a query fica correta por si só).

```ts
import { SerieValidaDaSessao } from '../types/indexTypes';

// D15: série válida de UMA sessão (fk_treino), não de uma janela de semana
export async function buscarSeriesValidasDaSessao(
  idTreino: string,
  fkUsuario: string
): Promise<SerieValidaDaSessao[]> {
  const resultado = await pool.query<SerieValidaDaSessao>(
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
       AND t.id_treino = $1
       AND t.fk_usuario = $2
     ORDER BY g.nome, e.nome_exercicio`,
    [idTreino, fkUsuario]
  );
  return resultado.rows;
}
```

> `Pv` continua usando o volume semanal acumulado — quem calcula isso
> (`volumeService.calcularVolumeSemanal`, com `inicioDaSemana()` por dentro,
> D10) não muda nada nesta semana. É só a busca de séries do diagnóstico
> (`Pi` + bloco 3 do prompt) que deixa de olhar pra semana e passa a olhar
> pra sessão.

### Passo 4 — `services/geminiService.ts`: o template de prompt (Tabela V)

- [x] Cada bloco é uma responsabilidade separada dentro da mesma função, pra
  ficar fácil de auditar contra a Tabela V do artigo na hora de escrever o
  capítulo de metodologia do TCC2.
- [x] Bloco 1 (persona) restringe o domínio — evita a IA responder fora do
  escopo de fisiologia do exercício.
- [x] Bloco 4 (diretrizes) cita os dois limiares do referencial teórico: 10
  séries semanais [Schoenfeld] e RPE 9 = 1 RIR [Zourdos; Helms] — sem isso o
  diagnóstico não tem embasamento científico (RNF04).
- [x] Bloco 5 (formato) proíbe explicitamente campo numérico de pontuação na
  resposta — é o que impede a IA de "inventar" o score.

```ts
import { Treino, VolumeSemanal, SerieValidaDaSessao } from '../types/indexTypes';
import { LIMIAR_SERIES } from './volumeService';

// D15: `treino` é a sessão que disparou o diagnóstico (dado central);
// `volume` é o acumulado semanal (RF04) só como contexto — nunca o gatilho.
function montarPrompt(treino: Treino, volume: VolumeSemanal, series: SerieValidaDaSessao[]): string {
  // Bloco 1 — Persona: domínio restrito, sem ficar solto respondendo qualquer coisa
  const persona = `Você é um especialista em fisiologia do exercício e treinamento de força, `
    + `focado exclusivamente em analisar dados objetivos de treino de hipertrofia. `
    + `Não responda perguntas fora desse domínio.`;

  // Bloco 2 — Contexto: sessão de treino avaliada + grupamentos treinados nela
  const grupamentosTreinados = [...new Set(series.map((s) => s.nome_grupamento))];
  const contexto = `Sessão de treino avaliada: ${treino.data}. `
    + `Grupamentos treinados nesta sessão: ${grupamentosTreinados.join(', ') || 'nenhum'}. `
    + `(Semana de referência do volume acumulado abaixo: ${volume.semana_referencia}, segunda a domingo.)`;

  // Bloco 3 — Dados de treino: séries desta sessão + volume semanal acumulado como contexto
  const linhasVolume = volume.grupamentos
    .map((g) => `- ${g.nome_grupamento}: ${g.series_validas} séries válidas `
      + `acumuladas na semana (limiar ${LIMIAR_SERIES}, ${g.atingiu_limiar ? 'atingido' : 'não atingido'})`)
    .join('\n');
  const linhasSeries = series
    .map((s) => `- ${s.nome_exercicio} (${s.nome_grupamento}): ${s.carga}kg x `
      + `${s.repeticoes} reps, RPE ${s.rpe} (RIR ${s.rir})`)
    .join('\n');
  const dados = `Séries válidas registradas nesta sessão:\n${linhasSeries}\n\n`
    + `Volume semanal acumulado por grupamento (contexto, não é o foco da avaliação):\n${linhasVolume}`;

  // Bloco 4 — Diretrizes científicas: os dois limiares do referencial teórico
  const diretrizes = `Considere: (1) 10 ou mais séries semanais por grupamento é o limiar `
    + `mínimo associado a ganhos hipertróficos [Schoenfeld, Ogborn, Krieger]; grupamentos `
    + `abaixo disso estão com volume insuficiente. (2) Na escala RPE/RIR, RPE 9 (1 RIR) `
    + `indica estímulo otimizado; quanto mais perto de RPE 6 (4 RIR) ao longo da sessão, `
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

### Passo 5 — `services/geminiService.ts`: schema estruturado + mock + chamada


- [x] `responseMimeType: 'application/json'` + `responseSchema` (SDK
  `@google/genai`, já instalado desde a S1) no lugar de confiar em o texto
  vir bem formatado sozinho — evita repetir o parsing frágil do protótipo
  antigo (`split('kg')`, RNF05).
- [x] Mock é determinístico a partir do dado de entrada real, não lorem ipsum
  fixo — senão o teste "score bate com o cálculo manual" (Passo 11) não
  prova nada.
- [x] `JSON.parse` pode falhar mesmo com `responseSchema` — o erro sobe pro
  controller (Passo 8) decidir o que fazer, não é tratado aqui dentro.

```ts
import { ai, GEMINI_MOCK, GEMINI_MODEL } from '../config/gemini';
import { Treino, VolumeSemanal, SerieValidaDaSessao, DiagnosticoConteudo } from '../types/indexTypes';

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
function mockDiagnostico(volume: VolumeSemanal, series: SerieValidaDaSessao[]): DiagnosticoConteudo {
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
  treino: Treino,
  volume: VolumeSemanal,
  series: SerieValidaDaSessao[]
): Promise<DiagnosticoConteudo> {
  if (GEMINI_MOCK) return mockDiagnostico(volume, series);

  const prompt = montarPrompt(treino, volume, series);
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

- [x] Funções puras, sem `pool.query` — testáveis sem banco nem `GEMINI_MOCK`,
  só com números conhecidos (matriz RF05/RF06 pede exatamente isso).
- [x] `calcularPv` só considera grupamentos que fazem parte da rotina da
  semana (`grupamentosDaRotina`), não o catálogo inteiro. Continua usando o
  volume semanal acumulado (RF04) — a D15 não muda `Pv`, só `Pi`.
- [x] `calcularPi` usa a régua RPE 6→0 / RPE 9 ou 10→100 (teto), baseada em
  Zourdos/Helms, agora sobre as séries **da sessão diagnosticada** (D15), não
  mais da semana inteira.

```ts
import { VolumeSemanal, SerieValidaDaSessao } from '../types/indexTypes';
import { LIMIAR_SERIES } from './volumeService';

// Pv: média, só sobre os grupamentos que fazem parte da rotina da semana
// (não o catálogo inteiro — quem treina push/pull/legs não deve ser
// penalizado por não treinar um grupamento que nem está no seu plano).
// Continua usando o volume semanal acumulado (RF04) como contexto — D15 não
// muda Pv, só Pi (que passa a ser por sessão).
export function calcularPv(volume: VolumeSemanal, grupamentosDaRotina: Set<number>): number {
  const relevantes = volume.grupamentos.filter((g) => grupamentosDaRotina.has(g.id_grupamento));
  if (relevantes.length === 0) return 0;

  const soma = relevantes.reduce(
    (acc, g) => acc + Math.min(g.series_validas / LIMIAR_SERIES, 1) * 100,
    0
  );
  return soma / relevantes.length;
}

// Pi: média sobre as séries válidas DA SESSÃO diagnosticada (D15, não mais
// "da semana"). RPE 6 (menor valor possível no schema) vale 0; RPE 9 ou 10
// vale 100 (teto) — a régua linear entre eles reflete Zourdos/Helms (RPE 9 =
// 1 RIR = estímulo otimizado)
export function calcularPi(series: SerieValidaDaSessao[]): number {
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

### Passo 7 — `models/diagnosticModel.ts` (D14, ajustado pela D15)

- [x] Sem `UNIQUE`/`ON CONFLICT` — cada `salvar` grava uma linha nova (D14,
  mesmo padrão append-only do `SerieTreino`/D8), agora referenciando
  `fk_treino` em vez de `semana_referencia`.
- [x] `buscarUltimoDoUsuario` ordena por `data_geracao DESC LIMIT 1` —
  "diagnóstico atual" é sempre uma leitura ordenada por data, sem filtro de
  semana; é o diagnóstico mais recente do usuário, de qualquer sessão.

```ts
import { pool } from '../config/db';
import { DiagnosticoIA, DiagnosticoConteudoPersistido } from '../types/indexTypes';

export async function salvar(
  fkUsuario: string,
  idTreino: string,
  scoreGeral: number,
  conteudo: DiagnosticoConteudoPersistido
): Promise<DiagnosticoIA> {
  const resultado = await pool.query<DiagnosticoIA>(
    `INSERT INTO DiagnosticoIA (fk_usuario, fk_treino, score_geral, conteudo_json)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [fkUsuario, idTreino, scoreGeral, conteudo]
  );
  return resultado.rows[0];
}

// "diagnóstico atual" = o mais recente do usuário (D14 + D15, sem filtro de semana)
export async function buscarUltimoDoUsuario(fkUsuario: string): Promise<DiagnosticoIA | null> {
  const resultado = await pool.query<DiagnosticoIA>(
    `SELECT * FROM DiagnosticoIA
     WHERE fk_usuario = $1
     ORDER BY data_geracao DESC
     LIMIT 1`,
    [fkUsuario]
  );
  return resultado.rows[0] ?? null;
}
```

### Passo 8 — `controllers/diagnosticController.ts` (D15)

- [x] Controller só orquestra: busca o treino (dono + existência), calcula
  score, chama a IA, persiste. Nenhum SQL e nenhuma conta aqui — se crescer
  além disso, é sinal de regra vazando (mesma régua do `metricsController`).
- [x] `id_treino` vem da rota (`POST /sessions/:id/diagnostics/generate`, D15
  — segue o mesmo padrão aninhado de `/sessions/:id/sets`), não do corpo.
- [x] Guard de `series.length === 0` → 400 antes de calcular qualquer coisa —
  sem isso Pv/Pi saem `NaN`.
- [x] `try/catch` só em volta da chamada à IA + persistência — falha do
  Gemini vira 502, sem tocar `Treino`/`SerieTreino` (RNF06).

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
  const idTreino = req.params.id;

  const treino = await sessionModel.buscarTreinoDoUsuario(idTreino, fkUsuario); // 404 se não existir/não for do usuário
  if (!treino) {
    return res.status(404).json({ erro: 'Treino não encontrado' });
  }

  const series = await sessionModel.buscarSeriesValidasDaSessao(idTreino, fkUsuario);
  if (series.length === 0) {
    return res.status(400).json({ erro: 'Nenhuma série válida registrada nesta sessão ainda' });
  }

  // Pv usa o volume semanal acumulado (RF04) só como contexto (D15) — não é
  // recorte da sessão, é "onde a semana está" no momento deste treino
  const volume = await volumeService.calcularVolumeSemanal(fkUsuario);
  const grupamentosDaRotina = new Set(series.map((s) => s.id_grupamento));
  const pv = calcularPv(volume, grupamentosDaRotina);
  const pi = calcularPi(series);
  const scoreGeral = calcularScoreGeral(pv, pi);

  try {
    const conteudo = await geminiService.gerarDiagnostico(treino, volume, series);
    const diagnostico = await diagnosticModel.salvar(fkUsuario, idTreino, scoreGeral, {
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

  const diagnostico = await diagnosticModel.buscarUltimoDoUsuario(fkUsuario);
  if (!diagnostico) {
    return res.status(404).json({ erro: 'Nenhum diagnóstico gerado ainda' });
  }
  return res.status(200).json({ diagnostico });
}
```

> `buscarTreinoDoUsuario` é só um `SELECT * FROM Treino WHERE id_treino = $1
> AND fk_usuario = $2` — se `sessionModel` já tiver algo equivalente de uma
> semana anterior (ex.: usado no `finish`), reusar em vez de duplicar.

### Passo 9 — rotas + `app.ts` (D15)

- [x] `POST /sessions/:id/diagnostics/generate` (aninhada na sessão, D15 — era
  `POST /diagnostics/generate` sem `id`) e `GET /diagnostics/latest`, ambas
  atrás de `autenticar`, mesmo padrão das outras rotas.
- [x] Registrar `app.use(diagnosticRoutes)` em `app.ts` — esquecer isso é o
  erro silencioso mais comum (mesmo caso do `metricsRoutes` na S6: rota
  existe, compila, devolve 404).

```ts
// routes/diagnosticRoutes.ts
import { Router } from 'express';
import { autenticar } from '../middlewares/auth';
import { gerarDiagnostico, diagnosticoAtual } from '../controllers/diagnosticController';

const router = Router();

router.post('/sessions/:id/diagnostics/generate', autenticar, gerarDiagnostico);
router.get('/diagnostics/latest', autenticar, diagnosticoAtual);

export default router;
```

### Passo 10 — testar no Postman antes do automatizado

- [ ] `POST /sessions/:id/diagnostics/generate` com token válido, `:id` de um
  treino do próprio usuário, e pelo menos uma série `work` registrada nele.
- [ ] Com `GEMINI_MOCK=true`, a resposta vem em menos de 1s (senão o mock não
  está sendo usado — provavelmente `.env` sem `GEMINI_MOCK=true` ou o
  servidor não recarregou a variável).
- [ ] `GET /diagnostics/latest` devolve o mesmo diagnóstico gerado, com
  `score_detalhe.pv`/`pi` batendo com a conta manual.

### Passo 11 — testes automatizados (`__tests__/diagnostic.test.ts`)

- [x] `GEMINI_MOCK=true` confirmado no ambiente antes de rodar (`npm run
  test` já carrega `.env` via `dotenv/config` nos módulos importados).
- [ ] Cobre o 400 sem série válida, o fluxo completo com score batendo com o
  cálculo manual, e testes puros do `scoreService` sem banco nem Gemini.

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app';
import { registrarComTreinoAberto } from './testHelpers';
import { calcularPv, calcularPi, calcularScoreGeral } from '../services/scoreService';

test('POST /sessions/:id/diagnostics/generate sem série válida retorna 400', async () => {
  const { token, idTreino } = await registrarComTreinoAberto(); // treino aberto, zero séries
  const resposta = await request(app)
    .post(`/sessions/${idTreino}/diagnostics/generate`)
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
    .post(`/sessions/${idTreino}/diagnostics/generate`)
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

Com `GEMINI_MOCK=false` e `GEMINI_API_KEY` válida, via Postman, três sessões
simuladas diferentes (cada uma um `Treino` com séries próprias) — sem alterar
a suíte automatizada, é validação manual:

- [ ] **Cenário 1 — volume semanal (contexto) bom + RPE alto na sessão** (o
  grupamento já tem ≥10 séries acumuladas na semana, sessão com RPE 8–9 na
  maioria): esperado `score_geral` alto, texto da IA reconhecendo o padrão.
- [ ] **Cenário 2 — volume semanal (contexto) baixo** (poucas séries
  acumuladas, 1–2 grupamentos abaixo de 10): esperado `score_geral`
  mediano/baixo puxado pelo Pv, e `analise_grupamentos` mencionando os
  grupamentos que não bateram o limiar.
- [ ] **Cenário 3 — RPE baixo/misto na sessão** (séries com RIR 3–4, ou seja
  RPE 6–7, volume semanal ok): esperado Pv alto mas Pi baixo — score no meio,
  e o texto da IA comentando intensidade insuficiente, não volume.
- [ ] Nos três: JSON sempre parseável (sem `try/catch` estourando), tempo de
  resposta aceitável (Gemini Flash Lite costuma ficar bem abaixo de 5s), e
  nenhum campo numérico de score vindo da IA (só texto nos três arrays).

---

## Passo 13 — Fechar a semana

1. [ ] `npm run test` no `server` verde na suíte inteira (39 + os novos de
   diagnóstico).
2. [ ] `npm run build` sem erro de tipo.
3. [ ] Os 3 cenários do Passo 12 rodados com chave real e conferidos à mão.
4. [ ] Conferir a D14 na prática: gerar o diagnóstico duas vezes pro mesmo
   treino e ver duas linhas em `DiagnosticoIA` (`SELECT COUNT(*) ... WHERE
   fk_usuario = ... AND fk_treino = ...`), e que `GET /diagnostics/latest`
   devolve sempre a mais recente.
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
- **Calcular Pi sobre a semana inteira em vez da sessão** (D15). O `Pi` mudou
  de escopo nesta revisão — usar `SerieValidaDaSessao` filtrado por
  `fk_treino`, não a consulta antiga de janela semanal.
- **Reimplementar a janela da semana em `sessionModel` na mão** em vez de
  reusar `inicioDaSemana()` do `volumeService` — duas fontes da verdade pra
  "semana atual" que podem divergir se uma mudar e a outra não (D10). Isso
  só se aplica ao `Pv`/`volumeService`; a busca de séries da sessão (Passo 3)
  não usa semana nenhuma.
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
- **Gerar diagnóstico sem nenhuma série válida na sessão.** Sem o guard do
  Passo 8 (`series.length === 0` → 400), o Pi sai `0/0` (`NaN`) e um `NaN`
  vai silenciosamente pro `INSERT` como `score_geral`.
- **Achar que "diagnóstico atual" precisa de `UNIQUE` + `ON CONFLICT`.** A
  D14 decidiu o contrário de propósito: histórico por padrão, "atual" é só
  uma leitura ordenada por `data_geracao`. Não adicionar constraint que a
  decisão já descartou.
- **Deixar `DiagnosticoIA.semana_referencia` no schema/tipos por hábito.** A
  D15 trocou esse campo por `fk_treino` — se aparecer `semana_referencia` em
  algum arquivo novo desta sessão, é sinal de que o código antigo (pré-D15)
  foi copiado sem revisar.
