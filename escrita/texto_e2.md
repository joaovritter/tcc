# Textos recomendados para o TCC II
 
Texto pronto para colar no TCC II (`main.tex` no Prism), item a item. Cada bloco tem:
- **Onde:** onde mexer no TCC II;
- **Hoje diz:** o trecho atual (herdado do TCC I);
- **Texto recomendado:** em LaTeX, com as mesmas chaves de citação do `references.bib`;
- **Por quê:** o motivo da mudança.
Os mesmos textos estão nos cards ✍️ do Trello (listas E1–E4).
 
**Ordem das seções no TCC II:** Introdução (I) → Referencial teórico (II) → Declaração de uso de IA (`\section*`, sem número) → Metodologia (III) → Solução desenvolvida (IV) → Resultados (V) → Conclusões (VI) → Referências. Limite: **até 10 páginas**.
 
**Sem seção própria de problema** (decisão de 19/10): como no TCC I, o problema fica na Introdução, no fim de II.B e no fechamento de II.E. Economiza ~0,5 página.
 
**Conferido com o código** do repositório `joaovritter/tcc` (último commit em 13/10/2026):
- `scoreService.ts`, `geminiService.ts`, `diagnosticController.ts`;
- `volumeService.ts`, `schema.sql` e `__tests__`.
Os trechos entre colchetes, como [N], são lacunas para preencher com os números reais.
 
Atualizado em 19/10/2026: declaração de IA antes da Metodologia, problema sem seção própria (fechamento de II.E reescrito), Pv decidido (grupamentos da sessão) com frase de justificativa e limitação nas Conclusões.
 
---
 
## E1 · Introdução e objetivos (I1, I2)
 
**Onde:** `\section{Introdução}`, último parágrafo ("Buscando diferenciar-se..."), e `\subsection{Objetivos Específicos}`.
 
**Os parágrafos 2 a 4 da Introdução ficam:** são eles que apresentam o problema, já que o TCC II não tem seção própria para isso. Só passar para o passado o que estiver no futuro.
 
**Hoje diz:** "Buscando diferenciar-se dos sistemas focados apenas no registro manual, propõe-se a integração dessas arquiteturas com APIs (...) de IA Generativa. Através da aplicação de técnicas de engenharia de prompts, torna-se possível utilizar o modelo para o processamento em conjunto das variáveis (Volume, RIR e RPE), transformando dados brutos em ferramentas de suporte à decisão que permitem fornecer diagnósticos precisos e automatizados para a rotina do usuário."
 
**Texto recomendado:** substitui o parágrafo inteiro.
```latex
Buscando diferenciar-se dos sistemas focados apenas no registro manual, este trabalho integrou essa arquitetura a uma API \textit{(Application Programming Interface)} de IA Generativa. Por meio de técnicas de engenharia de \textit{prompts}, o modelo passou a interpretar em conjunto o volume semanal, a RPE e as RIR registrados pelo praticante. Ao final de cada sessão de treino, o sistema calcula no servidor um indicador de desempenho e envia ao modelo as séries válidas daquela sessão, com o volume acumulado da semana como contexto, transformando dados brutos em um diagnóstico de apoio à decisão para a sessão seguinte.
```
 
**Objetivos:** ficam no infinitivo, que é o padrão para objetivos mesmo no trabalho final. Só dois itens mudam:
```latex
    \item Integrar a aplicação à API de Inteligência Artificial Generativa (Google Gemini) utilizando técnicas de engenharia de prompts para processar as métricas de cada sessão de treino e retornar diagnósticos ao usuário;
    \item Validar o protótipo por meio de testes de software e de cenários simulados de sessões de treino, verificando a coerência do diagnóstico gerado pela IA e a usabilidade da interface por meio de avaliação heurística.
```
 
**Opcional (4 linhas):** parágrafo de organização, no fim da Introdução. É comum em artigo IEEE e ajuda a banca a se localizar. A declaração de IA não tem número, então não entra na contagem.
```latex
O restante deste artigo está organizado da seguinte forma: a Seção~II apresenta o referencial teórico; a Seção~III, a metodologia; a Seção~IV, a solução desenvolvida; a Seção~V, os resultados; e a Seção~VI, as conclusões.
```
 
**Por quê:** o parágrafo antigo estava no futuro ("propõe-se", "torna-se possível") e não dizia que o diagnóstico é por sessão.
 
---
 
## E1 · Identificação e descrição do problema (P1) — sem seção própria
 
**Decisão de 19/10:** o TCC II não terá seção própria de problema. A lista de seções do curso é recomendação, e o TCC I também não tinha essa seção. O problema fica onde já estava:
- **Introdução**, parágrafos 2 a 4;
- **fim de II.B** (texto do item II.B-3, abaixo);
- **fechamento de II.E** (texto abaixo), que agora diz a lacuna com clareza.
Nada para colar à parte.
 
**Por quê:** economiza ~0,5 página no limite de 10 e evita repetir no texto o que o Referencial já diz.
 
---
 
## E1 · Referencial II.A e II.B: fisiologia, séries, RPE/RIR, deload
 
### II.A — Fisiologia (4 parágrafos → 2)
 
**Onde:** `\subsection{Fisiologia da Hipertrofia e a Janela de Adaptação}`. Substitui a subseção inteira.
 
```latex
\subsection{Fisiologia da Hipertrofia e a Janela de Adaptação}
 
A hipertrofia muscular resulta das adaptações do organismo aos estímulos do treinamento de força e é mediada principalmente por três fatores: tensão mecânica, estresse metabólico e dano muscular. Entre eles, a tensão mecânica é o mais importante, e seu efeito é potencializado quando combinado ao acúmulo de metabólitos \cite{schoenfeld2010mechanisms}.
 
A resposta a esses estímulos, porém, não é linear. Iniciantes respondem a quase qualquer estímulo, enquanto praticantes experientes apresentam taxa de crescimento atenuada e uma janela de adaptação mais estreita \cite{schoenfeld2016effects, schoenfeld2010mechanisms}. Nessa fase, manter o mesmo estímulo leva à estagnação, e novos ganhos dependem da manipulação estruturada e metrificada das variáveis de treinamento ao longo do tempo \cite{kraemer2004fundamentals, schoenfeld2016effects}.
```
 
