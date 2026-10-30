# Avaliação heurística de Nielsen (Frente 2)

Inspeção de usabilidade do HyperTrack, feita pelo autor, e seus resultados por tela.

- **Requisitos cobertos:** RF03 (registro de séries), RF05 (diagnóstico), RF07 (histórico) e RNF01 (uso no celular).
- **Critério de aceite:** nenhum problema de severidade 3 ou 4 sem correção ao final.
- **Ambiente:** navegador de desktop e modo de dispositivo móvel do DevTools (iPhone 12, 390 px), com `GEMINI_MOCK=false`.
- **Dados:** `joao@teste.com` (5 semanas de treino, com diagnósticos) e `joao2@teste.com` (sem dados, para as telas vazias). Senha dos dois: `www.com.brj`.
- **Texto do artigo:** `escrita/textos_tcc2.md`, seção VI.B.

---

## Como foi avaliado

1. **1ª passada (livre), por tarefas**, nos dois dispositivos:
   - **T1:** registrar uma sessão em Treino de Hoje, errando de propósito (RIR 7, carga com vírgula, carga absurda), editar e apagar uma série e finalizar.
   - **T2:** ver o diagnóstico, inclusive com falha forçada da API do Gemini.
   - **T3:** percorrer o Histórico, abrir uma sessão antiga e ver o histórico vazio.
2. **2ª passada, tela por tela**, respondendo às 10 heurísticas em cada tela (roteiro abaixo).
3. **Cada achado** foi registrado com quatro informações: **tela**, **problema**, **heurística violada** e **severidade**. O mesmo problema em duas telas conta como um achado só.

### As 10 heurísticas de Nielsen

| # | Heurística | O que significa neste sistema |
|---|---|---|
| 1 | Visibilidade do estado do sistema | O usuário sabe o que está acontecendo: se a série foi salva, se o diagnóstico está sendo gerado. |
| 2 | Correspondência com o mundo real | Os termos são os de academia (série, carga, RIR, RPE), não de programador. |
| 3 | Controle e liberdade do usuário | Dá para desfazer, corrigir ou voltar sem perder o que foi feito. |
| 4 | Consistência e padrões | Botões, rótulos e títulos seguem o mesmo padrão em todas as telas. |
| 5 | Prevenção de erros | A tela impede o erro antes que ele aconteça (valores fora da faixa, exclusão sem confirmação). |
| 6 | Reconhecer em vez de lembrar | A informação está na tela; o usuário não precisa decorar. |
| 7 | Flexibilidade e eficiência de uso | As ações frequentes, como registrar uma série, levam poucos toques. |
| 8 | Estética e design minimalista | A tela mostra só o necessário. |
| 9 | Ajudar a reconhecer, diagnosticar e corrigir erros | As mensagens de erro são claras, aparecem perto do problema e dizem o que fazer. |
| 10 | Ajuda e documentação | As telas vazias e os pontos de dúvida explicam o próximo passo. |

### Escala de severidade (0 a 4)

| Nota | Significado | Exemplo neste sistema |
|---|---|---|
| 0 | Não é problema | — |
| 1 | Cosmético: corrigir só se sobrar tempo | texto de tela vazia que não orienta |
| 2 | Menor: corrigir com baixa prioridade | ação sem confirmação visual |
| 3 | Maior: importante corrigir | apagar uma série sem confirmação |
| 4 | Catástrofe: corrigir antes de liberar | botão de finalizar inacessível no celular |

A nota considera a **frequência** (acontece sempre ou raramente), o **impacto** (o usuário perde dados ou só se incomoda) e a **persistência** (dá para contornar facilmente).

---

## Resumo dos resultados

**8 achados:** 1 de severidade 1, 6 de severidade 2, 1 de severidade 3 e nenhum de severidade 4.

