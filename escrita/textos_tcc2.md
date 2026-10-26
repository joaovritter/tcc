# Textos recomendados para o TCC II

Texto pronto para colar no TCC II (`main.tex` no Prism), **na ordem do artigo**. Cada bloco traz:
- **Semana:** E1 a E4, para casar com as listas do Trello;
- **Status:** ✅ feito, ⏳ a fazer ou ⚠️ com pendência;
- **Onde:** onde mexer no TCC II;
- **Texto:** em LaTeX, com as mesmas chaves do `references.bib`;
- **Por quê:** o motivo da mudança, quando ajuda.

Os trechos entre colchetes, como [N], são lacunas para preencher com números reais.

Atualizado em 26/10/2026. Esta versão segue a ordem do artigo e já traz as decisões tomadas na escrita (E1 e E2). Os cards ✍️ do Trello têm a versão antiga dos textos: **em caso de diferença, vale este arquivo.**

---

## Índice (ordem do artigo)

| # | Seção | Semana | Status |
|---|---|---|---|
| — | Resumo | E3 (por último) | ⏳ |
| I | Introdução e objetivos | E1 | ✅ |
| II | Referencial teórico (II.A a II.E) | E1 | ✅ |
| III | Declaração de uso de IA | E1 | ✅ |
| IV | Metodologia: Abordagem de desenvolvimento | E2 | ✅ (falta só a frase do cronograma, para depois) |
| IV | Metodologia: Requisitos do sistema | E2 | ✅ |
| IV | Metodologia: Procedimentos de validação | E2 | ⏳ falta o [N] |
| V | Solução desenvolvida (7 subseções) | E2 | ⏳ |
| VI | Resultados | E3 | ⏳ |
| VII | Conclusões | E3 | ⏳ |
| — | Referências novas (BibTeX) | E2/E3 | ⏳ |
| — | Lista de busca (Ctrl+F) | E4 | ⏳ |

## Pendências abertas

- [ ] **[N] de cenários** da Frente 3 (validação do conteúdo da IA).
- [ ] **Números do `npm test`** (total de testes e de arquivos), para os Resultados e o Resumo.
- [ ] **Achados da heurística** (quantidade por severidade), para os Resultados.
- [ ] **Prints** tirados depois do code freeze, com `GEMINI_MOCK=false`.
- [ ] **BibTeX novos** no `references.bib`: `nielsen1994severity` e `googleStructuredOutput`.
- [ ] **Frase do cronograma** no fim da Abordagem de Desenvolvimento (deixada para depois).
- [ ] **D13 no `PLANEJAMENTO.md`:** ainda diz "grupamentos da divisão da semana"; o certo é "grupamentos treinados na sessão".
- [ ] **PDF parcial ao orientador** (Introdução até Solução). O prazo era 25/10.

---

## Decisões que valem para o texto todo

- **Ordem das seções:** I Introdução → II Referencial → III Declaração de IA → IV Metodologia → V Solução desenvolvida → VI Resultados → VII Conclusões → Referências.
- **Declaração de IA numerada** (`\section{...}`), entre o Referencial e a Metodologia (19/10).
- **Sem seção própria de problema** (19/10): o problema fica na Introdução (parágrafos 2 a 4), no fim de II.B e no fechamento de II.E.
- **Sem parágrafo de organização** no fim da Introdução (decisão do autor).
- **Diagnóstico por sessão**, e não por semana. O **volume** continua semanal.
- **Score calculado no servidor, antes da IA.** O $P_v$ usa os grupamentos treinados na sessão (15/10).
- **Esforço informado em uma escala só** (RIR ou RPE); a outra é calculada (RPE = 10 − RIR).
- **Três tipos de série:** aquecimento, *feeder* e *work* (válida).
- **Saíram:** Figs. 1, 2 e 6; Tabela I (FDD); Tabela IV (conceitos → lógica). A Fig. 1 pode voltar na E4 se sobrar espaço.
- **Limite:** até 10 páginas.

---

# I · Introdução e objetivos — E1 ✅

Feito no TCC II, com o texto do autor. Nada para colar.

**Conferir na revisão:**
- o último parágrafo ("Buscando diferenciar-se...") fala em sessão e no score;
- os objetivos ficam no infinitivo;
- não há parágrafo de organização no fim.

---

# II · Referencial teórico — E1 ✅

Feito no TCC II, com o texto do autor (II.A Fisiologia, II.B Variáveis de esforço, II.C Engenharia de software, II.D IA e prompts, II.E Correlatos).

**Conferir na revisão:**
- **II.B:** os três tipos de série estão apresentados; não há promessa de *deload*; o último parágrafo diz que o diagnóstico é por sessão.
- **II.C:** o PostgreSQL aparece como onde os dados são persistidos, **não** como a camada de Modelo. Texto de referência para o fim do parágrafo:

```latex
Os dados são persistidos no sistema gerenciador de banco de dados relacional PostgreSQL, que garante a integridade referencial do histórico de treinos \cite{postgresql2026docs, silberschatz2019database}.
```

- **II.E:** o último parágrafo diz qual é a lacuna. É ele que faz o papel da seção do problema.
- **Tamanho:** o Referencial deve ocupar cerca de 1,75 página.

---

# III · Declaração de uso de IA — E1 ✅

Feito no TCC II: seção **numerada**, entre o Referencial e a Metodologia, com o modelo de texto do curso e a finalidade preenchida (planejamento, roteiros de implementação com código, depuração e revisão do código, redação e revisão do texto).

**Conferir na revisão:** se outras ferramentas foram usadas (Claude Code, por exemplo), incluir. O Gemini **não** entra aqui: é parte do sistema.

---

# IV · Metodologia — E2

## IV · Abertura e Abordagem de Desenvolvimento ✅ (cronograma pendente)

Feito no TCC II. Falta só colar a frase do cronograma (último parágrafo abaixo), quando chegar a hora. Versão final:

