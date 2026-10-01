# Semana 9 · 28/09–04/10 · Hardening + Testes de Integração 🏁 DEV PRONTO

> Entregável: **sistema completo + testes verdes, tag `v1.0-dev`** (DEV PRONTO até
> 06/10) — [card do entregável](https://trello.com/c/Usgbx6xy). Ver S9 no
> [`TASKS.md`](./TASKS.md) e a linha S9 do cronograma no
> [`PLANEJAMENTO.md`](./PLANEJAMENTO.md).
> Decisões novas desta semana: **D19** (cada tela ganha URL com `react-router`,
> encerra a D7; revisada em 01/10), **D20** (série só entra e sai de treino
> aberto; confirmada 01/10), **D21** (tirar um dia da semana não apaga o
> histórico; confirmada 01/10) e **D22** (treino aberto que virou o dia: a pessoa
> retoma ou finaliza, e o de anteontem para trás fecha sozinho; revisada
> 01/10 pelo autor).

> **Ponto de partida (conferido em 01/10):** `npm run test` no `server` com
> **62/62 verde**, `npm run build` sem erro nos dois lados, `main` limpo e
> igual ao `origin/main`. O `oxlint` do `client` acusa 2 avisos
> (`only-export-components`), que entram na limpeza. Da S8 ficaram abertos só
> a demo gravada, os prints provisórios das Fig. 4/5 e o `/trello-sync`, e os três
> vão para o fechamento desta semana (Passo 1).

> **Como este roteiro está dividido:** a **Parte 1** (Passos 0–1) só fecha o
> que ficou da S8. A **Parte 2** é a S9 de fato, em duas sessões: a **Sessão A**
> (Passos 2–11) é backend, com as correções que os testes de integração
> revelam e os próprios testes. A **Sessão B** (Passos 12–18) é front: rotas
> (D19), responsividade (D6), o "Retomar treino" (D22), limpeza e o teste no
> celular. O Passo 19 fecha a semana e cria a tag.

> **O que muda de natureza aqui:** nenhuma feature nova. A S9 é a semana de
> **provar** o que já existe, com os testes de integração que a matriz de
> rastreabilidade do TCC exige, e de **consertar** o que essa prova encontra.
> No planejamento desta semana, lendo o código da S1 à S8, apareceram sete
> defeitos reais (tabela abaixo). Nenhum deles é cosmético: três devolvem 500
> para erro do usuário, um apaga a navegação de quem usa o celular, e um
> esconde treino do histórico.

> **O que o texto do TCC pede (Seção D, Procedimentos de Validação):** *"Os
> testes de integração verificarão a comunicação entre os módulos do sistema,
> assegurando que o fluxo completo de envio de métricas à API Gemini (RF05), a
> persistência do diagnóstico retornado (RF06) e a exibição do histórico ao
> usuário (RF07) operem sem falhas de execução. Essa frente cobrirá diretamente
> os requisitos RNF02, RNF03 e RNF06."* A tabela abaixo mostra onde cada linha
> da Tabela VI (matriz de rastreabilidade) passa a ser provada. Ela já serve de
> rascunho para o capítulo de resultados.

| Requisito | Método (Tabela VI) | Critério de aceite | Onde é provado |
|---|---|---|---|
| RF05 | Integração + validação de conteúdo | Diagnóstico retornado em JSON válido | `integration.test.ts`: fluxo completo (etapa 5) e teste RNF05. O **conteúdo** é a Frente 3 (OUT) |
| RF06 | Integração | Diagnóstico salvo no banco após retorno | Fluxo completo: `SELECT` em `DiagnosticoIA` depois do `generate` |
| RF07 | Integração + usabilidade | Dados exibidos corretamente na interface | Fluxo completo (etapa 6, as três abas pela API) + checklist da tela no Passo 17. A heurística é a Frente 2 (OUT) |
| RNF01 | Avaliação de usabilidade | Sem violações graves nos fluxos principais | Rotas (Passo 13) + D6 (Passo 14) + teclado (Passo 15) + celular de verdade (Passo 17). A avaliação formal é a Frente 2 |
| RNF02 | Integração | Rejeição de registros órfãos | Três testes RNF02 (banco direto e pela API) |
| RNF03 | Unidade | Cálculos só no backend | Já coberto desde a S6/S7 (`volume.test.ts`, `calcularPv`/`calcularPi`). Nada novo |
| RNF05 | Integração | JSON parseável sem erros pelo Node.js | `interpretarResposta` (unidade) + teste RNF05 (IA responde fora do JSON) |
| RNF06 | Integração | Registros intactos após falha simulada | Teste RNF06 (`GEMINI_MOCK=falha`) + conferência pela tela no Passo 19 |

> **Escopo da semana (o que NÃO entra):** feature nova além do "Retomar
> treino" (D22), URL para as abas internas do Histórico (só as 5 telas ganham
> rota, D19), code splitting do bundle (o aviso de chunk > 500 kB do
> `vite build` é aviso, não erro), avaliação heurística (Frente 2, OUT) e
> validação do conteúdo da IA (Frente 3, OUT). As **figuras finais** saem só
> depois do code freeze (19/10), conforme a seção 5 do `PLANEJAMENTO.md`.

Critério de aceite (card 🎯 ENTREGÁVEL S9):
- [ ] Testes de integração verdes (RF05/06/07)
- [ ] RNF02: registros órfãos rejeitados pelo banco (teste)
- [ ] RNF06: falha simulada da API preserva registros (teste)
- [ ] Responsividade OK nos fluxos críticos (RNF01)
- [ ] Sidebar vira barra inferior (ícones) em telas pequenas — Decisão D6
- [ ] Código limpo: sem console.logs, código morto ou TODOs
- [ ] Tag v1.0-dev criada e enviada (🏁 DEV PRONTO antes de 06/10)

---

## Defeitos encontrados no planejamento

| # | Defeito | Como aparece | Passo |
|---|---|---|---|
| 1 | Não existe tratador de erro global no `app.ts` | Rota inexistente, JSON malformado no corpo ou exceção sem `try/catch` respondem **HTML**. O `apiFetch` do front faz `resposta.json()` e quebra com `Unexpected token '<'` | 2 |
| 2 | Exercício inexistente estoura como 500 | `POST /sessions/:id/sets` e `PUT /divisions/:id/exercises` com `fk_exercicio: 999999` → o banco recusa (FK, 23503) e o controller responde **500**. O certo é 400: o erro é de quem chamou | 3 |
| 3 | Série entra em treino já finalizado | `POST /sessions/:id/sets` não confere `completed`. Uma série nova depois do diagnóstico deixa a avaliação gravada (D14) descrevendo um treino que não existe mais | 4 |
| 4 | Tirar da semana um dia que já foi treinado dá 500 | `PUT /divisions` apaga a `Divisao`, mas `Treino.fk_divisao` aponta pra ela sem `ON DELETE`: o banco recusa e a tela mostra "erro ao salvar divisao semanal". Quem treinou segunda **nunca mais** consegue tirar a segunda da rotina | 5 |
| 5 | Treino esquecido aberto some de tudo | O "Treino de hoje" só enxerga treino aberto **de hoje**, e o histórico só mostra treino **finalizado** (D18-1). O treino de ontem que a pessoa esqueceu de finalizar não aparece em lugar nenhum, mas as séries dele continuam no volume (D11) e no gráfico de cargas (D17) | 6 |
| 6 | No celular, a sidebar come um terço da tela | A `AppShell` reserva `116px` à esquerda em qualquer largura. Num celular de 360px sobram ~210px úteis: o calendário de 7 colunas do Histórico não cabe | 13 |
| 7 | O teclado numérico nunca abriu no celular, e "82,5" é recusado | O `inputMode` foi passado direto no `TextField`, e o MUI joga esse prop na `div` de fora, não no `<input>`. E o teclado decimal brasileiro digita **vírgula**: `Number('82,5')` vira `NaN`, o `JSON.stringify` manda `null` e o backend responde 400 | 14 |

---

## Decisões novas desta semana

> **D19 — Cada tela ganha URL, com `react-router` (revisada 01/10).** A D7
> deixou para a S9 decidir se o app ganharia roteamento real. A primeira
> proposta deste roteiro foi manter a navegação por estado. Revendo pela
> pergunta do autor, **o `react-router` fica melhor**, por causa do lugar onde
> o sistema é usado: o celular, no meio do treino.
>
> - **O navegador do celular descarta aba em segundo plano.** A pessoa troca
>   para o app de música ou o cronômetro, volta, e a página recarrega. Com
>   navegação por estado, ela cai em "Minha divisão" no meio da série. Com
>   rota, recarrega em `/treino`, e as séries voltam do banco
>   (`GET /sessions/today`).
> - **O "voltar" do Android (gesto ou botão) hoje fecha o app.** Com rota, ele
>   volta de tela, como em qualquer site.
> - São justamente as duas coisas que a avaliação heurística da Frente 2 (11/10)
>   vai olhar: controle e liberdade do usuário, nos fluxos do celular (RNF01).
>
> O custo é baixo, porque são 5 telas fixas: uma dependência (`react-router`
> v7), o `main.tsx` ganha o `BrowserRouter`, o `App.tsx` troca o mapa de telas
> por `<Routes>`, e a `Sidebar` e o Treino de hoje passam a usar
> `useNavigate`/`useLocation` em vez de props. Fica **fora**: rota para as
> abas internas do Histórico (Cargas/Volume/Sessões) e para o mês do
> calendário. O login continua como está: sem usuário, o `App` mostra a
> `AuthView` em qualquer URL, e depois do login a pessoa cai na tela que
> pediu. Não precisa de "rota protegida" à parte.
>
> Se o tempo apertar, é o **primeiro corte** da semana: a navegação por estado
> de hoje funciona, e voltar para ela é só não fazer o Passo 13.

> **D20 — Série só entra e sai de treino aberto (confirmada 01/10).** `POST` e
> `DELETE` de série em treino **finalizado** passam a responder **409**. O
> treino finalizado é um registro fechado. A duração já foi calculada (D12), e
> o diagnóstico pode já ter sido gerado em cima daquelas séries (D14/D16).
> Série nova depois disso deixaria a avaliação gravada descrevendo outro
> treino. A tela nunca fez isso, porque depois do finish o `hoje.treino` vira
> `null`; o buraco era só na API. A D11 (série registrada conta no volume,
> com o treino finalizado ou não) **não muda**: ela fala do treino em
> andamento.
>
> Errou a carga e já finalizou? Não dá mais para corrigir: é o mesmo
> princípio da D8 (série é fato datado, não configuração). Enquanto o treino
> está aberto, inclusive o de ontem retomado (D22), a série errada se apaga e
> se registra de novo.

> **D21 — Tirar um dia da semana não apaga o histórico (confirmada 01/10).**
> `Treino.fk_divisao` passa a ser `ON DELETE SET NULL`. Quando a pessoa tira a
> segunda-feira da rotina, os treinos de segunda continuam, com todas as
> séries, e só perdem o vínculo com o dia. As séries apontam para `Exercicio`,
> não para `Divisao`, então nada se perde. A tela já mostra "Sem divisão"
> quando `nome_divisao` é `null` desde a S8.
>
> Avaliadas e **descartadas**: (a) proibir (409) apagar dia que tem treino,
> porque a pessoa nunca mais mudaria a rotina; (b) "apagar" com uma coluna
> `ativo` em `Divisao` (soft delete), porque é coluna nova no DER e abriria
> divergência TCC × sistema (ver [`INSTRUCOES.md`](./INSTRUCOES.md)). Com o `SET
> NULL` o DER não muda: o relacionamento `Treino → Divisao` já era opcional
> (`fk_divisao` sem `NOT NULL`). E a **RNF02 continua valendo**: nenhum
> registro fica apontando para algo que não existe. O banco anula o vínculo
> de forma declarada, e não deixa um órfão.

