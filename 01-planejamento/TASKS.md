# TASKS — TCC II (espelho do quadro Trello)

> **Quadro:** https://trello.com/b/eWQA6LXr
> Este arquivo é o espelho em Markdown do Trello. Marque `[x]` aqui **ou** mova/marque no Trello — depois rode a skill **/trello-sync** para sincronizar os dois lados (regra: concluído em qualquer um dos lados = concluído nos dois).
> Cada tarefa carrega o link do card correspondente — **não remova os links**, são a chave da sincronização.
>
> **Decisão vigente (09/08):** a tabela `Divisao` **não tem** `muscles[]` — os grupamentos
> treinados em cada dia são derivados via JOIN `Divisao → DivisaoExercicio → Exercicio →
> GrupamentoMuscular`. Ver [`DECISAO-MUSCLES-DIVISIONS.md`](./DECISAO-MUSCLES-DIVISIONS.md) (Opção D).

---

## S1 · 05–09/08 · Fundação MVC + Banco

- [x] 🎯 **ENTREGÁVEL S1 — Esqueleto full-stack rodando + banco criado** (entrega dom 09/08) — [card](https://trello.com/c/0TTVYhbo)
  - [x] API Express sobe com GET /health respondendo
  - [x] Front Vite+React sobe e consome /health
  - [x] schema.sql cria as 8 tabelas do DER com FKs (RNF02) — SerieTreino COM coluna rpe
  - [x] Seed com grupos musculares + ~40 exercícios rodando (7 grupamentos + 95 exercícios)
  - [x] Chave da API Gemini obtida e testada com um hello world
  - [x] Commit + push + README com passos de setup
- [x] Sessão A — Estruturar repo MVC (server + client) — [card](https://trello.com/c/CKxENmZT)
  - Arquivos: `server/src/app.ts`, `server/src/server.ts`, `server/src/routes/healthRoutes.ts`, `server/src/config/db.ts`, `client/src/App.tsx`, `client/src/main.tsx`, `package.json` (server + client), `.env.example`
- [x] Sessão B — schema.sql (DER do TCC) + seed de exercícios — [card](https://trello.com/c/RdPWPTlV)
  - Arquivos: `server/schema.sql`, `server/src/seed.ts` (seed de grupamentos + exercícios), `.env` (GEMINI_API_KEY)

## S2 · 10–16/08 · F1 Autenticação (RF01)

- [x] 🎯 **ENTREGÁVEL S2 — Cadastro e login funcionais (RF01)** (entrega dom 16/08) — [card](https://trello.com/c/AvLbGD9z)
  - [x] POST /auth/register cria usuário com senha bcrypt
  - [x] POST /auth/login retorna JWT válido
  - [x] Middleware JWT protege rotas privadas (401 sem token)
  - [x] Telas de Login e Registro funcionais com erros amigáveis
  - [x] Testes de unidade de auth passando (matriz RF01)
  - [x] Nenhuma credencial hardcoded (sem backdoor)
- [x] Sessão A — Backend F1: model User + authController + JWT — [card](https://trello.com/c/oeNbbi1E)
  - Arquivos: `types/indexTypes.ts`, `models/userModel.ts`, `controllers/authController.ts`, `routes/authRoutes.ts`, `middlewares/auth.ts`, `app.ts` (registrar rota)
- [x] Sessão B — Frontend F1: telas Login/Registro + AuthContext — [card](https://trello.com/c/XTpJ798X)
  - Arquivos: `services/api.ts`, `context/AuthContext.tsx`, `views/AuthView.tsx` (Login/Registro), `App.tsx`
- [x] Testes de unidade F1 (matriz RF01) — [card](https://trello.com/c/2eFXLYJg)
  - Arquivos: `__tests__/auth.test.ts`

## S3 · 17–23/08 · F2a Divisão Semanal (RF02) + Base de Design

> **Decisão (19/08):** antes da S3 ter ficado com telas em HTML puro (S1/S2),
> foi criada uma base de design transversal (MUI + Framer Motion, sidebar
> flutuante com hover-expand, sem Tailwind). Ver
> [`DESIGN-BASE.md`](./DESIGN-BASE.md). A tela desta semana já nasce usando
> essa base.

- [x] 🎯 **ENTREGÁVEL S3 — CRUD da divisão semanal** (entrega dom 23/08) — [card](https://trello.com/c/jCIep6AI)
  - [x] GET /divisions e PUT /divisions funcionando (em transação)
  - [x] Tela Minha Divisão salva e recarrega a semana toda
  - [x] Validações: dia_semana 0–6, nome obrigatório, sem dois registros no mesmo dia
  - [x] Sem coluna `muscles[]` — músculos derivados via JOIN, estado vazio até a S4 (Decisão D)
  - [x] Teste de unidade do CRUD passando (matriz RF02)
- [x] Sessão A — Backend F2a: DivisionModel + divisionController — [card](https://trello.com/c/rXPtyCKg)
  - Arquivos: `types/indexTypes.ts` (acrescentar), `models/divisionModel.ts`, `controllers/divisionController.ts`, `routes/divisionRoutes.ts`, `app.ts` (registrar rota), `__tests__/division.test.ts`
- [x] Base de Design — tema MUI + Sidebar flutuante (hover-expand) + AppShell — [card](https://trello.com/c/OPK0Sp8k)
  - Arquivos: `client/src/theme.ts`, `client/src/components/PageLayout.tsx`, `client/src/components/FeedbackAlert.tsx`, `client/src/components/Sidebar.tsx`, `client/src/components/AppShell.tsx`
- [x] Sessão B — Frontend F2a: tela "Minha Divisão" (já com MUI + AppShell) — [card](https://trello.com/c/GRpUYeXC)
  - Arquivos: `services/api.ts` (acrescentar), `views/DivisionView.tsx`, `App.tsx` (acrescentar)

## S4 · 24–30/08 · F2b Exercícios da Rotina (RF02)

- [ ] 🎯 **ENTREGÁVEL S4 — Montagem completa da rotina (RF02 completo)** (entrega dom 30/08) — [card](https://trello.com/c/ZO75u5Rr)
  - [x] GET /exercises com grupamento muscular e filtro
  - [x] Adicionar/remover/ordenar exercícios por dia funcionando
  - [x] Persistência em DivisaoExercicio com ordem
  - [x] Resumo de músculos da divisão passa a aparecer (derivado do JOIN, Decisão D)
  - [ ] Fluxo completo divisão → exercícios sem erros no console
  - [ ] Print da rotina montada guardado (figura para o TCC)
- [x] Sessão A — Backend F2b: ExerciseModel + endpoints da rotina — [card](https://trello.com/c/vz5Xu9hg)
  - Arquivos: `types/indexTypes.ts`, `models/exerciseModel.ts`, `controllers/exerciseController.ts`, `routes/exerciseRoutes.ts`, `models/divisionModel.ts` (acrescentar), `controllers/divisionController.ts` (acrescentar), `routes/divisionRoutes.ts` (acrescentar), `app.ts` (registrar rota), `__tests__/exercise.test.ts`
- [x] Sessão B — Frontend F2b: seleção e ordenação de exercícios — [card](https://trello.com/c/MjLJfaAZ)
  - Arquivos: `services/api.ts` (acrescentar), `components/DayExerciseDialog.tsx` (com busca + filtro por grupamento), `views/DivisionView.tsx` (acrescentar)

## S5 · 31/08–06/09 · F3a Execução do Treino (RF03)

- [ ] 🎯 **ENTREGÁVEL S5 — Treino do dia registrado no banco (RF03)** (entrega dom 06/09) — [card](https://trello.com/c/HLKbI7u9)
  - [ ] GET /sessions/today monta o treino a partir da divisão
  - [ ] Registro de série com tipo (aquecimento|válida), carga, reps, RPE e RIR
  - [ ] Validações de faixa no backend: RPE 6–10, RIR 0–5 (RNF03)
  - [ ] Tela usável no celular durante o treino (RNF01)
  - [ ] Campos persistidos corretamente + teste de unidade (matriz RF03)
- [ ] Sessão A — Backend F3a: sessionController + SetLogModel — [card](https://trello.com/c/oVROzoSE)
  - Arquivos: `types/indexTypes.ts` (acrescentar), `models/sessionModel.ts`, `controllers/sessionController.ts`, `routes/sessionRoutes.ts`, `app.ts` (registrar rota), `__tests__/session.test.ts`
- [ ] Sessão B — Frontend F3a: tela "Treino de Hoje" (mobile-first) — [card](https://trello.com/c/W2qkDGiE)
  - Arquivos: `services/api.ts` (acrescentar), `views/TodaySessionView.tsx`, `App.tsx` (acrescentar)

## S6 · 07–13/09 · F3b Finalizar + F4 Volume Semanal (RF04)

- [ ] 🎯 **ENTREGÁVEL S6 — Volume semanal calculado no backend (RF04)** (entrega dom 13/09) — [card](https://trello.com/c/bbqr5pdi)
  - [ ] Finalizar sessão grava data + duração (fecha RF03)
  - [ ] GET /metrics/weekly-volume conta só séries válidas (type=work) por grupamento
  - [ ] Comparação com limiar de 10 séries semanais [Schoenfeld]
  - [ ] Testes de unidade = resultado igual ao cálculo manual (matriz RF04)
  - [ ] Nenhum cálculo de volume/RPE/RIR no frontend (RNF03)
- [ ] Sessão A — Backend F3b + F4: finalizar sessão e volumeService — [card](https://trello.com/c/jEBdFGoP)
  - Arquivos: `models/sessionModel.ts` (acrescentar), `controllers/sessionController.ts` (acrescentar), `services/volumeService.ts`, `controllers/metricsController.ts`, `routes/metricsRoutes.ts`, `app.ts` (registrar rota)
- [ ] Sessão B — Testes do volume (RF04) + painel "Volume da Semana" — [card](https://trello.com/c/hp039ZdW)
  - Arquivos: `__tests__/volume.test.ts`, `services/api.ts` (acrescentar), `views/WeeklyVolumeView.tsx`

## S7 · 14–20/09 · F5a Diagnóstico IA Gemini (RF05/06)

- [ ] 🎯 **ENTREGÁVEL S7 — Diagnóstico semanal gerado e persistido (RF05/RF06)** (entrega dom 20/09) — [card](https://trello.com/c/JJLbz4Jl)
  - [ ] Prompt com os 5 blocos da Tabela V: persona, contexto, dados, diretrizes, formato (RNF04)
  - [ ] Retorno JSON com diagnostico_exercicios, analise_grupamentos, recomendacoes_proxima_sessao (RNF05)
  - [ ] score_geral = (Pv + Pi) / 2 calculado no backend (Equação 1)
  - [ ] Diagnóstico persistido na tabela diagnostics (RF06)
  - [ ] Falha da API Gemini não perde nenhum dado de treino (RNF06)
  - [ ] Mock do Gemini funcionando (GEMINI_MOCK=true) para dev e testes
- [ ] Sessão A — geminiService: template de prompt de 5 blocos (Tabela V) — [card](https://trello.com/c/NCwWY3sZ)
  - Arquivos: `services/geminiService.ts`, `config/gemini.ts`, `.env` (GEMINI_MOCK)
- [ ] Sessão B — diagnosticController + score_geral no backend — [card](https://trello.com/c/WGDVaEb9)
  - Arquivos: `types/indexTypes.ts` (acrescentar), `models/diagnosticModel.ts`, `controllers/diagnosticController.ts`, `routes/diagnosticRoutes.ts`, `app.ts` (registrar rota)
- [ ] Teste com chave real: 3 cenários de semana simulada — [card](https://trello.com/c/F0Wv7hDo)
  - Arquivos: `__tests__/diagnostic.test.ts`

## S8 · 21–27/09 · F5b Tela Diagnóstico + F6 Histórico (RF07)

- [ ] 🎯 **ENTREGÁVEL S8 — Fluxo principal ponta-a-ponta (RF07)** (entrega dom 27/09) — [card](https://trello.com/c/MLlAbzpN)
  - [ ] Tela Diagnóstico com score visual 0–100 (círculo/barra)
  - [ ] Análises por grupamento/exercício + recomendações exibidas
  - [ ] Histórico: sessões, progressão de carga, volume semanal e diagnósticos anteriores (RF07)
  - [ ] Demo ponta-a-ponta gravada (login → rotina → treino → volume → diagnóstico → histórico)
- [ ] Sessão A — Frontend F5b: tela "Diagnóstico da Semana" — [card](https://trello.com/c/rbDxorvY)
  - Arquivos: `services/api.ts` (acrescentar), `views/DiagnosticView.tsx`
- [ ] Sessão B — F6: histórico de progressão (backend + frontend) — [card](https://trello.com/c/cJsIQnv7)
  - Arquivos: `controllers/historyController.ts`, `routes/historyRoutes.ts`, `app.ts` (registrar rota), `services/api.ts` (acrescentar), `views/HistoryView.tsx`

## S9 · 28/09–04/10 · Hardening + Testes 🏁 DEV PRONTO

- [ ] 🎯 **ENTREGÁVEL S9 — Sistema completo + testes verdes (DEV PRONTO até 06/10)** (entrega dom 04/10) — [card](https://trello.com/c/Usgbx6xy)
  - [ ] Testes de integração verdes (RF05/06/07)
  - [ ] RNF02: registros órfãos rejeitados pelo banco (teste)
  - [ ] RNF06: falha simulada da API preserva registros (teste)
  - [ ] Responsividade OK nos fluxos críticos (RNF01)
  - [ ] Sidebar vira barra inferior (ícones) em telas pequenas — Decisão D6
  - [ ] Código limpo: sem console.logs, código morto ou TODOs
  - [ ] Tag v1.0-dev criada e enviada (🏁 DEV PRONTO antes de 06/10)
- [ ] Sessão A — Testes de integração (RF05/06/07 + RNF02/05/06) — [card](https://trello.com/c/tLtCxKQu)
  - Arquivos: `__tests__/integration.test.ts` (fluxo completo login → rotina → treino → volume → diagnóstico)
- [ ] Sessão B — Responsividade + limpeza + buffer de bugs — [card](https://trello.com/c/bqtMAAlK)
  - Arquivos: revisão geral em `client/src/views/*.tsx` e `client/src/components/*.tsx` (sem arquivo novo fixo)

## OUT · 05–19/10 · Validação

- [ ] Frente 2 — Avaliação heurística de Nielsen (até 11/10) — [card](https://trello.com/c/O9TROMLb)
- [ ] Frente 3 — Validação de conteúdo dos diagnósticos da IA (até 18/10) — [card](https://trello.com/c/DZ66AmkU)
- [ ] Correções da validação + CODE FREEZE 🧊 (19/10) — [card](https://trello.com/c/IqkltrwX)

## OUT/NOV · 20/10–06/11 · Escrita TCC II + Entrega

- [ ] Tirar prints das principais funcionalidades (máx. 6 figuras pro documento inteiro) — [card](https://trello.com/c/en1Tho0j)
- [ ] Capítulo de resultados: telas, testes e matriz preenchida (até 26/10) — [card](https://trello.com/c/VRinhHiX)
- [ ] Revisão do orientador + ajustes finais (até 01/11) — [card](https://trello.com/c/jPsMIk8V)
- [ ] 🎓 ENTREGA FINAL TCC II — 06/11 — [card](https://trello.com/c/igTEVfpf)
