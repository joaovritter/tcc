# Decisão de design: coluna `muscles[]` na tabela `divisions`

> Documento pra levar pra avaliação externa (outro projeto similar). Registra
> o contexto, a origem do campo, o problema identificado e as opções
> avaliadas até agora — nenhuma foi definida ainda.

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

## Estado atual

Nenhuma opção foi definida. Opção A foi descartada na avaliação inicial por
gerar experiência ruim pro usuário (dado desatualizado visível na tela).
Em aberto entre B e C, buscando avaliação externa (projeto similar já
entregue) pra decidir qual abordagem usar, ou se existe alternativa melhor
não considerada aqui.