### II.B-1 — Séries válidas e os três tipos de série
 
**Onde:** `\subsection{Monitoramento de Variáveis de Esforço...}`.
- O 1º parágrafo ("O controle do esforço para praticantes...") **sai**.
- O 2º e o 3º ("A variável quantitativa central..." e "Observa-se uma relação de dose-resposta...") são **substituídos** por:
```latex
A variável quantitativa central do sistema é o volume de treinamento, contado como o número de séries válidas (\textit{work sets}): séries levadas próximas à falha e realizadas por grupamento muscular ao longo da semana \cite{schoenfeld2017dose}. Há relação dose-resposta entre essa contagem e a hipertrofia, e a realização de 10 ou mais séries semanais por grupamento está associada a maiores ganhos, valor adotado pelo sistema como limiar mínimo de referência \cite{schoenfeld2017dose}.
 
Para que a contagem não seja inflada, o sistema distingue três tipos de série: aquecimento, de preparação geral; \textit{feeder}, séries de aproximação com cargas próximas à de trabalho, usadas para preparar a execução sem gerar estímulo efetivo; e \textit{work}, as séries válidas. Somente as séries do tipo \textit{work} entram no volume e recebem registro de esforço.
```
 
### II.B-2 — RPE/RIR em uma escala só e o piso de RPE 6
 
**Onde:** os parágrafos "Contudo, monitorar apenas o volume..." e "A viabilidade dessa autorregulação..." viram um só.
 
**Hoje diz (trecho que muda):** "um RPE abaixo de 6 pode indicar que o praticante experiente não está gerando uma intensidade suficiente para promover adaptações."
 
```latex
O volume, contudo, não indica a intensidade de cada série. Para isso, o sistema adota as escalas de RPE e RIR, ajustadas ao treinamento de força por \textcite{zourdos2016novel}, que quantificam o esforço pela estimativa de quantas repetições o praticante ainda conseguiria executar, com técnica adequada, antes da falha concêntrica. As duas escalas expressam a mesma informação: RPE 9 equivale a 1 RIR e indica estímulo otimizado \cite{helms2016application}. Por isso, no sistema o praticante informa o esforço em apenas uma das escalas, e a outra é obtida pela relação RPE $= 10 -$ RIR. A série válida aceita RIR entre 0 e 4, o que corresponde a RPE entre 6 e 10; esforços mais distantes da falha não caracterizam série válida. Essa autorregulação permite ajustar a intensidade à capacidade real do praticante no dia, que varia com o sono, a nutrição e o estresse \cite{helms2016application}.
```
 
### II.B-3 — Último parágrafo, sem a promessa de deload
 
Este parágrafo é parte do problema (o desafio de cruzar os dados), então fica, só mais curto.
 
**Hoje diz:** "Ele sugere momentos oportunos para progressão da carga ou a implementação de blocos de recuperação (\textit{deload}), minimizando vieses subjetivos na gestão do treinamento."
 
```latex
O desafio que justifica a automação está em cruzar esses dados: correlacionar o volume semanal acumulado \cite{schoenfeld2017dose} com a intensidade aferida por RPE e RIR \cite{helms2016application} exige um acompanhamento que o praticante dificilmente sustenta à mão por longos períodos. O sistema desenvolvido assume esse cálculo e, a cada sessão finalizada, entrega um diagnóstico com recomendações para a sessão seguinte.
```
 
**Por quê:**
- **Feeder:** não existia no TCC I (D9).
- **Escala única:** pedir RPE e RIR separados geraria dupla digitação e valores incoerentes.
- **Piso de 6:** é o menor RPE aceito pelo sistema.
- **Deload:** não foi implementado (D16). O sistema não sabe a intenção do praticante.
---
 
## E1 · Referencial II.C, II.D e II.E: engenharia de software, IA e correlatos
 
### II.C — FDD e MVC (6 parágrafos → 2)
 
**Onde:** `\subsection{Engenharia de Software e Arquitetura do Sistema}`. Substitui a subseção inteira.
- **Sai:** a explicação do DOM virtual, do Event Loop, do PostgreSQL genérico e do FDD longo.
- **Vai para a Solução desenvolvida:** a lista de tecnologias.
```latex
\subsection{Engenharia de Software e Arquitetura do Sistema}
 
O desenvolvimento seguiu a metodologia ágil FDD (\textit{Feature-Driven Development}), que decompõe o problema em funcionalidades pequenas e de valor para o usuário, implementáveis e testáveis em até duas semanas, organizadas em etapas de modelagem, planejamento, projeto e construção \cite{palmer2001practical, pressman2011engenharia}.
 
A aplicação adota o padrão MVC (\textit{Model-View-Controller}), que separa o gerenciamento dos dados e das regras de negócio (Modelo), a interface (Visão) e o processamento das requisições (Controlador) \cite{freeman2018pro}. A Visão foi construída com a biblioteca React, baseada em componentes reutilizáveis \cite{banks2020learning, react2026docs}. Modelo e Controlador ficam no \textit{backend} em Node.js, cujo modelo de entrada e saída não bloqueante favorece aplicações com muitas requisições ao banco de dados e a serviços externos \cite{casciaro2020node, nodejs2026docs}. Os dados são persistidos no sistema gerenciador de banco de dados relacional PostgreSQL, que garante a integridade referencial do histórico de treinos \cite{postgresql2026docs, silberschatz2019database}.
```
 
### II.D — IA e prompts (4 parágrafos → 1)
 
