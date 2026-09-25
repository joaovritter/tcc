# Planejamento TCC II — Sistema Web de Gerenciamento de Hipertrofia

**Aluno:** João Vitor dos Santos Ritter · **Orientador:** Fabiano Niederauer Flôres
**Entrega final:** 06/11/2026 · **Meta de desenvolvimento pronto:** 06/10/2026 (1 mês antes)
**Ritmo:** 2 sessões de dev/semana · 1 entregável técnico por semana
**Quadro Trello:** https://trello.com/b/eWQA6LXr

---

## 1. Análise do projeto existente (`servidorHipertrofia`)

O protótipo feito com IA usa a mesma stack do TCC (React + Vite + Tailwind no front; Node/Express + PostgreSQL + Gemini no back) e serve de referência, mas **não cumpre a promessa do artigo** em pontos centrais:

### Lacunas críticas (quebram RFs do TCC)

| Problema | Requisito afetado |
|---|---|
| **RPE não existe** — nem coluna no banco (`set_logs` só tem `rir`), nem campo na UI | RF03 |
| **Não há cálculo de volume semanal** por grupamento no backend | RF04, RNF03 |
| **Diagnóstico é por sessão**, não consolidação semanal enviada à IA | RF05 |
| **Não existe entidade de diagnóstico** (DiagnosticoIA do DER) — feedback fica em JSONB dentro de `sessions` | RF06 |
| **Score é inventado pela IA** — o TCC promete `score_geral = (Pv + Pi)/2` calculado no backend (Equação 1) | Metodologia |
| **Prompt não segue a anatomia de 5 blocos** da Tabela V (faltam diretrizes científicas: limiar de 10 séries, RPE9=1RIR) | RNF04 |
| **Zero testes** de unidade/integração (a matriz de rastreabilidade exige) | Validação |
| **Sem MVC real** — rotas fazem SQL + regra de negócio + chamada de IA no mesmo arquivo | Arquitetura |
| Backdoor de login hardcoded (`alex@hypertrack.app`) | Segurança |
| Parsing frágil da resposta da IA (`split('kg')` / `split('x ')`) | RNF05 |

### Extras fora do escopo (a cortar)

Onboarding com perfil/anamnese/lesões · sugestão de divisão por IA (`/ai/suggest-division`) · metas de carga por série (`ai_target_*`) · calendário mensal · dashboard elaborado · Redux · deploy. Detalhes e justificativas na lista **🧊 Cortado do Escopo** do Trello.

> **Correção (17/09):** "avaliação IA por sessão" estava listada aqui como cortada, o que contradizia a D2 logo abaixo (que já definia diagnóstico por sessão desde o início do projeto). Era um resíduo de rascunho antigo — removido. Ver **D15** para o realinhamento do que tinha derivado pra "semanal" no planejamento da S7.

> **Reincluído no escopo (05/08):** séries tipo "feeder" — `SerieTreino.tipo` agora aceita `aquecimento | feeder | work` (ver D9 quanto ao nome do terceiro valor).

---

## 2. Decisões de escopo (recomendadas — confirmar até 07/08)

- **D1 — Recomeçar limpo neste repositório (`tcc`)**, MVC desde o início; o projeto antigo vira referência para portar seletivamente (AuthView, WorkoutView podado, seed de exercícios).
- **D2 — Diagnóstico por SESSÃO** (mantém RF05/RF06 como no texto original do TCC); RF04 (volume semanal por grupamento) é calculado no backend de forma acumulativa, mas não é o gatilho do diagnóstico. ⚠️ ver card Trello sobre revisão de redação.
- **D3 — Cortes** conforme lista 🧊 do Trello.
- **D4 — Correções obrigatórias**: coluna RPE, tabela `diagnostics`, volume no backend, score no backend, prompt de 5 blocos, testes, sem backdoor.
- **D5 — Divisão sem `muscles[]` (09/08)**: `Divisao` guarda só `dia_semana` + `nome` livre; os grupamentos treinados no dia são **derivados via JOIN** `Divisao → DivisaoExercicio → Exercicio → GrupamentoMuscular` na leitura, com estado vazio enquanto não houver exercício. Elimina dado redundante e a necessidade de sincronizar array com `DivisaoExercicio`. Racional completo em [`DECISAO-MUSCLES-DIVISIONS.md`](./DECISAO-MUSCLES-DIVISIONS.md) (Opção D; A/B/C avaliadas e descartadas).
- **D6 — Sidebar vira barra inferior no mobile (31/08)**: a `Sidebar` (`client/src/components/Sidebar.tsx`) hoje é fixa à esquerda com expansão por hover — em tela estreita isso não cabe bem (barra fininha do lado, sem hover em touch). Decisão: usar `useMediaQuery` (breakpoint `sm`) para renderizar uma barra horizontal fixa embaixo (só ícones, sem expandir) em telas pequenas, mantendo a sidebar vertical no desktop. Implementação entra na S9 (Sessão B — Responsividade), não agora.