```latex
\section{Metodologia}

Esta seção descreve os procedimentos adotados no desenvolvimento do sistema, com a abordagem de desenvolvimento, os requisitos e os procedimentos de validação.

\subsection{Abordagem de Desenvolvimento}

O projeto foi conduzido pela metodologia FDD \cite{palmer2001practical}, que atuou como a ponte entre os requisitos da Ciência do Exercício e a arquitetura de \textit{software}, decompondo o domínio do problema em pequenas entregas de valor, controláveis e testáveis \cite{pressman2011engenharia}. Na etapa de modelo geral, a primeira do FDD, o banco de dados foi modelado para registrar as séries válidas por grupamento muscular, base da contagem de volume \cite{schoenfeld2017dose}, e o esforço de cada série em RPE e RIR \cite{zourdos2016novel}. Na etapa de lista de funcionalidades, as funcionalidades foram organizadas no seguinte \textit{backlog}:

\begin{itemize}
    \item Realizar o cadastro e a autenticação do usuário;
    \item Gerenciar a divisão semanal e os exercícios de cada dia;
    \item Executar a sessão de treino, com registro do tipo de cada série (aquecimento, \textit{feeder} ou válida), a carga, as repetições e o esforço, informado em RIR ou RPE;
    \item Calcular o volume semanal de séries válidas por grupamento muscular;
    \item Finalizar a sessão e gerar o diagnóstico via IA;
    \item Visualizar o histórico de cargas, de volume e das sessões, com seus diagnósticos.
\end{itemize}

As etapas de planejamento, projeto e construção por funcionalidade foram executadas em nove ciclos semanais (S1 a S9), de agosto a outubro de 2026. O primeiro ciclo preparou a base do sistema, com a estrutura MVC e o banco de dados. Os ciclos de S2 a S8 entregaram as funcionalidades do \textit{backlog} na ordem de suas dependências: autenticação, divisão semanal e exercícios da rotina, execução do treino, finalização e volume semanal, diagnóstico via Gemini, e telas de diagnóstico e histórico. Funcionalidades maiores, como a divisão semanal, foram divididas em dois ciclos, respeitando o limite de duas semanas do FDD. O último ciclo foi dedicado aos testes de integração e aos ajustes finais.

Em relação ao cronograma da proposta, a implementação foi antecipada: o banco de dados, previsto para setembro e outubro, foi implementado em agosto; a integração com o Gemini, prevista para outubro e novembro, foi concluída em setembro; e a validação, prevista para novembro, ocorreu em outubro.
```

**Decisão do autor:** a lista de ciclos fica com vírgulas.

**Pendente:** o último parágrafo (cronograma), que substitui a Fig. 6.

**Apagado:** a Tabela I (`quadroFDD`) e o parágrafo "Após a definição do backlog...". Conferir se não sobrou `\ref{quadroFDD}`.

**Conferido no Trello:** a ordem e as datas dos ciclos S1–S9 batem com o texto (S3/S4 foram a divisão semanal).

## IV · Requisitos do Sistema ✅

Feito no TCC II. Versão final, para referência:

```latex
\subsection{Requisitos do Sistema}

Os requisitos funcionais (RF), que delimitam as funcionalidades essenciais do sistema, e os não funcionais (RNF), que orientam aspectos de qualidade e restrições técnicas, são apresentados na Tabela~\ref{tab:requisitos}.

\begin{table}[!h]
\centering
\caption{Requisitos funcionais e não funcionais do sistema}
\label{tab:requisitos}
\scriptsize
\renewcommand{\arraystretch}{1.15}
\begin{tabular}{|p{0.13\columnwidth}|p{0.77\columnwidth}|}
\hline
\textbf{ID} & \textbf{Descrição} \\ \hline
RF01 & Permitir cadastro e autenticação do usuário. \\ \hline
RF02 & Permitir a criação e o gerenciamento da divisão semanal de treinos e exercícios. \\ \hline
RF03 & Registrar séries executadas com tipo (aquecimento, \textit{feeder} ou válida), carga, repetições e esforço em RPE ou RIR. \\ \hline
RF04 & Calcular automaticamente o volume semanal (segunda a domingo) de séries válidas por grupamento muscular. \\ \hline
RF05 & Ao finalizar a sessão, enviar à API Gemini as séries válidas da sessão, com o volume semanal como contexto, para gerar o diagnóstico. \\ \hline
RF06 & Persistir os diagnósticos gerados pela IA, vinculados à sessão avaliada e com \textit{score} geral. \\ \hline
RF07 & Exibir o histórico de cargas registradas, volume das últimas semanas e as sessões finalizadas com seus diagnósticos. \\ \hline
RNF01 & A interface deve ser responsiva e adequada ao uso em celulares durante o treino. \\ \hline
RNF02 & O sistema deve garantir integridade referencial no PostgreSQL. \\ \hline
RNF03 & O servidor deve centralizar os cálculos de volume, \textit{score}, RPE e RIR. \\ \hline
RNF04 & A comunicação com a API Gemini deve utilizar um \textit{template} de \textit{prompt} estruturado. \\ \hline
RNF05 & O retorno da IA deve seguir o formato JSON estruturado definido por esquema. \\ \hline
RNF06 & O sistema deve preservar os registros de treino em caso de falha na API externa. \\ \hline
\end{tabular}
{\footnotesize Fonte: elaborado pelo autor.}
\end{table}
```

**Conferir:**
- não sobrou `\ref{tab:requisitos-funcionais}` nem `\ref{tab:requisitos-nao-funcionais}`;
- a Tabela IV (`tab:operacionalizacao`) foi apagada e não sobrou `\ref{tab:operacionalizacao}`;
- as Figs. 1 e 2 (`figCasoUso`, `figDominio`) saíram, junto com os parágrafos que as apresentavam.

## IV · Procedimentos de Validação ⏳

**Onde:** `\subsection{Procedimentos de Validação}`. Substitui os três parágrafos antigos, que estão no futuro ("verificarão", "será conduzida") e dizem que a Frente 1 "cobrirá RNF02, RNF03 e RNF06", o que contradiz a tabela de resultados.

