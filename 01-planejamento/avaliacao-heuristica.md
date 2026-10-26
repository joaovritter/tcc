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