- **D7 — Navegação por estado até a S9 (03/09)**: com a segunda tela logada (`TodaySessionView`, S5), o `App.tsx` passa a alternar telas com um `useState<'divisao' | 'treino'>` repassado à `Sidebar`, em vez de entrar `react-router`. Roteamento real (URL, back do navegador, rota protegida) só se justifica com mais telas e fica para a S9 — meio-caminho agora custaria duas refatorações. Registro do racional em [`SEMANA5.md`](./SEMANA5.md) (Passo 6).
- **D9 — Tipo da série permanece `work` no banco (03/09)**: `SerieTreino.tipo` fica como está no `schema.sql` — `CHECK (tipo IN ('aquecimento','feeder','work'))`. Renomear para `valida` foi avaliado e **descartado**: o schema é a fonte da verdade e não se mexe nele por questão de nomenclatura. Quem se ajusta é o **texto do TCC**, que passa a citar os três valores como estão no banco. Divergência encerrada — nada pendente para a S9.
  - **RPE/RIR só existem em série válida (03/09):** `aquecimento` e `feeder` não recebem nota de esforço — o campo não aparece na tela e o backend recusa (400) se vier preenchido; série `work`, ao contrário, **exige** RPE e RIR. O `CHECK` do banco não cobre isso (ele só valida a faixa, e `NULL` passa), então a regra vive na validação do controller. Fecha a pergunta que estava em aberto para a S7: sem nota nessas séries, não há o que mandar para o bloco 3 do prompt — o Gemini recebe RPE/RIR só das séries válidas.
  - **RIR e RPE não coexistem no formulário (03/09):** na escala de musculação (Zourdos/Helms), as duas não são medidas independentes — são a mesma informação em réguas diferentes, com correspondência linear conhecida (`RPE = 10 - RIR`, ex. RIR 2 = RPE 8). O usuário escolhe qual régua reporta (toggle na tela, preferência salva no `localStorage` — não no banco, é conveniência de exibição, não dado de conta); o backend converte e grava os dois. No `schema.sql`, `rir` é a coluna canônica de entrada (`CHECK` estreitado de `0–5` para `0–4`, a faixa que corresponde inteira a `RPE 6–10`) e `rpe` vira coluna **gerada** (`GENERATED ALWAYS AS (10 - rir) STORED`) — real, gravada no disco, só impossível de escrever direto por `INSERT`. Elimina de vez a possibilidade de os dois valores divergirem.
  - Redação a usar no texto (evita a armadilha de dizer que `feeder` "não é usado" — ele é gravado, só não conta volume): *"As séries são classificadas em três tipos: `aquecimento`, `feeder` e `work` (série válida). Apenas as séries válidas são contabilizadas no volume semanal por grupamento (RF04), em conformidade com o limiar de 10 séries semanais [Schoenfeld], que considera séries efetivas de trabalho, e somente elas registram as métricas de esforço percebido (RPE e RIR). O usuário reporta o esforço em uma das duas escalas equivalentes (RIR ou RPE), e o sistema converte e persiste ambas. As séries de aquecimento e feeder são registradas para preservar a fidelidade do histórico de treino, mas excluídas do cálculo de volume e da análise de esforço."*