```latex
\subsection{Procedimentos de Validação}

A validação foi organizada em três frentes \cite{pressman2011engenharia}. A primeira consistiu em testes automatizados, executados contra um banco de dados de teste recriado a cada execução. Testes de unidade verificaram as funções de cálculo do \textit{score} e a validação da resposta da IA. Testes das rotas da API verificaram o cálculo do volume semanal, comparando-o com a contagem manual de cenários conhecidos (RF04), e as regras de cada funcionalidade. Testes de integração percorreram o fluxo completo, do cadastro à gravação e leitura do diagnóstico (RF05 a RF07), além da rejeição de registros órfãos pelo banco (RNF02) e da preservação dos registros quando a API falha (RNF06). Para que esses testes fossem determinísticos, a chamada ao Gemini pôde ser substituída por uma simulação, inclusive de falha.

A segunda frente foi uma inspeção de usabilidade baseada nas heurísticas de Nielsen \cite{nielsen1994enhancing}, realizada pelo autor nos fluxos de registro de séries (RF03) e de visualização do diagnóstico e do histórico (RF05 e RF07), no navegador de \textit{desktop} e no modo de dispositivo móvel das ferramentas de desenvolvedor do navegador (RNF01). Cada problema encontrado recebeu uma severidade de 0 a 4 \cite{nielsen1994severity}, e o critério de aceitação foi a ausência de problemas de severidade 3 ou 4 ao final das correções.

A terceira frente validou o conteúdo dos diagnósticos (RNF04). Foram montados [N] cenários de sessão com volume e esforço conhecidos, combinando grupamentos abaixo, no limiar e acima do limiar de 10 séries com séries de maior e menor intensidade. Cada diagnóstico gerado pela API real foi avaliado quanto à coerência com a literatura \cite{schoenfeld2017dose, zourdos2016novel, helms2016application}, à fidelidade aos dados enviados, à permanência no domínio do treinamento de força e à integridade do formato JSON.
```

**Pendências:**
- **[N]:** número de cenários da Frente 3 (planejado: no mínimo 5);
- **`nielsen1994severity`** no `references.bib` (BibTeX no fim deste arquivo);
- se a Frente 2 ou a 3 não aconteceu como descrito, ajustar o texto ao que foi feito de verdade.

**Como os testes estão no repositório** (conferir com `npm test`):
- 67 casos em 8 arquivos (`server/src/__tests__`);
- a maioria testa as rotas da API com supertest, contra um banco de teste;
- 3 são de unidade pura: `calcularPi`, `calcularPv` e `interpretarResposta` (`diagnostic.test.ts`);
- `integration.test.ts` tem o fluxo completo, o teste de integridade e a falha simulada.

---

# V · Solução desenvolvida — E2 ⏳

Seção nova, logo depois da Metodologia. Cerca de 2,25 páginas. Sete subseções, nesta ordem.

## V.A · Tecnologias e Arquitetura (Fig. 3)

**Onde:** abre a seção. Recebe o parágrafo da arquitetura que estava antes da Fig. 3 na Metodologia do TCC I.

**Hoje diz:** "...e o PostgreSQL representa a camada de modelo, responsável pela persistência dos dados."

```latex
\section{Solução Desenvolvida}
\label{sec:solucao}

\subsection{Tecnologias e Arquitetura}

O sistema foi implementado como uma aplicação web com \textit{frontend} e \textit{backend} separados, ambos escritos em TypeScript. O \textit{frontend} usa React com Vite, a biblioteca de componentes Material UI, react-router para a navegação entre telas e recharts para os gráficos. O \textit{backend} usa Node.js com Express 5, acesso ao PostgreSQL por consultas SQL parametrizadas, autenticação por \textit{token} JWT, com senhas armazenadas com \textit{hash} bcrypt, e o SDK oficial \texttt{@google/genai} para acessar o modelo \texttt{gemini-3.1-flash-lite}. Os testes automatizados usam o executor nativo do Node.js (\texttt{node:test}) com a biblioteca supertest.

A arquitetura seguiu o padrão MVC \cite{freeman2018pro}, com uma diferença em relação à proposta: o Modelo não é o PostgreSQL em si, mas a camada de \textit{models} do \textit{backend}, onde ficam as consultas SQL. O \textit{backend} foi organizado em rotas, \textit{controllers}, \textit{models} e uma camada de serviços, que concentra as regras de domínio: o cálculo do volume semanal, o cálculo do \textit{score} e a comunicação com o Gemini (Fig.~\ref{figComponentes}). Essa separação permitiu testar os cálculos de forma isolada e substituir a chamada real à IA por uma simulação durante os testes.
```

**Para redesenhar a Fig. 3 (componentes):**
- **Visão:** React (Vite + Material UI) → HTTP/JSON →
- **Backend Node.js/Express**, com quatro caixas: Rotas; Controllers; Services (`volumeService`, `scoreService`, `geminiService`); Models (SQL).
- **Fora do backend:** PostgreSQL, ligado aos Models; API Gemini, ligada ao `geminiService`, como serviço externo.

**Por quê:** o TCC I dizia "Modelo = PostgreSQL", e o código não é assim.

## V.B · Fluxo da Sessão e do Diagnóstico (Fig. 4)

**Hoje diz:** "...desde a solicitação do diagnóstico até a persistência e exibição."

```latex
\subsection{Fluxo da Sessão e do Diagnóstico}

O diagnóstico é gerado por sessão de treino finalizada, e não por semana, como previa a proposta. Ao tocar em ``Finalizar e avaliar treino'', a interface faz duas requisições em sequência. A primeira finaliza a sessão: o servidor marca o treino como concluído e calcula sua duração. A segunda solicita o diagnóstico: o servidor confere se o treino pertence ao usuário e se está finalizado, respondendo com erro 409 caso ainda esteja aberto; busca as séries válidas da sessão, respondendo com erro 400 se não houver nenhuma; calcula o volume semanal e o \textit{score}; monta o \textit{prompt}; chama a API Gemini; valida o JSON retornado; e grava o diagnóstico (Fig.~\ref{figSequenciaIA}).

Separar a finalização da avaliação foi a forma encontrada para atender ao RNF06: quando a IA é chamada, a sessão já está salva. Se a API falhar ou devolver uma resposta fora do formato, o servidor responde com erro 502, nenhuma série é alterada e a tela oferece a opção ``Tentar avaliar de novo''. Sessões finalizadas sem diagnóstico também podem ser avaliadas depois, a partir do histórico.
```

