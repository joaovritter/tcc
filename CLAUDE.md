# HyperTrack (TCC II) — contexto do projeto

TCC II de João Vitor dos Santos Ritter (UFN), orientador Fabiano Niederauer Flôres.
Sistema **HyperTrack**: registro de treinos de musculação com diagnóstico por IA (Google Gemini) ao fim de cada sessão.

## Onde está cada coisa

Este diretório é o repositório git (`github.com/joaovritter/tcc`, branch `main`).
- `server/` — API Node + Express + TypeScript + PostgreSQL (MVC). Testes: `npm test`.
- `client/` — React + Vite + TypeScript + Material UI.
- `01-planejamento/` — planejamento, roteiro da avaliação heurística, planilha de achados.
- `escrita/textos_tcc2.md` — textos prontos para o artigo, na ordem das seções. Em caso de diferença com o Trello, vale este arquivo.
- O artigo tem limite de 10 páginas. O code freeze foi em 19/10/2026; depois disso só entram correções pequenas ligadas aos achados da avaliação heurística.

## Usuários de demonstração

- `joao@teste.com` — 5 semanas de treino (28/09 a 26/10/2026) com diagnósticos reais.
- `joao2@teste.com` — sem dados, para ver as telas vazias.
- Senha dos dois: `www.com.brj`. Recriar com `npm run seed:demo` em `server/` (o `db:reset` já chama). Depois de mudar esses usuários pelo app, `npm run demo:export` regrava `server/src/demo/usuariosDemo.json`.

## Avaliação heurística (Frente 2) — andamento

Roteiro e resultados por tela: `01-planejamento/avaliacao-heuristica.md` (versão final; achados A1 a A8). Anotações brutas do autor: `01-planejamento/resultados_heuristica.md`.
Cada achado precisa de: tela, problema, heurística (1 a 10 de Nielsen) e severidade (0 a 4). O mesmo problema em duas telas é um achado só.
Para o texto só importam: contagem por severidade, 1 ou 2 exemplos e nenhum problema de severidade 3 ou 4 sem correção (critério do RNF01).

Achados confirmados pelo autor:

| Tela | Heurística | Problema | Sev. | Situação |
|---|---|---|---|---|
| Treino de Hoje | 5. Prevenção de erros | Lixeira apaga a série na hora, sem confirmação nem desfazer | 3 | a corrigir (confirmação em dois toques, como o "Finalizar") |
| Minha Divisão | 1. Visibilidade | "Salvar semana" não mostra confirmação. Causa: `FeedbackAlert` usa `erro ?? sucesso` e recebe `erro=''`; trocar por `\|\|` | 2 | registrado (autor decidiu não mexer no código além do A1) |
| Treino de Hoje | 9. Corrigir erros | Erro ao registrar série aparece no topo do card, fora da tela no celular; campo não destacado | 2 | registrado |
| Treino de Hoje | 5. Prevenção de erros | Carga sem limite nem confirmação (9999 kg, ou 225 no lugar de 22,5) | 2 | registrado |
| Treino de Hoje | 3. Controle e liberdade | Não dá para editar série; apagar e refazer joga a série para o fim da lista | 2 | registrado |
| Minha Divisão | 3. Controle e liberdade | Diálogo de exercícios descarta mudanças sem avisar ao clicar fora ou em Cancelar | 2 | registrado |
| Navegação (celular) | 6. Reconhecimento | Barra inferior só com ícones, sem texto | 2 | registrado |
| Histórico (Cargas e Volume) | 10. Ajuda e documentação | Estado vazio não diz o que fazer para ter dados (um achado só, duas abas) | 1 | autor quer corrigir |

Avaliação encerrada em 29/10/2026: 8 achados (sev. 1: 1, sev. 2: 6, sev. 3: 1, sev. 4: 0). Texto em `escrita/textos_tcc2.md`, seção VI.B.

Verificado e **não** é achado (decisão do autor): carga com vírgula (convertida de propósito); login com "Credenciais inválidas" genérico (segurança); termos "limiar" e "séries válidas" (público é praticante experiente); Volume da Semana sem atalho para semanas anteriores; mensagem de "dia de descanso"; Diagnóstico (Pv/Pi descritos, data da sessão visível).

**Ponto positivo para citar no texto:** a tela Diagnóstico vazia orienta o usuário ("Nenhum diagnóstico ainda. Em Treino de hoje, toque em Finalizar e avaliar treino…"), o que atende à heurística 10. Frase pronta em `escrita/textos_tcc2.md`, seção VI.B.

## Como trabalhar com o autor

- Não fazer `git commit` nem push: deixar as mudanças e entregar a mensagem de commit pronta.
- Não marcar checkboxes dos arquivos de planejamento; o autor marca o próprio progresso.
- Respostas e textos em português.