```latex
\subsection{IA Generativa e Engenharia de Prompts}
 
Problemas com muitas variáveis cruzadas, como o histórico de carga, RPE e volume de vários grupamentos, são difíceis de tratar apenas com regras estáticas e encontram na IA uma alternativa \cite{pressman2011engenharia}. O sistema utiliza a família de modelos de linguagem Gemini, acessada via API, o que dispensa treinar um modelo na infraestrutura da aplicação \cite{google2024gemini}. A qualidade da resposta, no entanto, depende de como a comunicação com o modelo é estruturada. \textcite{white2023prompt} catalogam padrões reutilizáveis para isso, dos quais dois foram aplicados: o \textit{Persona Pattern}, que restringe o modelo ao papel de especialista em fisiologia do exercício, e o \textit{Template Pattern}, em que o \textit{backend} injeta os dados de treino em um \textit{prompt} predefinido e exige a resposta em um formato previsível, como JSON (\textit{JavaScript Object Notation}), que o servidor consegue ler e a interface consegue exibir.
```
 
### II.E — Correlatos (5 parágrafos → 3)
 
O último parágrafo fecha o Referencial dizendo **qual é o problema** (a lacuna). É ele que faz o papel da seção do problema, sem custar espaço extra.
 
```latex
\subsection{Trabalhos Correlatos}
 
\textcite{schroter2025} desenvolveram uma aplicação web em .NET, com arquitetura MVC e integração à API Gemini, voltada a \textit{personal trainers}: a partir da anamnese do aluno e do catálogo de exercícios, a IA sugere uma divisão de treino em JSON, que o profissional revisa antes de atribuir. O trabalho demonstra a viabilidade de gerar conteúdo estruturado com o Gemini a partir de um \textit{template} de \textit{prompt}, mas não registra RPE ou RIR por série nem calcula volume por grupamento, e seu público é o profissional, não o praticante.
 
\textcite{noteboom2023muscle} avaliaram, com 30 participantes ao longo de oito sessões, uma aplicação de \textit{feedback} de carga muscular integrada a um sistema de rastreamento automático. O grupo que recebeu \textit{feedback} completo distribuiu a carga entre os grupamentos de forma significativamente mais equilibrada que o grupo controle. A carga, porém, era estimada por percentuais fixos de 1RM, sem considerar a proximidade da falha nem distinguir séries válidas, e não havia análise por IA.
 
Os trabalhos analisados tratam, portanto, apenas partes do problema. Falta uma ferramenta voltada ao próprio praticante experiente que registre as séries com tipo e esforço percebido, calcule de forma automática e verificável o volume semanal e a intensidade, e traduza esses números em um diagnóstico coerente com a literatura logo após cada sessão de treino. É essa lacuna que o presente trabalho busca preencher, com o apoio da IA generativa.
```
 
**Por quê:** o Referencial cabe em ~1,75 página. Fica o que sustenta uma decisão do sistema e sai a explicação didática de tecnologia. A frase "PostgreSQL é o Modelo" saiu porque não é como o sistema foi feito (ver Solução).
 
---
 
## E2 · Metodologia: abertura, FDD, backlog e ciclos (III.A)
 
**Onde:** `\section{Metodologia}` e `\subsection{Abordagem de Desenvolvimento}`, logo depois da Declaração de IA. Substitui o texto, a lista e a Tabela I (`quadroFDD`).
 
**Hoje diz (abertura):** "...serão utilizados artefatos de análise e projeto de software..."
 
```latex
\section{Metodologia}
 
Esta seção descreve os procedimentos adotados no desenvolvimento do sistema. A metodologia buscou alinhar os conceitos da Ciência do Exercício às práticas de Engenharia de Software, traduzindo as variáveis de esforço discutidas no referencial teórico em funcionalidades, estruturas de dados e fluxos de processamento \cite{pressman2011engenharia}.
 
\subsection{Abordagem de Desenvolvimento}
 
O projeto foi conduzido pela metodologia FDD \cite{palmer2001practical}. Na etapa de modelo geral, o banco de dados foi modelado para registrar as séries válidas por grupamento muscular, base da contagem de volume \cite{schoenfeld2017dose}, e o esforço de cada série em RPE e RIR \cite{zourdos2016novel}. Na etapa de lista de funcionalidades, o domínio foi decomposto no seguinte \textit{backlog}:
 
\begin{itemize}
    \item Realizar o cadastro e a autenticação do usuário;
    \item Gerenciar a divisão semanal e os exercícios de cada dia;
    \item Executar a sessão de treino, registrando o tipo de cada série (aquecimento, \textit{feeder} ou válida), a carga, as repetições e o esforço, informado em RIR ou RPE;
    \item Calcular o volume semanal de séries válidas por grupamento muscular;
    \item Finalizar a sessão e gerar o diagnóstico via IA;
    \item Visualizar o histórico de cargas, de volume e das sessões, com seus diagnósticos.
\end{itemize}
 
As etapas de planejamento, projeto e construção por funcionalidade foram executadas em nove ciclos semanais (S1 a S9), de agosto a outubro de 2026, cada um encerrado com uma funcionalidade implementada e testada. A ordem dos ciclos seguiu as dependências entre os módulos: base MVC e banco de dados; autenticação; divisão semanal; exercícios da rotina; execução do treino; finalização e volume semanal; diagnóstico via Gemini; telas de diagnóstico e histórico; e, por fim, testes de integração e ajustes.
```
 
**Apagar:** a Tabela I inteira (`\begin{table}...\label{quadroFDD}...\end{table}`) e o parágrafo "Após a definição do backlog, a etapa de planejamento...", que o último parágrafo acima já cobre.
 
**Por quê:**
- **Tabela I:** vira duas frases e libera ~1/4 de página.
- **Backlog:** passa a ter 3 tipos de série e o passo "finalizar e avaliar".
- **Ciclos:** a menção aos ciclos S1–S9 mostra como o FDD foi aplicado de fato.
---
 
## E2 · Requisitos: tabela única (III.B-1, III.B-2)
 