**Para redesenhar a Fig. 4 (sequência).** Se faltar espaço, a figura sai e fica só o texto, sem o `(Fig.~\ref{figSequenciaIA})`.
- **Participantes:** Usuário, React, Backend (Controller + Services), PostgreSQL e Gemini.
- **Mensagens, em ordem:**
  1. Finalizar e avaliar →
  2. `POST /sessions/:id/finish` → UPDATE `completed` e duração → 200 →
  3. `POST /sessions/:id/diagnostics/generate` → SELECT do treino (409 se aberto) → SELECT das séries válidas (400 se vazio) → SELECT do volume semanal → calcular Pv, Pi e score → montar o prompt → `generateContent` (Gemini) → validar o JSON → INSERT em `DiagnosticoIA` → 201 → exibir.
- **Bloco `alt`:** falha do Gemini → 502 → "Tentar avaliar de novo".

**Conferido no código:** `diagnosticController.ts` (409, 400, 502 e score calculado antes da chamada).

## V.C · Modelo de Dados (Fig. 5)

**Onde:** substitui o parágrafo do DER do TCC I ("Por fim, a persistência dos dados foi representada...").

```latex
\subsection{Modelo de Dados}

A Fig.~\ref{figDER} apresenta o modelo de dados implementado. Em relação à proposta, foram acrescentadas as entidades \textit{Divisao}, que guarda o nome do treino de cada dia da semana, e \textit{DivisaoExercicio}, que lista em ordem os exercícios desse dia. Os grupamentos musculares de cada dia não são armazenados na divisão, mas obtidos a partir dos exercícios escolhidos, o que evita que a divisão indique um grupamento e os exercícios, outro.

A entidade \textit{Treino} passou a registrar se a sessão foi finalizada e, opcionalmente, a qual dia da divisão ela corresponde; se esse dia for excluído da rotina, os treinos já realizados são mantidos. Em \textit{SerieTreino}, o tipo admite três valores (aquecimento, \textit{feeder} e \textit{work}) e o esforço é gravado em RIR, mesmo quando informado em RPE; o RPE é uma coluna calculada pelo próprio banco (RPE $= 10 -$ RIR), o que impede valores incoerentes entre as duas escalas. Por fim, \textit{DiagnosticoIA} deixou de referenciar uma semana e passou a referenciar o treino avaliado, armazenando também o \textit{score} geral e o conteúdo retornado pela IA em formato JSON. Uma sessão pode ter mais de um diagnóstico, o que preserva o histórico quando uma avaliação é refeita.
```

**Para redesenhar a Fig. 5 (DER), conforme o `schema.sql`:**
- **Usuario** (`id_usuario` PK UUID, `nome`, `email` único, `senha_hash`).
- **GrupamentoMuscular** (`id_grupamento` PK, `nome`).
- **Exercicio** (`id_exercicio` PK, `nome_exercicio`, `fk_grupamento` FK).
- **Divisao** (`id_divisao` PK, `fk_usuario` FK, `dia_semana` 0–6, `nome`). A dupla usuário + dia é única.
- **DivisaoExercicio** (`id_divisao_exercicio` PK, `fk_divisao` FK, `fk_exercicio` FK, `ordem`).
- **Treino** (`id_treino` PK, `fk_usuario` FK, `fk_divisao` FK **opcional, ON DELETE SET NULL**, `completed`, `data`, `duracao_total`).
- **SerieTreino** (`id_serie` PK, `fk_treino` FK, `fk_exercicio` FK, `tipo` ∈ {aquecimento, feeder, work}, `carga`, `repeticoes`, `rir` 0–4, `rpe` **gerada = 10 − rir**).
- **DiagnosticoIA** (`id_diagnostico` PK, `fk_usuario` FK, **`fk_treino` FK**, **`score_geral`**, `data_geracao`, `conteudo_json` JSONB).

| De | Para | Cardinalidade |
|---|---|---|
| Usuario | Divisao, Treino, DiagnosticoIA | 1:N |
| Divisao | DivisaoExercicio | 1:N |
| Exercicio | DivisaoExercicio, SerieTreino | 1:N |
| GrupamentoMuscular | Exercicio | 1:N |
| Divisao | Treino | 0..1:N |
| Treino | SerieTreino | 1:N |
| Treino | DiagnosticoIA | **1:N** |

**O que mudou em relação à Fig. 5 do TCC I:** `DiagnosticoIA` perde `semana_referencia` e ganha `fk_treino` e `score_geral`; `Treino` ganha `completed` e `fk_divisao`; tabelas novas `Divisao` e `DivisaoExercicio`.

## V.D · Integração com a IA Generativa (Tabela do prompt)

**Onde:** a subseção "Integração com Inteligência Artificial Generativa" do TCC I passa para cá. Substitui os dois parágrafos antes da Tabela V e a própria tabela.

**Hoje diz:** "...o contexto **da semana avaliada**..." e "O bloco de dados injetará as métricas consolidadas **da semana**...".

