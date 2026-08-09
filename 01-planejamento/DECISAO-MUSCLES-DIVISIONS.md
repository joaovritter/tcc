# Decisão de design: coluna `muscles[]` na tabela `divisions`

> **Status: DECIDIDO em 09/08/2026 — Opção D (o campo não existe).** Documento
> registra o contexto, a origem do campo, o problema identificado, as opções
> avaliadas (A/B/C) e a decisão final. Reflexos já aplicados em
> `PLANEJAMENTO.md` (D5), `TASKS.md` e nos cards S3/S4 do Trello.

## Contexto do projeto

Sistema web de TCC para gerenciamento de treino de hipertrofia, com
diagnóstico semanal gerado por IA (Gemini). Stack: Node/Express/TypeScript +
PostgreSQL no backend, React/Vite/TypeScript no front.

O DER tem 8 tabelas, entre elas `divisions` (os dias da semana de treino do
usuário, ex.: "Segunda = treino de peito") e `division_exercises` (quais
exercícios entram em cada dia, com ordem de execução).

## Origem do campo

O planejamento da feature de schema/seed especifica:

```
divisions (user_id, day_of_week 0–6, name, muscles[])
```

`muscles[]` seria um array guardando quais grupamentos musculares aquele dia
da semana treina (ex.: `['peito', 'ombros', 'triceps']`).

## Por que esse campo não é redundante à primeira vista

O cronograma do projeto separa a criação da divisão da escolha dos
exercícios em duas features/semanas diferentes:

- **Feature "Divisão semanal":** usuário define os dias da semana e o que
  cada um treina — ainda sem nenhum exercício escolhido.
- **Feature "Exercícios da rotina":** usuário escolhe e ordena os exercícios
  de cada dia, gravando em `division_exercises`.

Isso significa que, no momento em que a divisão é criada (primeira feature),
**não existe nenhuma linha em `division_exercises`** — não dá pra derivar
quais músculos aquele dia treina via JOIN
(`divisions → division_exercises → exercises → muscle_groups`), porque o
resultado sempre viria vazio. `muscles[]` existiria pra guardar essa
informação antes dos exercícios existirem de fato.

## O problema identificado

Depois que a segunda feature é implementada e o usuário começa a adicionar
exercícios reais em cada divisão, surge a pergunta: o `muscles[]` deve
refletir automaticamente os exercícios que existem agora, ou continua sendo
só o que o usuário definiu manualmente na criação da divisão?

**Cenário concreto de teste:** divisão criada como
`muscles: ['peito', 'ombros']`. Depois, o usuário adiciona um exercício de
bíceps nela (grava em `division_exercises`). O que acontece com
`muscles[]`?

## Opções avaliadas

### Opção A — Campo manual, independente dos exercícios

`muscles[]` é definido pelo usuário só na tela de criação/edição da divisão
e nunca muda sozinho. Adicionar ou remover um exercício não toca nesse
array — ele continua refletindo só o que foi escolhido manualmente.

- **Prós:** simples de implementar, sem lógica extra no endpoint de
  exercícios, casa com o motivo original do campo (existir antes dos
  exercícios).
- **Contras:** pode divergir da realidade. O campo vira "o que eu planejei
  treinar" e não necessariamente "o que eu realmente treino nesse dia". Um
  usuário pode ver "Segunda: Peito, Ombros" numa divisão que já tem um
  exercício de bíceps cadastrado, e isso confunde — **motivo pelo qual essa
  opção foi rejeitada** na avaliação inicial (ruim pra experiência do
  usuário).

### Opção B — Campo derivado, recalculado a cada mudança em `division_exercises`

Toda vez que um exercício é adicionado ou removido de uma divisão, o
backend recalcula `muscles[]` a partir dos grupamentos musculares dos
exercícios atuais e sobrescreve a coluna inteira (mais seguro que tentar
inserir/remover item por item, evita duplicata e sobra).

- **Prós:** sempre reflete a realidade, sem divergência visível pro
  usuário.
- **Contras:** reabre a pergunta "por que guardar isso numa coluna, se dá
  pra derivar via JOIN sempre que for exibir?". O ganho real fica restrito a
  performance de leitura (evita agregação a cada listagem) e ao caso de uso
  da criação da divisão (antes de existir exercício). Fora isso, é dado
  redundante que precisa de lógica extra pra manter sincronizado — cada
  escrita em `division_exercises` passa a ter um efeito colateral em
  `divisions`, o que é uma fonte comum de bugs se algum endpoint esquecer de
  chamar o recálculo.

### Opção C (ideia levantada, não avaliada) — Sugestão inicial + sincronização manual

`muscles[]` é preenchido pelo usuário na criação da divisão (igual à Opção
A), mas a tela oferece uma ação explícita tipo "sincronizar com os
exercícios cadastrados", que recalcula o array sob demanda (igual à lógica
da Opção B), em vez de recalcular automaticamente a cada escrita. Dá
controle ao usuário sobre quando atualizar, sem lógica automática escondida
e sem o array divergir silenciosamente sem o usuário saber que pode
atualizar.

