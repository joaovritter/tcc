# Instruções de consistência — Sistema × Texto do TCC

## Referência do texto do TCC

O texto oficial do TCC está em [tcc/planejamento/tcc1Joao.pdf](tcc1Joao.pdf). É esse documento que define os RFs, RNFs, metodologia, DER e prompt de 5 blocos citados neste diretório — qualquer verificação de "o que o TCC diz" deve consultar esse PDF.

## Regra principal

O **sistema implementado** e o **texto do TCC** (RFs, RNFs, metodologia, DER, prompt de 5 blocos etc.) devem descrever **exatamente a mesma coisa**. Nenhum dos dois é "a referência automática" — os dois precisam ficar iguais.

## O que fazer sempre que houver divergência

Sempre que, durante o desenvolvimento, surgir uma decisão, implementação ou ajuste que **diverge do que está escrito no texto do TCC** (ou vice-versa: perceber que o texto descreve algo que o sistema não vai fazer):

1. **Alertar imediatamente** — não seguir em silêncio nem assumir qual lado está certo.
2. **Documentar a divergência**:
   - O que o TCC diz.
   - O que o sistema está fazendo (ou vai fazer).
   - Por que surgiu a diferença.
3. **Registrar como card no Trello** (lista **📌 LEIA-ME · Guia & Decisões**), com prefixo `⚠️ Ajustar texto do TCC —` ou `⚠️ Ajustar sistema —`, dependendo de qual lado provavelmente precisa mudar (se não estiver claro, usar `⚠️ Divergência TCC × Sistema —` e decidir depois).
4. **Não decidir sozinho qual lado muda** — o autor decide se ajusta o texto do TCC ou a implementação. A IA só aponta a divergência e propõe as duas opções quando possível.
5. Depois da decisão, atualizar o [PLANEJAMENTO.md](PLANEJAMENTO.md) (seção de decisões de escopo) se for algo relevante ao escopo geral, e marcar/arquivar o card do Trello.

## Formato dos roteiros semanais (SEMANA*.md)

A partir da SEMANA4.md, todo roteiro semanal (`SEMANAn.md`) deve marcar
progresso **dentro de cada Passo**, não numa lista-resumo separada no
início do arquivo.

**Headings (`##`/`###`) nunca levam checkbox na frente** — `- [ ] ##
Passo N` quebra o markdown (vira item de lista com `##` literal em vez de
heading renderizado). Headings ficam puros, só como título da seção.

O checkbox vai em cada **pedaço de conteúdo abaixo** do heading: parágrafos
de instrução, blocos em negrito tipo `**funcaoTal**` que introduzem um
trecho de código, e itens de checklist final (ex.: os passos numerados do
"Fechar a semana") — cada um com seu próprio `- [ ]`/`N. [ ]`. O autor
marca `[x]` peça por peça conforme implementa, pra ver exatamente onde
parou dentro de um Passo. Blocos de código e citações (`>`) não recebem
checkbox. Exemplo (ver SEMANA4.md):

```md
## Passo 1 — `server/src/models/exerciseModel.ts`

- [ ] Só leitura — o catálogo de exercícios é fixo (seed da S1)...

### `server/src/controllers/exerciseController.ts`
```

## Exemplo já registrado

- **D2 — Diagnóstico por sessão vs. semanal**: o planejamento inicial propôs diagnóstico semanal consolidado (RF04+RF05), mas o autor confirmou que o TCC define feedback **por sessão**. Corrigido no PLANEJAMENTO.md; card de alerta criado no Trello para revisar a redação correspondente no texto do TCC.