**Onde:** `\subsection{Arquitetura e Modelagem do Sistema}`.
- **Sai:** o 1º parágrafo ("A arquitetura do sistema foi definida...").
- **Juntam-se:** as Tabelas II e III (`tab:requisitos-funcionais` e `tab:requisitos-nao-funcionais`) viram uma tabela só.
- **Saem também:** as Figs. 1 e 2 (`figCasoUso` e `figDominio`), com os parágrafos que as apresentam.
- **Renomear:** a subseção passa a se chamar "Requisitos do Sistema".
```latex
\subsection{Requisitos do Sistema}
 
Os requisitos funcionais (RF) e não funcionais (RNF), ajustados ao que foi implementado, são apresentados na Tabela~\ref{tab:requisitos}.
 
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
RF03 & Registrar séries com tipo (aquecimento, \textit{feeder} ou válida), carga, repetições e esforço informado em RIR ou RPE. \\ \hline
RF04 & Calcular automaticamente o volume semanal (segunda a domingo) de séries válidas por grupamento muscular. \\ \hline
RF05 & Ao finalizar a sessão, enviar à API Gemini as séries válidas da sessão, com o volume semanal como contexto, para gerar o diagnóstico. \\ \hline
RF06 & Persistir os diagnósticos gerados, vinculados à sessão avaliada e com o \textit{score} geral. \\ \hline
RF07 & Exibir o histórico de cargas, o volume das últimas semanas e as sessões finalizadas com seus diagnósticos. \\ \hline
RNF01 & A interface deve ser responsiva e utilizável em telas de celular durante o treino. \\ \hline
RNF02 & O sistema deve garantir integridade referencial no PostgreSQL. \\ \hline
RNF03 & Os cálculos de volume, RPE/RIR e \textit{score} devem ser feitos no servidor, nunca na interface. \\ \hline
RNF04 & A comunicação com a API Gemini deve utilizar um \textit{template} de \textit{prompt} estruturado. \\ \hline
RNF05 & O retorno da IA deve seguir obrigatoriamente o formato JSON definido por esquema. \\ \hline
RNF06 & O sistema deve preservar os registros de treino em caso de falha na API externa. \\ \hline
\end{tabular}
{\footnotesize Fonte: elaborado pelo autor.}
\end{table}
```
 
**Atenção:** procurar no `.tex` por `\ref{tab:requisitos-funcionais}` e `\ref{tab:requisitos-nao-funcionais}` e trocar pelo novo `\ref{tab:requisitos}`.
 
**O que mudou em cada requisito:**
 
| ID | Mudança | Motivo |
|---|---|---|
| RF03 | 3 tipos de série; esforço em RIR **ou** RPE | D9 |
| RF04 | semana de segunda a domingo | D10 |
| RF05 | "métricas semanais" passa a ser "séries da sessão" | D2/D15 |
| RF06 | vínculo com a sessão e com o `score_geral` | |
| RF07 | descrição das três abas | D17/D18 |
| RNF01 | "diversos dispositivos" passa a ser "celular" | o teste foi no DevTools |
| RNF03 | inclui o score; "no servidor" no lugar de "no backend" | o RPE é calculado pelo próprio banco |
| RNF05 | "preferencialmente" passa a ser "obrigatoriamente" | |
 
---
 
## E2 · Solução desenvolvida: tecnologias, arquitetura e fluxo (III.B-6, III.B-7)
 
**Onde:** seção nova `\section{Solução Desenvolvida}`, logo depois da Metodologia. Ela recebe o parágrafo da arquitetura (antes da Fig. 3) e o parágrafo da Fig. 4, que saem da Metodologia.
 
**Hoje diz (arquitetura):** "...e o PostgreSQL representa a camada de modelo, responsável pela persistência dos dados."
 
**Hoje diz (Fig. 4):** "...desde a solicitação do diagnóstico até a persistência e exibição."
 
```latex
\section{Solução Desenvolvida}
\label{sec:solucao}
 
\subsection{Tecnologias e Arquitetura}
 
O sistema foi implementado como uma aplicação web com \textit{frontend} e \textit{backend} separados, ambos escritos em TypeScript. O \textit{frontend} usa React com Vite, a biblioteca de componentes Material UI, react-router para a navegação entre telas e recharts para os gráficos. O \textit{backend} usa Node.js com Express 5, acesso ao PostgreSQL por consultas SQL parametrizadas, autenticação por \textit{token} JWT, com senhas armazenadas com \textit{hash} bcrypt, e o SDK oficial \texttt{@google/genai} para acessar o modelo \texttt{gemini-3.1-flash-lite}. Os testes automatizados usam o executor nativo do Node.js (\texttt{node:test}) com a biblioteca supertest.
 
A arquitetura seguiu o padrão MVC \cite{freeman2018pro}, com uma diferença em relação à proposta: o Modelo não é o PostgreSQL em si, mas a camada de \textit{models} do \textit{backend}, onde ficam as consultas SQL. O \textit{backend} foi organizado em rotas, \textit{controllers}, \textit{models} e uma camada de serviços, que concentra as regras de domínio: o cálculo do volume semanal, o cálculo do \textit{score} e a comunicação com o Gemini (Fig.~\ref{figComponentes}). Essa separação permitiu testar os cálculos de forma isolada e substituir a chamada real à IA por uma simulação durante os testes.
 
\subsection{Fluxo da Sessão e do Diagnóstico}
 
O diagnóstico é gerado por sessão de treino finalizada, e não por semana, como previa a proposta. Ao tocar em ``Finalizar e avaliar treino'', a interface faz duas requisições em sequência. A primeira finaliza a sessão: o servidor marca o treino como concluído e calcula sua duração. A segunda solicita o diagnóstico: o servidor confere se o treino pertence ao usuário e se está finalizado, respondendo com erro 409 caso ainda esteja aberto; busca as séries válidas da sessão, respondendo com erro 400 se não houver nenhuma; calcula o volume semanal e o \textit{score}; monta o \textit{prompt}; chama a API Gemini; valida o JSON retornado; e grava o diagnóstico (Fig.~\ref{figSequenciaIA}).
 
Separar a finalização da avaliação foi a forma encontrada para atender ao RNF06: quando a IA é chamada, a sessão já está salva. Se a API falhar ou devolver uma resposta fora do formato, o servidor responde com erro 502, nenhuma série é alterada e a tela oferece a opção ``Tentar avaliar de novo''. Sessões finalizadas sem diagnóstico também podem ser avaliadas depois, a partir do histórico.
```
 