- **D8 — Séries são registro histórico, não configuração (03/09)**: `SerieTreino` entra por `POST` individual e sai por `DELETE` pontual — o padrão "apaga-e-reinsere" das S3/S4 não se aplica, porque cada série é um fato datado que a S6 vai contar como volume. `GET /sessions/today` não cria treino; quem cria é o `POST /sessions/start`, idempotente por dia.

- **D10 — Semana de referência vai de segunda a domingo (10/09)**: o limiar de 10 séries semanais [Schoenfeld] exige dizer onde a semana começa. Avaliadas duas opções: janela móvel dos últimos 7 dias e semana de calendário. Fica a **semana de calendário começando na segunda**, que é o `date_trunc('week', ...)` do Postgres (ISO, sem configuração). Janela móvel muda o número sozinha toda meia-noite e nunca "fecha" uma semana; com calendário, a segunda zera o painel e a conta tem começo e fim reconhecíveis. ⚠️ Escopo da D10 é só o **volume semanal por grupamento (RF04)** — não o diagnóstico, que é por sessão (D2, reafirmado na D15). Não confundir também com `Divisao.dia_semana`, que é `0–6` com domingo = 0 (vem do `getDay()` do JavaScript): uma coisa é posição na grade da rotina, outra é recorte temporal de contagem.
- **D11 — Volume conta série registrada, treino finalizado ou não (10/09)**: contar só treino com `completed = true` esconderia o treino em andamento justamente enquanto a pessoa treina. Série gravada é trabalho feito; `completed` serve para fechar a duração (RF03), não para validar volume (RF04). Consequência aceita: esquecer de finalizar não distorce o volume.
- **D12 — A duração do treino é calculada pelo backend (10/09)**: `POST /sessions/:id/finish` não recebe corpo — o servidor faz `NOW() - data` no próprio `UPDATE`. Deixar o front mandar `duracao_total` seria cálculo no cliente (contra a RNF03) e entregaria o histórico ao relógio do celular.
- **D13 — Fórmula do `score_geral` (16/09, ajustada 17/09 pela D15)**: `score_geral = round((Pv + Pi) / 2)`, 100% calculado em `services/scoreService.ts`, nunca pedido à IA (fecha a lacuna central do protótipo antigo — "score inventado pela IA"). **Pv** (pontuação de volume) é a média, sobre os grupamentos **presentes na divisão da semana** (não todos os grupamentos do catálogo — senão quem treina push/pull/legs seria penalizado por não treinar antebraço), de `min(series_validas / LIMIAR_SERIES, 1) × 100`, usando o volume semanal acumulado (RF04) **até o momento da sessão avaliada** — é contexto, não o gatilho (D2/D15). **Pi** (pontuação de intensidade) é a média, sobre **as séries válidas da sessão de treino que disparou o diagnóstico** (não mais "da semana"), de `min(((rpe − 6) / 3) × 100, 100)` — RPE 6 vale 0, RPE 9 ou 10 vale 100 (teto), linear entre eles; a régua vem de Zourdos et al. [4] (RPE 9 = 1 RIR = estímulo otimizado). Detalhamento e código em [`SEMANA7.md`](./SEMANA7.md).
- **D14 — Diagnóstico é histórico, não singleton (16/09, ajustada 17/09 pela D15)**: `DiagnosticoIA` não tem `UNIQUE(fk_usuario, fk_treino)` — cada `POST /sessions/:id/diagnostics/generate` grava uma linha nova, mesmo padrão append-only da D8 (`SerieTreino`). "Diagnóstico atual" é sempre o de `data_geracao` mais recente do usuário (`GET /diagnostics/latest`); gerar de novo pra um treino já diagnosticado não sobrescreve, vira o histórico que a S8/RF07 vai exibir.
- **D15 — Diagnóstico é acionado por sessão de treino finalizada, não por corte semanal (17/09)**: realinhamento com a **D2**, que já definia "Diagnóstico por SESSÃO" desde 07/08 — o planejamento detalhado da S7 (`SEMANA7.md`) tinha derivado pra tratar o diagnóstico como um corte semanal (`DiagnosticoIA.semana_referencia`, prompt montado em cima de `VolumeSemanal` como dado principal), o que essa decisão corrige. Mudanças: **(1)** `DiagnosticoIA` troca `semana_referencia` por `fk_treino` (referencia o `Treino` que gerou o diagnóstico, ver `schema.sql`); **(2)** o prompt (`geminiService.montarPrompt`) recebe o `Treino` avaliado + suas séries válidas (`SerieValidaDaSessao`, ex-`SerieValidaDaSemana`) como dado central do bloco 3, e o `VolumeSemanal` (RF04) entra só como contexto complementar no bloco 2/3 ("faltam N séries pro limiar"), nunca como gatilho; **(3)** `Pi` (D13) passa a ser calculado sobre as séries da sessão, não da semana — `Pv` continua semanal-acumulado, porque é o que a métrica de volume representa. **RF04 (painel "Volume da Semana") não muda** — continua sendo o acumulado semanal calculado por `volumeService`, é uma feature separada do diagnóstico. Rotas: `POST /sessions/:id/diagnostics/generate` (era `POST /diagnostics/generate` sem id) e `GET /diagnostics/latest` (sem mudança de contrato, só deixa de filtrar por semana).
- **D16 — "Finalizar e avaliar treino" é um botão só, em duas chamadas (23/09; revisada 25/09)**: na tela, a pessoa toca **um** botão no fim do treino; por baixo, o front chama `POST /sessions/:id/finish` e, só se ele der certo, `POST /sessions/:id/diagnostics/generate`. O backend não muda de contrato. Juntar as duas coisas no backend (o `finish` chamando o Gemini por dentro) foi **descartado**: o Gemini leva segundos e pode falhar (502), e uma falha da IA derrubaria junto o encerramento do treino, contra a RNF06. Com as chamadas encadeadas no front, o treino já está salvo e fechado quando a IA é chamada; se ela falhar, a tela oferece "Tentar avaliar de novo", que refaz só o `generate`. O backend passa a **recusar (409)** diagnóstico de treino aberto (a D15 já dizia "sessão finalizada", mas o controller da S7 não conferia `completed`). Sessão sem série válida finaliza normalmente e o `generate` devolve 400: a tela avisa "treino salvo, sem séries válidas para avaliar" e não oferece nova tentativa. **Revisão 25/09:** avaliado e **descartado** avaliar essa sessão marcando-a como "deload" no prompt. Na literatura (Helms, Zourdos), deload é uma redução **planejada** de volume ou intensidade **nas séries válidas**, e não a ausência delas, e o sistema não sabe a intenção da pessoa. Sem série válida, a IA não avalia.
- **D17 — Progressão de carga = maior carga de série `work` por sessão, por exercício (23/09; ampliada 25/09)**: um ponto no gráfico = uma sessão, e a linha = a maior carga válida. Estimar 1RM (Epley/Brzycki) foi **descartado**, por ser uma fórmula que o texto do TCC não cita (abriria divergência TCC × sistema). Só entram séries `work`, e série registrada conta, com o treino finalizado ou não (mesma lógica da D11). **Ampliada em 25/09:** só a maior carga esconde a progressão por repetições (70 kg × 8 → 70 kg × 12 fica uma linha reta). Cada ponto passa a trazer também as reps da série mais pesada (com empate de carga, a de mais reps), as séries válidas e a **tonelagem** (Σ carga × reps das séries `work`), mostradas no tooltip. O nome é "tonelagem", nunca "volume": no TCC, volume = contagem de séries válidas por semana (RF04/D10). É soma, não estimativa. O mesmo resumo aparece no detalhe da sessão (D18), calculado por uma única subconsulta.
- **D18 — Recorte do histórico (23/09; item 3 reescrito 25/09)**: (1) o histórico de sessões mostra só treino **finalizado**; o treino aberto é assunto do "Treino de hoje". (2) O **volume histórico** mostra as últimas **8 semanas de calendário** (segunda a domingo, D10), configurável por `?semanas=1..26`, com todos os grupamentos em cada semana (zerado também). (3) **Sessões e diagnósticos anteriores = calendário mês a mês, com o histórico completo.** `GET /history/sessions?mes=AAAA-MM` devolve todas as sessões finalizadas do mês (sem `LIMIT`) e o dia do primeiro treino finalizado (`primeira_sessao`), que trava a navegação para trás. Tocar num dia mostra os treinos dele. Tocar num treino chama `GET /history/sessions/:id`, que traz os registros (séries válidas e de preparação por exercício, com o resumo da D17) e embaixo o diagnóstico mais novo da sessão (D14). **Descartados:** a lista dos "20 diagnósticos mais recentes" (escondia o histórico antigo); o calendário como tela própria no menu (duas portas para os mesmos diagnósticos; ele fica na aba "Sessões" do Histórico); os cards de métricas do mês e o gráfico de frequência; a coluna de descanso entre séries (o sistema não grava esse dado).

