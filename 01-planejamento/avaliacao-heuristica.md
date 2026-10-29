# Avaliação heurística de Nielsen — roteiro (Frente 2)

Roteiro para fazer a inspeção de usabilidade do sistema e transformar o resultado em texto para o TCC II.

- **Planilha de apoio:** `avaliacao-heuristica-achados.xlsx` (abas Instruções, Achados, Resumo e Listas).
- **Tempo estimado:** 3 a 4 horas no total.
- **Prazo:** antes de escrever os Resultados (E3, até 01/11).
- **Requisitos cobertos:** RF03 (registro de séries), RF05 (diagnóstico), RF07 (histórico) e RNF01 (uso no celular).
- **Critério de aceite:** nenhum problema de severidade 3 ou 4 sem correção ao final.

---

## Checklist rápido

- [ ] 1. Preparar o ambiente e os dados (30 min)
- [ ] 2. Executar as tarefas T1, T2 e T3 no desktop e no celular (1h30)
- [ ] 3. Fazer a 2ª passada, heurística por heurística (1h)
- [ ] 4. Dar a severidade de cada achado
- [ ] 5. Corrigir o que for grave e registrar o antes e depois (até 1h)
- [ ] 6. Fechar a conclusão (aba Resumo)
- [ ] 7. Escrever o texto dos Resultados (VI.B)

---

## Onde estamos

- **Dados prontos:** `joao@teste.com` (5 semanas de treino, 28/09 a 26/10, com diagnóstico) e `joao2@teste.com` (vazio). Senha dos dois: `www.com.brj`. Se o banco mudar, `npm run seed:demo` em `server/` recria os dois.
- **1ª passada (T1, T2, T3) feita:** anotações em `resultados_heuristica.md`. Confira se ela foi feita **nos dois dispositivos**; se faltou o celular, repita só o que mudar de layout (T1 inteira e o calendário da T3).
- **Agora:** passar as anotações para a planilha (rascunho logo abaixo) e fazer a 2ª passada tela por tela (seção 3, "Roteiro por tela").

### Rascunho de achados da 1ª passada (para a aba Achados)

A severidade é sugestão; a decisão é sua. Preencha o **Dispositivo** conforme onde viu o problema.

| ID | Tela | Tarefa | Heurística | Problema | Sev. sugerida |
|---|---|---|---|---|---|
| A1 | Treino de Hoje | T1 | 9. Ajudar a corrigir erros | RIR 7: a série é recusada, mas o aviso aparece no topo do card, longe do campo, e o campo não fica marcado em vermelho. | 2 |
| A2 | Treino de Hoje | T1 | 9. Ajudar a corrigir erros (ou 1. Visibilidade) | Carga vazia: o botão "Registrar série" só fica desabilitado, sem dizer qual campo falta. | 1 ou 2 |
| A3 | Treino de Hoje | T1 | 5. Prevenção de erros | Carga absurda (9999 kg) é aceita e gravada; não há limite nem pedido de confirmação. | 2 |
| A4 | Treino de Hoje | T1 | 3. Controle e liberdade | Não dá para editar uma série; é preciso apagar e registrar de novo. | 2 |

**Não é achado:** carga com vírgula (22,5). O sistema converte para 22.5 de propósito; confira na lista se apareceu "22.5 kg". Se apareceu, isso conta a favor da heurística 2 (o praticante digita como está acostumado).

---

## 1. Preparar (30 min)

1. **Subir o sistema** com `GEMINI_MOCK=false`, para o diagnóstico ser real.
2. **Montar dados realistas** em um usuário de teste:
   - divisão semanal preenchida;
   - 3 ou 4 sessões finalizadas na mesma semana, com diagnóstico;
   - cargas e repetições de verdade (nada de "teste", "aaa" ou 999 kg).