**Para redesenhar a Fig. 3 (componentes):**
- **Visão:** React (Vite + Material UI) → HTTP/JSON →
- **Backend Node.js/Express**, com quatro caixas:
  - Rotas;
  - Controllers;
  - Services: `volumeService`, `scoreService`, `geminiService`;
  - Models (SQL).
- **Fora do backend:**
  - PostgreSQL, ligado aos Models;
  - API Gemini, ligada ao `geminiService`, como serviço externo.
**Para redesenhar a Fig. 4 (sequência).** Se faltar espaço, a figura sai e fica só o texto acima. Com a margem ganha ao tirar a seção do problema, talvez ela caiba.
- **Participantes:** Usuário, React, Backend (Controller + Services), PostgreSQL e Gemini.
- **Mensagens, em ordem:**
  1. Finalizar e avaliar →
  2. `POST /sessions/:id/finish` → UPDATE `completed` e duração → 200 →
  3. `POST /sessions/:id/diagnostics/generate` → SELECT do treino (409 se aberto) → SELECT das séries válidas (400 se vazio) → SELECT do volume semanal → calcular Pv, Pi e score → montar o prompt → `generateContent` (Gemini) → validar o JSON → INSERT em `DiagnosticoIA` → 201 → exibir.
- **Bloco `alt`:** falha do Gemini → 502 → "Tentar avaliar de novo".
**Por quê:**
- **MVC:** o TCC I dizia "Modelo = PostgreSQL", e o código não é assim.
- **Fluxo:** o diagnóstico passou a ser disparado ao finalizar a sessão (D15/D16).
---
 
## E2 · Modelo de dados e DER (III.B-8)
 
**Onde:** dentro da Solução desenvolvida, substituindo o parágrafo do DER ("Por fim, a persistência dos dados foi representada...").
 
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
**Relações:**
 
| De | Para | Cardinalidade |
|---|---|---|
| Usuario | Divisao, Treino, DiagnosticoIA | 1:N |
| Divisao | DivisaoExercicio | 1:N |
| Exercicio | DivisaoExercicio, SerieTreino | 1:N |
| GrupamentoMuscular | Exercicio | 1:N |
| Divisao | Treino | 0..1:N |
| Treino | SerieTreino | 1:N |
| Treino | DiagnosticoIA | **1:N** |
 
**Por quê:**
- **Divisão:** o RF02 precisava de tabelas próprias, e o DER do TCC I não tinha (D5).
- **Score:** a proposta prometia o `score_geral`, mas a coluna não estava no DER.
- **Diagnóstico:** passou a ser por sessão (D15).
---
 
## E2 · Integração com a IA: blocos do prompt e Tabela V (III.C-1, 2, 3)
 
**Onde:** `\subsection{Integração com Inteligência Artificial Generativa}`. Passa para dentro da Solução desenvolvida e substitui os dois parágrafos antes da Tabela V e a própria tabela.
 
**Hoje diz:**
- "...o contexto **da semana avaliada**, os dados brutos de treino...";
- "O bloco de dados injetará as métricas consolidadas **da semana**...".
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
 
**Referência nova:** `googleStructuredOutput`, com o BibTeX no card de referências da E3.
 
**Por quê:**
- **Contexto e dados:** passaram a ser da sessão (D15).
- **JSON:** é obrigatório, com esquema (RNF05).
- **Sem nota:** a IA não dá nota, porque o score é do servidor (D13).
---
 
## E2 · Score: momento do cálculo, Equação (1), Pv e Pi (III.C-4)
 
**Onde:** o parágrafo depois da Tabela V ("O retorno da API Gemini deve seguir formato JSON...") e a Equação (1).
 
**Hoje diz:** "Após o recebimento desse retorno, o backend em Node.js calculará o campo \texttt{score\_geral} em uma escala de 0 a 100. (...) facilitando a visualização do desempenho **da semana**."
 
**Pv decidido (15/10):** a média do Pv é sobre os **grupamentos treinados na sessão**, como o código já faz (`diagnosticController.ts`). O texto abaixo já está assim e traz uma frase justificando a escolha. Falta corrigir a D13 no `PLANEJAMENTO.md`, que ainda diz "grupamentos da divisão da semana".
 
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
 
**Tabela IV (conceitos → lógica):** recomendo **tirar**. O conteúdo dela já está no Referencial (II.B) e nesta subseção, e isso libera ~1/4 de página. Para manter mesmo assim, use esta versão atualizada:
```latex
Schoenfeld et al.~\cite{schoenfeld2017dose} & Volume de treino & Contagem semanal (segunda a domingo) de séries válidas por grupamento e comparação com o limiar de 10 séries; base de $P_v$. \\ \hline
Zourdos et al.~\cite{zourdos2016novel} & Intensidade relativa & Esforço informado em RIR ou RPE, com RPE $= 10 -$ RIR; base de $P_i$. \\ \hline
Helms et al.~\cite{helms2016application} & Autorregulação & Interpretação da sessão pela IA e progressão de carga no histórico. \\ \hline
```
 
**Por quê:**
- **Ordem do cálculo:** o texto dizia "após o retorno", mas o código calcula **antes** (D13).
- **Fórmulas:** o TCC II tinha só a Equação (1), sem explicar Pv e Pi.
- **Justificativa do Pv:** a banca pode perguntar por que não olhar a semana toda; a frase já responde.
- **Exemplo:** mostra que o score dá para conferir na mão.
---
 