## 3. Arquitetura alvo (MVC, TypeScript)

```
server/src/
  config/db.ts
  types/        interfaces/tipos compartilhados (User, Division, SetLog, Diagnostic...)
  models/       User, Division, Exercise, Session, SetLog, Diagnostic, History (SQL)
  controllers/  auth, division, session, diagnostic, history
  services/     geminiService (5 blocos + mock), volumeService, scoreService
  routes/       finas (URL → controller)
  middleware/   auth (JWT)
client/src/     views/ components/ services/ context/   ← camada de Visão (React + TS, .tsx)
```

Stack em TypeScript nas duas pontas: backend com `tsx`/`ts-node` + `tsc` para build,
frontend com o template `react-ts` do Vite. `tsconfig.json` em `server/` e `client/`.

Entidades (nomes reais do `schema.sql`, em português, como no DER do TCC): `Usuario`, `GrupamentoMuscular`, `Exercicio`, `Divisao` (`dia_semana` 0–6 + `nome` — **sem** `muscles[]`, ver D5), `DivisaoExercicio` (`ordem`), `Treino` (`data`, `duracao_total`, `completed`), `SerieTreino` (`tipo`, `carga`, `repeticoes`, **`rpe` 6–10**, `rir` 0–5), `DiagnosticoIA` (`conteudo_json` JSONB, `score_geral`, `fk_treino` — ver D15).