> **D22 — Treino aberto que virou o dia: retoma ou finaliza; o mais antigo
> fecha sozinho (revisada 01/10).** O Treino de hoje só enxerga o treino
> aberto **de hoje** (`buscarTreinoAberto`), e o histórico só mostra treino
> **finalizado** (D18-1). O treino que ficou aberto de um dia para o outro
> (começou às 23h e passou da meia-noite, ou a pessoa esqueceu de finalizar)
> não aparecia em lugar nenhum. A régua é o calendário do banco
> (`CURRENT_DATE`):
>
> 1. **Aberto de ontem: a pessoa escolhe.** O Treino de hoje mostra o aviso
>    "Você tem um treino aberto de ontem", com dois botões:
>    - **Retomar treino:** o formulário volta com o treino de ontem, com a
>      divisão **dele** (não a de hoje) e as séries que já estavam lá. Dá para
>      registrar e apagar série (o treino está aberto, então a D20 deixa) e
>      terminar no "Finalizar e avaliar treino" de sempre. Não tem rota nova:
>      retomar é só a tela passar a mostrar esse treino. Por isso, se a página
>      recarregar, o aviso volta, e basta tocar em "Retomar" de novo. Guardar o
>      "retomado" no banco exigiria coluna nova no DER.
>    - **Finalizar:** fecha o treino pelo `POST /sessions/:id/finish` que já
>      existe. Ele entra no calendário e pode ser avaliado pelo botão "Avaliar
>      treino" do detalhe (S8).
>
>    **Começar treino** (o de hoje) também resolve: fecha o de ontem antes de
>    criar o novo. Assim nunca existem dois treinos abertos.
> 2. **Aberto de anteontem para trás: fecha sozinho.** Quando a pessoa abre o
>    Treino de hoje, começa um treino ou abre o calendário do Histórico, o
>    treino é finalizado automaticamente e entra no calendário.
>
> **Duração (D12):** o treino que virou o dia fecha com `duracao_total =
> NULL`, por qualquer um dos caminhos. Não dá para saber se a pessoa treinou
> direto ou esqueceu o treino aberto, e `NOW() - data` daria 1.440 minutos ou
> mais. O custo é o caso raro de quem treina das 23h10 à 0h40 ficar sem
> duração. A D12 continua de pé: a duração nunca é inventada nem calculada no
> cliente, e a tela já não mostra minutos quando ela é `null`.
>
> **Treino finalizado não reabre.** A primeira versão desta decisão reabria
> treino finalizado no mesmo dia (`POST /sessions/:id/reopen`). O autor
> descartou: o finalizado é registro fechado (D20), e o que somia da tela era
> o treino **aberto**.
>
> Enquanto está pendente, o treino de ontem fica fora do calendário (D18-1),
> mas as séries dele já contam no volume (D11) e no gráfico de cargas (D17),
> como antes. A D11 já previa o esquecimento ("esquecer de finalizar não
> distorce o volume"), mas não o histórico.

---

# Parte 1 — Pendências da S8

## Passo 0 — Conferir que a S8 está mesmo fechada

- [ ] `npm run test` no `server` sai **62/62 verde** (conferido em 01/10). A
  S9 reescreve o `geminiService` e mexe no `sessionController`: qualquer
  vermelho a partir daqui tem que ser desta semana, não herança.
- [ ] `npm run build` nos dois lados sem erro (conferido em 01/10). Era o item 2
  ainda aberto do Passo 22 da S8.
- [ ] `server/.env` com `GEMINI_MOCK=true`. A chave real só entra no Passo 19
  (demo e prints).
- [ ] Rodar o **`/trello-sync`**. O `TASKS.md` ainda tem S6, S7 e S8 com `[ ]`,
  e o código dessas semanas já está no `main`. Sincronizar antes de começar,
  para o quadro mostrar o que de fato falta.

## Passo 1 — O que da S8 fica para o fechamento desta semana

- [ ] A **demo ponta a ponta** (item 6 do Passo 22 da S8) e os **prints
  provisórios das Fig. 4 e 5** (item 7, card [📸 Tirar print da tela de
  Diagnóstico e Histórico](https://trello.com/c/8ciFP1Px)) passam para o
  Passo 19. Gravar agora mostraria telas que esta semana ainda vai mudar: a
  mensagem de erro de conexão, o teclado do Treino de hoje e a barra inferior.
  Gravando depois, a demo já mostra o sistema da tag `v1.0-dev`.

---

# Parte 2 — Implementação da S9

## Sessão A — Backend: correções + testes de integração

### Passo 2 — `server/src/middlewares/tratarErros.ts` (novo) + `app.ts`

- [ ] Duas peças que fecham o `app.ts`. A primeira pega tudo o que **não casou
  com rota nenhuma** e responde `404` em JSON. A segunda pega tudo o que
  **estourou sem `try/catch`**, e também o corpo que não é JSON (o
  `express.json()` lança antes de qualquer controller). Hoje as duas situações
  caem no tratador padrão do Express, que responde **HTML**.
- [ ] O `500` continua logando com `console.error`: é log de erro do servidor, não
  log de depuração (ver o Passo 16).

```ts
import { Request, Response, NextFunction } from 'express';

//as duas ultimas pecas do app.ts. Sem elas o Express responde HTML, e o front
//(que sempre faz resposta.json()) quebra com "Unexpected token '<'"

//nao casou com rota nenhuma
export function rotaNaoEncontrada(req: Request, res: Response) {
  res.status(404).json({ erro: 'Rota não encontrada' });
}

//4 parametros: e assim que o Express reconhece um middleware de erro,
//por isso o next fica na assinatura mesmo quando nao e usado
export function tratarErro(erro: unknown, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    return next(erro); //a resposta ja comecou a sair: so o Express consegue encerrar
  }

  //express.json() recebeu corpo que nao e JSON: erro de quem chamou
  if ((erro as { type?: string } | null)?.type === 'entity.parse.failed') {
    res.status(400).json({ erro: 'JSON inválido no corpo da requisição' });
    return;
  }

  console.error(erro);
  res.status(500).json({ erro: 'Erro interno do servidor' });
}
```

- [ ] `server/src/app.ts`: registrar as duas **depois** de todas as rotas. Na
  ordem inversa, o `rotaNaoEncontrada` responde 404 para tudo.

```ts
import { rotaNaoEncontrada, tratarErro } from './middlewares/tratarErros';

// ...depois do app.use(historyRoutes):
app.use(rotaNaoEncontrada);
app.use(tratarErro);
```

- [ ] Conferir rápido: `curl http://localhost:3000/nao-existe` devolve
  `{"erro":"Rota não encontrada"}`, e não `<!DOCTYPE html>`.

### Passo 3 — Exercício inexistente: 400 em vez de 500 (`config/db.ts` + 2 controllers)

- [ ] O banco já recusa a série com `fk_exercicio` que não existe (RNF02
  funcionando). O defeito é a **resposta**: o `catch` do controller trata
  qualquer erro como 500. O código `23503` do Postgres quer dizer
  `foreign_key_violation`, ou seja, o registro aponta para algo que não existe.
  Nesse caso a culpa é do pedido, e a resposta é 400.

`server/src/config/db.ts` (acrescentar no fim):

```ts
//23503 = foreign_key_violation: o registro aponta pra algo que nao existe (RNF02).
//o controller traduz em 400 - o banco recusou certo, o erro e de quem chamou
export function violouChaveEstrangeira(erro: unknown): boolean {
  return (erro as { code?: string } | null)?.code === '23503';
}
```

- [ ] `server/src/controllers/sessionController.ts`, no `catch` do
  `registrarSerie`:

```ts
import { violouChaveEstrangeira } from '../config/db';

    } catch (erro) {
        //RNF02: o banco recusou exercicio inexistente
        if (violouChaveEstrangeira(erro)) {
            return res.status(400).json({ erro: 'Exercício não encontrado' });
        }
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao registrar série' });
    }
```

- [ ] `server/src/controllers/divisionController.ts`, no `catch` do
  `salvarExerciciosDivisao`. O `substituirExerciciosDoDia` roda em transação:
  o `ROLLBACK` desfaz o `DELETE`, e a rotina de antes continua inteira. O teste
  do Passo 10 confere isso.

```ts
import { violouChaveEstrangeira } from '../config/db';

    } catch (erro) {
        if (violouChaveEstrangeira(erro)) {
            return res.status(400).json({ erro: 'Exercício não encontrado' });
        }
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao salvar exercícios da divisão' });
    }
```

### Passo 4 — D20: série só em treino aberto (`sessionController.ts`)

- [ ] No `registrarSerie` e no `apagarSerie`, logo
  depois do `if (!treino) … 404`, acrescentar o guard. A ordem importa:
  primeiro o 404 (treino de outro usuário não pode nem revelar que existe),
  depois o 409, e só então a validação do corpo.

```ts
    //D20: treino finalizado e registro fechado - serie nova ou apagada
    //desalinharia a duracao e o diagnostico gerados em cima dele
    if (treino.completed) {
        return res.status(409).json({ erro: 'Treino já finalizado: as séries não podem mais ser alteradas' });
    }
```

- [ ] O 409 da D20 não aparece na tela: depois do finish, o Treino de hoje não
  mostra mais o formulário (`hoje.treino` é `null`). E o "Retomar treino" da
  D22 só vale para treino **aberto**.

### Passo 5 — D21: `schema.sql` + `ALTER` no banco local

- [ ] Em `server/schema.sql`, na tabela `Treino`:

```sql
CREATE TABLE Treino (
  id_treino UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fk_usuario UUID NOT NULL REFERENCES Usuario(id_usuario),
  -- D21: tirar o dia da semana nao apaga o treino; ele so perde o vinculo (a tela mostra "Sem divisao")
  fk_divisao UUID REFERENCES Divisao(id_divisao) ON DELETE SET NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  data TIMESTAMP DEFAULT NOW(),
  duracao_total INTEGER
);
```

- [ ] O projeto não usa migrations: editar o `schema.sql` **não muda o banco
  local**. Em vez de `npm run db:reset`, que apaga tudo, inclusive o usuário e
  os treinos que você já tem, rode o `ALTER` no `psql` ou no pgAdmin. Confira
  antes o nome da constraint (o padrão do Postgres é `treino_fk_divisao_fkey`):

```sql
SELECT conname FROM pg_constraint
WHERE conrelid = 'treino'::regclass AND contype = 'f';
```

```sql
ALTER TABLE Treino DROP CONSTRAINT treino_fk_divisao_fkey;
ALTER TABLE Treino ADD CONSTRAINT treino_fk_divisao_fkey
  FOREIGN KEY (fk_divisao) REFERENCES Divisao(id_divisao) ON DELETE SET NULL;
```

- [ ] O `substituirSemana` (`divisionModel.ts`) **não muda**: ele já apaga a
  `DivisaoExercicio` antes da `Divisao`, e o `SET NULL` cuida do `Treino`.

### Passo 6 — D22: treino aberto que virou o dia (backend)

- [ ] `server/src/models/sessionModel.ts`: duas funções novas (depois do
  `buscarTreinoAberto`). As regras de "ontem" e "anteontem" ficam no SQL, com
  o `CURRENT_DATE` do banco, que é a mesma régua do `buscarTreinoAberto`.
  Comparar datas no JavaScript misturaria o fuso do Node com o do Postgres.

```ts
//D22: o treino que ficou aberto ONTEM - a tela oferece "Retomar treino" ou "Finalizar"
export async function buscarTreinoPendente(
    fkUsuario: string
): Promise<Treino | null> {
    const resultado = await pool.query<Treino>(
        `SELECT * FROM Treino
        WHERE fk_usuario = $1 AND completed = FALSE AND data::date = CURRENT_DATE - 1
        ORDER BY data DESC
        LIMIT 1`,
        [fkUsuario]
    );
    return resultado.rows[0] ?? null;
}

//D22: fecha SEM duracao o treino aberto de dia anterior - nao da pra saber quando
//acabou. Fechado, ele entra no calendario e pode ser avaliado pelo detalhe da sessao.
//incluirOntem = false: so de anteontem pra tras (o de ontem ainda e "pendente")
//incluirOntem = true: o de ontem tambem (a pessoa escolheu comecar um treino novo)
//idempotente: rodar de novo nao acha mais nada
export async function fecharTreinosEsquecidos(
    fkUsuario: string,
    incluirOntem = false
): Promise<void> {
    await pool.query(
        `UPDATE Treino
        SET completed = TRUE
        WHERE fk_usuario = $1
          AND completed = FALSE
          AND data::date < CURRENT_DATE - $2::int`,
        [fkUsuario, incluirOntem ? 0 : 1]
    );
}
```

- [ ] No mesmo arquivo, o `finalizarTreino` só calcula a duração de treino
  **de hoje**. O `CASE` sem `ELSE` dá `NULL`. É ele que cobre o "Retomar" e o
  "Finalizar" do treino de ontem, que chegam pela mesma rota `finish`.
  Acrescentar uma linha no comentário de cima e trocar o `SET`:

```ts
 * - CASE: treino que virou o dia fecha com duracao NULL (D22) - nao da pra saber
 *   se a pessoa treinou direto ou esqueceu aberto (NOW() - data daria 1440+ min)
```

```ts
    `UPDATE Treino
    SET completed = TRUE,
      duracao_total = CASE WHEN data::date = CURRENT_DATE
        THEN GREATEST(1, ROUND(EXTRACT(EPOCH FROM (NOW() - data)) /60)::int)
      END
    WHERE id_treino = $1 AND fk_usuario = $2 AND completed = FALSE
    RETURNING *`,
```

- [ ] `server/src/types/indexTypes.ts`: o tipo novo e o campo novo no
  `TreinoDeHoje`.

```ts
//D22: o treino que ficou aberto ontem, com a divisao e os exercicios DELE -
//se ontem foi peito e hoje e costas, retomar mostra peito
export interface TreinoPendente {
  treino: Treino;
  divisao: Divisao | null; //null se o dia foi tirado da rotina (D21)
  exercicios: ExercicioDoDia[];
  series: SerieComExercicio[];
}

export interface TreinoDeHoje {
  dia_semana: number;
  divisaoHoje: Divisao | null;
  treino: Treino | null;
  pendente: TreinoPendente | null; //D22: so vem quando nao ha treino aberto hoje
  exercicios: ExercicioDoDia[];
  series: SerieComExercicio[];
}
```

- [ ] `server/src/controllers/sessionController.ts`, `treinoDeHoje` completo
  (acrescentar `TreinoPendente` no `import` dos tipos):

```ts
export async function treinoDeHoje(req: AuthenticateRequest, res: Response) {
    const fkUsuario = req.userId as string;
    //D22: de anteontem pra tras fecha sozinho; o de ontem vira "pendente"
    await sessionModel.fecharTreinosEsquecidos(fkUsuario);

    const diaSemana = new Date().getDay(); // 0 = domingo

    const divisoes = await divisionModel.buscarDivisaoPorUsuario(fkUsuario);
    const divisaoHoje = divisoes.find((d) => d.dia_semana === diaSemana) ?? null;

    const exercicios = divisaoHoje ? await divisionModel.buscarExerciciosDoDia(divisaoHoje.id_divisao) : [];

    const treino = await sessionModel.buscarTreinoAberto(fkUsuario);
    const series = treino ? await sessionModel.buscarSeries(treino.id_treino) : [];

    //D22: com treino aberto hoje nao tem pendente - o start ja fechou o de ontem
    const treinoPendente = treino ? null : await sessionModel.buscarTreinoPendente(fkUsuario);
    let pendente: TreinoPendente | null = null;
    if (treinoPendente) {
        const divisao = divisoes.find((d) => d.id_divisao === treinoPendente.fk_divisao) ?? null;
        pendente = {
            treino: treinoPendente,
            divisao,
            exercicios: divisao ? await divisionModel.buscarExerciciosDoDia(divisao.id_divisao) : [],
            series: await sessionModel.buscarSeries(treinoPendente.id_treino),
        };
    }

    const hoje: TreinoDeHoje = { dia_semana: diaSemana, divisaoHoje, treino, pendente, exercicios, series };
    return res.status(200).json( {hoje });
}
```

- [ ] No `comecarTreino`, logo **depois** do `if (aberto) { … }`:

```ts
    //D22: comecar o treino de hoje fecha o de ontem que ficou aberto (sem duracao) -
    //assim nunca existem dois treinos abertos
    await sessionModel.fecharTreinosEsquecidos(fkUsuario, true);
```

- [ ] `server/src/controllers/historyController.ts`: no `sessoesDoMes`, dentro
  do `try` e antes do `Promise.all`. Assim, quem abre direto o Histórico, sem
  passar pelo Treino de hoje, também vê o treino esquecido. Sem o `true`: o de
  ontem continua pendente até a pessoa escolher no Treino de hoje.

```ts
import * as sessionModel from '../models/sessionModel';

        //D22: o treino aberto de anteontem pra tras entra no calendario ja fechado
        await sessionModel.fecharTreinosEsquecidos(fkUsuario);
```

- [ ] **Nenhuma rota nova.** "Retomar" é a tela usando o `pendente`, e
  "Finalizar" é o `POST /sessions/:id/finish` que já existe.

### Passo 7 — `server/src/config/gemini.ts`: `modoGemini()`

- [ ] Hoje o `GEMINI_MOCK` é uma `const` lida **uma vez**, no `import`. Para
  simular falha da IA no meio da suíte (RNF05/RNF06), o modo precisa ser lido
  **a cada chamada**. E ganha dois valores novos, que simulam os dois jeitos
  de a IA falhar: a API fora do ar (`falha`) e a IA respondendo, mas fora do
  JSON (`invalido`).

`server/src/config/gemini.ts` (completo):

```ts
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

export const GEMINI_MODEL = 'gemini-3.1-flash-lite';

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

//GEMINI_MOCK decide de onde vem a resposta da IA:
//  true     -> mock deterministico, sem rede nem cota (dev e testes - "Gemini sempre atras de mock")
//  falha    -> simula a API fora do ar (RNF06)
//  invalido -> simula a IA respondendo texto fora do JSON (RNF05)
//  false, ou qualquer outro valor -> Gemini de verdade
//Funcao, e nao constante: e lida a cada chamada, para o teste de integracao
//trocar o modo no meio da suite. Uma const seria lida uma vez so, no import
export type ModoGemini = 'mock' | 'falha' | 'invalido' | 'real';

export function modoGemini(): ModoGemini {
  switch (process.env.GEMINI_MOCK) {
    case 'true':
      return 'mock';
    case 'falha':
      return 'falha';
    case 'invalido':
      return 'invalido';
    default:
      return 'real';
  }
}
```

- [ ] `server/.env.example`: documentar os modos.

```
# true = mock (dev/testes) | falha = simula a API fora do ar (RNF06)
# invalido = simula resposta fora do JSON (RNF05) | false = Gemini de verdade
GEMINI_MOCK=true
```

### Passo 8 — `server/src/services/geminiService.ts`: `interpretarResposta` (RNF05)

- [ ] Hoje o texto do Gemini vira diagnóstico com `JSON.parse(texto) as
  DiagnosticoConteudo`: o `as` só convence o TypeScript e não confere nada.
  Se a IA devolver um JSON sem `recomendacoes_proxima_sessao`, ele é gravado
  assim mesmo e a tela quebra ao abrir. A função nova faz o parse **e** confere
  os três campos do bloco 5. Qualquer coisa fora disso lança erro, que cai no
  `catch` do controller: 502, e nada é gravado.
- [ ] Ela devolve **só** os três campos. Se a IA "inventar" um `score_geral`,
  ele não chega ao banco, porque o score é do backend (D13).

Trocar o `import` do topo:

```ts
import { ai, GEMINI_MODEL, modoGemini } from '../config/gemini';
```

Acrescentar antes do `gerarDiagnostico`:

```ts
//RNF05: o texto da IA so vira diagnostico se for JSON com os tres campos do
//bloco 5. Fora disso, lanca erro -> catch do controller -> 502, nada gravado.
//Devolve SO os tres campos: score inventado pela IA nao chega no banco (D13)
export function interpretarResposta(texto: string): DiagnosticoConteudo {
  let dados: unknown;
  try {
    dados = JSON.parse(texto);
  } catch {
    throw new Error('Resposta da IA não é JSON');
  }
  if (typeof dados !== 'object' || dados === null) {
    throw new Error('Resposta da IA não é um objeto JSON');
  }

  const d = dados as Partial<DiagnosticoConteudo>;
  if (
    !Array.isArray(d.diagnostico_exercicios) ||
    !Array.isArray(d.analise_grupamentos) ||
    !Array.isArray(d.recomendacoes_proxima_sessao)
  ) {
    throw new Error('Resposta da IA sem os três campos obrigatórios');
  }

  const ehTexto = (valor: unknown): valor is string => typeof valor === 'string';
  const itensValidos =
    d.diagnostico_exercicios.every((e) => ehTexto(e?.nome_exercicio) && ehTexto(e?.comentario)) &&
    d.analise_grupamentos.every((g) => ehTexto(g?.nome_grupamento) && ehTexto(g?.comentario)) &&
    d.recomendacoes_proxima_sessao.every(ehTexto);
  if (!itensValidos) {
    throw new Error('Resposta da IA com item fora do formato');
  }

  return {
    diagnostico_exercicios: d.diagnostico_exercicios,
    analise_grupamentos: d.analise_grupamentos,
    recomendacoes_proxima_sessao: d.recomendacoes_proxima_sessao,
  };
}
```

- [ ] `gerarDiagnostico` (substituir). O mock passa a sair como **texto** e a
  voltar pelo mesmo `interpretarResposta` da resposta real. Assim, toda a suíte
  exercita o caminho do RNF05, e não só o teste dedicado.

```ts
export async function gerarDiagnostico(
  treino: Treino,
  volume: VolumeSemanal,
  series: SerieValidaDaSessao[]
): Promise<DiagnosticoConteudo> {
  const modo = modoGemini();

  if (modo === 'falha') {
    throw new Error('Falha simulada da API Gemini (GEMINI_MOCK=falha)');
  }
  if (modo === 'invalido') {
    return interpretarResposta('Claro! Aqui está a análise do seu treino: o supino foi bem executado.');
  }
  if (modo === 'mock') {
    //mesmo JSON.parse da resposta real: a suite inteira passa pelo RNF05
    return interpretarResposta(JSON.stringify(mockDiagnostico(volume, series)));
  }

  const prompt = montarPrompt(treino, volume, series);
  const resposta = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: { responseMimeType: 'application/json', responseSchema: SCHEMA },
  });

  const texto = resposta.text;
  if (!texto) throw new Error('Gemini não retornou conteúdo');

  return interpretarResposta(texto);
}
```

- [ ] `grep -rn "GEMINI_MOCK" server/src` só pode achar o comentário do
  `config/gemini.ts`. A `const GEMINI_MOCK` antiga não existe mais.

### Passo 9 — Testes novos nos arquivos que já existem (7 testes)

- [ ] `server/src/__tests__/diagnostic.test.ts`: **2 testes de unidade** do
  `interpretarResposta`. Não tocam no banco nem no Gemini.

```ts
import { interpretarResposta } from '../services/geminiService';

test('interpretarResposta (RNF05): JSON com os 3 campos vira diagnóstico; campo a mais é descartado', () => {
    const texto = JSON.stringify({
        diagnostico_exercicios: [{ nome_exercicio: 'Supino', comentario: 'ok' }],
        analise_grupamentos: [{ nome_grupamento: 'Peito', comentario: 'ok' }],
        recomendacoes_proxima_sessao: ['subir 2,5 kg'],
        score_geral: 95, //a IA "inventou" um score: nao pode passar (D13)
    });

    const conteudo = interpretarResposta(texto);
    assert.equal('score_geral' in conteudo, false);
    assert.deepEqual(conteudo.recomendacoes_proxima_sessao, ['subir 2,5 kg']);
});


test('interpretarResposta (RNF05): texto fora de JSON ou sem campo obrigatório lança erro', () => {
    assert.throws(() => interpretarResposta('Claro! Aqui está o diagnóstico do treino.'));
    assert.throws(() => interpretarResposta('```json\n{}\n```'));
    assert.throws(() => interpretarResposta('null'));
    assert.throws(() => interpretarResposta(JSON.stringify({ diagnostico_exercicios: [], analise_grupamentos: [] })));
    assert.throws(() => interpretarResposta(JSON.stringify({
        diagnostico_exercicios: [{ nome_exercicio: 'Supino' }], //sem comentario
        analise_grupamentos: [],
        recomendacoes_proxima_sessao: [],
    })));
});
```

- [ ] `server/src/__tests__/session.test.ts`: **4 testes** (D20 e três da
  D22: anteontem fecha sozinho, ontem vira pendente, e começar treino fecha o
  de ontem). Trocar os imports do topo:

```ts
import { registrarELogar, registrarComRotinaDeHoje, registrarComTreinoAberto } from './testHelpers';
import { pool } from '../config/db';
```

```ts
test('D20: série em treino finalizado é recusada com 409 (registrar e apagar)', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  const serie = await request(app)
    .post(`/sessions/${idTreino}/sets`)
    .set('Authorization', `Bearer ${token}`)
    .send({ fk_exercicio: exercicio.id_exercicio, tipo: 'work', carga: 60, repeticoes: 10, rir: 2 });
  await request(app)
    .post(`/sessions/${idTreino}/finish`)
    .set('Authorization', `Bearer ${token}`);

  const nova = await request(app)
    .post(`/sessions/${idTreino}/sets`)
    .set('Authorization', `Bearer ${token}`)
    .send({ fk_exercicio: exercicio.id_exercicio, tipo: 'work', carga: 60, repeticoes: 10, rir: 2 });
  const apagar = await request(app)
    .delete(`/sessions/${idTreino}/sets/${serie.body.serie.id_serie}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(nova.status, 409);
  assert.equal(apagar.status, 409);
});


test('D22: treino aberto de anteontem fecha sozinho, sem duração, e entra no histórico', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  await request(app)
    .post(`/sessions/${idTreino}/sets`)
    .set('Authorization', `Bearer ${token}`)
    .send({ fk_exercicio: exercicio.id_exercicio, tipo: 'work', carga: 60, repeticoes: 10, rir: 2 });

  //"anteontem": o teste nao tem como voltar o relogio, entao volta a data do treino.
  //o mes vem do banco: no comeco do mes o "anteontem" e do mes anterior
  const { rows } = await pool.query<{ mes: string }>(
    `UPDATE Treino SET data = data - INTERVAL '2 days'
     WHERE id_treino = $1
     RETURNING to_char(data, 'YYYY-MM') AS mes`,
    [idTreino]
  );

  const hoje = await request(app)
    .get('/sessions/today')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(hoje.body.hoje.treino, null); //nao volta como treino de hoje
  assert.equal(hoje.body.hoje.pendente, null); //nem como pendente: ja fechou

  const mes = await request(app)
    .get(`/history/sessions?mes=${rows[0].mes}`)
    .set('Authorization', `Bearer ${token}`);
  const sessao = mes.body.sessoes.find((s: { id_treino: string }) => s.id_treino === idTreino);
  assert.ok(sessao, 'o treino esquecido tem que aparecer no calendario');
  assert.equal(sessao.duracao_total, null); //nao da pra saber quando acabou

  //fechado = pode ser avaliado pelo detalhe da sessao
  const diagnostico = await request(app)
    .post(`/sessions/${idTreino}/diagnostics/generate`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(diagnostico.status, 201);
});


test('D22: treino aberto de ontem vem como pendente, aceita série e finaliza sem duração', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  const serie = { fk_exercicio: exercicio.id_exercicio, tipo: 'work', carga: 60, repeticoes: 10, rir: 2 };
  await request(app).post(`/sessions/${idTreino}/sets`).set('Authorization', `Bearer ${token}`).send(serie);
  await pool.query(`UPDATE Treino SET data = data - INTERVAL '1 day' WHERE id_treino = $1`, [idTreino]);

  //a tela recebe o treino de ontem com a divisao, os exercicios e as series dele
  const hoje = await request(app).get('/sessions/today').set('Authorization', `Bearer ${token}`);
  assert.equal(hoje.body.hoje.treino, null);
  const { pendente } = hoje.body.hoje;
  assert.equal(pendente.treino.id_treino, idTreino);
  assert.equal(pendente.exercicios[0].fk_exercicio, exercicio.id_exercicio);
  assert.equal(pendente.series.length, 1);

  //retomado: continua aberto, entao aceita serie (D20)
  const nova = await request(app).post(`/sessions/${idTreino}/sets`).set('Authorization', `Bearer ${token}`).send(serie);
  assert.equal(nova.status, 201);

  const fim = await request(app).post(`/sessions/${idTreino}/finish`).set('Authorization', `Bearer ${token}`);
  assert.equal(fim.status, 200);
  assert.equal(fim.body.treino.duracao_total, null); //virou o dia: nao da pra saber quanto durou
});


