# Semana 1 — Roteiro de implementação (Fundação MVC + Banco)

> Isto é um **roteiro de instruções**, não código pronto. A ideia é você digitar
> cada arquivo entendendo o que está fazendo. Marque as caixas conforme for
> terminando. Cards correspondentes no Trello: S1.

> **Stack: TypeScript** no back e no front. Isso muda alguns detalhes de setup
> (arquivos `.ts`/`.tsx`, `tsconfig.json`, tipos) em relação a um projeto Node
> comum — sinalizado em cada passo.

> ✅ **Semana 1 concluída em 09/08/2026.** Todos os critérios de aceite abaixo foram
> cumpridos. O roteiro fica no repositório como registro do que foi feito.

Critério de aceite (card 🎯 ENTREGÁVEL S1):
- [x] API Express sobe com `GET /health` respondendo (`server/src/routes/healthRoutes.ts`)
- [x] Front Vite+React sobe e consome `/health` (`client/src/App.tsx`)
- [x] `schema.sql` cria as 8 tabelas do DER com FKs — `SerieTreino` COM coluna `rpe` (CHECK 6–10)
- [x] Seed rodando: 7 grupamentos + 95 exercícios (`server/src/seed.ts`, em transação)
- [x] Chave da API Gemini obtida e testada com um hello world (`server/scripts/test-gemini.ts`)
- [x] Commit + push + README com passos de setup

---

## Passo 0 — Deixar o `server/` pronto pra TypeScript

Seu `package.json` já tem as dependências (`express`, `cors`, `dotenv`, `pg`,
`bcrypt`, `jsonwebtoken`). Falta a parte de tipos e de build:

1. Instalar como **dependência de desenvolvimento** (`npm install -D ...`,
   não vai pro `dependencies` normal, vai pro `devDependencies`):
   - `typescript`
   - `tsx` (executa `.ts` direto, sem precisar compilar antes — usa isso no
     `npm run dev`, é o substituto do `node --watch` pra TS)
   - `@types/node`, `@types/express`, `@types/cors`,
     `@types/bcrypt`, `@types/jsonwebtoken`, `@types/pg` — os "tipos" das
     libs que não vêm com TypeScript embutido.
2. Criar um `tsconfig.json` na raiz de `server/`. Rode `npx tsc --init` pra
   gerar um base, e depois ajuste (no mínimo):
   - `target`/`module`: algo moderno (`ES2022`/`NodeNext` ou `ESNext`,
     dependendo de como for configurar os imports — combina com
     `moduleResolution`)
   - `outDir`: `dist` (pra onde vai o JS compilado)
   - `rootDir`: `src`
   - `strict: true` (ativa checagem de tipo rigorosa — no começo é chato,
     mas evita bug bobo)
3. Trocar as extensões: tudo que for código vira `.ts` (e depois, no client,
   componentes React viram `.tsx`).
4. No `package.json`, ajustar os scripts:
   - `dev`: `tsx watch src/index.ts`
   - `build`: `tsc`
   - `start`: `node dist/index.js` (roda o já compilado, pra produção/teste
     final — não precisa usar agora)

---

## Passo 1 — `server/src/index.ts`

Arquivo de entrada do backend. Mesma lógica de antes, só que tipado:

1. Importar `express` e criar a aplicação: `const app = express()` — o TS já
   infere o tipo `Express` sozinho aqui, não precisa anotar.
2. `app.use(cors())`.
3. Importar `'dotenv/config'` no topo, antes de tudo que usa `process.env`.
4. `app.use(express.json())`.
5. Registrar a rota de health check. Se for direto aqui:
   `app.get('/health', (req, res) => { ... })` — o Express com `@types/express`
   já tipa `req` e `res` automaticamente pelas assinaturas da lib, não
   precisa importar `Request`/`Response` só pra isso (só importa esses tipos
   quando for extrair a função pra fora do `app.get`, ex. num controller).
   Dentro, `res.json({ status: 'ok' })`.
   - Melhor ainda (MVC): extrair pra `server/src/routes/healthRoutes.ts`
     (Passo 2) e aqui só `app.use(healthRoutes)`.
6. Porta: `process.env.PORT` — atenção, em TS isso vem tipado como
   `string | undefined`, então `app.listen(process.env.PORT)` direto pode
   reclamar de tipo. Trate o fallback (`process.env.PORT || 3001`) e, se o
   TS ainda reclamar, converta pra número explicitamente.
7. `app.listen(porta, () => console.log(...))`.

**Dica sobre o que você já tinha escrito (versão JS):** a lógica do
`/health` que você começou continua igual em TS — o que muda é a extensão do
arquivo, o `tsconfig`, e o comando que você usa pra rodar (`npm run dev` com
`tsx` no lugar de `node --watch`). Complete o corpo da função, feche
certinho, e adicione o `app.listen` no final.

Teste manual: `npm run dev`, depois abra `http://localhost:3001/health`
ou `curl` — tem que responder o JSON.

---

## Passo 2 — `server/src/routes/healthRoutes.ts` (opcional, recomendado)

Por que separar: `routes/` fica fina — só "essa URL → essa função". Facilita
achar rotas quando o projeto crescer (Semana 2 em diante: `authRoutes`,
`divisionRoutes`...).

1. `import { Router } from 'express'`.
2. `const router = Router()`.
3. `router.get('/health', ...)` com a mesma lógica.
4. `export default router`.