```latex
\subsection{Integração com a IA Generativa}

A comunicação com o Gemini segue o \textit{Template Pattern} \cite{white2023prompt}: o \textit{prompt} não é escrito pelo usuário, mas montado pelo servidor a partir de cinco blocos, apresentados na Tabela~\ref{tab:prompt-estruturado}. O bloco de persona aplica o \textit{Persona Pattern} \cite{white2023prompt}, restringindo o modelo ao papel de especialista em fisiologia do exercício. O bloco de contexto identifica a sessão avaliada e os grupamentos treinados nela. O bloco de dados traz as séries válidas da sessão, com exercício, grupamento, carga, repetições, RPE e RIR, e, como contexto, o volume acumulado na semana por grupamento, indicando se o limiar foi atingido. O bloco de diretrizes científicas fixa os critérios de avaliação do referencial: o limiar de 10 séries semanais \cite{schoenfeld2017dose} e a intensidade ótima em RPE 9, ou 1 RIR \cite{zourdos2016novel, helms2016application}. O bloco de formato exige resposta somente em JSON e proíbe qualquer campo de pontuação.

Além da instrução no \textit{prompt}, a requisição envia ao Gemini um esquema de resposta, recurso de saída estruturada da API \cite{googleStructuredOutput}, com três campos obrigatórios: \texttt{diagnostico\_exercicios}, \texttt{analise\_grupamentos} e \texttt{recomendacoes\_proxima\_sessao}. Ao receber a resposta, o servidor confere a presença dos três campos e descarta qualquer outro; uma resposta fora do formato é tratada como falha e nada é gravado (RNF05).

\begin{table}[!h]
\centering
\caption{Anatomia do prompt estruturado}
\label{tab:prompt-estruturado}
\scriptsize
\renewcommand{\arraystretch}{1.3}
\begin{tabular}{|p{0.18\columnwidth}|p{0.47\columnwidth}|p{0.22\columnwidth}|}
\hline
\textbf{Bloco} & \textbf{Conteúdo injetado} & \textbf{Padrão} \\ \hline
\textit{Persona} & Especialista em fisiologia do exercício e treinamento de força, restrito à análise de dados de treino de hipertrofia. & \textit{Persona Pattern}~\cite{white2023prompt} \\ \hline
Contexto & Data da sessão avaliada e grupamentos treinados nela. & \textit{Template Pattern}~\cite{white2023prompt} \\ \hline
Dados de treino & Séries válidas da sessão (exercício, grupamento, carga, repetições, RPE e RIR) e volume semanal acumulado por grupamento, como contexto. & \textit{Template Pattern}~\cite{white2023prompt} \\ \hline
Diretrizes científicas & Limiar de 10 séries semanais~\cite{schoenfeld2017dose}; RPE 9 (1 RIR) como estímulo otimizado~\cite{zourdos2016novel, helms2016application}. & \textit{Template Pattern}~\cite{white2023prompt} \\ \hline
Formato de saída & Somente JSON com três campos obrigatórios e sem campo de pontuação, reforçado por esquema de resposta. & \textit{Template Pattern}~\cite{white2023prompt} \\ \hline
\end{tabular}
{\footnotesize Fonte: elaborado pelo autor.}
\end{table}
```

**Referência nova:** `googleStructuredOutput` (BibTeX no fim deste arquivo).

**Conferido no código** (`geminiService.ts`): `montarPrompt` tem os 5 blocos; o `SCHEMA` declara os 3 campos obrigatórios; `interpretarResposta` só aceita JSON com os 3 arrays.

## V.E · Cálculo do Score Geral (Equações)

**Onde:** substitui o parágrafo do TCC I depois da Tabela V ("O retorno da API Gemini deve seguir formato JSON...") e a Equação (1). A Tabela IV já foi apagada.

**Hoje diz:** "Após o recebimento desse retorno, o backend em Node.js calculará o campo score_geral..." e "...desempenho **da semana**."

```latex
\subsection{Cálculo do \textit{Score} Geral}

Além do texto da IA, cada diagnóstico traz um \textit{score} geral de 0 a 100, exibido como indicador visual na tela de diagnóstico. Diferentemente do previsto na proposta, o \textit{score} é calculado pelo servidor antes da chamada à IA, apenas com os dados do banco, e não depende da resposta do modelo: a IA não atribui nota, e qualquer campo numérico que ela devolva é descartado. Assim, o mesmo conjunto de séries sempre produz o mesmo \textit{score}, e o valor pode ser conferido manualmente. O \textit{score} é a média entre uma pontuação de volume ($P_v$) e uma de intensidade ($P_i$), arredondada para o inteiro mais próximo:
\begin{equation}
    \text{Score Geral} = \frac{P_v + P_i}{2}
\end{equation}

A pontuação de volume mede o quanto os grupamentos trabalhados se aproximam do limiar de 10 séries semanais \cite{schoenfeld2017dose}. Para cada um dos $n$ grupamentos treinados na sessão, considera-se o número $s_g$ de séries válidas acumuladas na semana:
\begin{equation}
    P_v = \frac{1}{n}\sum_{g=1}^{n} \min\left(\frac{s_g}{10},\, 1\right) \times 100
\end{equation}

Optou-se por considerar apenas os grupamentos treinados na sessão porque o diagnóstico avalia a sessão: o volume acumulado na semana serve de referência para os músculos daquele treino, e um grupamento trabalhado em outro dia não altera a nota desta sessão.

A pontuação de intensidade considera as $m$ séries válidas da sessão e tem como referência a intensidade ótima em RPE 9, ou 1 RIR \cite{zourdos2016novel, helms2016application}: RPE 6, o menor valor aceito, vale 0; RPE 9 ou 10 vale 100; e os valores intermediários são proporcionais:
\begin{equation}
    P_i = \frac{1}{m}\sum_{j=1}^{m} \min\left(\frac{\mathit{RPE}_j - 6}{3} \times 100,\, 100\right)
\end{equation}

Por exemplo, em uma sessão de peito e tríceps na qual o peito acumula 12 séries válidas na semana e o tríceps 6, tem-se $P_v = (100 + 60)/2 = 80$. Se as séries válidas da sessão tiverem RPE 8, 9 e 9, tem-se $P_i = (66{,}7 + 100 + 100)/3 \approx 88{,}9$, e o \textit{score} geral é $\mathrm{round}((80 + 88{,}9)/2) = 84$.
```