test('D22: começar treino com um aberto de ontem fecha o de ontem e abre um novo', async () => {
  const { token, idTreino } = await registrarComTreinoAberto();
  await pool.query(`UPDATE Treino SET data = data - INTERVAL '1 day' WHERE id_treino = $1`, [idTreino]);

  const inicio = await request(app).post('/sessions/start').set('Authorization', `Bearer ${token}`);
  assert.equal(inicio.status, 201); //treino novo, nao o de ontem
  assert.notEqual(inicio.body.treino.id_treino, idTreino);

  const { rows } = await pool.query(
    'SELECT completed, duracao_total FROM Treino WHERE id_treino = $1',
    [idTreino]
  );
  assert.equal(rows[0].completed, true);
  assert.equal(rows[0].duracao_total, null);

  //nunca dois abertos: o de hoje e o treino, e nao sobra pendente
  const hoje = await request(app).get('/sessions/today').set('Authorization', `Bearer ${token}`);
  assert.equal(hoje.body.hoje.treino.id_treino, inicio.body.treino.id_treino);
  assert.equal(hoje.body.hoje.pendente, null);
});
```

- [ ] `server/src/__tests__/division.test.ts`: **1 teste** (D21). Acrescentar
  `import { registrarComTreinoAberto } from './testHelpers';` no topo.

```ts
test('D21: tirar da semana um dia que já tem treino não apaga o histórico', async () => {
    const { token, idTreino, exercicio } = await registrarComTreinoAberto();
    await request(app)
        .post(`/sessions/${idTreino}/sets`)
        .set('Authorization', `Bearer ${token}`)
        .send({ fk_exercicio: exercicio.id_exercicio, tipo: 'work', carga: 60, repeticoes: 10, rir: 2 });
    await request(app)
        .post(`/sessions/${idTreino}/finish`)
        .set('Authorization', `Bearer ${token}`);

    const semana = await request(app)
        .put('/divisions')
        .set('Authorization', `Bearer ${token}`)
        .send({ divisoes: [] });
    assert.equal(semana.status, 200); //antes da D21: 500 (FK de Treino.fk_divisao)

    const detalhe = await request(app)
        .get(`/history/sessions/${idTreino}`)
        .set('Authorization', `Bearer ${token}`);
    assert.equal(detalhe.status, 200);
    assert.equal(detalhe.body.sessao.nome_divisao, null); //a tela mostra "Sem divisão"
    assert.equal(detalhe.body.exercicios[0].series.length, 1);
});
```

- [ ] Rodar `npm run test` **antes** dos Passos 4–6 com estes testes já
  escritos: os de D20, D21 e D22 têm que sair **vermelhos**. Se algum passar
  sem a correção, o teste não está testando o defeito.

### Passo 10 — `server/src/__tests__/integration.test.ts` (novo, 7 testes)

- [ ] É o arquivo que a matriz de rastreabilidade cita. O **fluxo completo**
  começa do cadastro, sem os helpers que pulam etapas, e passa por todas as
  camadas até o histórico. Os outros seis testes provam as RNFs, cada um com
  uma falha provocada de propósito.
- [ ] Os números do fluxo são conta de cabeça, não chute. Com 2 séries válidas
  num grupamento (RPE 9 e RPE 8):
  - **Pv** = min(2/10, 1) × 100 = **20**
  - **Pi** = média(100; 66,67) = **83,33**
  - **score** = round((20 + 83,33) / 2) = **52**
  - **tonelagem** = 80 × 8 + 80 × 7 = **1.200 kg**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app';
import { pool } from '../config/db';
import { registrarComTreinoAberto } from './testHelpers';

//Testes de integracao da matriz de rastreabilidade do TCC (Tabela VI):
//RF05, RF06, RF07, RNF02, RNF05 e RNF06. Os testes das outras semanas olham
//uma rota de cada vez; aqui o que se confere e a conversa entre os modulos
//(rota -> controller -> service -> banco -> resposta) no caminho de uso real

const EXERCICIO_INEXISTENTE = 999999;
const TREINO_INEXISTENTE = '00000000-0000-0000-0000-000000000000';

function get(caminho: string, token: string) {
  return request(app).get(caminho).set('Authorization', `Bearer ${token}`);
}

function post(caminho: string, token: string, corpo?: object) {
  const pedido = request(app).post(caminho).set('Authorization', `Bearer ${token}`);
  return corpo ? pedido.send(corpo) : pedido;
}

function put(caminho: string, token: string, corpo: object) {
  return request(app).put(caminho).set('Authorization', `Bearer ${token}`).send(corpo);
}

//treino aberto -> 2 series validas -> finalizado: pronto pra ser avaliado
async function treinoFinalizadoComSeries() {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  const serie = { fk_exercicio: exercicio.id_exercicio, tipo: 'work', carga: 80 };
  await post(`/sessions/${idTreino}/sets`, token, { ...serie, repeticoes: 8, rir: 1 });
  await post(`/sessions/${idTreino}/sets`, token, { ...serie, repeticoes: 7, rir: 2 });
  await post(`/sessions/${idTreino}/finish`, token);
  return { token, idTreino };
}

//troca o modo da IA so durante fn, e devolve o original mesmo se fn falhar.
//funciona porque o modoGemini() le o process.env a cada chamada (Passo 7)
async function comModoGemini<T>(modo: string, fn: () => PromiseLike<T>): Promise<T> {
  const original = process.env.GEMINI_MOCK;
  process.env.GEMINI_MOCK = modo;
  try {
    return await fn();
  } finally {
    //process.env so guarda texto: atribuir undefined gravaria a string "undefined"
    if (original === undefined) delete process.env.GEMINI_MOCK;
    else process.env.GEMINI_MOCK = original;
  }
}


//============================ fluxo completo ============================

test('fluxo completo: cadastro → rotina → treino → volume → diagnóstico → histórico (RF05, RF06, RF07)', async () => {
  //1. cadastro e login (RF01) - sem helper: o fluxo comeca do zero, como na tela
  const email = `integracao${Date.now()}${Math.random()}@teste.com`;
  const cadastro = await request(app).post('/auth/register').send({ nome: 'Integração', email, senha: '123456' });
  assert.equal(cadastro.status, 201);
  const login = await request(app).post('/auth/login').send({ email, senha: '123456' });
  assert.equal(login.status, 200);
  const token = login.body.token as string;

  //2. rotina de hoje com um exercicio (RF02)
  const divisao = await put('/divisions', token, {
    divisoes: [{ dia_semana: new Date().getDay(), nome: 'Peito' }],
  });
  const idDivisao = divisao.body.divisoes[0].id_divisao as string;
  const catalogo = await get('/exercises', token);
  const exercicio = catalogo.body.exercicios[0];
  const rotina = await put(`/divisions/${idDivisao}/exercises`, token, {
    exercicios: [{ fk_exercicio: exercicio.id_exercicio }],
  });
  assert.equal(rotina.status, 200);

  //3. treino (RF03): aquecimento + 2 validas, uma em cada regua (D9)
  const inicio = await post('/sessions/start', token);
  assert.equal(inicio.status, 201);
  const idTreino = inicio.body.treino.id_treino as string;
  const base = { fk_exercicio: exercicio.id_exercicio };
  await post(`/sessions/${idTreino}/sets`, token, { ...base, tipo: 'aquecimento', carga: 40, repeticoes: 12 });
  await post(`/sessions/${idTreino}/sets`, token, { ...base, tipo: 'work', carga: 80, repeticoes: 8, rir: 1 }); //RPE 9
  await post(`/sessions/${idTreino}/sets`, token, { ...base, tipo: 'work', carga: 80, repeticoes: 7, rpe: 8 }); //RIR 2
  const fim = await post(`/sessions/${idTreino}/finish`, token);
  assert.equal(fim.status, 200);

  //4. volume (RF04): so as 2 validas contam
  const volume = await get('/metrics/weekly-volume', token);
  const grupo = volume.body.volume.grupamentos.find(
    (g: { nome_grupamento: string }) => g.nome_grupamento === exercicio.nome_grupamento
  );
  assert.equal(grupo.series_validas, 2);

  //5. diagnostico (RF05): JSON com os 3 campos + score calculado no backend
  const geracao = await post(`/sessions/${idTreino}/diagnostics/generate`, token);
  assert.equal(geracao.status, 201);
  const diagnostico = geracao.body.diagnostico;
  const conteudo = diagnostico.conteudo_json;
  assert.ok(conteudo.diagnostico_exercicios.length > 0);
  assert.ok(conteudo.analise_grupamentos.length > 0);
  assert.ok(conteudo.recomendacoes_proxima_sessao.length > 0);
  assert.equal(conteudo.score_detalhe.pv, 20); //2 de 10 series
  assert.ok(Math.abs(conteudo.score_detalhe.pi - 83.33) < 0.01); //media(100; 66,67)
  assert.equal(diagnostico.score_geral, 52); //round((20 + 83,33) / 2)

  //RF06: o que a API devolveu e o que esta gravado no banco
  const salvo = await pool.query(
    'SELECT score_geral, conteudo_json FROM DiagnosticoIA WHERE fk_treino = $1',
    [idTreino]
  );
  assert.equal(salvo.rowCount, 1);
  assert.equal(salvo.rows[0].score_geral, 52);
  assert.deepEqual(salvo.rows[0].conteudo_json, conteudo);

  //6. historico (RF07): o que foi gravado aparece nas tres abas
  const mes = await get('/history/sessions', token);
  const sessao = mes.body.sessoes.find((s: { id_treino: string }) => s.id_treino === idTreino);
  assert.equal(sessao.series_validas, 2);
  assert.equal(sessao.score_geral, 52);
  assert.equal(sessao.id_diagnostico, diagnostico.id_diagnostico);

  const detalhe = await get(`/history/sessions/${idTreino}`, token);
  assert.equal(detalhe.body.diagnostico.id_diagnostico, diagnostico.id_diagnostico);
  assert.equal(detalhe.body.exercicios[0].series.length, 3); //o aquecimento tambem vem
  assert.deepEqual(detalhe.body.exercicios[0].resumo, {
    series_validas: 2,
    carga_maxima: 80,
    reps_carga_maxima: 8,
    tonelagem: 1200,
  });

  const progressao = await get(`/history/exercises/${exercicio.id_exercicio}/load-progression`, token);
  assert.equal(progressao.body.progressao.length, 1);
  assert.equal(progressao.body.progressao[0].carga_maxima, 80);

  const volumeHistorico = await get('/history/weekly-volume', token);
  assert.deepEqual(volumeHistorico.body.historico[0], volume.body.volume);
});


//============================ RNF02 ============================

test('RNF02: o banco rejeita série e diagnóstico que apontam pra treino inexistente', async () => {
  await assert.rejects(
    pool.query(
      `INSERT INTO SerieTreino (fk_treino, fk_exercicio, tipo, carga, repeticoes)
       VALUES ($1, (SELECT MIN(id_exercicio) FROM Exercicio), 'aquecimento', 20, 10)`,
      [TREINO_INEXISTENTE]
    ),
    { code: '23503' } //foreign_key_violation
  );
  await assert.rejects(
    pool.query(
      `INSERT INTO DiagnosticoIA (fk_usuario, fk_treino, score_geral, conteudo_json)
       VALUES ($1, $1, 50, '{}')`,
      [TREINO_INEXISTENTE]
    ),
    { code: '23503' }
  );
});


test('RNF02: o banco não deixa apagar um treino que ainda tem séries', async () => {
  const { token, idTreino } = await treinoFinalizadoComSeries();

  await assert.rejects(
    pool.query('DELETE FROM Treino WHERE id_treino = $1', [idTreino]),
    { code: '23503' }
  );
  const detalhe = await get(`/history/sessions/${idTreino}`, token);
  assert.equal(detalhe.status, 200);
  assert.equal(detalhe.body.exercicios[0].series.length, 2);
});


test('RNF02 na API: exercício inexistente vira 400 (série e rotina), sem gravar nada pela metade', async () => {
  const { token, idTreino, idDivisao } = await registrarComTreinoAberto();

  const serie = await post(`/sessions/${idTreino}/sets`, token, {
    fk_exercicio: EXERCICIO_INEXISTENTE, tipo: 'work', carga: 80, repeticoes: 8, rir: 1,
  });
  assert.equal(serie.status, 400);
  assert.equal(serie.body.erro, 'Exercício não encontrado');

  const rotina = await put(`/divisions/${idDivisao}/exercises`, token, {
    exercicios: [{ fk_exercicio: EXERCICIO_INEXISTENTE }],
  });
  assert.equal(rotina.status, 400);

  //a transacao desfez o DELETE: a rotina de antes continua inteira
  const exercicios = await get(`/divisions/${idDivisao}/exercises`, token);
  assert.equal(exercicios.body.exercicios.length, 1);
});


//============================ RNF05 / RNF06 ============================

test('RNF05: IA respondendo fora do JSON vira 502 e nenhum diagnóstico é gravado', async () => {
  const { token, idTreino } = await treinoFinalizadoComSeries();

  const geracao = await comModoGemini('invalido', () =>
    post(`/sessions/${idTreino}/diagnostics/generate`, token)
  );
  assert.equal(geracao.status, 502);

  const salvos = await pool.query('SELECT 1 FROM DiagnosticoIA WHERE fk_treino = $1', [idTreino]);
  assert.equal(salvos.rowCount, 0);
});


test('RNF06: falha simulada da IA devolve 502 e o treino continua intacto', async () => {
  const { token, idTreino } = await treinoFinalizadoComSeries();
  const antes = await get(`/history/sessions/${idTreino}`, token);

  const geracao = await comModoGemini('falha', () =>
    post(`/sessions/${idTreino}/diagnostics/generate`, token)
  );
  assert.equal(geracao.status, 502);
  assert.equal(geracao.body.erro, 'Falha ao gerar diagnóstico com a IA');

  //"registros intactos apos falha simulada" (Tabela VI): treino e series iguais
  const depois = await get(`/history/sessions/${idTreino}`, token);
  assert.deepEqual(depois.body.sessao, antes.body.sessao);
  assert.deepEqual(depois.body.exercicios, antes.body.exercicios);
  assert.equal(depois.body.diagnostico, null); //nada gravado pela metade

  //o "Tentar avaliar de novo" (D16): com a IA de volta, o mesmo treino e avaliado
  const novaTentativa = await post(`/sessions/${idTreino}/diagnostics/generate`, token);
  assert.equal(novaTentativa.status, 201);
});


//============================ erros em JSON (Passo 2) ============================

test('rota inexistente e JSON malformado respondem JSON, não HTML', async () => {
  const rota = await request(app).get('/rota-que-nao-existe');
  assert.equal(rota.status, 404);
  assert.equal(rota.body.erro, 'Rota não encontrada');

  const corpo = await request(app)
    .post('/auth/login')
    .set('Content-Type', 'application/json')
    .send('{"email": '); //cortado de proposito
  assert.equal(corpo.status, 400);
  assert.equal(corpo.body.erro, 'JSON inválido no corpo da requisição');
});
```