## 4. Cronograma (FDD — uma feature por semana, entregável todo domingo)

| Semana | Período | Feature / Foco | Sessão A (back) | Sessão B (front) | Entregável (domingo) |
|---|---|---|---|---|---|
| S1 | 05–09/08 | Fundação MVC + banco | Estruturar repo MVC (server + client) | *(mesma sessão A)* | Esqueleto full-stack + schema + seed |
| S2 | 10–16/08 | F1 Autenticação (RF01) | model User + authController + JWT | Telas Login/Registro + AuthContext | Cadastro/login com JWT + testes |
| S3 | 17–23/08 | F2a Divisão semanal (RF02) | DivisionModel + divisionController | Tela "Minha Divisão" | CRUD divisão por dia da semana |
| S4 | 24–30/08 | F2b Exercícios da rotina (RF02) | ExerciseModel + endpoints da rotina | Seleção e ordenação de exercícios | Montagem completa da rotina |
| S5 | 31/08–06/09 | F3a Execução do treino (RF03) | sessionController + SetLogModel | Tela "Treino de Hoje" (mobile-first) | Séries com tipo/carga/reps/RPE/RIR no banco |
| S6 | 07–13/09 | F3b + F4 Volume semanal (RF04) | Finalizar sessão + volumeService | Testes do volume + painel "Volume da Semana" | Endpoint de volume + testes = cálculo manual |
| S7 | 14–20/09 | F5a Diagnóstico IA (RF05/06) | geminiService (prompt 5 blocos) | diagnosticController + score_geral | Prompt 5 blocos + score backend + persistência |
| S8 | 21–27/09 | F5b + F6 Histórico (RF07) | F6: histórico (backend) | Tela "Diagnóstico da Sessão" + histórico (front) | Fluxo ponta-a-ponta completo |
| S9 | 28/09–04/10 | Hardening + testes integração | Testes de integração (RF05/06/07 + RNF02/05/06) | Responsividade + limpeza + buffer de bugs | 🏁 **DEV PRONTO** — suíte verde, tag v1.0-dev |
| OUT | 05–19/10 | Validação | — | Heurística de Nielsen (Frente 2) | Heurística de Nielsen (11/10) + conteúdo IA (18/10) + code freeze (19/10) |
| OUT/NOV | 20/10–06/11 | Escrita TCC II | — | — | Resultados (26/10), revisão orientador (06/11) |