3. **Criar um segundo usuário, sem dados**, para ver as telas vazias.
4. **Preparar os dois ambientes:**
   - **Desktop:** janela normal do navegador.
   - **Celular:** DevTools (F12) → modo de dispositivo → iPhone 12 (390 px).
5. **Abrir a planilha** na aba Achados.
6. **Aproveitar a sessão para os prints do artigo**, com o mesmo usuário e os mesmos dados.

---

## 2. Executar as tarefas (1h30)

Cada tarefa é feita **duas vezes**: uma no desktop e outra no modo celular.

### T1 — Registrar uma sessão (RF03)

1. Abrir **Treino de Hoje** e iniciar a sessão.
2. Registrar um aquecimento.
3. Registrar um *feeder*.
4. Registrar três séries válidas: duas com RIR e uma com RPE.
5. **Errar de propósito** e ver como o sistema reage:
   - RIR 7 (fora da faixa 0 a 4);
   - campo de carga vazio;
   - carga com vírgula (ex.: 22,5);
   - carga absurda (ex.: 9999).
6. Editar uma série e apagar outra.
7. Tocar em **"Finalizar e avaliar treino"**.

### T2 — Ver o diagnóstico (RF05)

1. Observar a espera: dá para saber que o diagnóstico está sendo gerado?
2. Ler o score, o Pv, o Pi, a análise e as recomendações. Um praticante entenderia sem explicação?
3. **Forçar uma falha:** trocar a chave do Gemini por uma inválida (ou desligar a internet) e avaliar de novo.
   - Aparece mensagem de erro? Ela diz o que fazer?
   - O botão **"Tentar avaliar de novo"** funciona depois de corrigir a chave?
   - As séries continuam salvas?

### T3 — Histórico (RF07)

1. Passar pelas abas **Cargas**, **Volume** e **Sessões**.
2. Abrir uma sessão antiga pelo calendário e ver as séries e o diagnóstico dela.
3. Entrar com o **usuário sem dados** e ver o histórico vazio. A tela explica o que fazer?

**Durante as tarefas:** anote tudo o que travar, confundir ou irritar. Isso é a 1ª passada (livre). Marque a tarefa como "Livre (1ª passada)" na planilha quando não souber ainda qual heurística foi violada.

---

## 3. Segunda passada: heurística por heurística (1h)

Para cada tela (Minha Divisão, Treino de Hoje, Volume da Semana, Diagnóstico, Histórico), responda às 10 perguntas. Cada "não" é um achado.

| # | Heurística | Pergunta para este sistema |
|---|---|---|
| 1 | Visibilidade do estado do sistema | Dá para saber se a série foi salva? Se o diagnóstico está gerando? |
| 2 | Correspondência com o mundo real | Os termos são de academia (série, carga, RPE) e não de programador? |
| 3 | Controle e liberdade do usuário | Dá para desfazer, apagar uma série errada ou voltar? |
| 4 | Consistência e padrões | Os botões e rótulos são iguais em todas as telas? |
| 5 | Prevenção de erros | A tela impede RIR fora de 0 a 4? Pede confirmação ao apagar? |
| 6 | Reconhecer em vez de lembrar | A tela mostra a última carga, ou o usuário precisa lembrar? |
| 7 | Flexibilidade e eficiência | Registrar uma série leva poucos toques? |
| 8 | Estética e design minimalista | A tela de treino tem só o necessário? |
| 9 | Ajudar a corrigir erros | As mensagens de erro são claras e dizem o que fazer? |
| 10 | Ajuda e documentação | As telas vazias explicam o próximo passo? |

### Roteiro por tela

Os nomes das telas são os da coluna **Tela** da planilha. Para cada uma: abra no desktop e no celular (iPhone 12, 390 px), passe pelas 10 heurísticas e anote os "não". Os itens **"Conferir"** são pontos que eu vi no código e que podem virar achado; confirme olhando a tela antes de registrar.