- [ ] `npm run test`: **76/76** (62 da S8 + 2 do `diagnostic` + 4 do `session`
  + 1 do `division` + 7 do `integration`). O teste RNF06 imprime um stack trace
  no terminal, o `console.error` do controller com a "Falha simulada…". Isso é
  esperado: é o log de erro funcionando, não teste falhando.

### Passo 11 — Postman: 25.1–25.8 + conferências fora da coleção

As requisições novas entram **no fim da coleção**, depois do `24.8`, e usam o
usuário principal (`{{token}}`). Só o `25.4` regrava uma variável, e ela já
existia (`idTreino`). Nenhum teste anterior muda de valor. A coleção passa de
**78 para 86** requisições.

#### 25.1 - rota inexistente (404)

- [ ] Posição: no fim da coleção, depois do `24.8`.
- `GET {{baseUrl}}/rota-que-nao-existe` · Auth: `Inherit`
- **Post-response**:

```js
pm.test('rota inexistente 404', () => pm.response.to.have.status(404));
pm.test('responde JSON, não HTML', () => pm.expect(pm.response.json().erro).to.eql('Rota não encontrada'));
```

- Variáveis: nenhuma. Esperado: `404 { "erro": "Rota não encontrada" }`.

#### 25.2 - login com JSON malformado (400)