**Conferido no código** (`scoreService.ts`): `calcularPv`, `calcularPi` e `calcularScoreGeral` batem com as fórmulas. Exemplo refeito: Pv 80, Pi 88,9, score 84.

**Por quê:** o texto antigo dizia "após o retorno", mas o código calcula **antes** (D13). A frase do $P_v$ responde à pergunta provável da banca: "por que não olhar a semana toda?".

## V.F · Interface e Regras de Uso

**Onde:** depois do score. Conteúdo novo, sem equivalente no TCC I.

```latex
\subsection{Interface e Regras de Uso}

A interface possui cinco telas: Minha Divisão, onde o usuário monta a rotina semanal; Treino de Hoje, onde registra as séries; Volume da Semana, com as séries válidas por grupamento em relação ao limiar; Diagnóstico, com o \textit{score}, as pontuações $P_v$ e $P_i$, a análise por exercício e por grupamento e as recomendações para a próxima sessão; e Histórico. Em telas estreitas, a barra lateral de navegação é substituída por uma barra inferior de ícones, pensada para o uso com uma mão durante o treino (RNF01). Os campos numéricos aceitam vírgula decimal.

O histórico (RF07) foi organizado em três abas. A aba Cargas mostra, por exercício, a maior carga válida de cada sessão, com as repetições e a tonelagem (soma de carga $\times$ repetições); optou-se por não estimar a carga máxima (1RM), pois isso exigiria fórmulas fora do referencial adotado. A aba Volume mostra as séries válidas por grupamento nas últimas oito semanas. A aba Sessões apresenta um calendário mensal das sessões finalizadas, e cada sessão pode ser aberta com suas séries e seu diagnóstico.

Durante o desenvolvimento, surgiram regras que a proposta não previa. A semana de volume vai de segunda a domingo, as séries de uma sessão ainda aberta já contam no volume e grupamentos sem séries aparecem com zero. A duração da sessão é calculada pelo servidor, e não informada pelo usuário. Séries só podem ser registradas em uma sessão aberta. Ao iniciar uma nova sessão, uma sessão esquecida aberta de outro dia é encerrada automaticamente, sem duração, para não misturar dados de dias diferentes.
```

**Decisões cobertas:** D6 (barra inferior), D10 (segunda a domingo), D11 (treino aberto conta no volume), D12 (duração no servidor), D17 (aba Cargas sem 1RM), D18 (calendário só com sessões finalizadas), D20 (série só em treino aberto), D22 (novo treino fecha o esquecido).

**Atenção:** "tonelagem" (carga × repetições) é diferente de "volume" (contagem de séries). Não misturar.

## V.G · Ajustes em Relação à Proposta

**Onde:** última subseção da Solução.

```latex
\subsection{Ajustes em Relação à Proposta}

A implementação manteve os objetivos, os requisitos e a arquitetura da proposta, mas alguns pontos foram ajustados ao longo dos ciclos de desenvolvimento e registrados como decisões de projeto. O principal foi a unidade do diagnóstico: a proposta previa consolidar as métricas da semana, e o sistema passou a avaliar cada sessão finalizada, usando o volume semanal como contexto, para que o retorno chegasse logo após o treino e tratasse do que acabou de ser feito. O registro do esforço também mudou: em vez de pedir RPE e RIR separadamente, o sistema pede uma das escalas e calcula a outra, o que evita dupla digitação e valores incoerentes. Foi acrescentado o tipo de série \textit{feeder}, para registrar séries de aproximação sem inflar o volume. O \textit{score} passou a ser calculado antes da chamada à IA, e não depois, o que o torna independente do modelo. Por fim, a sugestão de \textit{deload} mencionada na proposta não foi implementada como regra, pois o \textit{deload} é uma redução planejada e o sistema não conhece a intenção do praticante; recomendações desse tipo aparecem apenas no texto gerado pela IA.
```

**Por quê:** a banca avalia a "consistência com a proposta apresentada". Mudança explicada conta a favor; mudança sem explicação conta contra.

---

# VI · Resultados — E3 ⏳

Seção nova, depois da Solução. Cerca de 2 páginas.

## VI.A · Testes Automatizados (Tabela de rastreabilidade)

**Onde:** a Tabela VI do TCC I (`tab:matriz-rastreabilidade`) vem para cá e ganha a coluna **Resultado**.

```latex
\section{Resultados}

\subsection{Testes Automatizados}

A suíte de testes do \textit{backend} reúne [N] casos de teste, distribuídos em [8] arquivos, e todos foram executados com sucesso na versão final do sistema. A Tabela~\ref{tab:matriz-rastreabilidade} relaciona cada requisito ao método usado para verificá-lo e ao resultado obtido. [Opcional: ``No teste de falha simulada, a API externa foi forçada a falhar após a finalização da sessão; o servidor respondeu com erro 502 e o número de séries gravadas permaneceu o mesmo antes e depois da tentativa.'']

\begin{table}[!h]
\scriptsize
\centering
\caption{Matriz de rastreabilidade dos requisitos}
\label{tab:matriz-rastreabilidade}
\renewcommand{\arraystretch}{1.2}
\setlength{\tabcolsep}{2pt}
\begin{tabular}{|p{0.12\columnwidth}|p{0.25\columnwidth}|p{0.36\columnwidth}|p{0.17\columnwidth}|}
\hline
\textbf{ID} & \textbf{Método} & \textbf{Critério de aceite} & \textbf{Resultado} \\ \hline
RF01 & Teste de API & Cadastro e \textit{login} sem erros; acesso negado sem \textit{token} & Atendido \\ \hline
RF02 & Teste de API e usabilidade & Operações da divisão sem falhas & Atendido \\ \hline
RF03 & Teste de API e usabilidade & Séries gravadas com tipo e esforço corretos & Atendido \\ \hline
RF04 & Teste de API & Volume igual à contagem manual & Atendido \\ \hline
RF05 & Teste de integração e validação de conteúdo & Diagnóstico da sessão em JSON válido e coerente & Atendido \\ \hline
RF06 & Teste de integração & Diagnóstico gravado e vinculado à sessão & Atendido \\ \hline
RF07 & Teste de API e usabilidade & Cargas, volume e sessões exibidos corretamente & Atendido \\ \hline
RNF01 & Avaliação de usabilidade & Sem problemas de severidade 3 ou 4 & [preencher] \\ \hline
RNF02 & Teste de integração & Registro órfão rejeitado pelo banco & Atendido \\ \hline
RNF03 & Teste de unidade e de API & Cálculos feitos no servidor & Atendido \\ \hline
RNF04 & Validação de conteúdo & Diagnóstico dentro do domínio & [preencher] \\ \hline
RNF05 & Teste de unidade & Resposta fora do formato recusada sem gravar & Atendido \\ \hline
RNF06 & Teste de integração & Registros intactos após falha simulada & Atendido \\ \hline
\end{tabular}
{\footnotesize Fonte: elaborado pelo autor.}
\end{table}
```

