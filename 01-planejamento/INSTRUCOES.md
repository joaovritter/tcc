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

## Nível do projeto: maturidade de estudante (03/10)

Este é um TCC de graduação. Maturidade demais no código (teste de tudo,
tratamento de todo erro possível, uma decisão com "alternativas descartadas"
para cada detalhe) fica com cara de código gerado por IA e é difícil de
defender na banca. Isso não quer dizer fazer de qualquer jeito nem reduzir o
que o TCC promete. Quer dizer **calibrar**. Todo roteiro semanal, antes de
propor uma tarefa, a classifica em um destes 3 níveis:

| Nível | O que é | O que fazer |
|---|---|---|
| **1 — O que o TCC promete** | RFs, RNFs, a matriz de rastreabilidade (Tabela VI), o prompt de 5 blocos, o score da Equação 1, os testes que a Seção D cita | Fazer **completo**. Não se negocia |
| **2 — Bug no uso normal** | Algo que um usuário comum encontra pela tela (500 ao salvar, campo que não aceita o que a pessoa digita, conteúdo escondido no celular) | Consertar do **jeito mais simples** que resolve. Um teste só se for barato |
| **3 — Caso de borda e polimento** | Erro que só aparece chamando a API à mão, cobertura extra de testes, cenários raros, refinamento de UX além do necessário | **Cortar**, ou deixar registrado como limitação conhecida |

**Regras práticas:**

- **Testes:** os da matriz de rastreabilidade + o caminho feliz principal de
  cada RF. Não um teste por regra ou por decisão. Postman só para rota nova.
- **Erros:** tratar o que o TCC cita (RNF02/05/06) e o que quebra a tela no
  uso normal. Não tratar todo `catch` possível.
- **Interface:** a base visual veio de modelos prontos (UI, sidebar e
  animações — ver `DESIGN-BASE.md`). Não acrescentar animação ou detalhe além
  do que o modelo já traz.
- **Comentários no código:** curtos, onde o autor comentaria. A justificativa
  longa das decisões fica no `PLANEJAMENTO.md`, não no código.
- **Critério final:** o autor precisa conseguir explicar **cada linha** na
  defesa sem ler. Se não conseguiria, simplificar ou cortar.

Exemplo aplicado: a revisão da `SEMANA9.md` (03/10) cortou 8 testes, o Postman
da semana, o "Retomar treino" e o 400 para exercício inexistente (nível 3), e
manteve os testes de integração da Tabela VI (nível 1) e as correções de 500 ao
salvar a rotina e do teclado no celular (nível 2).

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

## Requisições no Postman (coleção `TCC`)

A coleção `TCC` do Postman é **uma lista única, sem pastas, que roda inteira
no Run collection**. Todo roteiro semanal que criar ou mudar requisição segue
a numeração dessa coleção, e não a numeração dos Passos da semana. O Passo do
roteiro diz onde a requisição entra na coleção.

### Como cada requisição aparece no roteiro

Toda requisição nova ou alterada no `SEMANAn.md` traz, nesta ordem:

1. **Nome na coleção**, com o número da sequência (ex.: `25.1 - listar metas`).
   Variações do mesmo endpoint (erros, parâmetros diferentes) usam subnúmero:
   `20.1`, `20.2`, `20.3`… Quando a resposta esperada é erro, o status vai no
   nome: `(400)`, `(404)`, `(409)`.