- [ ] Posição: depois do `25.1`.
- `POST {{baseUrl}}/auth/login` · Auth: `No Auth`
- **Body** (raw → JSON), cortado de propósito. O Postman sublinha em vermelho e
  envia assim mesmo:

```
{ "email": "{{emailTeste}}",
```

- **Post-response**:

```js
pm.test('JSON malformado 400', () => pm.response.to.have.status(400));
pm.test('mensagem do tratador global', () => pm.expect(pm.response.json().erro).to.eql('JSON inválido no corpo da requisição'));
```

- Variáveis: usa `emailTeste`. Esperado: `400 { "erro": "JSON inválido no corpo
  da requisição" }`. Antes do Passo 2, era `400` com uma página HTML.

#### 25.3 - série em treino finalizado (409)

- [ ] Posição: depois do `25.2`.
- `POST {{baseUrl}}/sessions/{{idTreino}}/sets` · Auth: `Inherit`. O
  `{{idTreino}}` aqui é o treino só de aquecimento do `21.1`, finalizado no
  `21.4`.
- **Body**:

```json
{ "fk_exercicio": {{idExercicio}}, "tipo": "work", "carga": 80, "repeticoes": 8, "rir": 1 }
```

- **Post-response**:

```js
pm.test('série em treino finalizado 409 (D20)', () => pm.response.to.have.status(409));
pm.test('mensagem', () => pm.expect(pm.response.json().erro).to.eql('Treino já finalizado: as séries não podem mais ser alteradas'));
```

- Variáveis: usa `idTreino`, `idExercicio`. Esperado: `409`. Antes do Passo 4,
  era `201` e uma série nova num treino já avaliado.

#### 25.4 - começar um treino novo

- [ ] Posição: depois do `25.3`. O `25.5` precisa de um treino **aberto**, e o
  do `21.1` já está finalizado. Este start cria outro (201) e passa o
  `idTreino` para ele. Os `25.5` e `25.6` usam esse treino.
- `POST {{baseUrl}}/sessions/start` · Auth: `Inherit` · sem body
- **Post-response**:

```js
pm.test('start 200/201', () => pm.expect(pm.response.code).to.be.oneOf([200, 201]));
pm.environment.set('idTreino', pm.response.json().treino.id_treino);
```

- Variáveis: **regrava** `idTreino`. Esperado: `201 { "treino": { "completed":
  false, … } }`. Dá `200` se já houver um treino aberto hoje (de um teste
  manual, por exemplo), e a sequência funciona igual.

#### 25.5 - série com exercício inexistente (400)

- [ ] Posição: depois do `25.4`. Precisa do treino **aberto**: com ele
  finalizado, o 409 da D20 viria antes da checagem de FK.
- `POST {{baseUrl}}/sessions/{{idTreino}}/sets` · Auth: `Inherit`
- **Body**:

```json
{ "fk_exercicio": 999999, "tipo": "work", "carga": 80, "repeticoes": 8, "rir": 1 }
```

- **Post-response**:

```js
pm.test('exercício inexistente 400, não 500 (RNF02)', () => pm.response.to.have.status(400));
pm.test('mensagem', () => pm.expect(pm.response.json().erro).to.eql('Exercício não encontrado'));
```

- Variáveis: usa `idTreino`. Esperado: `400 { "erro": "Exercício não encontrado" }`.
  Antes do Passo 3, era `500 { "erro": "Erro ao registrar série" }`.

#### 25.6 - finalizar o treino do 25.4

- [ ] Posição: depois do `25.5`. Fecha o treino, para a coleção não deixar
  treino aberto para trás.
- `POST {{baseUrl}}/sessions/{{idTreino}}/finish` · Auth: `Inherit`
- **Post-response**:

```js
pm.test('finalizar 200', () => pm.response.to.have.status(200));
pm.test('treino de hoje ganha duração (D12)', () => pm.expect(pm.response.json().treino.duracao_total).to.be.at.least(1));
```

- Variáveis: usa `idTreino`. Esperado: `200`, com `completed: true` e a
  duração em minutos.

#### 25.7 - tirar todos os dias da semana (D21)

- [ ] Posição: depois do `25.6`. É a última que mexe na rotina do usuário
  principal, de propósito: nada depois dela depende da divisão.
- `PUT {{baseUrl}}/divisions` · Auth: `Inherit`
- **Body**:

```json
{ "divisoes": [] }
```

- **Post-response**:

```js
pm.test('semana vazia salva mesmo com treinos no histórico (D21)', () => pm.response.to.have.status(200));
pm.test('nenhum dia sobrou', () => pm.expect(pm.response.json().divisoes).to.eql([]));
```

- Variáveis: nenhuma. Esperado: `200 { "divisoes": [] }`. Antes do Passo 5,
  era `500 { "erro": "erro ao salvar divisao semanal" }`.

#### 25.8 - detalhe da sessão depois de tirar o dia

- [ ] Posição: depois do `25.7`, e é a última da coleção.
- `GET {{baseUrl}}/history/sessions/{{idSessaoHoje}}` · Auth: `Inherit`
- **Post-response**:

```js
pm.test('detalhe 200', () => pm.response.to.have.status(200));
const { sessao, exercicios, diagnostico } = pm.response.json();
pm.test('perdeu só o vínculo com o dia', () => pm.expect(sessao.nome_divisao).to.eql(null));
pm.test('séries e diagnóstico continuam', () => {
  pm.expect(exercicios.length).to.be.above(0);
  pm.expect(diagnostico).to.not.eql(null);
});
```

- Variáveis: usa `idSessaoHoje`. Esperado: `200`, com `"nome_divisao": null`,
  os exercícios e o diagnóstico da sessão principal.

#### Conferências fora da coleção (não rodam no Run collection)

A D22 depende da data do treino, e o Postman não tem como voltar o relógio.
Por isso ela é conferida à mão, com o mesmo usuário, depois do Run collection.

- [ ] **Treino aberto de ontem:** `POST {{baseUrl}}/sessions/start` avulso
  (201, salva o `idTreino`). Copie o `idTreino` do ambiente e, no `psql`:

```sql
UPDATE Treino SET data = data - INTERVAL '1 day'
WHERE id_treino = '<idTreino do start avulso>';
```

  Depois disso, o `GET {{baseUrl}}/sessions/today` volta com `"treino": null`
  e com o `"pendente"` preenchido: esse treino, `"divisao": null` (o `25.7`
  tirou todos os dias), e `"exercicios"` e `"series"` vazios. Em seguida, `POST
  {{baseUrl}}/sessions/{{idTreino}}/finish` devolve `200` com
  `"duracao_total": null`.
- [ ] **Treino aberto de anteontem:** outro start avulso, agora com `INTERVAL
  '2 days'` no `UPDATE`. O `GET {{baseUrl}}/sessions/today` volta com
  `"pendente": null`, e o `GET {{baseUrl}}/history/sessions?mes=<mês de
  anteontem>` mostra a sessão com `"duracao_total": null` e
  `"series_validas": 0`. Sem série válida, o `generate` dela devolve 400
  (D16), que é o comportamento certo.

- [ ] **Run collection** inteiro: **86/86 requisições, todos os `pm.test`
  verdes**, com `GEMINI_MOCK=true`.

---

## Sessão B — Front: responsividade + limpeza

### Passo 12 — `services/api.ts` + `context/`: conexão, sessão expirada e `VITE_API_URL`

- [ ] Três defeitos de borda do `apiFetch`, que viram tela quebrada para quem
  usa:
  1. **Servidor fora do ar ou IP errado:** o `fetch` rejeita com
     `TypeError: Failed to fetch`, e a tela mostra essa mensagem, em inglês.
  2. **Token vencido** (o JWT dura 7 dias): toda tela mostra "Token invalido ou
     expirado", e a pessoa fica presa até achar o "Sair".
  3. **`API_URL` fixa em `localhost`:** no celular, `localhost` é o próprio
     celular. Sem isso, o Passo 17 não acontece.

`client/src/services/api.ts`, trocar o topo até o fim do `apiFetch`:

```ts
//VITE_API_URL vem do client/.env.local - no celular (Passo 17) aponta pro IP do PC.
//sem ele, o localhost de sempre
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

//o AuthContext escuta este evento pra voltar pro login quando o token vence
export const EVENTO_SESSAO_EXPIRADA = 'sessao-expirada';

//Estende as opções de configurações padrão do fetch (method, headers, etc.)
//e flexibiliza o 'body' para aceitar objetos JS antes da conversão para JSON.
interface OpcoesFetch extends RequestInit {
    body?: any;
}

//evita erros tipo: mensagem.includes('já foi finalizado'), se mudar a mensagem no backend, a tela quebra.
//status 0 = nem chegou resposta (servidor fora, sem rede)
export class ApiErro extends Error {
    status: number;

    constructor(mensagem: string, status: number) {
        super(mensagem);
        this.status = status;
    }
}

//funcao que monta url, injeta o token quando existe, e transforma resposta de erro numa exceção
// ...(spread) tira a embalagem de objeto ou lista e despeja só o conteudo.
async function apiFetch(caminho: string, opcoes: OpcoesFetch = {}) {
    const token = localStorage.getItem('token');

    let resposta: Response;
    try {
        resposta = await fetch(`${API_URL}${caminho}`, {
            ...opcoes, //repassa qualquer propriedade recebida em opcoes
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...opcoes.headers,
            },
            body: opcoes.body ? JSON.stringify(opcoes.body) : undefined,
        });
    } catch {
        //o fetch so rejeita quando nao chegou resposta nenhuma
        throw new ApiErro('Não foi possível conectar ao servidor. Confira sua conexão.', 0);
    }

    //401 COM token = sessao vencida numa tela logada (sem token e senha errada no login)
    if (resposta.status === 401 && token) {
        localStorage.removeItem('token');
        window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
    }

    //.catch: corpo que nao e JSON (proxy, pagina de erro) vira a mensagem generica
    const dados = resposta.status === 204 ? null : await resposta.json().catch(() => null);
    if (!resposta.ok) {
        throw new ApiErro(dados?.erro ?? 'Erro na requisição', resposta.status);
    }

    return dados;
}
```

- [ ] `client/src/context/useAuth.ts` (novo). O contexto e o hook saem do
  `AuthContext.tsx`: arquivo `.tsx` que exporta componente **e** hook quebra
  o fast refresh do Vite, e é um dos 2 avisos do `oxlint`.

```ts
import { createContext, useContext } from 'react';
import type { Usuario } from '../services/api';

//separado do AuthContext.tsx: arquivo .tsx que exporta componente E hook
//quebra o fast refresh do Vite (aviso only-export-components do oxlint)

//contrato que define oq está disponivel para componentes que usarem a autenticação
export interface AuthContextValor {
    usuario: Usuario | null;
    carregando: boolean;
    login: (email: string, senha: string) => Promise<void>;
    registrar: (nome: string, email: string, senha: string) => Promise<void>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextValor | null>(null);

export function useAuth() {
    const contexto = useContext(AuthContext);
    if (!contexto) {
        throw new Error('useAuth precisa ser usado dentro de um AuthProvider');
    }
    return contexto;
}
```

- [ ] `client/src/context/AuthContext.tsx`: sai a `interface`, o
  `createContext` e o `useAuth`, e entra o ouvinte da sessão expirada. Fica
  só o `AuthProvider`:

```tsx
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import * as api from '../services/api';
import type { Usuario } from '../services/api';
import { AuthContext } from './useAuth';

/**
 * Contexto global de autenticação
 * Responsabilidades:
 * - Manter o estado do usuario logado ('usuario')e do carregamento inicial ('carregando')
 * - Restaurar a sessão automaticamente ao dar F5 validando o token do localStorage
 * - Centralizar as funcoes de login, registrar e logout
 * - Voltar pro login quando o apiFetch avisa que o token venceu
 */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function restaurarSessao() {
      const token = localStorage.getItem('token');
      if (!token) {
        setCarregando(false);
        return;
      }
      try {
        const { usuario } = await api.buscarPerfil();
        setUsuario(usuario);
      } catch {
        localStorage.removeItem('token');
      } finally {
        setCarregando(false);
      }
    }
    restaurarSessao();
  }, []);

  //401 numa tela logada: o apiFetch ja apagou o token, aqui so volta pro login
  useEffect(() => {
    function aoExpirar() {
      setUsuario(null);
    }
    window.addEventListener(api.EVENTO_SESSAO_EXPIRADA, aoExpirar);
    return () => window.removeEventListener(api.EVENTO_SESSAO_EXPIRADA, aoExpirar);
  }, []);

  async function login(email: string, senha: string) {
    const { token, usuario } = await api.login(email, senha);
    localStorage.setItem('token', token);
    setUsuario(usuario);
  }

  async function registrar(nome: string, email: string, senha: string) {
    await api.registrar(nome, email, senha);
    await login(email, senha);
  }

  function logout() {
    localStorage.removeItem('token');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, registrar, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

- [ ] Trocar o import do `useAuth` nos três lugares que usam:
  `App.tsx` (`'./context/useAuth'`), `components/Sidebar.tsx` e
  `views/AuthView.tsx` (`'../context/useAuth'`).
- [ ] `client/.env.example` (novo, versionado):

```
# endereço da API. Para testar no celular: http://<IP do PC na rede>:3000
# copie para .env.local (ignorado pelo git) e reinicie o npm run dev
VITE_API_URL=http://localhost:3000
```

- [ ] Testar: com o front aberto, derrube o `server` (Ctrl+C) e registre uma
  série. A tela tem que mostrar "Não foi possível conectar ao servidor…". Para a
  sessão expirada: no DevTools → Application → Local Storage, troque o `token`
  por `abc` e navegue para outra tela. O app tem que voltar para o login.

### Passo 13 — D19: uma URL por tela (`react-router`)

- [ ] As 5 telas viram rotas: `/divisao`, `/treino`, `/volume`, `/diagnostico` e
  `/historico`. O `useState<Tela>` do `App.tsx` sai, e quem diz qual tela está
  aberta passa a ser a URL. É isso que faz o F5 e a aba recarregada pelo
  celular voltarem para a mesma tela, e o "voltar" do Android voltar de tela.
- [ ] Instalar no `client/` (a v7 junta o antigo `react-router-dom` no pacote
  `react-router`):

```bash
npm install react-router
```

- [ ] `client/src/main.tsx`: o `BrowserRouter` por fora de tudo. O `useNavigate`
  só funciona **dentro** dele, e a `Sidebar` e o Treino de hoje passam a usar.

```tsx
import { BrowserRouter } from 'react-router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] `client/src/App.tsx` (completo). O login continua do jeito que está: sem
  usuário, a `AuthView` aparece **em qualquer URL**, e a URL não muda. Depois do
  login, a pessoa cai na tela que tinha pedido (ex.: abriu `/historico` com o
  token vencido, entrou e já está no Histórico).

```tsx
import { Navigate, Route, Routes } from 'react-router'
import { useAuth } from './context/useAuth'
import { AuthView } from './views/AuthView'
import { DivisionView } from './views/DivisionView'
import { TodaySessionView } from './views/TodaySessionView'
import { WeeklyVolumeView } from './views/WeeklyVolumeView'
import { DiagnosticView } from './views/DiagnosticView'
import { HistoryView } from './views/HistoryView'

import { AppShell } from './components/AppShell'
import { PageLayout } from './components/PageLayout'
import { Typography } from '@mui/material'

//D19: cada tela tem URL. o F5 e o "voltar" do navegador ficam na tela certa -
//e no celular o navegador recarrega sozinho a aba que ficou em segundo plano
function App() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <PageLayout>
        <Typography>Carregando...</Typography>
      </PageLayout>
    )
  }

  //sem usuario: login em qualquer URL. depois de entrar, a rota pedida ja esta na barra
  if (!usuario) {
    return <AuthView />
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/divisao" element={<DivisionView />} />
        <Route path="/treino" element={<TodaySessionView />} />
        <Route path="/volume" element={<WeeklyVolumeView />} />
        <Route path="/diagnostico" element={<DiagnosticView />} />
        <Route path="/historico" element={<HistoryView />} />
        {/* "/" e qualquer URL desconhecida: a primeira tela do fluxo.
            replace: sem ele, o "voltar" cai de novo no redirecionamento */}
        <Route path="*" element={<Navigate to="/divisao" replace />} />
      </Routes>
    </AppShell>
  )
}

export default App
```

- [ ] `client/src/views/TodaySessionView.tsx`: a prop `onVerDiagnostico` sai. A
  tela navega sozinha depois de avaliar.

```tsx
import { useNavigate } from 'react-router';

export function TodaySessionView() {
  const navigate = useNavigate();
  // ...o resto dos estados igual

  //dentro do avaliar(), no lugar do onVerDiagnostico():
      setPendenteAvaliacao(null);
      navigate('/diagnostico');
```

- [ ] `AppShell` e `Sidebar` deixam de receber `tela`/`onNavegar`: o código
  completo dos dois está no Passo 14, que já usa as rotas. O `export type Tela`
  do `App.tsx` deixa de existir. O `tsc` acusa qualquer import dele que tenha
  sobrado.
- [ ] O `npm run dev` do Vite já devolve o `index.html` para qualquer caminho
  (fallback de SPA). Abrir `http://localhost:5173/historico` direto funciona
  sem configuração. Teste: em cada tela, F5 → continua nela; navegue Divisão →
  Treino → Volume e use o "voltar" do navegador → Treino → Divisão.
- [ ] **Se este passo for cortado** (primeiro da ordem de corte), o Passo 14
  continua valendo com uma troca só: a `Sidebar` recebe de novo `tela` e
  `onNavegar` como props, `ativo = item.tela === tela` e `onClick={() =>
  onNavegar(item.tela)}`, como hoje.

### Passo 14 — D6: barra inferior no celular (`Sidebar.tsx` + `AppShell.tsx`)

- [ ] Abaixo do breakpoint `sm` (600px), a lateral dá lugar a uma barra
  fixa embaixo, só com ícones. A `Sidebar` vira um **seletor** entre dois
  componentes, cada um com os próprios hooks. Assim nenhum hook fica depois de
  um `return` condicional.
- [ ] Sem `noSsr: true`, o `useMediaQuery` devolve `false` no primeiro render, e
  no celular a lateral **pisca** antes de virar barra.
- [ ] O item de sair no celular é o **ícone de sair**, e não o avatar. Avatar sem
  nome embaixo não diz o que faz, e um toque sem querer desloga (prevenção de
  erro, heurística de Nielsen).
- [ ] O `disponivel`/`opacity: 0.45`, que ficou da S3 (item ainda sem tela), sai
  junto: todo item tem `rota`.
- [ ] Com as rotas do Passo 13, a `Sidebar` não recebe mais props: ela lê a tela
  ativa da URL (`useLocation`) e navega com `useNavigate`.

`client/src/components/Sidebar.tsx` (completo):

```tsx
import { useState, type ReactNode } from 'react';
import { Avatar, Box, ButtonBase, Stack, Typography, useMediaQuery } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import BarChartIcon from '@mui/icons-material/BarChart';
import InsightsIcon from '@mui/icons-material/Insights';
import TimelineIcon from '@mui/icons-material/Timeline';
import LogoutIcon from '@mui/icons-material/Logout';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/useAuth';

//Navegacao das telas logadas (D6). A tela ativa vem da URL (D19):
// - a partir do sm (600px): lateral flutuante, so icones (76px), expande no hover (Framer Motion)
// - celular: barra inferior so com icones - hover nao existe no touch, e a
//   lateral comia 116px de uma tela de 360

interface NavItem {
  label: string;
  icon: ReactNode;
  rota: string;
}

//ordem = ordem de uso: monta a rotina, treina, confere o volume, a avaliacao e o historico
const NAV_ITEMS: NavItem[] = [
  { label: 'Minha divisão', icon: <CalendarViewWeekIcon fontSize="small" />, rota: '/divisao' },
  { label: 'Treino de hoje', icon: <FitnessCenterIcon fontSize="small" />, rota: '/treino' },
  { label: 'Volume da semana', icon: <BarChartIcon fontSize="small" />, rota: '/volume' },
  { label: 'Diagnóstico', icon: <InsightsIcon fontSize="small" />, rota: '/diagnostico' },
  { label: 'Histórico', icon: <TimelineIcon fontSize="small" />, rota: '/historico' },
];

const COLLAPSED = 76;
const EXPANDED = 244;

export function Sidebar() {
  //noSsr: le a media query ja no primeiro render - sem ele a lateral pisca no celular
  const celular = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'), { noSsr: true });
  return celular ? <BarraInferior /> : <BarraLateral />;
}

function BarraLateral() {
  const [aberta, setAberta] = useState(false);
  const { usuario, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <Box
      component={motion.nav}
      animate={{ width: aberta ? EXPANDED : COLLAPSED }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      onMouseEnter={() => setAberta(true)}
      onMouseLeave={() => setAberta(false)}
      onFocus={() => setAberta(true)}
      onBlur={() => setAberta(false)}
      sx={{
        position: 'fixed',
        top: 20,
        left: 20,
        bottom: 20,
        bgcolor: '#0F1B17',
        color: '#C7D3CE',
        borderRadius: '28px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        px: 1.75,
        py: 2.5,
        boxShadow: '0 20px 45px -18px rgba(15, 27, 23, 0.55)',
        zIndex: 10,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 0.5, pb: 2.5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '12px',
            flexShrink: 0,
            background: 'linear-gradient(155deg, #2F8A73, #1E6F5C)',
          }}
        />
        {aberta && (
          <Typography
            component={motion.span}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            sx={{ fontFamily: '"Sora", sans-serif', fontWeight: 700, fontSize: 15, color: '#F3F6F4', whiteSpace: 'nowrap' }}
          >
            HyperTrack
          </Typography>
        )}
      </Stack>

      <Stack spacing={0.5} sx={{ flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const ativo = pathname === item.rota;

          return (
            <Stack
              key={item.rota}
              direction="row"
              spacing={1.75}
              alignItems="center"
              onClick={() => navigate(item.rota)}
              sx={{
                px: 1.75,
                py: 1.25,
                borderRadius: '999px',
                cursor: 'pointer',
                bgcolor: ativo ? 'primary.main' : 'transparent',
                color: ativo ? '#F3F6F4' : 'inherit',
                '&:hover': { bgcolor: ativo ? 'primary.main' : 'rgba(255,255,255,0.07)' },
              }}
            >
              {item.icon}
              {aberta && (
                <Typography
                  component={motion.span}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  sx={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                  {item.label}
                </Typography>
              )}
            </Stack>
          );
        })}
      </Stack>

      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        onClick={logout}
        sx={{ px: 1.25, py: 1, borderRadius: '999px', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' } }}
      >
        <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(170,59,255,0.15)', color: '#D9A6FF', fontSize: 13, fontWeight: 700 }}>
          {usuario?.nome?.slice(0, 2).toUpperCase()}
        </Avatar>
        {aberta && (
          <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} sx={{ overflow: 'hidden' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#F3F6F4', whiteSpace: 'nowrap' }}>
              {usuario?.nome}
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: '#7C8B85' }}>Sair</Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
}

function BarraInferior() {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <Box
      component="nav"
      sx={{
        position: 'fixed',
        left: 12,
        right: 12,
        //safe-area: no iPhone sem botao, a barra nao fica embaixo da barra de gesto
        bottom: 'calc(12px + env(safe-area-inset-bottom))',
        height: 64,
        px: 1,
        bgcolor: '#0F1B17',
        borderRadius: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        boxShadow: '0 20px 45px -18px rgba(15, 27, 23, 0.55)',
        zIndex: 10,
      }}
    >
      {NAV_ITEMS.map((item) => {
        const ativo = pathname === item.rota;
        return (
          <ButtonBase
            key={item.rota}
            aria-label={item.label} //so icone: o leitor de tela precisa do nome
            aria-current={ativo ? 'page' : undefined}
            onClick={() => navigate(item.rota)}
            sx={{
              width: 44, //44px: alvo de toque minimo confortavel
              height: 44,
              borderRadius: '999px',
              color: ativo ? '#F3F6F4' : '#C7D3CE',
              bgcolor: ativo ? 'primary.main' : 'transparent',
            }}
          >
            {item.icon}
          </ButtonBase>
        );
      })}
      <ButtonBase
        aria-label="Sair"
        onClick={logout}
        sx={{ width: 44, height: 44, borderRadius: '999px', color: '#7C8B85' }}
      >
        <LogoutIcon fontSize="small" />
      </ButtonBase>
    </Box>
  );
}
```

`client/src/components/AppShell.tsx` (completo):

```tsx
import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { Sidebar } from './Sidebar';
import { PageLayout } from './PageLayout';

//Casca de toda tela logada: navegacao fixa + conteudo com espaco reservado
//pra ela nunca cobrir o texto - a esquerda a partir do sm, embaixo no celular (D6).
//sem props de tela: a Sidebar le a rota sozinha (D19)
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Sidebar />
      <Box sx={{ pl: { xs: 0, sm: '116px', md: '136px' }, pb: { xs: '96px', sm: 0 } }}>
        <PageLayout>{children}</PageLayout>
      </Box>
    </Box>
  );
}
```

- [ ] O breakpoint do `sx` (`xs` vale abaixo de 600px) e o do `useMediaQuery`
  (`down('sm')` também vale abaixo de 600px) são **o mesmo**. Se um mudar sem o
  outro, aparece uma faixa de largura com a barra embaixo e 116px vazios à
  esquerda.
- [ ] Testar no DevTools (Ctrl+Shift+M), em **599px e 600px**: em 599, a barra
  embaixo e o conteúdo encostado na margem; em 600, a lateral.

### Passo 15 — Treino de hoje: "Retomar treino", teclado numérico e vírgula decimal

#### 15.1 — Treino aberto de ontem: "Retomar treino" e "Finalizar" (D22)

- [ ] `client/src/services/api.ts`: o tipo novo e o campo que o backend passou
  a mandar (Passo 6). Nenhuma chamada nova: o "Finalizar" usa o
  `finalizarTreino` que já existe.

```ts
//D22: o treino que ficou aberto ontem, com a divisao e os exercicios dele
export interface TreinoPendente {
    treino: Treino;
    divisao: Divisao | null;
    exercicios: ExercicioDoDia[];
    series: Serie[];
}

export interface TreinoDeHoje {
    dia_semana: number;
    divisaoHoje: Divisao | null; //o backend devolve a chave com esse nome (Reparo 5)
    treino: Treino | null;
    pendente: TreinoPendente | null; //D22: so vem quando nao ha treino aberto hoje
    exercicios: ExercicioDoDia[];
    series: Serie[];
}
```