## E2 · Interface, histórico e regras de uso (N1–N4)
 
**Onde:** dentro da Solução desenvolvida, depois do score. É conteúdo novo.
 
```latex
\subsection{Interface e Regras de Uso}
 
A interface possui cinco telas: Minha Divisão, onde o usuário monta a rotina semanal; Treino de Hoje, onde registra as séries; Volume da Semana, com as séries válidas por grupamento em relação ao limiar; Diagnóstico, com o \textit{score}, as pontuações $P_v$ e $P_i$, a análise por exercício e por grupamento e as recomendações para a próxima sessão; e Histórico. Em telas estreitas, a barra lateral de navegação é substituída por uma barra inferior de ícones, pensada para o uso com uma mão durante o treino (RNF01). Os campos numéricos aceitam vírgula decimal.
 
O histórico (RF07) foi organizado em três abas. A aba Cargas mostra, por exercício, a maior carga válida de cada sessão, com as repetições e a tonelagem (soma de carga $\times$ repetições); optou-se por não estimar a carga máxima (1RM), pois isso exigiria fórmulas fora do referencial adotado. A aba Volume mostra as séries válidas por grupamento nas últimas oito semanas. A aba Sessões apresenta um calendário mensal das sessões finalizadas, e cada sessão pode ser aberta com suas séries e seu diagnóstico.
 
Durante o desenvolvimento, surgiram regras que a proposta não previa. A semana de volume vai de segunda a domingo, as séries de uma sessão ainda aberta já contam no volume e grupamentos sem séries aparecem com zero. A duração da sessão é calculada pelo servidor, e não informada pelo usuário. Séries só podem ser registradas em uma sessão aberta. Ao iniciar uma nova sessão, uma sessão esquecida aberta de outro dia é encerrada automaticamente, sem duração, para não misturar dados de dias diferentes.
```
 
**Por quê:** são decisões que não estavam no TCC I (D6, D10, D11, D12, D17, D18, D20, D22). A banca pergunta sobre esse tipo de regra; com o texto, a resposta já está escrita.
 
---
 
## E2 · Ajustes em relação à proposta (N5)
 
**Onde:** última subseção da Solução desenvolvida.
 
```latex
\subsection{Ajustes em Relação à Proposta}
 
A implementação manteve os objetivos, os requisitos e a arquitetura da proposta, mas alguns pontos foram ajustados ao longo dos ciclos de desenvolvimento e registrados como decisões de projeto. O principal foi a unidade do diagnóstico: a proposta previa consolidar as métricas da semana, e o sistema passou a avaliar cada sessão finalizada, usando o volume semanal como contexto, para que o retorno chegasse logo após o treino e tratasse do que acabou de ser feito. O registro do esforço também mudou: em vez de pedir RPE e RIR separadamente, o sistema pede uma das escalas e calcula a outra, o que evita dupla digitação e valores incoerentes. Foi acrescentado o tipo de série \textit{feeder}, para registrar séries de aproximação sem inflar o volume. O \textit{score} passou a ser calculado antes da chamada à IA, e não depois, o que o torna independente do modelo. Por fim, a sugestão de \textit{deload} mencionada na proposta não foi implementada como regra, pois o \textit{deload} é uma redução planejada e o sistema não conhece a intenção do praticante; recomendações desse tipo aparecem apenas no texto gerado pela IA.
```
 
**Por quê:** a banca avalia a "consistência com a proposta apresentada". Uma mudança explicada conta a favor; uma mudança que aparece sem explicação conta contra.
 
---
 
## E2 · Procedimentos de validação e cronograma (III.D-1, 2, 3 e IV-2)
 
**Onde:** `\subsection{Procedimentos de Validação}`, na Metodologia. Substitui os três parágrafos das frentes. O texto antigo estava no futuro ("verificarão", "será conduzida") e dizia que o RNF03 era de integração, contradizendo a Tabela VI.
 
**Como os testes estão no repositório:**
- são 67 casos em 8 arquivos (`server/src/__tests__`);
- a maioria testa as rotas da API com supertest, contra um banco de teste;
- 3 são de unidade pura: `calcularPi`, `calcularPv` e `interpretarResposta`, em `diagnostic.test.ts`;
- `integration.test.ts` tem o fluxo completo, o teste de integridade e a falha simulada.
**Conferir os números com `npm test` antes de escrever.**
 
```latex
\subsection{Procedimentos de Validação}
 
A validação foi organizada em três frentes \cite{pressman2011engenharia}. A primeira consistiu em testes automatizados, executados contra um banco de dados de teste recriado a cada execução. Testes de unidade verificaram as funções de cálculo do \textit{score} e a validação da resposta da IA. Testes das rotas da API verificaram o cálculo do volume semanal, comparando-o com a contagem manual de cenários conhecidos (RF04), e as regras de cada funcionalidade. Testes de integração percorreram o fluxo completo, do cadastro à gravação e leitura do diagnóstico (RF05 a RF07), além da rejeição de registros órfãos pelo banco (RNF02) e da preservação dos registros quando a API falha (RNF06). Para que esses testes fossem determinísticos, a chamada ao Gemini pôde ser substituída por uma simulação, inclusive de falha.
 
A segunda frente foi uma inspeção de usabilidade baseada nas heurísticas de Nielsen \cite{nielsen1994enhancing}, realizada pelo autor nos fluxos de registro de séries (RF03) e de visualização do diagnóstico e do histórico (RF05 e RF07), no navegador de \textit{desktop} e no modo de dispositivo móvel das ferramentas de desenvolvedor do navegador (RNF01). Cada problema encontrado recebeu uma severidade de 0 a 4 \cite{nielsen1994severity}, e o critério de aceitação foi a ausência de problemas de severidade 3 ou 4 ao final das correções.
 
A terceira frente validou o conteúdo dos diagnósticos (RNF04). Foram montados [N] cenários de sessão com volume e esforço conhecidos, combinando grupamentos abaixo, no limiar e acima do limiar de 10 séries com séries de maior e menor intensidade. Cada diagnóstico gerado pela API real foi avaliado quanto à coerência com a literatura \cite{schoenfeld2017dose, zourdos2016novel, helms2016application}, à fidelidade aos dados enviados, à permanência no domínio do treinamento de força e à integridade do formato JSON.
```
 