**Antes de escrever:** rodar `npm test` em `server/` e copiar o total (`# tests` / `# pass`). Se algum requisito não passar por inteiro, trocar "Atendido" por "Atendido com ressalva" e explicar em uma frase.

## VI.B · Avaliação Heurística de Usabilidade

Molde. Preencher com os achados da Frente 2.

```latex
\subsection{Avaliação Heurística de Usabilidade}

A inspeção identificou [N] problemas de usabilidade nos fluxos avaliados: [a] de severidade 1, [b] de severidade 2, [c] de severidade 3 e nenhum de severidade 4. [Descrever em uma ou duas frases os mais relevantes, citando a heurística violada. Exemplo: ``Na tela Treino de Hoje, não havia confirmação visual após salvar uma série, violando a heurística de visibilidade do estado do sistema (severidade 2).''] Os problemas de severidade 2 ou superior foram corrigidos antes do congelamento do código, em 19 de outubro de 2026, e nenhum problema de severidade 3 ou 4 permaneceu, atendendo ao critério definido para o RNF01.
```

Tabela opcional, se couber:
```latex
\begin{tabular}{|p{0.30\columnwidth}|p{0.30\columnwidth}|p{0.12\columnwidth}|p{0.16\columnwidth}|}
\hline
\textbf{Tela} & \textbf{Heurística violada} & \textbf{Sev.} & \textbf{Situação} \\ \hline
Treino de Hoje & [...] & [2] & Corrigido \\ \hline
\end{tabular}
```

## VI.C · Validação do Conteúdo dos Diagnósticos

Molde. Preencher com as fichas da Frente 3.

```latex
\subsection{Validação do Conteúdo dos Diagnósticos}

Os [N] cenários de sessão foram submetidos à API real. Em [X] deles, o diagnóstico foi coerente com o limiar de volume \cite{schoenfeld2017dose} e com a leitura de intensidade por RPE e RIR \cite{zourdos2016novel, helms2016application}. [Descrever as divergências, se houver. Exemplo: ``No cenário com séries em RPE 6, o modelo recomendou aumentar a carga, mas não apontou que a sessão teve intensidade baixa.''] Em nenhum caso o modelo citou exercícios ou valores ausentes dos dados enviados [ajustar se houve], e todas as respostas vieram no formato JSON esperado. [Se o \textit{prompt} foi ajustado: descrever a mudança e comparar as duas rodadas.]
```

Tabela opcional:
```latex
\begin{tabular}{|p{0.07\columnwidth}|p{0.27\columnwidth}|p{0.14\columnwidth}|p{0.14\columnwidth}|p{0.14\columnwidth}|}
\hline
\textbf{\#} & \textbf{Cenário} & \textbf{Coerência} & \textbf{Fidelidade} & \textbf{Domínio} \\ \hline
1 & Peito 12 séries, RPE 9 & Sim & Sim & Sim \\ \hline
\end{tabular}
```

## VI.D · Prints das telas

3 ou 4 figuras, seguindo o card de prints do Trello (tirar depois do code freeze, mesmo usuário e mesma semana de dados, `GEMINI_MOCK=false`). Plano B: volume + diagnóstico numa figura só.

```latex
\begin{figure}[!h]
\caption{Tela de diagnóstico de uma sessão}
\centering
\includegraphics[width=\columnwidth]{images/tela_diagnostico.png}
\label{fig:tela-diagnostico}
{\footnotesize Fonte: elaborado pelo autor.}
\end{figure}
```

Frase que cita a figura:
```latex
A Fig.~\ref{fig:tela-diagnostico} mostra o diagnóstico de uma sessão: o \textit{score} geral, as pontuações $P_v$ e $P_i$, a análise por exercício e por grupamento e as recomendações para a próxima sessão.
```

---

# VII · Conclusões — E3 ⏳

**Onde:** `\section{Conclusões Parciais}` vira `\section{Conclusões}`, e o texto inteiro é substituído.

```latex
\section{Conclusões}

Este trabalho desenvolveu um sistema web integrado à IA generativa para apoiar praticantes experientes no gerenciamento do treinamento de hipertrofia. Os quatro objetivos específicos foram atendidos: as métricas de volume semanal, RPE e RIR foram mapeadas na literatura e traduzidas em regras de cálculo; a arquitetura MVC foi implementada com React, Node.js e PostgreSQL; a integração com o Gemini foi feita por um \textit{prompt} estruturado em cinco blocos, com saída em JSON validada; e o protótipo foi validado por testes automatizados, inspeção heurística e avaliação do conteúdo dos diagnósticos.

A decisão de maior impacto foi separar o que é calculado do que é interpretado. Volume, intensidade e \textit{score} são calculados pelo servidor de forma determinística e verificável, enquanto a IA fica responsável apenas por interpretar esses números em linguagem natural. Essa divisão reduz o efeito de eventuais erros do modelo sobre a informação mais objetiva apresentada ao usuário. Avaliar cada sessão, em vez da semana, aproximou o retorno do momento do treino.

O trabalho tem limitações. Cada exercício está associado a um único grupamento muscular, o que subestima o volume dos grupamentos sinergistas. O $P_v$ considera apenas os grupamentos da sessão avaliada; um grupamento previsto na divisão e negligenciado na semana não reduz o \textit{score}, embora apareça na tela de volume semanal. A validação foi feita sem usuários reais, a inspeção de usabilidade contou com um único avaliador e a responsividade foi verificada no modo de dispositivo móvel do navegador, e não em aparelhos físicos. O sistema não registra o descanso entre séries e não foi publicado em ambiente de produção. A qualidade dos diagnósticos também depende do modelo de linguagem utilizado, que pode mudar de versão.

Como trabalhos futuros, sugerem-se: avaliar o sistema com praticantes reais por um período prolongado; associar cada exercício a mais de um grupamento, com pesos diferentes; incluir o perfil e a anamnese do usuário no contexto do \textit{prompt}; e publicar o sistema em ambiente de produção.
```