- [ ] `client/src/views/TodaySessionView.tsx`. A ideia: a tela passa a
  trabalhar sobre o **treino em foco**, que é o de hoje ou, depois do
  "Retomar", o de ontem, cada um com a sua divisão e os seus exercícios. Os
  imports: `Alert` e `AlertTitle` no `import` do `@mui/material`, e
  `import ReplayIcon from '@mui/icons-material/Replay';`.
- [ ] Um estado novo, junto dos outros, e o `emFoco` logo abaixo do
  `pendenteAvaliacao`:

```tsx
  const [retomando, setRetomando] = useState(false); //D22: a pessoa escolheu continuar o treino de ontem

  //D22: tudo o que o formulario usa sai daqui - o treino de hoje, ou o de ontem
  //depois do "Retomar". cada um com a divisao e os exercicios dele
  const emFoco = retomando && hoje?.pendente
    ? hoje.pendente
    : {
        treino: hoje?.treino ?? null,
        divisao: hoje?.divisaoHoje ?? null,
        exercicios: hoje?.exercicios ?? [],
        series: hoje?.series ?? [],
      };
```

- [ ] Nos três handlers, `hoje.treino` vira `emFoco.treino`:
  - `registrar`: `if (!emFoco.treino) return;` e
    `api.registrarSerie(emFoco.treino.id_treino, {…})`.
  - `remover`: `if (!emFoco.treino) return;` e
    `api.apagarSerie(emFoco.treino.id_treino, idSerie)`.
  - `finalizarEAvaliar`: `if (!emFoco.treino) return;` e
    `const idTreino = emFoco.treino.id_treino;`.
- [ ] No `finalizarEAvaliar`, a mensagem de sucesso considera a duração `null`,
  e o `retomando` volta a `false` antes do `recarregar`:

```tsx
    try {
      const { treino } = await api.finalizarTreino(idTreino);
      //D22: treino que virou o dia fecha sem duracao
      setSucesso(treino.duracao_total != null
        ? `Treino finalizado — ${treino.duracao_total} min registrados.`
        : 'Treino finalizado.');
    } catch (erro) {
      // ...igual
    }
    setRetomando(false);
    await recarregar(); //a tela volta pro "Comecar treino"
```

- [ ] Função nova, depois do `avaliar`:

```tsx
  //D22: "Finalizar" do treino de ontem - fecha sem duracao, e ele vai pro Historico,
  //onde o "Avaliar treino" do detalhe gera a avaliacao
  async function finalizarPendente(idTreino: string) {
    setErro('');
    setSucesso('');
    try {
      await api.finalizarTreino(idTreino);
      setSucesso('Treino de ontem finalizado. Ele já está no Histórico, onde dá para avaliar.');
      await recarregar();
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : 'Erro ao finalizar treino');
    }
  }
```

- [ ] O aviso, logo antes do `if (carregando)`. O "Retomar" só aparece se o
  treino de ontem ainda tem divisão: sem ela (o dia foi tirado da rotina, D21)
  não há exercício para mostrar, e sobra o "Finalizar".

```tsx
  //D22: treino aberto de ontem - o aviso fica ate a pessoa escolher
  const pendente = retomando ? null : hoje?.pendente;
  const avisoPendente = pendente && (
    <Alert severity="warning" sx={{ mt: 2 }}>
      <AlertTitle>Você tem um treino aberto de ontem</AlertTitle>
      {pendente.divisao?.nome ?? 'Sem divisão'}, começado às{' '}
      {new Date(pendente.treino.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
      {hoje?.divisaoHoje && ' Começar o treino de hoje fecha esse.'}
      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
        {pendente.divisao && (
          <Button
            variant="contained"
            size="small"
            startIcon={<ReplayIcon />}
            onClick={() => setRetomando(true)}
            disabled={etapa !== null}
          >
            Retomar treino
          </Button>
        )}
        <Button
          variant="outlined"
          size="small"
          onClick={() => finalizarPendente(pendente.treino.id_treino)}
          disabled={etapa !== null}
        >
          Finalizar
        </Button>
      </Stack>
    </Alert>
  );
```

- [ ] O ramo do dia de descanso passa a olhar o `emFoco` e ganha o aviso, porque
  o treino de ontem pode ter ficado aberto num dia em que hoje é descanso. E
  ganha o `erro`, que o `finalizarPendente` pode mostrar:

```tsx
  if (!hoje || !emFoco.divisao) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h2" gutterBottom>
            Treino de Hoje
          </Typography>
          <FeedbackAlert erro={erro} />
          <FeedbackAlert sucesso={sucesso} />
          <Typography color="text.secondary">
            {DIAS[hoje?.dia_semana ?? new Date().getDay()]} não tem divisão cadastrada — dia de descanso.
          </Typography>
          {avisoPendente}
        </CardContent>
      </Card>
    );
  }
```

- [ ] No JSX principal: o subtítulo, o ramo do "Começar treino" e o mapa de
  exercícios.

```tsx
        <Typography color="text.secondary" gutterBottom>
          {retomando ? 'Treino de ontem' : DIAS[hoje.dia_semana]} — {emFoco.divisao.nome}
        </Typography>
```

```tsx
        {!emFoco.treino ? (
          <>
            {avisoPendente}
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={comecar}
              disabled={etapa !== null}
              sx={{ mt: 2 }}
            >
              Começar treino
            </Button>
          </>
        ) : (
```

  E, dentro do formulário, `hoje.exercicios.map(…)` vira
  `emFoco.exercicios.map(…)`, e `hoje.series.filter(…)` vira
  `emFoco.series.filter(…)`.

- [ ] Testar. Comece um treino, registre 2 séries e, no `psql`, mande o treino
  aberto para ontem:

```sql
UPDATE Treino SET data = data - INTERVAL '1 day'
WHERE completed = FALSE
  AND fk_usuario = (SELECT id_usuario FROM Usuario WHERE email = '<seu e-mail>');
```

  - **Retomar:** recarregue o Treino de hoje → o aviso aparece → "Retomar
    treino" → o subtítulo vira "Treino de ontem", com as 2 séries → registre
    outra → "Finalizar e avaliar treino" → "Treino finalizado." (sem minutos)
    → no Histórico, a sessão aparece ontem, com o diagnóstico.
  - **Finalizar:** repita o `UPDATE` com um treino novo → "Finalizar" → o
    aviso some, e a sessão aparece no Histórico, sem duração.
  - **Começar treino:** repita → "Começar treino" → o de ontem vai para o
    Histórico, e o de hoje abre vazio.
  - **Anteontem:** repita com `INTERVAL '2 days'` → nenhum aviso, e a sessão
    já está no Histórico.

#### 15.2 — Teclado numérico e vírgula decimal

- [ ] **Teclado:** o `inputMode` está direto no `TextField`, e o MUI repassa esse
  prop para a `div` de fora (`MuiFormControl-root`), não para o `<input>`.
  Confira no DevTools: o atributo `inputmode` está na `div`. Por isso o
  celular sempre abriu o teclado de letras. Em
  `client/src/views/TodaySessionView.tsx`, nos três campos:

```tsx
                    {/* inputMode tem que chegar no <input>: no TextField direto ele cai na div de fora */}
                    <TextField
                      label="Carga (kg)"
                      size="small"
                      slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                      value={rascunho.carga}
                      onChange={(e) =>
                        atualizarRascunho(exercicio.fk_exercicio, 'carga', e.target.value)
                      }
                    />
                    <TextField
                      label="Reps"
                      size="small"
                      slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                      value={rascunho.repeticoes}
                      onChange={(e) =>
                        atualizarRascunho(exercicio.fk_exercicio, 'repeticoes', e.target.value)
                      }
                    />
```

  E o mesmo `slotProps={{ htmlInput: { inputMode: 'numeric' } }}` no campo de
  RIR/RPE.

- [ ] **Vírgula:** o teclado decimal em português digita `82,5`. No
  `registrar`, a carga passa por um `replace` antes do `Number`. Isso é só
  leitura do que foi digitado, não cálculo (RNF03 intacta):

```tsx
        //teclado decimal em pt-BR digita virgula: Number('82,5') seria NaN -> null no JSON -> 400
        carga: Number(rascunho.carga.replace(',', '.')),
```

- [ ] Testar no DevTools: carga `82,5` → a série aparece como `82.5 kg × …`.
  O teclado só dá para conferir no celular de verdade (Passo 17).

### Passo 16 — Limpeza (critério "código limpo")

- [ ] **O que "sem console.logs" quer dizer aqui:** sem log de **depuração**. O
  `console.error` dos `catch` do backend e do `tratarErro` fica, porque é o único
  registro de erro do servidor (sem ele, um 500 em produção não deixa rastro).
  O `console.log` do `index.ts` ("server rodando na porta…") e os do
  `seed.ts`/`resetDb.ts` também ficam: são a saída de scripts de linha de
  comando, não depuração.

```bash
# da raiz do repo: so pode sobrar index.ts, seed.ts e resetDb.ts no server, e nada no client
grep -rn "console.log" server/src client/src
grep -rn "TODO\|FIXME\|XXX" server/src client/src
```

- [ ] **Arquivos mortos do template do Vite** (nenhum é importado: o
  `main.tsx` não importa CSS, e o `theme.ts` + `CssBaseline` substituíram o
  `index.css` na S3):

```bash
git rm client/src/App.css client/src/index.css
git rm -r client/src/assets
git rm client/public/icons.svg client/README.md
git rm server/scripts/test-gemini.ts   # hello world da S1; o modo real do Passo 7 cobre
```

- [ ] `client/index.html`: idioma e título do app, e o favicon deixa de ser o
  raio do Vite.

```html
<html lang="pt-BR">
  ...
  <title>HyperTrack</title>
```

`client/public/favicon.svg` (substituir pelo mesmo quadrado verde da sidebar):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2F8A73"/>
      <stop offset="1" stop-color="#1E6F5C"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="10" fill="url(#g)"/>
</svg>
```

- [ ] **O outro aviso do `oxlint`:** o `DiagnosticContent.tsx` exporta o
  componente **e** a função `corDoScore`. Mover a função para
  `client/src/components/corDoScore.ts` (novo):

```ts
//faixa de cor e so apresentacao: o score ja chegou pronto do backend (D13).
//usada no circulo do diagnostico e no ponto do dia no calendario do historico
export function corDoScore(score: number): 'success' | 'warning' | 'error' {
  if (score >= 70) return 'success';
  if (score >= 40) return 'warning';
  return 'error';
}
```

  E importar no `DiagnosticContent.tsx` (`import { corDoScore } from
  './corDoScore'`) e no `HistoryView.tsx` (`import { corDoScore } from
  '../components/corDoScore'`).

- [ ] `npx oxlint` no `client`: **0 avisos**.
- [ ] **`README.md` da raiz** está parado na S1. Ele diz "diagnóstico
  **semanal**" (contra a D2/D15), "Status: Semana 1" e `muscle_groups`, e não
  cita `db:reset` nem `test`. Trocar o trecho de descrição e acrescentar o
  que falta:

```md
Sistema web para acompanhamento de treino de hipertrofia, com diagnóstico
**por sessão de treino** gerado por IA (Google Gemini) e score calculado no
backend. Projeto de TCC II.
```

```md
Criar o banco (schema + seed de grupamentos e exercícios, **apaga tudo** antes):

    npm run db:reset

Rodar os testes (unidade + integração, com `GEMINI_MOCK=true`):

    npm run test
```

```md
### Modos da IA (`GEMINI_MOCK` no `server/.env`)

| Valor | Comportamento |
|---|---|
| `true` | mock determinístico (dev e testes) |
| `falha` | simula a API fora do ar (RNF06) |
| `invalido` | simula resposta fora do JSON (RNF05) |
| `false` | Gemini de verdade (precisa de `GEMINI_API_KEY`) |

### Testar no celular

1. `client/.env.local` com `VITE_API_URL=http://<IP do PC>:3000`
2. `npm run dev -- --host` no `client/`
3. No celular (mesma rede Wi-Fi): `http://<IP do PC>:5173`
```

```md
## Status atual

🏁 **DEV PRONTO — tag `v1.0-dev`** (S9, 04/10/2026): RF01–RF07 implementados,
suíte de unidade + integração verde. Próximo: validação (heurística de Nielsen e
conteúdo da IA) até o code freeze de 19/10.
```

  E na tabela "Scripts úteis", trocar `muscle_groups` + `exercises` por
  `GrupamentoMuscular` + `Exercicio` e acrescentar `npm run db:reset` e `npm
  run test`. Sai a linha `scripts/` da "Estrutura", porque a pasta deixa de
  existir.

### Passo 17 — Testar no celular de verdade (RNF01)

- [ ] O DevTools estreito **não** mostra teclado, toque nem barra de gesto. A
  RNF01 fala em uso **durante o treino**, e a Fig. 2 vai ser tirada no aparelho
  (seção 5 do `PLANEJAMENTO.md`). Então o teste é no celular.
  1. `ipconfig` no Windows → o **IPv4** da placa Wi-Fi (ex.: `192.168.0.15`).
  2. `client/.env.local` com `VITE_API_URL=http://192.168.0.15:3000`.
  3. `npm run dev -- --host` no `client` (reinicie se já estava rodando: o
     Vite só lê o `.env` no start). Ele mostra a linha `Network:
     http://192.168.0.15:5173`.
  4. O `server` não muda: o `app.listen(port)` já escuta todas as interfaces,
     e o `cors()` aceita qualquer origem.
  5. Na primeira vez, o Firewall do Windows pergunta sobre o `node`: liberar em
     **rede privada**. Se não perguntar e o celular não carregar, é ele.
  6. No celular, na **mesma Wi-Fi**: `http://192.168.0.15:5173`.