#### 1. Login/Cadastro
- **Como abrir:** sair do sistema (ícone de sair).
- **O que tem:** e-mail, senha, botão Entrar, link "Não tem conta? Criar uma" (o cadastro acrescenta o campo Nome).
- **Conferir:**
  - H9: senha errada e e-mail já cadastrado. A mensagem diz o que fazer?
  - H1: o botão muda para "Enviando..." enquanto espera?
- [ ] Desktop  [ ] Celular

#### 2. Minha Divisão
- **Como abrir:** menu "Minha divisão", com `joao@teste.com`; depois com `joao2@teste.com` (vazio).
- **O que tem:** um campo por dia, ícone de descanso (soneca), botão "Exercícios" por dia, "Salvar semana" e o diálogo de exercícios (busca, filtro por grupamento, adicionar, subir/descer, remover, "Salvar exercícios").
- **Conferir:**
  - H6/H2: o ícone de descanso só explica o que faz no tooltip, e no celular não existe hover. Dá para entender sem passar o mouse?
  - H3/H5: no diálogo de exercícios, clicar fora dele ou em "Cancelar" descarta as mudanças sem avisar.
  - H1: depois de "Salvar semana", aparece "Divisão salva com sucesso!"? E depois de "Salvar exercícios" aparece algum aviso, ou o diálogo só fecha?
  - H10 (joao2): a tela vazia explica que é preciso dar nome ao dia e depois escolher os exercícios?
- [ ] Desktop  [ ] Celular

#### 3. Treino de Hoje
- **Como abrir:** menu "Treino de hoje". É a tela da T1; aproveite o que já anotou.
- **O que tem:** "Começar treino", seletor RIR/RPE (vale para a sessão toda), um bloco por exercício (Tipo, Carga (kg), Reps, RIR ou RPE, "Registrar série"), a lista de séries com lixeira e, no fim, "Finalizar e avaliar treino", que pede um segundo toque para confirmar.
- **Conferir:**
  - **H3/H5: a lixeira apaga a série na hora, sem confirmação e sem desfazer.** É o exemplo de severidade 3 do próprio roteiro; se confirmar, é obrigatório corrigir.
  - H6: a tela não mostra a carga nem as repetições da última sessão daquele exercício. O usuário precisa lembrar.
  - H1: depois de registrar, a série aparece na lista. Isso basta como confirmação, ou falta um aviso de "série salva"?
  - H1/H9 (celular): o aviso de erro aparece no topo do card. Registrando o 5º exercício no celular, dá para ver o erro sem rolar a tela?
  - H4/H8 (celular): a barra de ícones fixa embaixo cobre o botão "Finalizar e avaliar treino" no fim da página? Se cobrir e não der para tocar, é severidade 4.
  - H10 (joao2 ou dia sem divisão): a mensagem "dia de descanso" diz onde cadastrar a divisão?
- [ ] Desktop  [ ] Celular

#### 4. Volume da Semana
- **Como abrir:** menu "Volume da semana". Como hoje é meio de semana, com joao aparecem poucas séries (só o Push de segunda e o que você registrou na T1). Isso é esperado.
- **O que tem:** uma barra por grupamento, um chip "N / 10 séries" e o texto "Faltam N séries para o limiar".
- **Conferir:**
  - H2: "limiar" e "séries válidas" são termos que um praticante entende? Em algum lugar diz que aquecimento e feeder não contam?
  - H10 (joao2): todos os grupamentos aparecem com "Nenhuma série válida nesta semana". A tela diz o que fazer para isso mudar?
  - H6: dá para ver a semana passada daqui, ou só no Histórico → Volume? Basta saber que existe.
- [ ] Desktop  [ ] Celular