| ID | Tela | Heurística | Problema | Sev. | Situação |
|---|---|---|---|---|---|
| A1 | Treino de Hoje | 5. Prevenção de erros | A lixeira apaga a série na hora, sem confirmação nem desfazer. | 3 | **a corrigir (obrigatório)** |
| A2 | Minha Divisão | 1. Visibilidade | "Salvar semana" não mostra confirmação; o usuário não sabe se salvou e tende a clicar de novo. | 2 | registrado |
| A3 | Minha Divisão | 3. Controle e liberdade | No diálogo de exercícios, clicar em Cancelar ou fora descarta as mudanças sem avisar. | 2 | registrado |
| A4 | Treino de Hoje | 9. Corrigir erros | Erro de RIR inválido aparece no topo do card, fora da tela no celular, e o campo não fica destacado. | 2 | registrado |
| A5 | Treino de Hoje | 5. Prevenção de erros | Carga absurda (ex.: 999 kg) é aceita e distorce os gráficos de carga e evolução. | 2 | registrado |
| A6 | Treino de Hoje | 3. Controle e liberdade | Não dá para editar uma série; apagar e registrar de novo joga a série para o fim da lista. | 2 | registrado |
| A7 | Navegação (celular) | 6. Reconhecer em vez de lembrar | A barra inferior só tem ícones, sem texto; o usuário precisa decorar a função de cada um. | 2 | registrado |
| A8 | Histórico (Cargas e Volume) | 10. Ajuda e documentação | Sem dados, as abas não dizem o que fazer para ter registros. | 1 | registrado |

- **Tela com mais problemas:** Treino de Hoje (4 achados).
- **Só no celular:** A4 (o erro sai da tela) e A7 (barra só com ícones).
- **Critério do RNF01:** atendido depois da correção do A1.
- **Ponto positivo:** a tela Diagnóstico vazia orienta o usuário ("Nenhum diagnóstico ainda. Em Treino de hoje, toque em Finalizar e avaliar treino…"), o que atende à heurística 10.

---

## Resultados por tela

### 1. Login/Cadastro
- **O que tem:** e-mail, senha, botão Entrar, link "Não tem conta? Criar uma" (o cadastro acrescenta o campo Nome).
- **Conferido:** mensagem de senha errada e de e-mail já cadastrado (H9); botão "Enviando..." durante a espera (H1).
- **Resultado:** sem achados. A mensagem genérica "Credenciais inválidas" é proposital, por segurança.

### 2. Minha Divisão
- **O que tem:** um campo por dia, ícone de descanso, botão "Exercícios" por dia, "Salvar semana" e o diálogo de exercícios (busca, filtro por grupamento, adicionar, subir/descer, remover, "Salvar exercícios").
- **Conferido:** ícone de descanso sem texto (H6/H2); descarte das mudanças no diálogo (H3/H5); confirmação ao salvar (H1); tela vazia com `joao2` (H10).
- **Resultado:**
  - **A3** (sev. 2, H3): o diálogo de exercícios descarta as mudanças sem avisar.
  - **A2** (sev. 2, H1): "Salvar semana" não mostra confirmação.
  - Ícone de descanso: não é achado; o ícone já deixa claro o que faz.

### 3. Treino de Hoje (inclui a T1)
- **O que tem:** "Começar treino", seletor RIR/RPE (vale para a sessão toda), um bloco por exercício (Tipo, Carga (kg), Reps, RIR ou RPE, "Registrar série"), a lista de séries com lixeira e "Finalizar e avaliar treino", que pede um segundo toque para confirmar.
- **Conferido:** registro de aquecimento, *feeder* e séries válidas; escolha entre RIR e RPE; erros de propósito; edição e exclusão de série; finalização.
- **Resultado:**
  - **A1** (sev. 3, H5): a lixeira apaga a série na hora, sem confirmação nem desfazer.
  - **A4** (sev. 2, H9): o erro de RIR 7 aparece no topo do card, longe do campo.
  - **A5** (sev. 2, H5): carga absurda é aceita e gravada.
  - **A6** (sev. 2, H3): não há edição de série.
  - Carga com vírgula (22,5): não é achado; o sistema converte de propósito, como o praticante está acostumado a digitar.
  - A mensagem de "dia de descanso" está adequada. A finalização funciona.