- [ ] Roteiro no aparelho, tela por tela:
  - **Rotas (D19):** no meio do Treino de hoje, troque para outro app por um
    minuto e volte. Se o navegador recarregar a aba, ela volta em `/treino`,
    com as séries. O gesto/botão "voltar" do Android volta para a tela
    anterior e não fecha o app.
  - **Barra inferior:** os 5 ícones + sair, o ativo destacado. Nenhum conteúdo
    escondido atrás dela: o botão "Finalizar e avaliar treino", no fim do
    Treino de hoje, aparece inteiro acima da barra.
  - **Minha divisão:** o diálogo de exercícios abre, a busca funciona e a lista
    rola. Se apertar demais, `fullScreen` no `Dialog` em telas `xs` (buffer de
    bugs).
  - **Treino de hoje:** o teclado **numérico** abre em carga, reps e RIR/RPE, e
    a carga `82,5` grava como 82.5 kg. O toggle RIR/RPE cabe numa linha. Com
    um treino aberto de ontem (o `UPDATE` do Passo 15.1), o aviso cabe na
    largura, com "Retomar treino" e "Finalizar" lado a lado.
  - **Volume da semana:** as barras e o limiar de 10 visíveis, sem rolagem
    horizontal.
  - **Diagnóstico:** o círculo do score e o texto da IA numa coluna.
  - **Histórico:** o gráfico de Cargas encolhe e o tooltip abre no toque, o
    calendário cabe nas 7 colunas, e as tabelas do detalhe não estouram a
    largura.
- [ ] Qualquer coisa que quebrar aqui é o **buffer de bugs** da Sessão B: anote,
  corrija e repita só a tela afetada.

### Passo 18 — Documentação: `PLANEJAMENTO.md`, `INSTRUCOES.md`, `TASKS.md`

- [ ] `PLANEJAMENTO.md`, seção 2: registrar **D19, D20, D21 e D22** (texto das
  decisões acima, versão curta, como as D16–D18), já com a data de confirmação.
  Na **D7**, acrescentar *"Encerrada pela D19 (01/10): as telas ganham URL com
  `react-router`"*. Na **D6**, *"Implementada na S9 (Passo 14 do
  `SEMANA9.md`)"*. Se o Passo 13 tiver sido cortado, a D19 é registrada como
  "navegação por estado definitiva", com o motivo do corte.
- [ ] `INSTRUCOES.md`, seção do Postman: título da tabela para **"Sequência
  atual da coleção (86 requisições, S9)"**, nova linha no fim e o próximo
  número:

```md
| 25.1–25.8 | rota inexistente, JSON malformado, série em treino finalizado, começar treino novo, exercício inexistente, finalizar, semana vazia, detalhe sem divisão | hardening S9 (D20/D21, RNF02) |
```

  E no fim: *"Requisição de semana nova entra no fim (próximo número: `26`)"*.

- [ ] `TASKS.md`, seção S9: acrescentar, logo abaixo do título, como nas S5–S7:

```md
> Roteiro da semana: [`SEMANA9.md`](./SEMANA9.md).
> Decisões novas: **D19** (cada tela ganha URL, `react-router`), **D20** (série
> só em treino aberto), **D21** (tirar dia da semana não apaga histórico) e
> **D22** (treino aberto de ontem: retoma ou finaliza; o mais antigo fecha
> sozinho) — ver [`PLANEJAMENTO.md`](./PLANEJAMENTO.md).
```

---

## Passo 19 — Fechar a semana (🏁 DEV PRONTO)

1. [ ] `npm run test` no `server` verde na suíte inteira: **76/76** (62 da S8
   + 7 do Passo 9 + 7 do Passo 10), com `GEMINI_MOCK=true`.
2. [ ] `npm run build` nos **dois** lados sem erro de tipo, e `npx oxlint` no
   `client` com **0 avisos**. O aviso de chunk > 500 kB do `vite build` é
   esperado (ver "Escopo").
3. [ ] **Run collection** no Postman: **86/86**, todos os `pm.test` verdes, mais as
   conferências fora da coleção do Passo 11.
4. [ ] **RNF06 pela tela**, agora sem precisar estragar a chave: `GEMINI_MOCK=falha`
   no `server/.env` → **reiniciar o server** → registrar 2 séries →
   "Finalizar e avaliar treino" → "Treino salvo, mas a avaliação falhou…" →
   Histórico → Sessões → hoje: a sessão está lá, com as séries e sem avaliação.
   Voltar para `GEMINI_MOCK=true`, reiniciar e usar "Avaliar treino" no detalhe.
5. [ ] Passo 17 feito no celular, sem pendência aberta no buffer de bugs.
6. [ ] **Gravar a demo ponta a ponta** (critério que veio da S8): `Win + Alt + R`
   ou OBS, com `GEMINI_MOCK=false` e a chave real. Roteiro: login → Minha
   divisão → Treino de hoje (3–4 séries) → Volume da semana → "Finalizar e
   avaliar treino" → Diagnóstico → Histórico (Cargas com o tooltip, Volume, e
   Sessões: calendário → dia → treino → registros + avaliação).
7. [ ] **Prints provisórios das Fig. 4 e 5** (card [📸 Tirar print da tela de
   Diagnóstico e Histórico](https://trello.com/c/8ciFP1Px)): montar um treino
   completo, com exercícios e cargas plausíveis (regras da seção 5 do
   `PLANEJAMENTO.md`), e capturar a Fig. 4 (Diagnóstico da Sessão) e a Fig. 5
   (Histórico: progressão de carga + calendário + detalhe da sessão com o
   diagnóstico), para garantir que as telas fecham o critério. Salvar em
   `02-prints/`. As versões finais saem depois do code freeze.
8. [ ] Commits. Sugestão: um para os erros em JSON + FK (Passos 2–3), **um por
   decisão** (D20, D21, D22 backend: fica fácil de reverter uma se o orientador
   discordar), um para o RNF05/modos da IA (Passos 7–8), um para os testes
   (Passos 9–10), um para as rotas (Passo 13, para dar para reverter sozinho),
   um para o resto do front (Passos 12, 14 e 15), um para a limpeza (Passo 16)
   e um para a documentação (Passo 18 e este roteiro).
9. [ ] **Tag `v1.0-dev`**, só depois dos itens 1–3 verdes e do `git status`
   limpo:

```bash
git tag -a v1.0-dev -m "DEV PRONTO: RF01-RF07, suite de unidade + integracao verde (76/76)"
git push origin main
git push origin v1.0-dev   # o git push sozinho nao envia tag
```

10. [ ] Marcar os cards da S9 no Trello (`/trello-sync`), incluindo os critérios
    de aceite do entregável.

---

## Ordem sugerida pra essa semana

Faltam 4 dias para o domingo (04/10), e o DEV PRONTO vence em 06/10: são **dois
dias de folga, não uma semana**.

1. **Parte 1 (Passos 0–1):** 15 minutos. Testes, build, `/trello-sync`.
2. **Sessão A (qui/sex):** escrever **primeiro** os testes do Passo 9 e ver os de
   D20/D21/D22 vermelhos. Depois os Passos 2 → 8, rodando a suíte a cada passo.
   Depois o `integration.test.ts` (Passo 10) e o Postman (Passo 11). O backend
   fecha antes do front, porque o front depende dos erros em JSON do Passo 2.
3. **Sessão B (sáb):** Passos 12 → 16 no DevTools. As rotas (Passo 13) vêm
   **antes** da barra inferior (Passo 14), porque o código da `Sidebar` do Passo
   14 já usa `useNavigate`. Depois, o celular (Passo 17): é ele que alimenta o
   buffer de bugs, então deixe tempo depois dele.
4. **Dom (04/10):** documentação (Passo 18) e Passo 19. A demo e os prints com a
   chave real são as últimas coisas antes da tag.

> **Se o tempo apertar**, a ordem de corte é: (1) as rotas do Passo 13 (a
> navegação por estado de hoje funciona; o Passo 13 explica a troca na
> `Sidebar`); (2) a separação do `useAuth.ts` (o aviso do `oxlint` é só de fast
> refresh em dev); (3) o 401 global do Passo 12 (o JWT dura 7 dias, e a
> validação cabe numa semana); (4) o favicon e o README. **Não** cortar: os
> testes de integração (são o critério de aceite e a Tabela VI do TCC), a D21
> (é 500 de verdade, em uso normal), a D20 e a D22 (confirmadas; sem a D22, o
> treino que vira o dia some da tela e do histórico), a barra
> inferior e o teclado (sem eles a RNF01 e a Fig. 2 não se sustentam), nem a
> tag.

## Armadilhas comuns desta semana

- **`process.env.GEMINI_MOCK = undefined` para "restaurar".** O `process.env`
  só guarda texto: vira a **string** `"undefined"`, o `modoGemini()` cai no
  `default` e os testes seguintes chamam o Gemini de verdade. É o `delete` do
  `comModoGemini`.
- **Trocar o `GEMINI_MOCK` no `.env` sem reiniciar o server.** O `tsx watch` só
  reinicia quando muda arquivo importado; o `.env` é lido uma vez, pelo
  `dotenv`, no start.
- **`app.use(rotaNaoEncontrada)` antes das rotas.** Toda requisição vira 404. As
  duas peças do Passo 2 são as **últimas** do `app.ts`.
- **Middleware de erro com 3 parâmetros.** O Express reconhece o tratador de
  erro **pela quantidade de parâmetros**. Sem o `next` na assinatura, ele vira
  middleware comum e nunca recebe o erro.
- **Editar o `schema.sql` e achar que o banco mudou.** Sem o `ALTER` do Passo 5,
  o teste da D21 continua vermelho, e parece que o `SET NULL` "não funciona".
- **`npm run db:reset` pra aplicar a D21.** Funciona, mas apaga o usuário e os
  treinos de verdade que você já tem. O `ALTER` muda só a constraint.
- **Calcular a duração do treino que virou o dia com `NOW() - data`.** Dá
  1.440 minutos ou mais e entra no histórico como se fosse verdade. Duração
  desconhecida é `NULL` (D22): é o `CASE` do `finalizarTreino`.
- **Passar `true` no `fecharTreinosEsquecidos` do `treinoDeHoje`.** Aí o de
  ontem fecha junto com os mais antigos, e o aviso "Retomar treino" nunca
  aparece. O `true` é só do `comecarTreino`.
- **Retomar com os exercícios de hoje.** Se ontem foi peito e hoje é costas, o
  formulário retomado tem que mostrar peito. Por isso o `pendente` vem com a
  divisão e os exercícios dele, e a tela usa o `emFoco` em vez do
  `hoje.exercicios`. Um `hoje.` que sobrar no JSX do formulário mistura os
  dois treinos.
- **Conferir o "é de ontem" no JavaScript.** `new Date(treino.data)` comparado
  com `new Date()` usa o fuso do Node (ou do celular), e o
  `buscarTreinoAberto` usa o `CURRENT_DATE` do Postgres. Perto da meia-noite
  os dois discordam. A regra fica no SQL.
- **Esquecer o `replace` no `<Navigate>`.** Sem ele, o "voltar" de quem abriu
  `/` cai de novo em `/`, que redireciona de novo para `/divisao`, e o botão
  parece travado.
- **`useNavigate` fora do `BrowserRouter`.** O React acusa erro na hora (*"useNavigate()
  may be used only in the context of a <Router>"*). O `BrowserRouter` fica no
  `main.tsx`, por fora de tudo.
- **Importar de `react-router-dom`.** Na v7 o pacote é `react-router`. O `-dom`
  ainda existe só como reexportação, e misturar os dois pode carregar duas
  cópias do roteador.
- **Pôr o guard da D20 antes do 404.** O treino de outro usuário passaria a
  responder 409 e revelaria que o id existe. A ordem é: 404 → 409 → validação.
- **`deepEqual` com o `pi` exato.** `(8-6)/3*100` é `66.66666666666666`, e
  `200/3` é `66.66666666666667`: a conta "certa" de cabeça erra na última
  casa. O teste usa tolerância no `pi` e compara o `score_geral` inteiro.
- **E-mail fixo no teste de integração.** A segunda execução falha no cadastro
  (e-mail duplicado). É o `Date.now()` + `Math.random()`.
- **`inputMode` direto no `TextField`.** Compila, porque o tipo aceita, mas o
  atributo cai na `div` de fora. No MUI v7 é `slotProps.htmlInput`.
- **`Number('82,5')`.** É `NaN`, e o `JSON.stringify` transforma `NaN` em
  `null`: o backend responde "carga precisa ser um número" para uma carga que a
  pessoa digitou certo.
- **`useMediaQuery` sem `noSsr`.** O primeiro render sai como desktop, e a
  lateral pisca no celular.
- **Hook depois do `return` condicional na `Sidebar`.** Se o `useState` do
  hover ficar depois do `if (celular) return …`, o React quebra ao girar o
  aparelho ou redimensionar a janela. É por isso que são dois componentes.
- **Esquecer o `pb` da `AppShell`.** A barra inferior cobre o último botão de
  cada tela, justamente o "Finalizar e avaliar treino".
- **`client/.env` em vez de `client/.env.local`.** O `.gitignore` do client
  ignora `*.local`, não `.env`, e o IP da sua rede iria para o GitHub.
- **Esquecer de reiniciar o Vite depois de criar o `.env.local`.** O
  `import.meta.env` é resolvido no start, e o celular continua chamando
  `localhost`.
- **Testar o celular com o PC na rede "Pública" do Windows.** O firewall
  bloqueia as portas 3000 e 5173 sem avisar. Rede privada.
- **Tirar o `console.error` dos `catch` "porque o critério diz sem console".**
  O critério é sobre log de depuração. Sem o `console.error`, um 500 não deixa
  rastro nenhum.
- **`git tag` sem `-a`.** Tag leve não guarda autor, data nem mensagem. E o
  `git push` sozinho **não envia tag**: é o `git push origin v1.0-dev`.
- **Criar a tag antes da suíte verde.** A tag é a foto do DEV PRONTO; mover uma
  tag já enviada exige `push --force` da tag.
- **Gravar a demo ou os prints com `GEMINI_MOCK=true`.** O texto "Mock: 8 reps a
  RPE 9" não prova o RF05. Chave real (`GEMINI_MOCK=false`).