#### 5. Diagnóstico
- **Como abrir:** menu "Diagnóstico" (mostra o diagnóstico da sessão mais recente).
- **O que tem:** score de 0 a 100 no círculo, chips de Pv e Pi, análise por grupamento, por exercício e recomendações.
- **Conferir:**
  - H2: o praticante entende o que são Pv e Pi só pelos chips? E a cor do score (vermelho, amarelo, verde)?
  - H4: o título do menu é "Diagnóstico" e o da tela é "Diagnóstico da Sessão". Fica claro que é só da última sessão?
  - H6: a tela leva para diagnósticos anteriores, ou o usuário precisa saber que eles estão no Histórico → Sessões?
  - H10 (joao2): "Nenhum diagnóstico ainda. Em Treino de hoje, toque em Finalizar e avaliar treino…". Bom exemplo de tela vazia bem resolvida (pode citar no texto).
- [ ] Desktop  [ ] Celular

#### 6. Histórico – Cargas
- **Como abrir:** menu "Histórico", aba Cargas.
- **O que tem:** um seletor de exercício e o gráfico da maior carga válida por sessão. O tooltip mostra reps, séries e tonelagem.
- **Conferir:**
  - H6 (celular): o detalhe do ponto só aparece no tooltip. Tocando no ponto, ele abre?
  - H2: "tonelagem" é claro?
  - H10 (joao2): "Nenhuma série válida registrada ainda." Diz o que fazer? (Compare com a do Diagnóstico.)
- [ ] Desktop  [ ] Celular

#### 7. Histórico – Volume
- **Como abrir:** aba Volume.
- **O que tem:** uma linha por semana com chips "Grupamento N/10" (verde quando atingiu o limiar).
- **Conferir:**
  - H10 (joao2): sempre aparecem as últimas 8 semanas, com todos os chips zerados e nenhum texto explicando. A tela diz o que fazer?
  - H8: com 8 semanas e 7 grupamentos, fica legível no celular?
- [ ] Desktop  [ ] Celular

#### 8. Histórico – Sessões
- **Como abrir:** aba Sessões. Com joao, navegue até setembro pelas setas e abra uma sessão (detalhe com séries e "Avaliação da IA", botão de voltar ao calendário).
- **O que tem:** calendário do mês com um ponto colorido nos dias de treino, lista de treinos do dia escolhido, card com score, divisão, hora, séries válidas e duração.
- **Conferir:**
  - **H1: ao abrir a aba, antes de tocar em um dia, aparece "Nenhum treino finalizado neste mês." mesmo em outubro, que tem treinos.** A mensagem engana; é forte candidato a severidade 2 ou 3.
  - H6/H10: não há legenda para a cor dos pontos. Dá para saber o que verde, amarelo e vermelho significam?
  - H3: o "voltar" do detalhe volta para o mesmo mês e dia que estavam abertos?
- [ ] Desktop  [ ] Celular

#### 9. Navegação geral
- **O que olhar:** a sidebar no desktop e a barra de ícones no celular.
- **Conferir:**
  - H6 (celular): a barra inferior só tem ícones, sem texto. Dá para saber qual é qual sem decorar?
  - H4: os nomes não batem com os títulos. "Minha divisão" e "Treino de hoje" no menu viram "Minha Divisão" e "Treino de Hoje" no título; "Diagnóstico" vira "Diagnóstico da Sessão". Cosmético (severidade 1), mas é um achado de consistência fácil de mostrar.
  - H1: fica claro em qual tela você está (item ativo destacado)?
- [ ] Desktop  [ ] Celular

---

## 4. Dar a severidade

| Nota | Significado | Exemplo neste sistema |
|---|---|---|
| 0 | Não é problema | — |
| 1 | Cosmético | alinhamento torto, cor inconsistente |
| 2 | Menor | sem aviso de "série salva" |
| 3 | Maior | apagar série sem confirmação |
| 4 | Catástrofe | botão de finalizar some no celular |

**Como decidir:** pense em três perguntas.
- **Frequência:** acontece sempre ou só em um caso raro?
- **Impacto:** o usuário erra, perde dados ou só se incomoda?
- **Persistência:** dá para contornar facilmente?