**Antes de fechar:** conferir se as limitações batem com o que aconteceu nas Frentes 2 e 3, e se os trabalhos futuros batem com a lista 🧊 do Trello.

---

# Resumo e palavras-chave — E3 ⏳ (escrever por último)

**Onde:** `\begin{abstract}`. O texto atual está no futuro ("Nesta primeira etapa...", "A etapa seguinte prevê..."). Escrever quando os números existirem.

```latex
\begin{abstract}
O treinamento de força voltado à hipertrofia exige, em praticantes experientes, o controle conjunto do volume semanal de séries, da Percepção Subjetiva de Esforço (RPE) e das Repetições em Reserva (RIR), um cruzamento difícil de sustentar manualmente. Este trabalho desenvolveu um sistema web, estruturado no padrão MVC com React, Node.js e PostgreSQL, que registra as séries de cada sessão, calcula o volume semanal por grupamento muscular e, ao final de cada sessão, gera um diagnóstico por meio da API do Google Gemini, com um \textit{prompt} estruturado em cinco blocos e saída em JSON. Um \textit{score} de 0 a 100, que combina volume e intensidade, é calculado no servidor de forma determinística, independentemente da IA. O desenvolvimento seguiu a metodologia FDD em nove ciclos semanais. A validação incluiu [N] testes automatizados, todos aprovados, uma inspeção heurística de usabilidade sem problemas graves remanescentes e a avaliação de [N] cenários de sessão, nos quais os diagnósticos se mostraram [coerentes] com a literatura.
\end{abstract}
```

**Palavras-chave:** podem ficar iguais. Opção: trocar "Aplicação Web" por "Sistema Web", mais fiel ao título.

---

# Referências novas (BibTeX)

Colar no `references.bib`. O projeto usa biblatex + biber, que aceita `@online`.

```bibtex
@online{nielsen1994severity,
  author       = {Nielsen, Jakob},
  title        = {Severity Ratings for Usability Problems},
  organization = {Nielsen Norman Group},
  year         = {1994},
  url          = {https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/},
  urldate      = {2026-10-15}
}

@online{googleStructuredOutput,
  author  = {{Google}},
  title   = {Structured outputs -- {Gemini API}},
  year    = {2026},
  url     = {https://ai.google.dev/gemini-api/docs/structured-output},
  urldate = {2026-10-15}
}
```

| Chave | Onde é citada | O que sustenta |
|---|---|---|
| `nielsen1994severity` | IV · Procedimentos de validação | escala de severidade 0–4 |
| `googleStructuredOutput` | V.D · Integração com a IA | esquema de resposta do Gemini (RNF05) |

**Opcionais**, só se citar no texto (documentações oficiais, formato `@online`): TypeScript, Express, Material UI.

**Conferir também:** com `\printbibliography`, só as referências citadas aparecem. Depois dos cortes, vale ver se alguma que você queria manter deixou de ser citada.

---

# Lista de busca (Ctrl+F) — E4 ⏳

Procurar cada termo no TCC II e conferir caso a caso.

| Buscar | O que fazer |
|---|---|
| `será`, `serão`, `prevê`, `utilizará`, `injetará`, `instruirá`, `calculará`, `verificarão`, `cobrirá`, `focará` | passar para o passado |
| `nesta primeira etapa`, `etapa seguinte`, `Conclusões Parciais`, `TCC II` | apagar ou reescrever |
| `semana avaliada`, `métricas semanais`, `consolidadas da semana`, `desempenho da semana` | trocar por sessão |
| `semanal` (todas as ocorrências) | o **volume** semanal está certo; o **diagnóstico** semanal está errado |
| `deload` | não pode aparecer como funcionalidade |
| `aquecimento ou válida` | trocar pelos 3 tipos |
| `RPE e RIR` em requisito ou *backlog* | o esforço é informado em uma escala só |
| `preferencialmente` | trocar por obrigatoriamente |
| `Após o recebimento` | o score é calculado antes |
| `diversos dispositivos`, `exclusivamente no backend` | ajustar (RNF01 e RNF03) |
| `representa a camada de modelo`, `camada de Modelo armazena` | o PostgreSQL não é o Modelo |
| `solicitação do diagnóstico` | trocar por "Finalizar e avaliar treino" |
| `atravéz` | "através" |
| `\ref{quadroFDD}`, `\ref{figCasoUso}`, `\ref{figDominio}`, `\ref{fig:cronograma}`, `\ref{tab:requisitos-funcionais}`, `\ref{tab:requisitos-nao-funcionais}`, `\ref{tab:operacionalizacao}`, `\ref{sec:problema}` | referências a itens que saíram |
| `??` no PDF compilado | `\ref` quebrado |
| `Tabela 5`, `Tabela 6` | usar `\ref`, nunca o número escrito |
| `HyperTrack`, `Trainna` | usar o mesmo nome em todo o texto, ou nenhum |
| ordem das seções | I Introdução, II Referencial, III Declaração de IA, IV Metodologia, V Solução, VI Resultados, VII Conclusões |
| número de páginas | até 10 |
