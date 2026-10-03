# Semana 9 · 28/09–04/10 · Hardening + Testes de Integração 🏁 DEV PRONTO

> Entregável: **sistema completo + testes verdes, tag `v1.0-dev`** (DEV PRONTO até
> 06/10) — [card do entregável](https://trello.com/c/Usgbx6xy). Ver S9 no
> [`TASKS.md`](./TASKS.md) e a linha S9 do cronograma no
> [`PLANEJAMENTO.md`](./PLANEJAMENTO.md).
> Decisões novas desta semana: **D19** (cada tela ganha URL com `react-router`,
> encerra a D7), **D20** (série nova só em treino aberto), **D21** (tirar um dia
> da semana não apaga o histórico) e **D22** (começar treino fecha o treino
> esquecido aberto de outro dia).

> **Ponto de partida (conferido em 01/10):** `npm run test` no `server` com
> **62/62 verde**, `npm run build` sem erro nos dois lados, `main` limpo e
> igual ao `origin/main`. Da S8 ficaram abertos só a demo gravada, os prints
> provisórios das Fig. 4/5 e o `/trello-sync`, e os três vão para o fechamento
> desta semana (Passo 1).

> **Revisão de 03/10 — nível de estudante.** A primeira versão deste roteiro
> tinha 14 testes novos, 8 requisições novas no Postman, tratamento para erro
> que o usuário nem alcança pela tela e um fluxo de "Retomar treino" com três
> caminhos. Era maduro demais para um TCC de graduação e difícil de defender
> linha por linha. Ela foi enxugada pelo critério dos **3 níveis** (ver
> [`INSTRUCOES.md`](./INSTRUCOES.md), seção "Nível do projeto"): fica completo
> o que o texto do TCC promete, conserta-se de forma simples o bug que aparece
> no uso normal, e sai o resto. **Cortado:** os testes de cada decisão (D21,
> D22, rota inexistente), o 400 para exercício inexistente (FK 23503), o
> Postman 25.x, a tela de "Retomar treino", o modo `invalido` da IA, o aviso de
> erro de conexão e a sessão expirada no front, e o `oxlint` zerado.

> **Como este roteiro está dividido:** a **Parte 1** (Passos 0–1) só fecha o
> que ficou da S8. A **Parte 2** é a S9 de fato, em duas sessões: a **Sessão A**
> (Passos 2–8) é backend, com as correções e os testes de integração. A
> **Sessão B** (Passos 9–14) é front: rotas (D19), barra inferior (D6), teclado
> numérico, limpeza e o teste no celular. O Passo 15 fecha a semana e cria a
> tag.

> **O que o texto do TCC pede (Seção D, Procedimentos de Validação):** *"Os
> testes de integração verificarão a comunicação entre os módulos do sistema,
> assegurando que o fluxo completo de envio de métricas à API Gemini (RF05), a
> persistência do diagnóstico retornado (RF06) e a exibição do histórico ao
> usuário (RF07) operem sem falhas de execução. Essa frente cobrirá diretamente
> os requisitos RNF02, RNF03 e RNF06."* A tabela abaixo mostra onde cada linha
> da Tabela VI (matriz de rastreabilidade) é provada. Ela já serve de rascunho
> para o capítulo de resultados.

| Requisito | Método (Tabela VI) | Critério de aceite | Onde é provado |
|---|---|---|---|
| RF05 | Integração + validação de conteúdo | Diagnóstico retornado em JSON válido | `integration.test.ts`, fluxo completo (etapa 5). O **conteúdo** é a Frente 3 (OUT) |
| RF06 | Integração | Diagnóstico salvo no banco após retorno | Fluxo completo: `SELECT` em `DiagnosticoIA` depois do `generate` |
| RF07 | Integração + usabilidade | Dados exibidos corretamente na interface | Fluxo completo (etapa 6, histórico e detalhe pela API) + celular no Passo 13. A heurística é a Frente 2 (OUT) |
| RNF01 | Avaliação de usabilidade | Sem violações graves nos fluxos principais | Rotas (Passo 10) + barra inferior (Passo 11) + teclado (Passo 12) + celular (Passo 13). A avaliação formal é a Frente 2 |
| RNF02 | Integração | Rejeição de registros órfãos | Dois testes RNF02 (banco direto) |
| RNF03 | Unidade | Cálculos só no backend | Já coberto desde a S6/S7 (`volume.test.ts`, `calcularPv`/`calcularPi`). Nada novo |
| RNF05 | Integração | JSON parseável sem erros pelo Node.js | `interpretarResposta` (Passo 5) + teste de unidade (Passo 6) |
| RNF06 | Integração | Registros intactos após falha simulada | Teste RNF06 (`GEMINI_MOCK=falha`) + conferência pela tela no Passo 15 |

> **Escopo da semana (o que NÃO entra):** feature nova, URL para as abas
> internas do Histórico (só as 5 telas ganham rota), code splitting do bundle
> (o aviso de chunk > 500 kB do `vite build` é aviso, não erro), avaliação
> heurística (Frente 2, OUT) e validação do conteúdo da IA (Frente 3, OUT). As
> **figuras finais** saem só depois do code freeze (19/10), conforme a seção 5
> do `PLANEJAMENTO.md`.

Critério de aceite (card 🎯 ENTREGÁVEL S9):
- [ ] Testes de integração verdes (RF05/06/07)
- [ ] RNF02: registros órfãos rejeitados pelo banco (teste)
- [ ] RNF06: falha simulada da API preserva registros (teste)
- [ ] Responsividade OK nos fluxos críticos (RNF01)
- [ ] Sidebar vira barra inferior (ícones) em telas pequenas — Decisão D6
- [ ] Código limpo: sem console.logs, código morto ou TODOs
- [ ] Tag v1.0-dev criada e enviada (🏁 DEV PRONTO antes de 06/10)

---

## Defeitos encontrados no planejamento

Lendo o código da S1 à S8, apareceram estes defeitos. Todos aparecem no uso
normal do sistema, e nenhum é cosmético.

| # | Defeito | Como aparece | Passo |
|---|---|---|---|
| 1 | Não existe tratador de erro no fim do `app.ts` | Rota inexistente ou exceção sem `try/catch` respondem **HTML**. O `apiFetch` do front faz `resposta.json()` e quebra com `Unexpected token '<'` | 2 |
| 2 | Série entra em treino já finalizado | `POST /sessions/:id/sets` não confere `completed`. Uma série nova depois do diagnóstico deixa a avaliação gravada descrevendo outro treino | 3 |
| 3 | Tirar da semana um dia que já foi treinado dá 500 | `PUT /divisions` apaga a `Divisao`, mas `Treino.fk_divisao` aponta pra ela sem `ON DELETE`. Quem treinou segunda **nunca mais** consegue tirar a segunda da rotina | 4 |
| 4 | Treino esquecido aberto some de tudo | O Treino de hoje só enxerga treino aberto **de hoje**, e o histórico só mostra treino **finalizado** (D18-1). O treino de ontem que a pessoa esqueceu de finalizar não aparece em lugar nenhum | 4 |
| 5 | No celular, a sidebar come um terço da tela | A `AppShell` reserva `116px` à esquerda em qualquer largura. Num celular de 360px, o calendário de 7 colunas do Histórico não cabe | 11 |
| 6 | O teclado numérico nunca abriu no celular, e "82,5" é recusado | O `inputMode` foi passado direto no `TextField`, e o MUI joga esse prop na `div` de fora. E o teclado brasileiro digita **vírgula**: `Number('82,5')` vira `NaN`, que vai como `null` e o backend responde 400 | 12 |

---

## Decisões novas desta semana

> **D19 — Cada tela ganha URL, com `react-router` (01/10).** A D7 deixou para
> a S9 decidir se o app ganharia roteamento real. Fica o `react-router`, por
> causa de onde o sistema é usado, que é o celular no meio do treino: o
> navegador do celular recarrega a aba que ficou em segundo plano (com
> navegação por estado, a pessoa volta para "Minha divisão" no meio da série),
> e o "voltar" do Android fecha o app em vez de voltar de tela. São só 5 telas
> fixas. Ficam sem rota as abas internas do Histórico. Se o tempo apertar, é o
> **primeiro corte** da semana.

> **D20 — Série nova só em treino aberto (01/10).** `POST
> /sessions/:id/sets` em treino **finalizado** responde **409**. O treino
> finalizado já tem duração calculada (D12) e pode já ter diagnóstico (D14).
> A tela nunca fez isso, porque depois do finish ela não mostra mais o
> formulário. O buraco era só na API. A D11 não muda.

> **D21 — Tirar um dia da semana não apaga o histórico (01/10).**
> `Treino.fk_divisao` passa a ser `ON DELETE SET NULL`. Os treinos daquele dia
> continuam com todas as séries e só perdem o vínculo com o dia. A tela já
> mostra "Sem divisão" quando `nome_divisao` é `null`. O DER não muda (o
> vínculo `Treino → Divisao` já era opcional) e a RNF02 continua valendo:
> nenhum registro fica apontando para algo que não existe.

> **D22 — Começar treino fecha o treino esquecido (revisada 03/10).** Quando
> a pessoa toca em "Começar treino", qualquer treino dela que ficou aberto de
> um dia anterior é finalizado antes, **sem duração** (`duracao_total =
> NULL`), porque não dá para saber quando ele acabou. Assim ele entra no
> calendário do Histórico e nunca existem dois treinos abertos. As séries dele
> já contavam no volume (D11) e no gráfico (D17). Limitação aceita: quem
> começa às 23h e passa da meia-noite perde o formulário do treino aberto (as
> séries continuam salvas). A versão anterior desta decisão tinha um botão
> "Retomar treino" e fechamento automático por idade do treino. Foi cortada
> na revisão de 03/10 por ser complexa demais para o ganho.

---

# Parte 1 — Pendências da S8

## Passo 0 — Conferir que a S8 está mesmo fechada

- [x] `npm run test` no `server` sai **62/62 verde** (conferido em 01/10).
  Qualquer vermelho a partir daqui é desta semana, não herança.
- [x] `npm run build` nos dois lados sem erro (conferido em 01/10).
- [x] `server/.env` com `GEMINI_MOCK=true`. A chave real só entra no Passo 15
  (demo e prints).
- [x] Rodar o **`/trello-sync`**, para o quadro mostrar o que de fato falta.

## Passo 1 — O que da S8 fica para o fechamento desta semana

- [ ] A **demo ponta a ponta** e os **prints provisórios das Fig. 4 e 5**
  (card [📸 Tirar print da tela de Diagnóstico e
  Histórico](https://trello.com/c/8ciFP1Px)) passam para o Passo 15. Gravando
  depois, a demo já mostra o sistema da tag `v1.0-dev`, com a barra inferior e
  o teclado novos.

---

# Parte 2 — Implementação da S9

## Sessão A — Backend: correções + testes de integração

### Passo 2 — Erros em JSON no fim do `app.ts`

- [ ] Duas peças no fim do `server/src/app.ts`, **depois** de todas as rotas.
  A primeira responde 404 para o que não casou com rota nenhuma. A segunda pega
  qualquer erro que chegou até ali (no Express 5, exceção em função `async`
  também chega) e responde JSON em vez da página HTML padrão do Express.
- [ ] O `erro.status` cobre o JSON malformado no corpo: o `express.json()` já
  marca esse erro com status 400. O resto vira 500.

```ts
import express, { Request, Response, NextFunction } from 'express';

// ...depois do app.use(historyRoutes):

//nenhuma rota casou
app.use((req: Request, res: Response) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

//erro que nao foi tratado no controller. precisa dos 4 parametros pro express reconhecer
app.use((erro: any, req: Request, res: Response, next: NextFunction) => {
  console.error(erro);
  res.status(erro.status || 500).json({ erro: 'Erro ao processar a requisição' });
});
```

- [ ] Conferir rápido: `curl http://localhost:3000/nao-existe` devolve
  `{"erro":"Rota não encontrada"}`, e não `<!DOCTYPE html>`.

### Passo 3 — D20: série nova só em treino aberto (`sessionController.ts`)

- [ ] No `registrarSerie`, logo depois do `if (!treino) … 404`:

```ts
    if (treino.completed) {
        return res.status(409).json({ erro: 'Treino já finalizado' });
    }
```

- [ ] O 404 vem antes de propósito: treino de outro usuário responde "não
  encontrado", e não revela que existe.

### Passo 4 — D21 e D22: `schema.sql`, `ALTER` e treino esquecido

- [ ] **D21.** Em `server/schema.sql`, na tabela `Treino`, a linha do
  `fk_divisao`:

```sql
  fk_divisao UUID REFERENCES Divisao(id_divisao) ON DELETE SET NULL,
```

- [ ] O projeto não usa migrations: editar o `schema.sql` **não muda o banco
  local**. Em vez de `npm run db:reset`, que apaga tudo, rode o `ALTER` no
  `psql` ou no pgAdmin. O nome padrão da constraint é
  `treino_fk_divisao_fkey`. Se o `DROP` reclamar, confira com
  `\d treino` no `psql`.

```sql
ALTER TABLE Treino DROP CONSTRAINT treino_fk_divisao_fkey;
ALTER TABLE Treino ADD CONSTRAINT treino_fk_divisao_fkey
  FOREIGN KEY (fk_divisao) REFERENCES Divisao(id_divisao) ON DELETE SET NULL;
```

- [ ] Conferir pela tela: com um treino finalizado hoje, vá em Minha divisão,
  tire o dia de hoje e salve. Tem que salvar sem erro, e no Histórico o treino
  aparece como "Sem divisão".
- [ ] **D22.** `server/src/models/sessionModel.ts`, função nova depois do
  `buscarTreinoAberto`. A comparação de data fica no SQL, com o mesmo
  `CURRENT_DATE` que o `buscarTreinoAberto` usa:

```ts
//treino que ficou aberto de outro dia (esqueceu de finalizar).
//fecha sem duracao porque nao da pra saber quando acabou
export async function fecharTreinosAntigos(fkUsuario: string): Promise<void> {
  await pool.query(
    `UPDATE Treino SET completed = TRUE
    WHERE fk_usuario = $1 AND completed = FALSE AND data::date < CURRENT_DATE`,
    [fkUsuario]
  );
}
```

- [ ] `server/src/controllers/sessionController.ts`, no `comecarTreino`, logo
  **depois** do `if (aberto) { … }`:

```ts
    await sessionModel.fecharTreinosAntigos(fkUsuario);
```

- [ ] Conferir: comece um treino e, no `psql`, mande ele para ontem:

```sql
UPDATE Treino SET data = data - INTERVAL '1 day' WHERE completed = FALSE;
```

  Recarregue o Treino de hoje e toque em "Começar treino". O de ontem aparece
  no Histórico sem duração, e o de hoje abre vazio.

### Passo 5 — IA: modo `falha` e conferência do JSON (`geminiService.ts`)

- [ ] Dois ajustes para os testes do RNF05 e do RNF06:
  1. O `GEMINI_MOCK` hoje é uma `const`, lida uma vez só, no `import`. Para o
     teste do RNF06 simular a IA fora do ar no meio da suíte, ele passa a ser
     lido a cada chamada e ganha o valor `falha`.
  2. O texto do Gemini vira diagnóstico com `JSON.parse(texto) as
     DiagnosticoConteudo`, e o `as` não confere nada. Se a IA devolver um JSON
     sem um dos três campos, ele é gravado assim mesmo e a tela quebra ao
     abrir. A função nova confere os três campos antes.
- [ ] `server/src/config/gemini.ts`: apagar o comentário e a linha `export
  const GEMINI_MOCK = …`. Ficam só o `GEMINI_MODEL` e o `ai`.
- [ ] `server/src/services/geminiService.ts`, o `import` do topo vira
  `import { ai, GEMINI_MODEL } from '../config/gemini';`, e antes do
  `gerarDiagnostico` entra:

```ts
//RNF05: so aceita a resposta da IA se for JSON com os 3 campos do bloco 5
export function interpretarResposta(texto: string): DiagnosticoConteudo {
  const dados = JSON.parse(texto); //se nao for JSON, ja lanca erro aqui

  if (
    !Array.isArray(dados?.diagnostico_exercicios) ||
    !Array.isArray(dados?.analise_grupamentos) ||
    !Array.isArray(dados?.recomendacoes_proxima_sessao)
  ) {
    throw new Error('Resposta da IA fora do formato esperado');
  }

  //devolve so os 3 campos: se a IA mandar um score, ele nao vai pro banco (D13)
  return {
    diagnostico_exercicios: dados.diagnostico_exercicios,
    analise_grupamentos: dados.analise_grupamentos,
    recomendacoes_proxima_sessao: dados.recomendacoes_proxima_sessao,
  };
}
```

- [ ] No `gerarDiagnostico`, o começo e o fim mudam:

```ts
  //lido a cada chamada pro teste do RNF06 conseguir trocar no meio da suite
  const modo = process.env.GEMINI_MOCK;
  if (modo === 'falha') {
    throw new Error('Falha simulada da API Gemini');
  }
  if (modo === 'true') {
    return mockDiagnostico(volume, series);
  }

  // ...montarPrompt e generateContent iguais

  return interpretarResposta(texto);
```

- [ ] Erro lançado aqui cai no `catch` do `diagnosticController`, que já
  responde 502 e não grava nada.
- [ ] `server/.env.example`, acima do `GEMINI_MOCK=true`:

```
# true = mock (dev/testes) | falha = simula a API fora do ar | false = Gemini de verdade
```

### Passo 6 — Testes novos nos arquivos que já existem (2 testes)

- [ ] `server/src/__tests__/diagnostic.test.ts`: **1 teste de unidade** do
  RNF05. Acrescentar o import no topo:

```ts
import { interpretarResposta } from '../services/geminiService';

test('RNF05: resposta da IA só vira diagnóstico se for JSON com os 3 campos', () => {
    const texto = JSON.stringify({
        diagnostico_exercicios: [],
        analise_grupamentos: [],
        recomendacoes_proxima_sessao: ['subir 2,5 kg'],
    });
    assert.deepEqual(interpretarResposta(texto).recomendacoes_proxima_sessao, ['subir 2,5 kg']);

    assert.throws(() => interpretarResposta('Claro! Aqui está o diagnóstico do treino.'));
    assert.throws(() => interpretarResposta(JSON.stringify({ diagnostico_exercicios: [] })));
});
```

- [ ] `server/src/__tests__/session.test.ts`: **1 teste** da D20. Trocar o
  import dos helpers para
  `import { registrarELogar, registrarComRotinaDeHoje, registrarComTreinoAberto } from './testHelpers';`.

```ts
test('D20: série em treino finalizado é recusada com 409', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  await request(app)
    .post(`/sessions/${idTreino}/finish`)
    .set('Authorization', `Bearer ${token}`);

  const resposta = await request(app)
    .post(`/sessions/${idTreino}/sets`)
    .set('Authorization', `Bearer ${token}`)
    .send({ fk_exercicio: exercicio.id_exercicio, tipo: 'work', carga: 60, repeticoes: 10, rir: 2 });

  assert.equal(resposta.status, 409);
});
```

### Passo 7 — `server/src/__tests__/integration.test.ts` (novo, 4 testes)

- [ ] É o arquivo que a matriz de rastreabilidade cita. O **fluxo completo**
  começa do cadastro e passa por todas as camadas até o histórico. Os outros
  três provam RNF02 e RNF06.
- [ ] Os números do fluxo são conta de cabeça. Com 2 séries válidas num
  grupamento (RPE 9 e RPE 8):
  - **Pv** = min(2/10, 1) × 100 = **20**
  - **Pi** = média(100; 66,67) = **83,33**
  - **score** = round((20 + 83,33) / 2) = **52**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app';
import { pool } from '../config/db';
import { registrarComTreinoAberto } from './testHelpers';

//testes de integracao da Tabela VI do TCC: RF05, RF06, RF07, RNF02 e RNF06

const TREINO_INEXISTENTE = '00000000-0000-0000-0000-000000000000';

function get(caminho: string, token: string) {
  return request(app).get(caminho).set('Authorization', `Bearer ${token}`);
}

function post(caminho: string, token: string, corpo?: object) {
  const pedido = request(app).post(caminho).set('Authorization', `Bearer ${token}`);
  return corpo ? pedido.send(corpo) : pedido;
}

function put(caminho: string, token: string, corpo: object) {
  return request(app).put(caminho).set('Authorization', `Bearer ${token}`).send(corpo);
}

//treino com 2 series validas, ja finalizado
async function treinoFinalizado() {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  const serie = { fk_exercicio: exercicio.id_exercicio, tipo: 'work', carga: 80 };
  await post(`/sessions/${idTreino}/sets`, token, { ...serie, repeticoes: 8, rir: 1 });
  await post(`/sessions/${idTreino}/sets`, token, { ...serie, repeticoes: 7, rir: 2 });
  await post(`/sessions/${idTreino}/finish`, token);
  return { token, idTreino };
}


test('fluxo completo: cadastro, rotina, treino, volume, diagnóstico e histórico (RF05, RF06, RF07)', async () => {
  //1. cadastro e login
  const email = `integracao${Date.now()}@teste.com`;
  const cadastro = await request(app).post('/auth/register').send({ nome: 'Integração', email, senha: '123456' });
  assert.equal(cadastro.status, 201);
  const login = await request(app).post('/auth/login').send({ email, senha: '123456' });
  const token = login.body.token;

  //2. rotina de hoje com um exercicio
  const divisao = await put('/divisions', token, {
    divisoes: [{ dia_semana: new Date().getDay(), nome: 'Peito' }],
  });
  const idDivisao = divisao.body.divisoes[0].id_divisao;
  const catalogo = await get('/exercises', token);
  const exercicio = catalogo.body.exercicios[0];
  await put(`/divisions/${idDivisao}/exercises`, token, {
    exercicios: [{ fk_exercicio: exercicio.id_exercicio }],
  });

  //3. treino: 1 aquecimento + 2 validas (uma com RIR e outra com RPE)
  const inicio = await post('/sessions/start', token);
  const idTreino = inicio.body.treino.id_treino;
  const base = { fk_exercicio: exercicio.id_exercicio };
  await post(`/sessions/${idTreino}/sets`, token, { ...base, tipo: 'aquecimento', carga: 40, repeticoes: 12 });
  await post(`/sessions/${idTreino}/sets`, token, { ...base, tipo: 'work', carga: 80, repeticoes: 8, rir: 1 });
  await post(`/sessions/${idTreino}/sets`, token, { ...base, tipo: 'work', carga: 80, repeticoes: 7, rpe: 8 });
  const fim = await post(`/sessions/${idTreino}/finish`, token);
  assert.equal(fim.status, 200);

  //4. volume: so as 2 validas contam
  const volume = await get('/metrics/weekly-volume', token);
  const grupo = volume.body.volume.grupamentos.find(
    (g: { nome_grupamento: string }) => g.nome_grupamento === exercicio.nome_grupamento
  );
  assert.equal(grupo.series_validas, 2);

  //5. diagnostico (RF05): os 3 campos + score calculado no backend
  const geracao = await post(`/sessions/${idTreino}/diagnostics/generate`, token);
  assert.equal(geracao.status, 201);
  const diagnostico = geracao.body.diagnostico;
  assert.ok(diagnostico.conteudo_json.recomendacoes_proxima_sessao.length > 0);
  assert.equal(diagnostico.score_geral, 52);

  //RF06: o diagnostico esta gravado no banco
  const salvo = await pool.query('SELECT score_geral FROM DiagnosticoIA WHERE fk_treino = $1', [idTreino]);
  assert.equal(salvo.rowCount, 1);
  assert.equal(salvo.rows[0].score_geral, 52);

  //6. historico (RF07): a sessao aparece no mes e o detalhe traz series e diagnostico
  const mes = await get('/history/sessions', token);
  const sessao = mes.body.sessoes.find((s: { id_treino: string }) => s.id_treino === idTreino);
  assert.equal(sessao.score_geral, 52);

  const detalhe = await get(`/history/sessions/${idTreino}`, token);
  assert.equal(detalhe.body.exercicios[0].series.length, 3);
  assert.equal(detalhe.body.diagnostico.id_diagnostico, diagnostico.id_diagnostico);
});


test('RNF02: o banco rejeita série e diagnóstico de treino inexistente', async () => {
  await assert.rejects(
    pool.query(
      `INSERT INTO SerieTreino (fk_treino, fk_exercicio, tipo, carga, repeticoes)
       VALUES ($1, (SELECT MIN(id_exercicio) FROM Exercicio), 'aquecimento', 20, 10)`,
      [TREINO_INEXISTENTE]
    )
  );
  await assert.rejects(
    pool.query(
      `INSERT INTO DiagnosticoIA (fk_usuario, fk_treino, score_geral, conteudo_json)
       VALUES ($1, $1, 50, '{}')`,
      [TREINO_INEXISTENTE]
    )
  );
});


test('RNF02: o banco não deixa apagar um treino que tem séries', async () => {
  const { idTreino } = await treinoFinalizado();

  await assert.rejects(pool.query('DELETE FROM Treino WHERE id_treino = $1', [idTreino]));
});


test('RNF06: falha simulada da IA devolve 502 e o treino continua intacto', async () => {
  const { token, idTreino } = await treinoFinalizado();

  process.env.GEMINI_MOCK = 'falha';
  const geracao = await post(`/sessions/${idTreino}/diagnostics/generate`, token);
  process.env.GEMINI_MOCK = 'true';

  assert.equal(geracao.status, 502);

  const detalhe = await get(`/history/sessions/${idTreino}`, token);
  assert.equal(detalhe.body.exercicios[0].series.length, 2);
  assert.equal(detalhe.body.diagnostico, null);
});
```

- [ ] `npm run test`: **68/68** (62 da S8 + 2 do Passo 6 + 4 deste). O teste
  RNF06 imprime um stack trace no terminal, que é o `console.error` do
  controller. Isso é esperado: é o log de erro funcionando, não teste falhando.

### Passo 8 — Postman: nada novo

- [ ] A coleção continua com as **78 requisições** da S8. Os casos novos desta
  semana já estão nos testes automáticos, e repetir no Postman seria cobertura
  dobrada. Só rodar o **Run collection** no fim (Passo 15) para ver se nada
  quebrou.

---

## Sessão B — Front: responsividade + limpeza

### Passo 9 — `VITE_API_URL` (para testar no celular)

- [ ] O `API_URL` do `client/src/services/api.ts` está fixo em `localhost`. No
  celular, `localhost` é o próprio celular, e o Passo 13 não funciona. Trocar
  a linha:

```ts
//no celular, o client/.env.local aponta pro IP do PC
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
```

- [ ] `client/.env.example` (novo, versionado):

```
# para testar no celular: http://<IP do PC na rede>:3000 (copiar para .env.local)
VITE_API_URL=http://localhost:3000
```

### Passo 10 — D19: uma URL por tela (`react-router`)

- [ ] As 5 telas viram rotas: `/divisao`, `/treino`, `/volume`, `/diagnostico` e
  `/historico`. O `useState<Tela>` do `App.tsx` sai, e quem diz qual tela está
  aberta passa a ser a URL.
- [ ] Instalar no `client/` (na v7 o pacote é `react-router`, não mais
  `react-router-dom`):

```bash
npm install react-router
```

- [ ] `client/src/main.tsx`: o `BrowserRouter` por fora de tudo. O `useNavigate`
  só funciona dentro dele.

```tsx
import { BrowserRouter } from 'react-router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] `client/src/App.tsx` (completo). Sem usuário, a `AuthView` aparece em
  qualquer URL. Depois do login, a pessoa cai na tela que tinha pedido.

```tsx
import { Navigate, Route, Routes } from 'react-router'
import { useAuth } from './context/AuthContext'
import { AuthView } from './views/AuthView'
import { DivisionView } from './views/DivisionView'
import { TodaySessionView } from './views/TodaySessionView'
import { WeeklyVolumeView } from './views/WeeklyVolumeView'
import { DiagnosticView } from './views/DiagnosticView'
import { HistoryView } from './views/HistoryView'

import { AppShell } from './components/AppShell'
import { PageLayout } from './components/PageLayout'
import { Typography } from '@mui/material'

function App() {
  const { usuario, carregando } = useAuth();

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
      <Routes>
        <Route path="/divisao" element={<DivisionView />} />
        <Route path="/treino" element={<TodaySessionView />} />
        <Route path="/volume" element={<WeeklyVolumeView />} />
        <Route path="/diagnostico" element={<DiagnosticView />} />
        <Route path="/historico" element={<HistoryView />} />
        {/* qualquer outra URL vai pra primeira tela */}
        <Route path="*" element={<Navigate to="/divisao" replace />} />
      </Routes>
    </AppShell>
  )
}

export default App
```

- [ ] `client/src/views/TodaySessionView.tsx`: a prop `onVerDiagnostico` sai, e
  a tela navega sozinha depois de avaliar.

```tsx
import { useNavigate } from 'react-router';

export function TodaySessionView() {
  const navigate = useNavigate();
  // ...o resto dos estados igual

  //dentro do avaliar(), no lugar do onVerDiagnostico():
      navigate('/diagnostico');
```

- [ ] `AppShell` e `Sidebar` deixam de receber `tela`/`onNavegar`: o código
  dos dois está no Passo 11. O `export type Tela` do `App.tsx` deixa de
  existir, e o `tsc` acusa qualquer import dele que tenha sobrado.
- [ ] Testar: em cada tela, F5 → continua nela. Navegue Divisão → Treino →
  Volume e use o "voltar" do navegador → Treino → Divisão.
- [ ] **Se este passo for cortado**, o Passo 11 continua valendo com uma troca:
  a `Sidebar` recebe de novo `tela` e `onNavegar` como props, como hoje.

### Passo 11 — D6: barra inferior no celular (`Sidebar.tsx` + `AppShell.tsx`)

- [ ] Abaixo de 600px (breakpoint `sm`), a lateral dá lugar a uma barra fixa
  embaixo, só com ícones. A `Sidebar` só escolhe entre dois componentes, cada
  um com os próprios hooks. Hook depois de um `return` condicional quebra o
  React quando a largura muda.
- [ ] O `noSsr: true` faz o `useMediaQuery` responder já no primeiro render.
  Sem ele, a lateral pisca no celular antes de virar barra.
- [ ] No celular, o item de sair é o ícone de sair, e não o avatar: avatar sem
  nome embaixo não diz o que faz.
- [ ] O `disponivel`/`opacity: 0.45` que ficou da S3 sai: todo item tem tela.
- [ ] O visual da lateral (cores, raio, animação de expandir no hover) é o
  mesmo do modelo adotado na S3 (`DESIGN-BASE.md`). Só a tela ativa passa a vir
  da URL.

`client/src/components/Sidebar.tsx` (completo):

```tsx
import { useState, type ReactNode } from 'react';
import { Avatar, Box, ButtonBase, Stack, Typography, useMediaQuery } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import BarChartIcon from '@mui/icons-material/BarChart';
import InsightsIcon from '@mui/icons-material/Insights';
import TimelineIcon from '@mui/icons-material/Timeline';
import LogoutIcon from '@mui/icons-material/Logout';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

//desktop: lateral que expande no hover. celular: barra embaixo so com icones (D6)

interface NavItem {
  label: string;
  icon: ReactNode;
  rota: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Minha divisão', icon: <CalendarViewWeekIcon fontSize="small" />, rota: '/divisao' },
  { label: 'Treino de hoje', icon: <FitnessCenterIcon fontSize="small" />, rota: '/treino' },
  { label: 'Volume da semana', icon: <BarChartIcon fontSize="small" />, rota: '/volume' },
  { label: 'Diagnóstico', icon: <InsightsIcon fontSize="small" />, rota: '/diagnostico' },
  { label: 'Histórico', icon: <TimelineIcon fontSize="small" />, rota: '/historico' },
];

const COLLAPSED = 76;
const EXPANDED = 244;

export function Sidebar() {
  const celular = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'), { noSsr: true });
  return celular ? <BarraInferior /> : <BarraLateral />;
}

function BarraLateral() {
  const [aberta, setAberta] = useState(false);
  const { usuario, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <Box
      component={motion.nav}
      animate={{ width: aberta ? EXPANDED : COLLAPSED }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      onMouseEnter={() => setAberta(true)}
      onMouseLeave={() => setAberta(false)}
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
          const ativo = pathname === item.rota;

          return (
            <Stack
              key={item.rota}
              direction="row"
              spacing={1.75}
              alignItems="center"
              onClick={() => navigate(item.rota)}
              sx={{
                px: 1.75,
                py: 1.25,
                borderRadius: '999px',
                cursor: 'pointer',
                bgcolor: ativo ? 'primary.main' : 'transparent',
                color: ativo ? '#F3F6F4' : 'inherit',
                '&:hover': { bgcolor: ativo ? 'primary.main' : 'rgba(255,255,255,0.07)' },
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

function BarraInferior() {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <Box
      component="nav"
      sx={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 12,
        height: 64,
        px: 1,
        bgcolor: '#0F1B17',
        borderRadius: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        boxShadow: '0 20px 45px -18px rgba(15, 27, 23, 0.55)',
        zIndex: 10,
      }}
    >
      {NAV_ITEMS.map((item) => {
        const ativo = pathname === item.rota;
        return (
          <ButtonBase
            key={item.rota}
            aria-label={item.label}
            onClick={() => navigate(item.rota)}
            sx={{
              width: 44,
              height: 44,
              borderRadius: '999px',
              color: ativo ? '#F3F6F4' : '#C7D3CE',
              bgcolor: ativo ? 'primary.main' : 'transparent',
            }}
          >
            {item.icon}
          </ButtonBase>
        );
      })}
      <ButtonBase
        aria-label="Sair"
        onClick={logout}
        sx={{ width: 44, height: 44, borderRadius: '999px', color: '#7C8B85' }}
      >
        <LogoutIcon fontSize="small" />
      </ButtonBase>
    </Box>
  );
}
```

`client/src/components/AppShell.tsx` (completo):

```tsx
import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { Sidebar } from './Sidebar';
import { PageLayout } from './PageLayout';

//espaco reservado pra navegacao nao cobrir o conteudo: a esquerda no desktop, embaixo no celular
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Sidebar />
      <Box sx={{ pl: { xs: 0, sm: '116px', md: '136px' }, pb: { xs: '96px', sm: 0 } }}>
        <PageLayout>{children}</PageLayout>
      </Box>
    </Box>
  );
}
```

- [ ] O `xs` do `sx` e o `down('sm')` do `useMediaQuery` valem os dois abaixo
  de 600px. Se um mudar sem o outro, aparece uma faixa com a barra embaixo e
  116px vazios à esquerda.
- [ ] Testar no DevTools (Ctrl+Shift+M), em **599px e 600px**: em 599, a barra
  embaixo; em 600, a lateral.

### Passo 12 — Treino de hoje: teclado numérico e vírgula decimal

- [ ] **Teclado:** em `client/src/views/TodaySessionView.tsx`, nos três campos
  (carga, reps e RIR/RPE), o `inputMode` sai do `TextField` e vai para o
  `<input>` de dentro, pelo `slotProps`. Direto no `TextField`, o MUI coloca o
  atributo na `div` de fora (dá para ver no DevTools), e o celular abre o
  teclado de letras.

```tsx
                    <TextField
                      label="Carga (kg)"
                      size="small"
                      slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                      value={rascunho.carga}
                      onChange={(e) =>
                        atualizarRascunho(exercicio.fk_exercicio, 'carga', e.target.value)
                      }
                    />
```

  Nos campos de reps e de RIR/RPE, o mesmo com `inputMode: 'numeric'`.

- [ ] **Vírgula:** no `registrar`, a carga troca vírgula por ponto antes do
  `Number`:

```tsx
        carga: Number(rascunho.carga.replace(',', '.')), //teclado pt-BR digita virgula
```

- [ ] Testar no DevTools: carga `82,5` → a série aparece como `82.5 kg × …`.
  O teclado só dá para conferir no celular (Passo 13).

### Passo 13 — Testar no celular de verdade (RNF01)

- [ ] O DevTools estreito não mostra teclado nem toque, e a Fig. 2 vai ser
  tirada no aparelho. Então o teste é no celular:
  1. `ipconfig` no Windows → o **IPv4** da placa Wi-Fi (ex.: `192.168.0.15`).
  2. `client/.env.local` com `VITE_API_URL=http://192.168.0.15:3000`.
  3. `npm run dev -- --host` no `client` (reinicie se já estava rodando: o
     Vite só lê o `.env` no start).
  4. Na primeira vez, o Firewall do Windows pergunta sobre o `node`: liberar em
     **rede privada**.
  5. No celular, na **mesma Wi-Fi**: `http://192.168.0.15:5173`.
- [ ] Roteiro no aparelho:
  - **Rotas:** no meio do Treino de hoje, troque para outro app e volte. Se a
    aba recarregar, ela volta em `/treino`, com as séries. O "voltar" do
    Android volta de tela.
  - **Barra inferior:** os 5 ícones + sair. O botão "Finalizar e avaliar
    treino" aparece inteiro acima da barra.
  - **Minha divisão:** o diálogo de exercícios abre e a lista rola.
  - **Treino de hoje:** o teclado numérico abre, e `82,5` grava como 82.5 kg.
  - **Volume, Diagnóstico e Histórico:** nada estoura a largura, e o
    calendário cabe nas 7 colunas.
- [ ] O que quebrar aqui é o **buffer de bugs** da Sessão B: anote, corrija e
  repita só a tela afetada.

### Passo 14 — Limpeza (critério "código limpo")

- [ ] **Sem `console.log` de depuração.** O `console.error` dos `catch` e do
  tratador do Passo 2 fica, porque é o registro de erro do servidor. O
  `console.log` do `index.ts` ("server rodando na porta…") e os do
  `seed.ts`/`resetDb.ts` também ficam: são saída de script.

```bash
# da raiz do repo: so pode sobrar index.ts, seed.ts e resetDb.ts
grep -rn "console.log" server/src client/src
grep -rn "TODO\|FIXME" server/src client/src
```

- [ ] **Arquivos que sobraram do template do Vite** e do hello world da S1
  (nenhum é importado):

```bash
git rm client/src/App.css client/src/index.css
git rm -r client/src/assets
git rm client/public/icons.svg client/README.md
git rm server/scripts/test-gemini.ts
```

- [ ] `client/index.html`: `<html lang="pt-BR">` e `<title>HyperTrack</title>`.
- [ ] **Comentários.** Passar o olho nos arquivos das S5–S8 e enxugar
  comentário longo que explica decisão (os que citam D11, D14 etc. em várias
  linhas). Comentário fica onde você mesmo comentaria: o porquê de uma linha
  que não é óbvia, em uma linha. A justificativa das decisões está no
  `PLANEJAMENTO.md` e no texto do TCC, não precisa estar no código.
- [ ] **`README.md` da raiz** está parado na S1: diz "diagnóstico **semanal**"
  e "Status: Semana 1". Corrigir a descrição para "diagnóstico **por sessão de
  treino** gerado por IA (Google Gemini), com score calculado no backend",
  acrescentar `npm run db:reset` e `npm run test` nos comandos, e trocar o
  status para "DEV PRONTO — tag `v1.0-dev` (04/10/2026)".

---

## Passo 15 — Fechar a semana (🏁 DEV PRONTO)

1. [ ] `npm run test` no `server` verde na suíte inteira: **68/68**, com
   `GEMINI_MOCK=true`.
2. [ ] `npm run build` nos **dois** lados sem erro de tipo. O aviso de chunk
   > 500 kB do `vite build` é esperado.
3. [ ] **Run collection** no Postman: **78/78**, todos os `pm.test` verdes.
4. [ ] **RNF06 pela tela:** `GEMINI_MOCK=falha` no `server/.env` → **reiniciar o
   server** → registrar 2 séries → "Finalizar e avaliar treino" → "Treino
   salvo, mas a avaliação falhou…" → no Histórico, a sessão está lá, com as
   séries e sem avaliação. Voltar para `GEMINI_MOCK=true`, reiniciar e usar
   "Avaliar treino" no detalhe.
5. [ ] Passo 13 feito no celular, sem pendência no buffer de bugs.
6. [ ] **Gravar a demo ponta a ponta** com `GEMINI_MOCK=false` e a chave real:
   login → Minha divisão → Treino de hoje (3–4 séries) → Volume da semana →
   "Finalizar e avaliar treino" → Diagnóstico → Histórico.
7. [ ] **Prints provisórios das Fig. 4 e 5**, com exercícios e cargas
   plausíveis (seção 5 do `PLANEJAMENTO.md`). Salvar em `02-prints/`. As
   versões finais saem depois do code freeze.
8. [ ] Commits. Sugestão: um para o backend (Passos 2–5), um para os testes
   (Passos 6–7), um para as rotas (Passo 10, para dar para reverter sozinho),
   um para o resto do front (Passos 9, 11 e 12) e um para a limpeza (Passo 14).
9. [ ] **Tag `v1.0-dev`**, só depois dos itens 1–3 verdes e do `git status`
   limpo:

```bash
git tag -a v1.0-dev -m "DEV PRONTO: RF01-RF07, testes de unidade e integracao verdes"
git push origin main
git push origin v1.0-dev   # o git push sozinho nao envia tag
```

10. [ ] Marcar os cards da S9 no Trello (`/trello-sync`), incluindo os critérios
    de aceite do entregável.

> **Documentação (fica comigo):** registrar D19–D22 no `PLANEJAMENTO.md`
> (D7 encerrada pela D19, D6 implementada) e o link do roteiro no `TASKS.md`.

---

## Ordem sugerida pra essa semana

O DEV PRONTO vence em 06/10.

1. **Sessão A:** Passos 2 → 5, rodando a suíte a cada passo. Depois os testes
   (Passos 6–7). O backend fecha antes do front.
2. **Sessão B:** Passos 9 → 12 no DevTools. As rotas (Passo 10) vêm **antes**
   da barra inferior (Passo 11), porque a `Sidebar` nova já usa `useNavigate`.
   Depois o celular (Passo 13), com tempo para o buffer de bugs.
3. **Fechamento:** limpeza (Passo 14) e Passo 15. A demo e os prints com a
   chave real são as últimas coisas antes da tag.

> **Se o tempo apertar**, a ordem de corte é: (1) as rotas do Passo 10; (2) a
> passada nos comentários e o README. **Não** cortar: os testes de integração
> (são o critério de aceite e a Tabela VI do TCC), a D21 (é 500 no uso
> normal), a barra inferior e o teclado (sem eles a RNF01 e a Fig. 2 não se
> sustentam), nem a tag.

## Armadilhas comuns desta semana

- **Os `app.use` do Passo 2 antes das rotas.** Toda requisição vira 404. Eles
  são as últimas linhas do `app.ts`.
- **Tratador de erro com 3 parâmetros.** O Express reconhece o tratador de erro
  pela quantidade de parâmetros. Sem o `next`, ele nunca recebe o erro.
- **Editar o `schema.sql` e achar que o banco mudou.** Sem o `ALTER` do Passo 4,
  tirar o dia continua dando 500.
- **`npm run db:reset` pra aplicar a D21.** Funciona, mas apaga seus treinos. O
  `ALTER` muda só a constraint.
- **Trocar o `GEMINI_MOCK` no `.env` sem reiniciar o server.** O `.env` é lido
  uma vez, no start.
- **Esquecer de voltar o `GEMINI_MOCK` para `'true'` no teste do RNF06.** Os
  testes seguintes passariam a chamar o Gemini de verdade.
- **Importar de `react-router-dom`.** Na v7 o pacote é `react-router`.
- **Esquecer o `replace` no `<Navigate>`.** O "voltar" cai de novo no
  redirecionamento e o botão parece travado.
- **Esquecer o `pb` da `AppShell`.** A barra inferior cobre o último botão de
  cada tela, justamente o "Finalizar e avaliar treino".
- **`client/.env` em vez de `client/.env.local`.** O `.gitignore` ignora
  `*.local`, e o IP da sua rede iria para o GitHub.
- **Testar o celular com o PC na rede "Pública" do Windows.** O firewall
  bloqueia as portas sem avisar.
- **`git tag` sem `-a`**, ou achar que o `git push` envia a tag. Não envia: é o
  `git push origin v1.0-dev`.
- **Gravar a demo com `GEMINI_MOCK=true`.** O texto do mock não prova o RF05.