**Regras para a planilha:**
- Um problema por linha.
- O mesmo problema em duas telas conta como **um** achado (escreva as duas telas na coluna Tela).
- Guarde um print de cada achado (coluna Evidência).
- Seja honesto. Zero problemas soa falso para a banca; o normal é algo entre 5 e 15.

---

## 5. Corrigir (até 1h)

O code freeze foi em 19/10. Correções de usabilidade apontadas pela avaliação são aceitáveis, desde que sejam pequenas e ligadas aos achados.

| Severidade | O que fazer |
|---|---|
| 3 e 4 | corrigir sempre (é o critério de aceite) |
| 2 | corrigir se for rápido |
| 0 e 1 | só registrar |

**Depois das correções:**
1. Marcar "Sim" na coluna Corrigido? e descrever a correção.
2. Tirar o print **depois** (pelo menos de uma correção, para mostrar o antes e depois).
3. Rodar `npm test` em `server/` e confirmar que tudo passa.
4. Fazer o commit e criar uma tag nova (ex.: `v1.0.1`).
5. Tirar os prints finais do artigo.

---

## 6. O que concluir (aba Resumo)

A aba Resumo calcula sozinha:
- **total de achados** e quantos de cada severidade;
- **quantos foram corrigidos**;
- **heurísticas mais violadas**, com a severidade média de cada uma;
- **critério de aceite do RNF01:**
  - nenhum problema de severidade 3 ou 4 sem correção → **Atendido**;
  - sobrou algum → **Atendido com ressalva** (explicar em uma frase no texto);
- **frase pronta** com a contagem, para colar no texto.

Responda também, em uma linha cada:
- Qual tela teve mais problemas?
- Algum problema só apareceu no celular?
- Qual foi a correção mais importante?

---

## 7. Como vira texto (Resultados, VI.B)

Molde que já está no `textos-recomendados-tcc2.md`, com o ajuste do code freeze:

```latex
\subsection{Avaliação Heurística de Usabilidade}

A inspeção identificou [N] problemas de usabilidade nos fluxos avaliados: [a] de severidade 1, [b] de severidade 2, [c] de severidade 3 e [d] de severidade 4. [Descrever em uma ou duas frases os mais relevantes, citando a heurística violada. Exemplo: ``Na tela Treino de Hoje, não havia confirmação visual após salvar uma série, violando a heurística de visibilidade do estado do sistema (severidade 2).''] Os problemas de severidade 2 ou superior foram corrigidos [ajustar: ou "os de severidade 3 ou superior"], e nenhum problema de severidade 3 ou 4 permaneceu, atendendo ao critério definido para o RNF01.
```

**Tabela opcional** (só se couber no limite de 10 páginas), com os 3 a 5 achados principais:

```latex
\begin{table}[!h]
\centering
\caption{Principais achados da avaliação heurística}
\label{tab:heuristica}
\scriptsize
\begin{tabular}{|p{0.30\columnwidth}|p{0.30\columnwidth}|p{0.10\columnwidth}|p{0.16\columnwidth}|}
\hline
\textbf{Tela} & \textbf{Heurística violada} & \textbf{Sev.} & \textbf{Situação} \\ \hline
Treino de Hoje & [...] & [2] & Corrigido \\ \hline
\end{tabular}
{\footnotesize Fonte: elaborado pelo autor.}
\end{table}
```

**Na tabela de rastreabilidade (VI.A):** trocar o `[preencher]` do RNF01 por "Atendido" ou "Atendido com ressalva", conforme o Resumo.

**Limitações** (já estão nas Conclusões): avaliador único, que é o próprio autor do sistema, e celular testado só pelo DevTools.

**Referências usadas:** `nielsen1994enhancing` (heurísticas) e `nielsen1994severity` (escala 0–4). O BibTeX da segunda está no `textos-recomendados-tcc2.md`.