**Cronograma:** a Fig. 6 sai. Esta frase pode ir para o fim da Metodologia ou para o início dos Resultados.
```latex
Em relação ao cronograma da proposta, a implementação foi antecipada: o banco de dados, previsto para setembro e outubro, foi implementado em agosto; a integração com o Gemini, prevista para outubro e novembro, foi concluída em setembro; e a validação, prevista para novembro, ocorreu em outubro. O desenvolvimento foi concluído em 4 de outubro de 2026, um mês antes da entrega final.
```
 
**Referência nova:** `nielsen1994severity`, para a escala de 0 a 4.
 
---
 
## E3 · Resultados: testes e Tabela VI (RES1, III.D-4)
 
**Onde:** seção nova `\section{Resultados}`, depois da Solução desenvolvida. A Tabela VI (`tab:matriz-rastreabilidade`) passa para cá e ganha a coluna **Resultado**.
 
```latex
\section{Resultados}
 
\subsection{Testes Automatizados}
 
A suíte de testes do \textit{backend} reúne [N] casos de teste, distribuídos em [8] arquivos, e todos foram executados com sucesso na versão final do sistema. A Tabela~\ref{tab:matriz-rastreabilidade} relaciona cada requisito ao método usado para verificá-lo e ao resultado obtido. [Se quiser, cite um caso: ``No teste de falha simulada, a API externa foi forçada a falhar após a finalização da sessão; o servidor respondeu com erro 502 e o número de séries gravadas permaneceu o mesmo antes e depois da tentativa.'']
 
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
 
**Antes de escrever:**
- rodar `npm test` em `server/` e copiar o total da saída (`# tests` / `# pass`);
- se algum requisito não passar por inteiro, trocar "Atendido" por "Atendido com ressalva" e explicar em uma frase.
---
 
## E3 · Resultados: heurística, validação da IA e prints (RES2, RES3, RES4)
 
### Heurística de Nielsen
 
Molde. Preencher com a tabela de achados da Frente 2.
 
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
 
### Validação do conteúdo da IA
 
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
 
### Prints
 
Usar 3 ou 4 figuras, seguindo as regras do card de prints. Modelo para cada uma:
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
 
## E3 · Conclusões (IV-1)
 
**Onde:** `\section{Conclusões Parciais}`. A seção é renomeada para `\section{Conclusões}` e o texto inteiro é substituído. Também sai o parágrafo do cronograma, junto com a Fig. 6.
 
```latex
\section{Conclusões}
 
Este trabalho desenvolveu um sistema web integrado à IA generativa para apoiar praticantes experientes no gerenciamento do treinamento de hipertrofia. Os quatro objetivos específicos foram atendidos: as métricas de volume semanal, RPE e RIR foram mapeadas na literatura e traduzidas em regras de cálculo; a arquitetura MVC foi implementada com React, Node.js e PostgreSQL; a integração com o Gemini foi feita por um \textit{prompt} estruturado em cinco blocos, com saída em JSON validada; e o protótipo foi validado por testes automatizados, inspeção heurística e avaliação do conteúdo dos diagnósticos.
 
A decisão de maior impacto foi separar o que é calculado do que é interpretado. Volume, intensidade e \textit{score} são calculados pelo servidor de forma determinística e verificável, enquanto a IA fica responsável apenas por interpretar esses números em linguagem natural. Essa divisão reduz o efeito de eventuais erros do modelo sobre a informação mais objetiva apresentada ao usuário. Avaliar cada sessão, em vez da semana, aproximou o retorno do momento do treino.
 
O trabalho tem limitações. Cada exercício está associado a um único grupamento muscular, o que subestima o volume dos grupamentos sinergistas. O $P_v$ considera apenas os grupamentos da sessão avaliada; um grupamento previsto na divisão e negligenciado na semana não reduz o \textit{score}, embora apareça na tela de volume semanal. A validação foi feita sem usuários reais, a inspeção de usabilidade contou com um único avaliador e a responsividade foi verificada no modo de dispositivo móvel do navegador, e não em aparelhos físicos. O sistema não registra o descanso entre séries e não foi publicado em ambiente de produção. A qualidade dos diagnósticos também depende do modelo de linguagem utilizado, que pode mudar de versão.
 
Como trabalhos futuros, sugerem-se: avaliar o sistema com praticantes reais por um período prolongado; associar cada exercício a mais de um grupamento, com pesos diferentes; incluir o perfil e a anamnese do usuário no contexto do \textit{prompt}; e publicar o sistema em ambiente de produção.
```
 
**Antes de fechar:** conferir se as limitações batem com o que aconteceu na validação (Frentes 2 e 3) e se os trabalhos futuros batem com a lista 🧊 do Trello.
 
---
 
## E3 · Resumo e palavras-chave (R1)
 
**Onde:** `\begin{abstract}`. Substitui o texto inteiro, que hoje está no futuro ("Nesta primeira etapa...", "A etapa seguinte prevê..."). Escrever por último, quando os números existirem.
 
