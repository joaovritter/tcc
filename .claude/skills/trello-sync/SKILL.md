---
name: trello-sync
description: Sincroniza o TASKS.md do repositório com o quadro Trello do TCC (dois sentidos). Use quando o usuário pedir para sincronizar tarefas, marcar tarefa concluída, atualizar o quadro/checklist, ou invocar /trello-sync.
---

# Sincronização TASKS.md ⇄ Trello

Quadro do TCC: **https://trello.com/b/eWQA6LXr** (board "TCC II — Sistema Hipertrofia").
Arquivo espelho: **planejamento/TASKS.md** no repositório.

## Pré-requisito

As ferramentas do Trello (MCP/conector `trello*`) precisam estar disponíveis. Se não estiverem, avise o usuário que a sincronização precisa do conector Trello conectado e pare.

## Chave de mapeamento

Cada tarefa no `planejamento/TASKS.md` termina com `[card](https://trello.com/c/<shortLink>)` — esse link identifica o card correspondente. Itens indentados sob um card 🎯 ENTREGÁVEL correspondem, **pelo texto**, aos itens do checklist "Critérios de aceite" daquele card no Trello.

## Regra de sincronização

**União de conclusão: concluído em qualquer lado = concluído nos dois.** Nunca "desconcluir" nada automaticamente; se houver divergência estranha (ex.: item desmarcado de propósito), pergunte ao usuário.

## Passos

1. Leia o `planejamento/TASKS.md` e colete o estado de cada checkbox (cards e subitens).
2. Leia o quadro no Trello:
   - Um card está **concluído** se estiver na lista `✅ Concluído` ou marcado como done.
   - Um subitem está concluído se o check item correspondente do checklist estiver `checked`.
3. Compare e propague:
   - **MD → Trello:** para cada `[x]` no MD cujo card não está concluído: mova o card para a lista `✅ Concluído` (`trelloWriteCard` action `move`) e/ou marque `mark_done`; para subitens, marque o check item (`trelloWriteChecklist` action `update_item`, `checked: true`).
   - **Trello → MD:** para cada card/check item concluído no Trello cujo checkbox está `[ ]` no MD: edite o `planejamento/TASKS.md` marcando `[x]`.
4. Cards novos que existam só num dos lados: adicione no outro (no MD, na seção da lista correspondente, mantendo o link do card; no Trello, criando o card na lista certa) — pergunte antes se não for óbvio a que semana pertence.
5. Ao final, mostre um resumo: N tarefas sincronizadas MD→Trello, N Trello→MD, divergências que precisaram de decisão.
6. Se o `planejamento/TASKS.md` mudou, ofereça commitar (`git add planejamento/TASKS.md && git commit`), mas só faça push se o usuário pedir.

## Cuidados

- Não altere nomes, descrições ou datas dos cards — a sincronização é só de **estado de conclusão** (e criação de tarefas novas, com confirmação).
- Não remova os links `[card](...)` do MD; sem eles o mapeamento se perde.
- Semana totalmente concluída no MD = todos os cards da lista S# no Trello movidos para `✅ Concluído`.
