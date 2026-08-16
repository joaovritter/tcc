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
- [x] Sessão B — schema.sql (DER do TCC) + seed de exercícios — [card](https://trello.com/c/RdPWPTlV)

## S2 · 10–16/08 · F1 Autenticação (RF01)

- [ ] 🎯 **ENTREGÁVEL S2 — Cadastro e login funcionais (RF01)** (entrega dom 16/08) — [card](https://trello.com/c/AvLbGD9z)
  - [ ] POST /auth/register cria usuário com senha bcrypt
  - [ ] POST /auth/login retorna JWT válido
  - [ ] Middleware JWT protege rotas privadas (401 sem token)
  - [ ] Telas de Login e Registro funcionais com erros amigáveis
  - [ ] Testes de unidade de auth passando (matriz RF01)
  - [ ] Nenhuma credencial hardcoded (sem backdoor)
- [ ] Sessão A — Backend F1: model User + authController + JWT — [card](https://trello.com/c/oeNbbi1E)
- [ ] Sessão B — Frontend F1: telas Login/Registro + AuthContext — [card](https://trello.com/c/XTpJ798X)
- [ ] Testes de unidade F1 (matriz RF01) — [card](https://trello.com/c/2eFXLYJg)

## S3 · 17–23/08 · F2a Divisão Semanal (RF02)

- [ ] 🎯 **ENTREGÁVEL S3 — CRUD da divisão semanal** (entrega dom 23/08) — [card](https://trello.com/c/jCIep6AI)
  - [ ] GET /divisions e PUT /divisions funcionando (em transação)
  - [ ] Tela Minha Divisão salva e recarrega a semana toda
  - [ ] Validações: dia_semana 0–6, nome obrigatório, sem dois registros no mesmo dia
  - [ ] Sem coluna `muscles[]` — músculos derivados via JOIN, estado vazio até a S4 (Decisão D)
  - [ ] Teste de unidade do CRUD passando (matriz RF02)
- [ ] Sessão A — Backend F2a: DivisionModel + divisionController — [card](https://trello.com/c/rXPtyCKg)
- [ ] Sessão B — Frontend F2a: tela "Minha Divisão" — [card](https://trello.com/c/GRpUYeXC)

## S4 · 24–30/08 · F2b Exercícios da Rotina (RF02)

- [ ] 🎯 **ENTREGÁVEL S4 — Montagem completa da rotina (RF02 completo)** (entrega dom 30/08) — [card](https://trello.com/c/ZO75u5Rr)
  - [ ] GET /exercises com grupamento muscular e filtro
  - [ ] Adicionar/remover/ordenar exercícios por dia funcionando
  - [ ] Persistência em DivisaoExercicio com ordem
  - [ ] Resumo de músculos da divisão passa a aparecer (derivado do JOIN, Decisão D)
  - [ ] Fluxo completo divisão → exercícios sem erros no console
  - [ ] Print da rotina montada guardado (figura para o TCC)
- [ ] Sessão A — Backend F2b: ExerciseModel + endpoints da rotina — [card](https://trello.com/c/vz5Xu9hg)
- [ ] Sessão B — Frontend F2b: seleção e ordenação de exercícios — [card](https://trello.com/c/MjLJfaAZ)

## S5 · 31/08–06/09 · F3a Execução do Treino (RF03)

- [ ] 🎯 **ENTREGÁVEL S5 — Treino do dia registrado no banco (RF03)** (entrega dom 06/09) — [card](https://trello.com/c/HLKbI7u9)
  - [ ] GET /sessions/today monta o treino a partir da divisão
  - [ ] Registro de série com tipo (aquecimento|válida), carga, reps, RPE e RIR
  - [ ] Validações de faixa no backend: RPE 6–10, RIR 0–5 (RNF03)
  - [ ] Tela usável no celular durante o treino (RNF01)
  - [ ] Campos persistidos corretamente + teste de unidade (matriz RF03)
- [ ] Sessão A — Backend F3a: sessionController + SetLogModel — [card](https://trello.com/c/oVROzoSE)
- [ ] Sessão B — Frontend F3a: tela "Treino de Hoje" (mobile-first) — [card](https://trello.com/c/W2qkDGiE)

## S6 · 07–13/09 · F3b Finalizar + F4 Volume Semanal (RF04)

- [ ] 🎯 **ENTREGÁVEL S6 — Volume semanal calculado no backend (RF04)** (entrega dom 13/09) — [card](https://trello.com/c/bbqr5pdi)
  - [ ] Finalizar sessão grava data + duração (fecha RF03)
  - [ ] GET /metrics/weekly-volume conta só séries válidas (type=work) por grupamento
  - [ ] Comparação com limiar de 10 séries semanais [Schoenfeld]
  - [ ] Testes de unidade = resultado igual ao cálculo manual (matriz RF04)
  - [ ] Nenhum cálculo de volume/RPE/RIR no frontend (RNF03)
- [ ] Sessão A — Backend F3b + F4: finalizar sessão e volumeService — [card](https://trello.com/c/jEBdFGoP)
- [ ] Sessão B — Testes do volume (RF04) + painel "Volume da Semana" — [card](https://trello.com/c/hp039ZdW)

## S7 · 14–20/09 · F5a Diagnóstico IA Gemini (RF05/06)

- [ ] 🎯 **ENTREGÁVEL S7 — Diagnóstico semanal gerado e persistido (RF05/RF06)** (entrega dom 20/09) — [card](https://trello.com/c/JJLbz4Jl)
  - [ ] Prompt com os 5 blocos da Tabela V: persona, contexto, dados, diretrizes, formato (RNF04)
  - [ ] Retorno JSON com diagnostico_exercicios, analise_grupamentos, recomendacoes_proxima_sessao (RNF05)
  - [ ] score_geral = (Pv + Pi) / 2 calculado no backend (Equação 1)
  - [ ] Diagnóstico persistido na tabela diagnostics (RF06)
  - [ ] Falha da API Gemini não perde nenhum dado de treino (RNF06)
  - [ ] Mock do Gemini funcionando (GEMINI_MOCK=true) para dev e testes
- [ ] Sessão A — geminiService: template de prompt de 5 blocos (Tabela V) — [card](https://trello.com/c/NCwWY3sZ)
- [ ] Sessão B — diagnosticController + score_geral no backend — [card](https://trello.com/c/WGDVaEb9)
- [ ] Teste com chave real: 3 cenários de semana simulada — [card](https://trello.com/c/F0Wv7hDo)

## S8 · 21–27/09 · F5b Tela Diagnóstico + F6 Histórico (RF07)

- [ ] 🎯 **ENTREGÁVEL S8 — Fluxo principal ponta-a-ponta (RF07)** (entrega dom 27/09) — [card](https://trello.com/c/MLlAbzpN)
  - [ ] Tela Diagnóstico com score visual 0–100 (círculo/barra)
  - [ ] Análises por grupamento/exercício + recomendações exibidas
  - [ ] Histórico: sessões, progressão de carga, volume semanal e diagnósticos anteriores (RF07)
  - [ ] Demo ponta-a-ponta gravada (login → rotina → treino → volume → diagnóstico → histórico)
- [ ] Sessão A — Frontend F5b: tela "Diagnóstico da Semana" — [card](https://trello.com/c/rbDxorvY)
- [ ] Sessão B — F6: histórico de progressão (backend + frontend) — [card](https://trello.com/c/cJsIQnv7)

## S9 · 28/09–04/10 · Hardening + Testes 🏁 DEV PRONTO

- [ ] 🎯 **ENTREGÁVEL S9 — Sistema completo + testes verdes (DEV PRONTO até 06/10)** (entrega dom 04/10) — [card](https://trello.com/c/Usgbx6xy)
  - [ ] Testes de integração verdes (RF05/06/07)
  - [ ] RNF02: registros órfãos rejeitados pelo banco (teste)
  - [ ] RNF06: falha simulada da API preserva registros (teste)
  - [ ] Responsividade OK nos fluxos críticos (RNF01)
  - [ ] Código limpo: sem console.logs, código morto ou TODOs
  - [ ] Tag v1.0-dev criada e enviada (🏁 DEV PRONTO antes de 06/10)
- [ ] Sessão A — Testes de integração (RF05/06/07 + RNF02/05/06) — [card](https://trello.com/c/tLtCxKQu)
- [ ] Sessão B — Responsividade + limpeza + buffer de bugs — [card](https://trello.com/c/bqtMAAlK)

## OUT · 05–19/10 · Validação

- [ ] Frente 2 — Avaliação heurística de Nielsen (até 11/10) — [card](https://trello.com/c/O9TROMLb)
- [ ] Frente 3 — Validação de conteúdo dos diagnósticos da IA (até 18/10) — [card](https://trello.com/c/DZ66AmkU)
- [ ] Correções da validação + CODE FREEZE 🧊 (19/10) — [card](https://trello.com/c/IqkltrwX)

## OUT/NOV · 20/10–06/11 · Escrita TCC II + Entrega

- [ ] Tirar prints das principais funcionalidades (máx. 6 figuras pro documento inteiro) — [card](https://trello.com/c/en1Tho0j)
- [ ] Capítulo de resultados: telas, testes e matriz preenchida (até 26/10) — [card](https://trello.com/c/VRinhHiX)
- [ ] Revisão do orientador + ajustes finais (até 01/11) — [card](https://trello.com/c/jPsMIk8V)
- [ ] 🎓 ENTREGA FINAL TCC II — 06/11 — [card](https://trello.com/c/igTEVfpf)