2. **Posição**: depois de qual requisição ela entra (ex.: "entre o 19.3 e o
   20.1") ou "no fim da coleção".
3. **Método + URL** sempre com `{{baseUrl}}` e variáveis, nunca
   `http://localhost:3000` nem UUID fixo.
4. **Auth**: `Inherit` (padrão, usa o `{{token}}` da coleção), `No Auth`, ou
   header `Authorization: Bearer {{tokenOutro}}` para o segundo usuário. Nunca
   colar token fixo na aba Authorization da requisição.
5. **Body** (raw → JSON), quando tiver.
6. **Pre-request** (*Before request*), quando tiver.
7. **Post-response** (*After response*) com `pm.test` de status e do conteúdo.
   Toda requisição tem pelo menos o teste de status. Resposta de erro também
   confere a mensagem (`pm.response.json().erro`).
8. **Variáveis**: quais ela salva (`pm.environment.set`) e quais usa.
9. **Resultado esperado**: status + JSON (pode ser cortado com `…`).

### Regras para a coleção continuar rodando de uma vez

- **Dependência só para trás**: uma requisição só usa variável salva por uma
  requisição **anterior** na lista.
- **Usuário novo a cada execução**: o `2 - register` gera
  `postman.<timestamp>@teste.com` no pre-request, então a coleção nunca
  depende de dado de uma execução passada e pode rodar quantas vezes quiser.
- **Nada de SQL no fluxo**: o Run collection não roda `UPDATE` no banco.
  Conferência no banco (ex.: `SELECT COUNT(*)`, voltar data de treino) vai no
  roteiro como passo manual, **fora** da coleção.
- **Todas as sessões são de hoje**: no runner não dá pra voltar a data. Os
  valores esperados consideram as 3 sessões com série work na semana atual
  (Peito = 6 séries válidas; `pv` = 20 na 1ª sessão e 60 na 3ª).
- **Mexeu no fluxo, confere tudo**: requisição nova que cria treino ou série
  muda contagens mais adiante (16.1, 13, 20.1, 22.2…). O roteiro precisa
  dizer quais testes seguintes mudam e o novo valor.
- **Fechar a semana**: o Run collection passa **100% verde** com o servidor
  local (`GEMINI_MOCK=true`) e o ambiente `TCC local` selecionado.

### Variáveis do ambiente `TCC local`

| Variável | Quem salva | Observação |
|---|---|---|
| `baseUrl` | você | `http://localhost:3000` |
| `emailTeste` | 2 (pre-request) | e-mail único da execução |
| `token` | 3 | usuário principal |
| `idExercicio` | 5.2 | Supino Reto com Barra |
| `diaHoje`, `idDivisao` | 6.1 | |
| `idTreino` | 8.1, 9.1, 10.1, 21.1 | **sempre o último treino iniciado** |
| `idDiagnostico` | 8.5, 14, 22.1 | último diagnóstico gerado |
| `volumeSemana` | 13 | JSON do volume, comparado no 20.1 |
| `mesAtual` | 16.1 (pre-request) | `AAAA-MM` |
| `idSessaoHoje` | 16.1 | sessão principal (80 kg, com série work) |
| `idSessao75` | 16.1 | sessão de 75 kg (sem diagnóstico) |
| `emailOutro`, `tokenOutro` | 24.1, 24.2 | segundo usuário (isolamento) |

### Sequência atual da coleção (78 requisições, S8)

| # | Requisições | O que cobre |
|---|---|---|
| 1–4 | health, register, login, me | servidor e usuário |
| 5.1–5.2 | listar exercícios, exercícios do grupamento | catálogo |
| 6.1–6.5 | salvar divisão de hoje, listar divisões, salvar/listar exercícios da divisão, resumo muscular | rotina |
| 7 | treino de hoje | tela Hoje sem treino aberto |
| 8.1–8.5 | sessão 70 kg: iniciar, 2 séries work, finalizar, gerar diagnóstico | dado de histórico |
| 9.1–9.4 | sessão 75 kg: iniciar, 2 séries work, finalizar (sem diagnóstico) | dado de histórico |
| 10.1–10.10 | sessão principal 80 kg: iniciar, iniciar de novo (D8), aquecimento, feeder, work RIR, work RPE, 4 séries inválidas (400) | registro de séries |
| 11 | diagnóstico treino aberto (409) | guard do Passo 1 da S8 |
| 12.1–12.2 | finalizar, finalizar de novo (409) | fim do treino |
| 13 | volume semanal | RF volume |
| 14–15 | gerar diagnóstico, último diagnóstico | diagnóstico (D13) |
| 16.1–16.7 | histórico do mês + variações do `?mes` | calendário |
| 17.1–17.3 | detalhe sessão work, sessão 75 kg, id inválido | detalhe (D17) |
| 18 | exercícios com histórico | |
| 19.1–19.3 | progressão de carga + negativos | gráfico (D17) |
| 20.1–20.6 | volume histórico + variações de `?semanas` | D10/D18 |
| 21.1–21.6 | sessão só de aquecimento: iniciar, detalhe aberto (404), série, finalizar, diagnóstico (400), detalhe | D16 |
| 22.1–22.3 | gerar diagnóstico de novo, histórico e detalhe com o novo | D14 |
| 23.1–23.4 | diagnóstico sem token, treino inexistente, ids inválidos | negativos |
| 24.1–24.8 | segundo usuário: register, login, histórico/detalhe/progressão/volume/diagnóstico do primeiro | isolamento |

Requisição de semana nova entra **no fim** (próximo número: `25`), a menos
que o fluxo exija que ela venha antes. Nesse caso, entra com subnúmero no
ponto certo, e o roteiro atualiza esta tabela.

## Exemplo já registrado

- **D2 — Diagnóstico por sessão vs. semanal**: o planejamento inicial propôs diagnóstico semanal consolidado (RF04+RF05), mas o autor confirmou que o TCC define feedback **por sessão**. Corrigido no PLANEJAMENTO.md; card de alerta criado no Trello para revisar a redação correspondente no texto do TCC.