### 4. Volume da Semana
- **O que tem:** uma barra por grupamento, um chip "N / 10 séries" e o texto "Faltam N séries para o limiar".
- **Conferido:** termos "limiar" e "séries válidas" (H2); tela vazia (H10); acesso às semanas anteriores (H6).
- **Resultado:** sem achados. O público é de praticantes experientes, que conhecem os termos, e as semanas anteriores estão no Histórico → Volume.

### 5. Diagnóstico (inclui a T2)
- **O que tem:** score de 0 a 100 no círculo, chips de Pv e Pi, análise por grupamento e por exercício e recomendações.
- **Conferido:** indicação de espera; compreensão de Pv, Pi e da cor do score (H2); título da tela (H4); tela vazia (H10); falha forçada da API.
- **Resultado:** sem achados.
  - Durante a geração, a tela mostra que está carregando.
  - Pv e Pi estão descritos na tela, e a data da sessão está visível.
  - Com a API falhando, aparece a mensagem de erro, o botão "Tentar avaliar de novo" funciona e as séries continuam salvas.
  - **Ponto positivo (H10):** a tela vazia orienta o usuário a finalizar e avaliar um treino.

### 6. Histórico – Cargas (inclui a T3)
- **O que tem:** um seletor de exercício e o gráfico da maior carga válida por sessão. O *tooltip* mostra reps, séries e tonelagem.
- **Conferido:** *tooltip* no celular (H6); termo "tonelagem" (H2); tela vazia (H10).
- **Resultado:**
  - **A8** (sev. 1, H10): sem dados, a mensagem não diz o que fazer para ter registros.
  - No celular, o *tooltip* abre ao segurar o toque no ponto. Os números de reps e carga deixam claro o que é cada valor.

### 7. Histórico – Volume
- **O que tem:** uma linha por semana com chips "Grupamento N/10" (verde quando atingiu o limiar).
- **Conferido:** tela vazia (H10); legibilidade no celular com 8 semanas e 7 grupamentos (H8).
- **Resultado:**
  - **A8** (sev. 1, H10): o mesmo problema da aba Cargas; sem dados, a tela não diz para treinar e registrar séries válidas.
  - A tela inteira fica legível no celular.

### 8. Histórico – Sessões
- **O que tem:** calendário do mês com um ponto colorido nos dias de treino, lista de treinos do dia escolhido e card com score, divisão, hora, séries válidas e duração.
- **Conferido:** dia selecionado ao abrir a aba (H1); "voltar" do detalhe da sessão (H3); sessões antigas pelo calendário (T3).
- **Resultado:** sem achados. Ao abrir a aba, o calendário vai direto para o último dia com treino. O "voltar" retorna ao mês e ao dia que estavam abertos, e a sessão antiga mostra as séries e o diagnóstico corretos.

### 9. Navegação geral
- **O que olhar:** a sidebar no desktop e a barra de ícones no celular.
- **Conferido:** barra só com ícones no celular (H6); nomes do menu e títulos das telas (H4); item ativo destacado (H1).
- **Resultado:**
  - **A7** (sev. 2, H6): a barra do celular só mostra ícones, sem texto.
  - Nomes do menu e títulos: sem achado. O item ativo fica destacado.

---

## Correções

| Severidade | O que fazer |
|---|---|
| 3 e 4 | corrigir sempre (critério de aceite) |
| 2 | corrigir se for rápido |
| 0 e 1 | só registrar |

As correções entram depois do *code freeze* (19/10) como ajustes pequenos ligados aos achados, o que o planejamento permite. Para cada correção: tirar o print do antes e do depois, rodar `npm test` em `server/` e anotar aqui.

- **A1:** pedir confirmação em dois toques na lixeira, como no "Finalizar e avaliar treino".

---

## Limitações

Um único avaliador, que é o próprio autor do sistema, e o celular testado só pelo DevTools. As duas já estão nas Conclusões do artigo.

**Referências:** `nielsen1994enhancing` (heurísticas) e `nielsen1994severity` (escala 0 a 4).