No `index.ts`: `import healthRoutes from './routes/healthRoutes.js'` — repare
que mesmo o arquivo sendo `.ts`, se você configurar o `tsconfig` com módulos
`NodeNext`/ESM, o import às vezes precisa terminar em `.js` (é estranho, mas é
assim que o Node resolve módulo ESM+TS; se preferir evitar essa pegadinha
agora, configure `module: "CommonJS"` no `tsconfig` e importe sem extensão —
mais simples pra começar, dá pra migrar pra ESM depois se quiser).

---

## Passo 3 — `server/src/types/` (adiado pra Semana 2)

Pasta pra centralizar tipos/interfaces compartilhados entre `models`,
`controllers` e `services` (`interface User`, `interface SetLog`,
`interface Diagnostic`...). **Não criar ainda** — sem nenhum `model` de pé,
não tem o que tipar. Cria junto com o primeiro `model` real (`User`, na
Semana 2, F1 Autenticação).

---

## Passo 4 — `server/src/config/db.ts`

Ainda não precisa **usar** isso na Semana 1, mas o card pede o schema
criado, então vale deixar a conexão pronta:

1. `import pg from 'pg'` e `const { Pool } = pg`.
2. `import 'dotenv/config'`.
3. Criar e exportar `export const pool = new Pool({ connectionString: process.env.DATABASE_URL })`.

Esse `Pool` é o que os `models/` vão importar depois pra rodar queries SQL
(com `@types/pg` instalado, os métodos do `pool` já vêm tipados).

---

## Passo 5 — `server/.env`

Igual antes, TS não muda nada aqui (variável de ambiente é sempre string em
runtime):
- `PORT`
- `DATABASE_URL` (`postgresql://usuario:senha@localhost:5432/nome_do_banco`)
- `JWT_SECRET`
- `GEMINI_API_KEY`
- `GEMINI_MOCK=true`

Confirme que `server/.gitignore` tem `.env`, `node_modules/` **e** `dist/`
(a pasta gerada pelo `tsc`).

---

## Passo 6 — `server/schema.sql`

SQL puro, não muda nada por causa do TS. 8 tabelas, respeitando ordem das FKs:

1. `users`
2. `muscle_groups`
3. `exercises` (FK → `muscle_groups`)
4. `divisions` (FK → `users`)
5. `division_exercises` (FK → `divisions`, `exercises`)
6. `sessions` (FK → `users`, possivelmente `divisions`)
7. `set_logs` (FK → `sessions`, `exercises`; colunas: `type` `warmup|work`,
   `weight`, `reps`, **`rpe` 6–10**, `rir` 0–5)
8. `diagnostics` (FK → `sessions`/`users`; payload `JSONB`, `score_geral`)

Rodar: `psql -d nome_do_banco -f schema.sql` (ou via pgAdmin/DBeaver).

> Dica de TS: quando você criar as `interfaces` no Passo 3 mais pra frente,
> elas devem espelhar essas colunas exatamente (mesmos nomes, tipos
> compatíveis) — é o que garante que o TypeScript pegue erro se você tentar
> salvar um `rpe` fora de 6–10, por exemplo, antes mesmo de rodar.

---

## Passo 7 — `server/seed.sql` (ou `seed.ts`)

Popular `muscle_groups` e depois `exercises` (~40).

- Se for `.sql`: sequência de `INSERT INTO`, roda igual ao schema.
- Se preferir `.ts`: um array tipado (`const exercises: { name: string;
  muscleGroupId: number }[] = [...]`) e um loop que insere via o `pool` do
  Passo 4, rodado com `tsx src/seed.ts`.

---

## Passo 8 — Chave Gemini

1. Gerar em https://aistudio.google.com/apikey.
2. Colar em `GEMINI_API_KEY` no `.env`.
3. "Hello world": arquivo descartável `server/scripts/test-gemini.ts`,
   importando o SDK do Gemini, mandando um prompt simples, printando a
   resposta. Roda com `tsx server/scripts/test-gemini.ts`. Só confirma que a
   chave funciona — a integração de verdade é Semana 7.

---

## Passo 9 — Front (`client/`)

Quando o back tiver `/health` respondendo: rodar o scaffold do Vite dentro
de `client/` escolhendo o template **React + TypeScript** (`react-ts`, não
`react`) — isso já vem com `tsconfig.json` configurado e os componentes em
`.tsx`. Depois, no componente principal, um `fetch` tipado pro
`http://localhost:3001/health` pra provar que os dois se conversam.
Detalhamos isso quando você chegar nessa parte.

---

## Passo 10 — Commit + README

1. `README.md` na raiz do `tcc/` (ou em `server/`/`client/` separados):
   como instalar, criar `.env`, rodar schema, subir server (`npm run dev`)
   e client — e agora também: rodar `npm run build` pra checar que o
   TypeScript compila sem erro antes de dar por certo.
2. `git add` + commit descrevendo "fundação MVC em TypeScript: server +
   client + schema + seed".
3. `git push`.

---

## Ordem sugerida pra essa sessão

1. Passo 0 (instalar TS + configurar `tsconfig.json`) — sem isso nada mais
   roda.
2. Terminar o `index.ts` (Passo 1) até o `/health` responder via `npm run dev`.
3. Extrair pra `routes/healthRoutes.ts` (Passo 2) — pratica o padrão MVC que
   se repete toda semana.
4. `config/db.ts` (Passo 4) + `.env` (Passo 5).
5. `schema.sql` (Passo 6) — pode ficar pra próxima sessão da semana.