```latex
\begin{abstract}
O treinamento de força voltado à hipertrofia exige, em praticantes experientes, o controle conjunto do volume semanal de séries, da Percepção Subjetiva de Esforço (RPE) e das Repetições em Reserva (RIR), um cruzamento difícil de sustentar manualmente. Este trabalho desenvolveu um sistema web, estruturado no padrão MVC com React, Node.js e PostgreSQL, que registra as séries de cada sessão, calcula o volume semanal por grupamento muscular e, ao final de cada sessão, gera um diagnóstico por meio da API do Google Gemini, com um \textit{prompt} estruturado em cinco blocos e saída em JSON. Um \textit{score} de 0 a 100, que combina volume e intensidade, é calculado no servidor de forma determinística, independentemente da IA. O desenvolvimento seguiu a metodologia FDD em nove ciclos semanais. A validação incluiu [N] testes automatizados, todos aprovados, uma inspeção heurística de usabilidade sem problemas graves remanescentes e a avaliação de [N] cenários de sessão, nos quais os diagnósticos se mostraram [coerentes] com a literatura.
\end{abstract}
```
 
**Palavras-chave:** podem ficar iguais. Uma opção é trocar "Aplicação Web" por "Sistema Web", mais fiel ao título.
 
---
 
## E3 · Declaração de uso de IA (IA1)
 
**Onde:** `\section*{...}` sem número, **entre o Referencial teórico e a Metodologia** (lugar recomendado, 19/10). Sem número, a numeração das outras seções e o parágrafo de organização da Introdução não mudam. Se o curso tiver modelo próprio de texto, usar o modelo.
 
```latex
\section*{Declaração de Uso de Inteligência Artificial}
 
Durante a realização deste trabalho, o autor utilizou o assistente de IA Claude (Anthropic) como ferramenta de apoio para: o planejamento das etapas de desenvolvimento; a elaboração de roteiros de implementação com exemplos de código; o apoio à depuração e à revisão do código; e a elaboração de sugestões de redação e a revisão do texto. Todo conteúdo produzido com apoio da ferramenta foi revisado, adaptado e validado pelo autor, que assume integral responsabilidade pelo texto, pelo código-fonte e pelos resultados apresentados. O modelo Gemini (Google), utilizado para gerar os diagnósticos, é componente do sistema desenvolvido e está descrito na Seção~\ref{sec:solucao}.
```
 
**Ajustar antes de usar:**
- **Ferramentas:** listar todas as que você usou de fato (Claude no chat, Claude Code, Copilot, outras).
- **Sugestões de redação:** o item "elaboração de sugestões de redação" precisa estar na declaração, porque os textos destes cards são sugestões geradas com IA. Ser específico conta a favor.
- **`\ref{sec:solucao}`:** a Solução vem depois da declaração; o LaTeX resolve a referência normalmente.
---
 
## E3 · Referências novas (BibTeX)
 
O orientador liberou referências novas. Colar no `references.bib`. O projeto usa biblatex + biber, que aceita `@online`.
 
```bibtex
@online{googleStructuredOutput,
  author  = {{Google}},
  title   = {Structured outputs -- {Gemini API}},
  year    = {2026},
  url     = {https://ai.google.dev/gemini-api/docs/structured-output},
  urldate = {2026-10-15}
}
 
@online{nielsen1994severity,
  author       = {Nielsen, Jakob},
  title        = {Severity Ratings for Usability Problems},
  organization = {Nielsen Norman Group},
  year         = {1994},
  url          = {https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/},
  urldate      = {2026-10-15}
}
```
 
| Chave | Onde é citada | O que sustenta |
|---|---|---|
| `googleStructuredOutput` | III.C (Integração com a IA) | esquema de resposta do Gemini (RNF05) |
| `nielsen1994severity` | III.D (Procedimentos de validação) | escala de severidade 0–4 |
 
**Opcionais**, só se citar no texto. São documentações oficiais, no mesmo formato `@online`:
- TypeScript: https://www.typescriptlang.org/docs/
- Express: https://expressjs.com/
- Material UI: https://mui.com/material-ui/
**Conferir também:**
- se toda referência do `.bib` continua citada depois dos cortes. Com `\printbibliography`, só as citadas aparecem, então nada sobra na lista. A `bondaronek2018quality` é citada na Introdução do TCC I, então continua;
- se a [14], documentação do Node, está na versão usada. O README pede Node 18+.
---
 
## E4 · Lista de busca (Ctrl+F) para a revisão final
 
Procurar cada termo no TCC II e conferir caso a caso.
 
| Buscar | O que fazer |
|---|---|
| `será`, `serão`, `prevê`, `utilizará`, `injetará`, `instruirá`, `calculará`, `verificarão`, `cobrirá` | passar para o passado |
| `nesta primeira etapa`, `etapa seguinte`, `Conclusões Parciais`, `TCC II` | apagar ou reescrever |
| `semana avaliada`, `métricas semanais`, `consolidadas da semana`, `desempenho da semana` | trocar por sessão |
| `semanal` (todas as ocorrências) | conferir: o **volume** semanal está certo; o **diagnóstico** semanal está errado |
| `deload` | não pode aparecer como funcionalidade |
| `aquecimento ou válida` | trocar pelos 3 tipos |
| `preferencialmente` | trocar por obrigatoriamente |
| `Após o recebimento` | o score é calculado antes |
| `diversos dispositivos`, `exclusivamente no backend` | ajustar (RNF01 e RNF03) |
| `representa a camada de modelo` | o PostgreSQL não é o Modelo |
| `solicitação do diagnóstico` | trocar por "Finalizar e avaliar treino" |
| `\ref{quadroFDD}`, `\ref{figCasoUso}`, `\ref{figDominio}`, `\ref{fig:cronograma}`, `\ref{tab:requisitos-funcionais}`, `\ref{tab:requisitos-nao-funcionais}`, `\ref{sec:problema}` | referências a itens que saíram; o PDF mostra "??" |
| `??` no PDF compilado | `\ref` quebrado |
| `Tabela 5`, `Tabela 6` | usar `\ref`, nunca o número escrito |
| `HyperTrack`, `Trainna` | usar o mesmo nome em todo o texto, ou nenhum |
| ordem das seções | Introdução, Referencial, Declaração de IA, Metodologia, Solução, Resultados, Conclusões |
| número de páginas | até 10 |
 
