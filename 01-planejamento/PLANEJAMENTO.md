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

Onboarding com perfil/anamnese/lesões · sugestão de divisão por IA (`/ai/suggest-division`) · avaliação IA por sessão · metas de carga por série (`ai_target_*`) · calendário mensal · dashboard elaborado · Redux · deploy. Detalhes e justificativas na lista **🧊 Cortado do Escopo** do Trello.

> **Reincluído no escopo (05/08):** séries tipo "feeder" — `SerieTreino.tipo` agora aceita `aquecimento | feeder | valida`.

---

## 2. Decisões de escopo (recomendadas — confirmar até 07/08)

- **D1 — Recomeçar limpo neste repositório (`tcc`)**, MVC desde o início; o projeto antigo vira referência para portar seletivamente (AuthView, WorkoutView podado, seed de exercícios).
- **D2 — Diagnóstico por SESSÃO** (mantém RF05/RF06 como no texto original do TCC); RF04 (volume semanal por grupamento) é calculado no backend de forma acumulativa, mas não é o gatilho do diagnóstico. ⚠️ ver card Trello sobre revisão de redação.
- **D3 — Cortes** conforme lista 🧊 do Trello.
- **D4 — Correções obrigatórias**: coluna RPE, tabela `diagnostics`, volume no backend, score no backend, prompt de 5 blocos, testes, sem backdoor.
- **D5 — Divisão sem `muscles[]` (09/08)**: `Divisao` guarda só `dia_semana` + `nome` livre; os grupamentos treinados no dia são **derivados via JOIN** `Divisao → DivisaoExercicio → Exercicio → GrupamentoMuscular` na leitura, com estado vazio enquanto não houver exercício. Elimina dado redundante e a necessidade de sincronizar array com `DivisaoExercicio`. Racional completo em [`DECISAO-MUSCLES-DIVISIONS.md`](./DECISAO-MUSCLES-DIVISIONS.md) (Opção D; A/B/C avaliadas e descartadas).
- **D6 — Sidebar vira barra inferior no mobile (31/08)**: a `Sidebar` (`client/src/components/Sidebar.tsx`) hoje é fixa à esquerda com expansão por hover — em tela estreita isso não cabe bem (barra fininha do lado, sem hover em touch). Decisão: usar `useMediaQuery` (breakpoint `sm`) para renderizar uma barra horizontal fixa embaixo (só ícones, sem expandir) em telas pequenas, mantendo a sidebar vertical no desktop. Implementação entra na S9 (Sessão B — Responsividade), não agora.

- **D7 — Navegação por estado até a S9 (03/09)**: com a segunda tela logada (`TodaySessionView`, S5), o `App.tsx` passa a alternar telas com um `useState<'divisao' | 'treino'>` repassado à `Sidebar`, em vez de entrar `react-router`. Roteamento real (URL, back do navegador, rota protegida) só se justifica com mais telas e fica para a S9 — meio-caminho agora custaria duas refatorações. Registro do racional em [`SEMANA5.md`](./SEMANA5.md) (Passo 6).
- **D8 — Séries são registro histórico, não configuração (03/09)**: `SerieTreino` entra por `POST` individual e sai por `DELETE` pontual — o padrão "apaga-e-reinsere" das S3/S4 não se aplica, porque cada série é um fato datado que a S6 vai contar como volume. `GET /sessions/today` não cria treino; quem cria é o `POST /sessions/start`, idempotente por dia.

## 3. Arquitetura alvo (MVC, TypeScript)

```
server/src/
  config/db.ts
  types/        interfaces/tipos compartilhados (User, Division, SetLog, Diagnostic...)
  models/       User, Division, Exercise, Session, SetLog, Diagnostic (SQL)
  controllers/  auth, division, session, diagnostic
  services/     geminiService (5 blocos + mock), volumeService, scoreService
  routes/       finas (URL → controller)
  middleware/   auth (JWT)
client/src/     views/ components/ services/ context/   ← camada de Visão (React + TS, .tsx)
```

Stack em TypeScript nas duas pontas: backend com `tsx`/`ts-node` + `tsc` para build,
frontend com o template `react-ts` do Vite. `tsconfig.json` em `server/` e `client/`.

Entidades (nomes reais do `schema.sql`, em português, como no DER do TCC): `Usuario`, `GrupamentoMuscular`, `Exercicio`, `Divisao` (`dia_semana` 0–6 + `nome` — **sem** `muscles[]`, ver D5), `DivisaoExercicio` (`ordem`), `Treino` (`data`, `duracao_total`, `completed`), `SerieTreino` (`tipo`, `carga`, `repeticoes`, **`rpe` 6–10**, `rir` 0–5), `DiagnosticoIA` (`conteudo_json` JSONB, `score_geral`, `semana_referencia`).

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
| S8 | 21–27/09 | F5b + F6 Histórico (RF07) | F6: histórico (backend) | Tela "Diagnóstico da Semana" + histórico (front) | Fluxo ponta-a-ponta completo |
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
| 4 | Diagnóstico da Semana: score 0–100 + análise por grupamento + recomendações | S7 | RF05/RF06 — figura central do trabalho |
| 5 | Histórico: progressão de carga + diagnósticos anteriores | S8 | RF07 |

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
2. **Contexto** — semana de referência + grupamentos treinados
3. **Dados de treino** — volume de séries válidas, RPE/RIR por série (PostgreSQL)
4. **Diretrizes científicas** — limiar 10 séries/grupamento [Schoenfeld]; RPE 9 = 1 RIR [Zourdos; Helms]
5. **Formato de saída** — apenas JSON: `diagnostico_exercicios`, `analise_grupamentos`, `recomendacoes_proxima_sessao`