Cada linha S2–S9 tem duas sessões de dev/semana (1 back + 1 front), espelhando 1:1 os cards do Trello e o `TASKS.md`. S1 é exceção: as duas sessões (A e B) estruturam back e front no mesmo esqueleto, sem split funcional.

**Regras anti-atraso:** S9 é o buffer; Gemini sempre atrás de mock; nada entra no escopo sem passar pela lista 🧊; 2 semanas sem entregável = replanejar cortando.

## 5. Figuras do capítulo de resultados (máx. 5)

Decidido em 03/09: **5 figuras no documento inteiro** (era 6). Critério de seleção — cada figura prova **um RF diferente**; o que a matriz de rastreabilidade e os testes já comprovam não vira figura.

| # | Figura | Semana | Prova |
|---|---|---|---|
| 1 | Minha Divisão com a semana preenchida + chips de músculos do dia | S4 ✅ | RF02 completo (e a D5 visível: grupamentos vindos do JOIN) |
| 2 | Treino de Hoje **no celular**, com 3–4 séries registradas (carga/reps/RPE/RIR) | S5 | RF03 + RNF01 |
| 3 | Volume da Semana por grupamento, com o limiar de 10 séries marcado | S6 | RF04 + embasamento [Schoenfeld] |
| 4 | Diagnóstico da Sessão: score 0–100 + análise por grupamento + recomendações | S7 | RF05/RF06 — figura central do trabalho |
| 5 | Histórico: progressão de carga + calendário com o detalhe de uma sessão (registros + diagnóstico anterior) | S8 | RF07 |

**Cortadas:** tela de login/registro (RF01 já comprovado pela matriz + testes de unidade; não tem nada específico deste trabalho) e o Dialog de seleção de exercícios (o resultado dele já aparece na Fig. 1).

**Plano B se o espaço apertar:** juntar volume + diagnóstico numa figura composta da **mesma semana de dados** — vira 1 figura, e ganha em argumento, porque mostra o dado que entrou na IA ao lado do diagnóstico que saiu dele. Ficariam 4.

**Regras de captura:**
- Tirar **todas depois do code freeze** (19/10), não semana a semana — figuras com UI de épocas diferentes destoam entre capítulos.
- **Mesmo usuário e mesma semana de dados** nas 5, pra o leitor seguir uma narrativa: essa divisão → esse treino → esse volume → esse diagnóstico.
- **Dados realistas** (exercícios e cargas plausíveis; nada de "teste", "aaa", 999 kg).
- Fig. 2 em **retrato, recortada no aparelho** — é ela que sustenta a RNF01; print de navegador estreitado não convence.
- Conferir legibilidade **no PDF impresso**: se não der pra ler o RPE, a figura não prova nada.

## 6. Referência rápida — prompt de 5 blocos (Tabela V)

1. **Persona** — especialista em fisiologia do exercício, domínio restrito
2. **Contexto** — sessão de treino avaliada (data) + grupamentos treinados nela (D15)
3. **Dados de treino** — séries válidas da sessão (RPE/RIR por série, PostgreSQL) + volume semanal acumulado por grupamento como contexto complementar (RF04, não é o gatilho)
4. **Diretrizes científicas** — limiar 10 séries/grupamento [Schoenfeld]; RPE 9 = 1 RIR [Zourdos; Helms]
5. **Formato de saída** — apenas JSON: `diagnostico_exercicios`, `analise_grupamentos`, `recomendacoes_proxima_sessao`