- Não avaliada em profundidade ainda — listada aqui como terceira via entre
  "nunca sincroniza" e "sincroniza sempre sozinho".

## O que essa decisão influencia

- **Endpoint de criar/editar divisão:** grava `muscles[]` diretamente do
  input do usuário (todas as opções).
- **Endpoint de adicionar/remover exercício da divisão:** só precisa tocar
  em `divisions` nas Opções B e C (B: sempre; C: só quando o usuário aciona
  a sincronização).
- **Tela "Minha Divisão":** exibe `muscles[]` como resumo rápido de cada
  dia — a opção escolhida define se esse resumo é "o que o usuário
  planejou" ou "o que está de fato montado".
- **Consistência de dados:** só a Opção B garante que `muscles[]` nunca
  fique desatualizado em relação a `division_exercises`.

## Decisão final

**Opção D — sem coluna, músculos sempre derivados via JOIN, com estado
vazio no dia 1.**

Não existe `muscles[]` (nem qualquer campo equivalente) na tabela
`divisions`/`Divisao`. Na criação da divisão, o usuário só escolhe o dia da
semana e digita um nome livre (ex.: "Peito e Tríceps") — sem tela de
seleção de grupamentos. Na exibição, o backend deriva os músculos
treinados naquele dia via JOIN
`divisions → division_exercises → exercises → muscle_groups`
(`Divisao → DivisaoExercicio → Exercicio → GrupamentoMuscular` no schema
atual), agregando os grupamentos distintos dos exercícios cadastrados. Se
a divisão ainda não tem nenhum exercício (cenário do dia 1, antes da
feature "Exercícios da rotina"), a tela mostra um estado vazio ("Nenhum
exercício definido ainda") em vez de uma lista de músculos.

Chegou-se a essa decisão passando pelas Opções A, B e C (ver histórico
abaixo), depois de avaliação externa num projeto de referência ter
confirmado que o campo nunca tinha uso funcional (só exibição) — o que
levou à pergunta natural de por que persistir esse dado. A Opção D resolve
isso na raiz: elimina o campo em vez de tentar mantê-lo consistente.

### Justificativa

1. **Elimina o problema de origem, não só mitiga.** Não existe dado
   gravado, logo não existe dado pra ficar dessincronizado dos exercícios
   reais. As Opções A/B/C giravam em torno de "como lidar com a
   divergência"; D remove a pergunta.
2. **Reduz fricção do usuário.** Ele não digita a mesma informação duas
   vezes (nome da divisão + chips de grupamento que muitas vezes só serão
   confirmados quando os exercícios forem cadastrados). Cadastro fica mais
   simples: só dia da semana + nome livre.
3. **Custo de leitura é desprezível nesta escala.** O JOIN com
   `DISTINCT`/`array_agg` por divisão é uma query trivial para o volume de
   dados de um TCC (um usuário, poucas divisões, poucos exercícios por
   dia). O ganho de performance que justificaria persistir o array (razão
   original da Opção B ter sido descartada) não se aplica aqui.
4. **Estado vazio é mais honesto que dado adivinhado.** Mostrar "nenhum
   exercício definido ainda" no dia 1 é mais correto do que mostrar chips
   escolhidos manualmente (ou sugeridos pela IA) antes de qualquer
   exercício existir de fato — que era exatamente o cenário problemático
   que motivou o campo originalmente.
5. **Sem perda funcional confirmada.** A análise do projeto de referência
   já havia mostrado que o campo não alimentava cálculo de volume/frequência
   (esses sempre foram derivados via JOIN em `exercises.muscle_group_id`),
   não era input de nenhum prompt de diagnóstico de IA, e não alimentava
   comparação "planejado vs. realizado". A única coisa que se perde é a
   IA sugerir grupamentos *antes* de existir exercício — que nunca foi
   consumida por nada além da própria tela.

### Impacto na implementação

- **Schema:** `Divisao` não ganha coluna `muscles`/`grupamentos` — o
  `schema.sql` atual já está correto nesse sentido (só
  `id_divisao, fk_usuario, dia_semana, nome`), não é necessária migração.
- **Criação/edição de divisão:** formulário só pede dia da semana + nome
  livre. Sem tela/etapa de seleção de grupamentos.
- **Endpoint de leitura da divisão (GET):** faz o JOIN
  `Divisao → DivisaoExercicio → Exercicio → GrupamentoMuscular`, agrega
  grupamentos distintos por divisão, retorna lista vazia quando não há
  exercícios ainda.
- **Adicionar/remover exercício da divisão:** nenhum efeito colateral em
  `Divisao` — o resumo de músculos já reflete a mudança na próxima leitura,
  sem sync.
- **Tela "Minha Divisão":** exibe o resumo derivado; mostra estado vazio
  ("Nenhum exercício definido ainda") quando a divisão não tem exercícios.

## Histórico da decisão (Opções A/B/C avaliadas antes de D)

Registrado como referência do raciocínio percorrido — não reflete mais a
decisão vigente.
