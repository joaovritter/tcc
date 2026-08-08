# Sistema de Gerenciamento de Hipertrofia — TCC

Sistema web para acompanhamento de treino de hipertrofia, com diagnóstico
semanal gerado por IA (Google Gemini). Projeto de TCC II.

- **Aluno:** João Vitor dos Santos Ritter
- **Orientador:** Fabiano Niederauer Flôres
- **Planejamento completo:** [`01-planejamento/`](./01-planejamento)

## Stack

- **Backend:** Node.js + Express + TypeScript + PostgreSQL
- **Frontend:** React + Vite + TypeScript
- **IA:** Google Gemini (com mock local via `GEMINI_MOCK`, pra não depender de
  chave/quota durante o dev)

## Estrutura

```
server/             API REST (MVC)
  src/
    config/db.ts       conexão com o Postgres (pool)
    routes/             URL -> controller
    seed.ts             popula grupos musculares + exercícios
  schema.sql          criação das 8 tabelas do DER
  scripts/             scripts descartáveis (ex.: teste da chave Gemini)
client/              front React + Vite (template react-ts)
01-planejamento/    roteiros semanais, planejamento e tasks do TCC
```

## Pré-requisitos

- Node.js 18+
- PostgreSQL rodando localmente (ou acessível via `DATABASE_URL`)
- Chave de API do Gemini em https://aistudio.google.com/apikey (opcional em
  dev — dá pra usar `GEMINI_MOCK=true`)

## Setup

### 1. Clonar

```bash
git clone https://github.com/joaovritter/tcc.git
cd tcc
```

### 2. Backend (`server/`)

```bash
cd server
npm install
cp .env.example .env
```

Editar o `.env` com os valores reais:

```
PORT=3000
DATABASE_URL=postgresql://usuario:senha@localhost:5432/nome_do_banco
JWT_SECRET=uma_string_bem_grande_e_aleatoria
GEMINI_API_KEY=
GEMINI_MOCK=true
```

Criar o banco e rodar o schema:

```bash
psql -d nome_do_banco -f schema.sql
```

Popular grupos musculares + exercícios:

```bash
npm run seed
```

Subir a API:

```bash
npm run dev
```

Testar: `curl http://localhost:3000/health` deve responder `{"status":"ok"}`.

### 3. Frontend (`client/`)

```bash
cd client
npm install
npm run dev
```

Abre em `http://localhost:5173` e consome o `/health` do backend pra
confirmar que os dois se conversam.

### 4. Checar build (TypeScript compilando sem erro)

```bash
cd server && npm run build
cd client && npm run build
```

## Scripts úteis (`server/`)

| Script | O que faz |
|---|---|
| `npm run dev` | sobe a API com hot-reload (`tsx watch`) |
| `npm run seed` | popula `muscle_groups` + `exercises` |
| `npm run build` | compila TypeScript pra `dist/` |
| `npm start` | roda o build compilado (`dist/index.js`) |

## Status atual

Semana 1 — fundação MVC + banco (schema, seed, `/health` full-stack).
Progresso semana a semana em [`01-planejamento/TASKS.md`](./01-planejamento/TASKS.md).
