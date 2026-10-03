# HyperTrack — Sistema de Gerenciamento de Hipertrofia

Sistema web para registrar treinos de musculação e receber, ao fim de cada
sessão, um diagnóstico gerado por IA (Google Gemini). Feito como projeto do
TCC II.

- **Aluno:** João Vitor dos Santos Ritter
- **Orientador:** Fabiano Niederauer Flôres

## O que o sistema faz

- **Minha divisão:** monta a rotina da semana, escolhendo os exercícios de cada dia.
- **Treino de hoje:** começa o treino do dia e registra as séries (aquecimento,
  feeder ou válida) com carga, repetições e esforço, em RIR ou RPE.
- **Volume da semana:** conta as séries válidas por grupamento muscular e compara
  com o limiar de 10 séries semanais.
- **Diagnóstico:** ao finalizar o treino, a IA avalia a sessão e o sistema mostra
  um score de 0 a 100 com pontos fortes e o que ajustar.
- **Histórico:** lista as sessões passadas, com séries e diagnóstico de cada uma.

O layout se adapta ao celular: no lugar da sidebar, aparece uma barra de ícones
embaixo da tela.

## Como foi feito

Parti de um protótipo que fiz antes com ajuda de IA, o `servidorHipertrofia`. Ele
usava a mesma stack, mas deixava de cumprir pontos centrais do artigo: não tinha
RPE, o score era inventado pela própria IA e não havia testes. Então recomecei
limpo neste repositório, em arquitetura MVC, corrigindo isso.

Algumas decisões que vieram da literatura do artigo:

- **Volume:** conta só séries válidas, com limiar de 10 séries por semana por
  grupamento (Schoenfeld). A semana vai de segunda a domingo.
- **Esforço:** RIR e RPE são a mesma informação em réguas diferentes
  (`RPE = 10 - RIR`). A pessoa escolhe uma, e o banco calcula a outra.
- **Score:** `score_geral = (Pv + Pi) / 2`, calculado no backend. Pv mede o volume
  e Pi mede a intensidade. A IA só escreve o texto, nunca o número.
- **Prompt:** segue a estrutura de 5 blocos descrita no TCC, e o treino é salvo
  antes de chamar o Gemini, então uma falha da IA não perde nada.

O planejamento completo, semana a semana, está em [`01-planejamento/`](./01-planejamento).

## Tecnologias

- **Backend:** Node.js, Express, TypeScript e PostgreSQL
- **Frontend:** React, Vite, TypeScript e Material UI
- **IA:** Google Gemini (com `GEMINI_MOCK=true` dá para rodar sem chave)
- **Testes:** `node:test` e supertest, com testes de unidade e de integração

## Estrutura

```
server/             API REST (MVC)
  src/
    routes/           URL -> controller
    controllers/      recebe a requisição e valida
    models/           SQL
    services/         score, volume e chamada do Gemini
    __tests__/        testes
  schema.sql          tabelas do banco
client/             front React
  src/
    views/            uma por tela
    components/       Sidebar, barra inferior, diálogos
01-planejamento/    roteiros semanais e decisões do TCC
```

## Como rodar

Precisa de Node.js 18+ e PostgreSQL.

```bash
git clone https://github.com/joaovritter/tcc.git
cd tcc

# backend
cd server
npm install
cp .env.example .env     # preencher DATABASE_URL e JWT_SECRET
psql -d nome_do_banco -f schema.sql
npm run seed             # grupos musculares e exercícios
npm run dev              # http://localhost:3000

# frontend (outro terminal)
cd client
npm install
npm run dev              # http://localhost:5173
```

Para usar a IA de verdade, coloque a chave em `GEMINI_API_KEY` e mude
`GEMINI_MOCK` para `false`. A chave sai em https://aistudio.google.com/apikey.

## Scripts do `server/`

| Script | O que faz |
|---|---|
| `npm run dev` | sobe a API com hot-reload |
| `npm run seed` | popula grupos musculares e exercícios |
| `npm run db:reset` | apaga e recria o banco com o seed |
| `npm run test` | roda os testes |
| `npm run build` | compila o TypeScript |
