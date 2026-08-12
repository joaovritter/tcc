# Semana 2 — Roteiro de implementação (F1 Autenticação — RF01)

> Isto é um **roteiro com código de exemplo**, não um copia-e-cola cego. Cada
> seção explica a decisão por trás do trecho e depois mostra o arquivo
> inteiro pra você comparar com o que digitou. Adapte nomes/detalhes ao seu
> gosto — o que importa é entender o porquê de cada linha. Marque as caixas
> conforme for terminando. Cards correspondentes no Trello: S2.

> **Por que essa semana importa:** a partir daqui, tudo no sistema é "por
> usuário" (`fk_usuario` em `Divisao`, `Treino`, `DiagnosticoIA`...). Sem
> auth, nenhuma feature seguinte tem dono. É também a primeira semana de MVC
> de verdade — `models/`, `controllers/`, `middleware/` e `types/` nascem
> agora, e o padrão que você fixar aqui se repete em S3–S8.

Critério de aceite (card 🎯 ENTREGÁVEL S2):
- [X] `POST /auth/register` cria usuário com senha em bcrypt
- [X] `POST /auth/login` retorna JWT válido
- [X] Middleware JWT protege rotas privadas (401 sem token)
- [ ] Telas de Login e Registro funcionais com erros amigáveis
- [X] Testes de unidade de auth passando (matriz RF01)
- [X] Nenhuma credencial hardcoded (sem backdoor)

---

## Passo 0 — `server/src/types/indexTypes.ts`

Na Semana 1 isso ficou adiado por falta de model. Agora tem.

**A interface `Usuario` espelha as colunas da tabela** — nomes e tipos
iguais ao `schema.sql`. É isso que faz o TypeScript acusar erro se você
tentar acessar uma coluna que não existe, antes mesmo de rodar.

```ts
export interface Usuario {
  id_usuario: string;
  nome: string;
  email: string;
  senha_hash: string;
}
```

**Uma versão "pública"**, sem `senha_hash` — é o formato que a API deve
devolver em toda resposta (registro, login, `/me`). Ter um tipo separado
pra isso torna impossível esquecer e devolver o hash sem querer: se a
função promete `UsuarioPublico`, o TypeScript reclama se você tentar
incluir `senha_hash` no retorno. Também deixa a assinatura das funções do
`userModel` mais limpa que repetir `Omit<Usuario, 'senha_hash'>` em cada
uma.

```ts
export interface UsuarioPublico {
  id_usuario: string;
  nome: string;
  email: string;
}
```

**O payload que vai dentro do JWT.** Sem esse tipo, o retorno de
`jwt.verify()` vem como `string | JwtPayload` (tudo opcional), e pra ler o
id seria preciso usar `any` — perdendo a checagem de tipo bem no ponto que
decide quem é o usuário autenticado.

```ts
// Formato do payload guardado dentro do JWT. Sem esse tipo, o retorno de
// jwt.verify() vem como "string | JwtPayload" (tudo opcional) e pra ler
// o id seria preciso usar "any" — perdendo a checagem de tipo bem no
// ponto que decide quem é o usuário autenticado.
export interface TokenPayload {
  id: string;
}
```

### Arquivo completo — `server/src/types/indexTypes.ts`

```ts
export interface Usuario {
  id_usuario: string;
  nome: string;
  email: string;
  senha_hash: string;
}

export interface UsuarioPublico {
  id_usuario: string;
  nome: string;
  email: string;
}

// Formato do payload guardado dentro do JWT. Sem esse tipo, o retorno de
// jwt.verify() vem como "string | JwtPayload" (tudo opcional) e pra ler
// o id seria preciso usar "any" — perdendo a checagem de tipo bem no
// ponto que decide quem é o usuário autenticado.
export interface TokenPayload {
  id: string;
}
```

---

## Passo 1 — `server/src/models/userModel.ts`

Só SQL aqui — nada de validação de regra de negócio, isso é trabalho do
controller (Passo 3).

**`criarUsuario`** — `INSERT` com placeholders (`$1, $2, $3`). Nunca
concatenar valor direto na string da query, isso é abertura pra injeção de
SQL. Repare que o `RETURNING` já pede só as colunas públicas — o hash nunca
sai do banco por essa função.

```ts
export async function criarUsuario(
  nome: string,
  email: string,
  senhaHash: string
): Promise<UsuarioPublico> {
  const resultado = await pool.query<UsuarioPublico>(
    `INSERT INTO Usuario (nome, email, senha_hash)
     VALUES ($1, $2, $3)
     RETURNING id_usuario, nome, email`,
    [nome, email, senhaHash]
  );
  return resultado.rows[0];
}
```

**`buscarPorEmail`** — usado só pelo login. Aqui sim o `SELECT *` traz o
`senha_hash`, porque é o controller quem vai comparar a senha com
`bcrypt.compare`. O tipo de retorno é `Usuario` completo (não o público).

```ts
export async function buscarPorEmail(email: string): Promise<Usuario | null> {
  const resultado = await pool.query<Usuario>(
    'SELECT * FROM Usuario WHERE email = $1',
    [email]
  );
  return resultado.rows[0] ?? null;
}
```

**`buscarPorId`** — usado pelo middleware/rota `/me` pra confirmar que o
usuário do token ainda existe. Volta só o formato público.

```ts
export async function buscarPorId(id: string): Promise<UsuarioPublico | null> {
  const resultado = await pool.query<UsuarioPublico>(
    'SELECT id_usuario, nome, email FROM Usuario WHERE id_usuario = $1',
    [id]
  );
  return resultado.rows[0] ?? null;
}
```

### Arquivo completo — `server/src/models/userModel.ts`

```ts
import { pool } from '../config/db';
import { Usuario, UsuarioPublico } from '../types/indexTypes';

export async function criarUsuario(
  nome: string,
  email: string,
  senhaHash: string
): Promise<UsuarioPublico> {
  const resultado = await pool.query<UsuarioPublico>(
    `INSERT INTO Usuario (nome, email, senha_hash)
     VALUES ($1, $2, $3)
     RETURNING id_usuario, nome, email`,
    [nome, email, senhaHash]
  );
  return resultado.rows[0];
}

export async function buscarPorEmail(email: string): Promise<Usuario | null> {
  const resultado = await pool.query<Usuario>(
    'SELECT * FROM Usuario WHERE email = $1',
    [email]
  );
  return resultado.rows[0] ?? null;
}

export async function buscarPorId(id: string): Promise<UsuarioPublico | null> {
  const resultado = await pool.query<UsuarioPublico>(
    'SELECT id_usuario, nome, email FROM Usuario WHERE id_usuario = $1',
    [id]
  );
  return resultado.rows[0] ?? null;
}
```

---

## Passo 2 — `server/src/middleware/auth.ts`

Esse arquivo protege as rotas que vêm depois desta semana (e todas as
próximas). Ele roda **antes** do controller.

**Estender o `Request` do Express** com um campo `userId` — assim o
controller consegue ler `req.userId` de forma tipada, sem `any`. Fazemos
isso com uma interface própria em vez de mexer nos tipos globais do Express
(mais simples de entender pra quem está começando).

```ts
export interface AuthenticatedRequest extends Request {
  userId?: string;
}
```

**A função do middleware.** Primeiro confere se veio o header no formato
`Bearer <token>` — sem isso, nem tenta validar. Repare no `try/catch`
em volta do `jwt.verify`: token adulterado ou expirado lança exceção, e é
isso que vira `401` em vez de derrubar o servidor com `500`.

```ts
export function autenticar(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não informado' });
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as TokenPayload;
    req.userId = payload.id;
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}
```

### Arquivo completo — `server/src/middleware/auth.ts`

```ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TokenPayload } from '../types/indexTypes';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function autenticar(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não informado' });
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as TokenPayload;
    req.userId = payload.id;
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}
```

---

## Passo 3 — `server/src/controllers/authController.ts`

Aqui mora a regra de negócio: validar entrada, decidir o que responder.

**`register`** — valida campos obrigatórios e tamanho mínimo de senha
**antes** de tocar o banco (retorno rápido, sem gastar uma query à toa).
Gera o hash com `bcrypt.hash` (10 salt rounds — equilíbrio custo/segurança
razoável pra um TCC). O `catch` trata especificamente o erro `23505`
(violação de `UNIQUE` do Postgres — e-mail duplicado) e devolve `400` em
vez de deixar virar `500` genérico.

```ts
const SALT_ROUNDS = 10;

export async function register(req: Request, res: Response) {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res
      .status(400)
      .json({ erro: 'Nome, e-mail e senha são obrigatórios' });
  }
  if (senha.length < 6) {
    return res
      .status(400)
      .json({ erro: 'Senha precisa ter no mínimo 6 caracteres' });
  }

  try {
    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
    const usuario = await userModel.criarUsuario(nome, email, senhaHash);
    return res.status(201).json({ usuario });
  } catch (erro: any) {
    if (erro.code === '23505') {
      return res.status(400).json({ erro: 'E-mail já cadastrado' });
    }
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao criar usuário' });
  }
}
```

**`login`** — o ponto de atenção aqui é a **mensagem genérica**: tanto
"e-mail não existe" quanto "senha errada" devolvem exatamente o mesmo texto
(`'Credenciais inválidas'`). Diferenciar as duas mensagens ajudaria alguém
tentando descobrir quais e-mails estão cadastrados no seu banco.

```ts
export async function login(req: Request, res: Response) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
  }

  const usuario = await userModel.buscarPorEmail(email);
  if (!usuario) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const senhaConfere = await bcrypt.compare(senha, usuario.senha_hash);
  if (!senhaConfere) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const token = jwt.sign(
    { id: usuario.id_usuario },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  return res.status(200).json({
    token,
    usuario: {
      id_usuario: usuario.id_usuario,
      nome: usuario.nome,
      email: usuario.email,
    },
  });
}
```

**`me`** — rota protegida que devolve o usuário do token. Não é pedida
explicitamente pelo card, mas é o jeito mais direto de comprovar que o
middleware do Passo 2 funciona antes de depender dele nas semanas
seguintes (e pode virar a rota real de "meu perfil" mais pra frente).

```ts
export async function me(req: AuthenticatedRequest, res: Response) {
  const usuario = await userModel.buscarPorId(req.userId as string);
  if (!usuario) {
    return res.status(404).json({ erro: 'Usuário não encontrado' });
  }
  return res.status(200).json({ usuario });
}
```

**Não fazer:** nenhum e-mail/senha de teste especial que sempre loga — isso
é exatamente o backdoor (`alex@hypertrack.app`) que o TCC precisa mostrar
corrigido em relação ao protótipo antigo.

### Arquivo completo — `server/src/controllers/authController.ts`

```ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as userModel from '../models/userModel';
import { AuthenticatedRequest } from '../middleware/auth';

const SALT_ROUNDS = 10;

export async function register(req: Request, res: Response) {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res
      .status(400)
      .json({ erro: 'Nome, e-mail e senha são obrigatórios' });
  }
  if (senha.length < 6) {
    return res
      .status(400)
      .json({ erro: 'Senha precisa ter no mínimo 6 caracteres' });
  }

  try {
    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
    const usuario = await userModel.criarUsuario(nome, email, senhaHash);
    return res.status(201).json({ usuario });
  } catch (erro: any) {
    if (erro.code === '23505') {
      return res.status(400).json({ erro: 'E-mail já cadastrado' });
    }
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao criar usuário' });
  }
}

export async function login(req: Request, res: Response) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
  }

  const usuario = await userModel.buscarPorEmail(email);
  if (!usuario) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const senhaConfere = await bcrypt.compare(senha, usuario.senha_hash);
  if (!senhaConfere) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const token = jwt.sign(
    { id: usuario.id_usuario },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  return res.status(200).json({
    token,
    usuario: {
      id_usuario: usuario.id_usuario,
      nome: usuario.nome,
      email: usuario.email,
    },
  });
}

export async function me(req: AuthenticatedRequest, res: Response) {
  const usuario = await userModel.buscarPorId(req.userId as string);
  if (!usuario) {
    return res.status(404).json({ erro: 'Usuário não encontrado' });
  }
  return res.status(200).json({ usuario });
}
```

---

## Passo 4 — `server/src/routes/authRoutes.ts`

Segue o padrão de `healthRoutes.ts` da Semana 1 — rota fina, só liga URL a
controller. A rota `/me` passa pelo `autenticar` do Passo 2 **antes** de
chegar no controller — é assim que uma rota fica protegida: o middleware
entra como segundo argumento, antes da função final.

```ts
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/me', autenticar, me);
```

### Arquivo completo — `server/src/routes/authRoutes.ts`

```ts
import { Router } from 'express';
import { register, login, me } from '../controllers/authController';
import { autenticar } from '../middleware/auth';

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/me', autenticar, me);

export default router;
```

**Teste manual nesse ponto:** com `npm run dev` rodando, use o cliente HTTP
que preferir (Insomnia/Postman/extensão do VS Code) pra registrar, logar, e
chamar `/me` sem token (`401`) e com token (`200`).

---

## Passo 5 — Separar `app` do `listen`

Isso é preparação pro Passo 6: os testes automatizados precisam **importar**
a aplicação Express sem que ela suba um servidor de verdade na porta 3000
(senão dois testes rodando em paralelo brigam pela porta, ou o teste nunca
termina porque o servidor ficou escutando).

**`app.ts`** — tudo que já existia em `index.ts`, menos o `listen`. Note a
nova linha `app.use(authRoutes)`, ao lado do `healthRoutes` que já estava
lá desde a Semana 1.

```ts
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';

const app = express();

app.use(cors());
app.use(express.json());
app.use(healthRoutes);
app.use(authRoutes);

export default app;
```

**`index.ts`** fica enxuto: só importa o `app` pronto e sobe o servidor.

```ts
import app from './app';

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`server rodando na porta ${port}`);
});
```

### Arquivos completos

`server/src/app.ts`:

```ts
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';

const app = express();

app.use(cors());
app.use(express.json());
app.use(healthRoutes);
app.use(authRoutes);

export default app;
```

`server/src/index.ts`:

```ts
import app from './app';

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`server rodando na porta ${port}`);
});
```

---

## Passo 6 — Testes de unidade (matriz RF01)

O card pede testes passando — e essa é a primeira linha da matriz de
rastreabilidade (Tabela VI) do TCC preenchida com evidência real.

**Ferramentas:** `node:test` (já vem com o Node, roda com `tsx --test`,
zero dependência nova pra runner) + `supertest` pra bater na API importada
diretamente, sem precisar de porta HTTP de verdade.

Instalar como dev dependency:

```
npm install -D supertest @types/supertest
```

E o script no `package.json`:

```json
"scripts": {
  "test": "tsx --test src/**/*.test.ts"
}
```

**Banco:** aponte `DATABASE_URL` (no `.env`) pra um banco/schema de teste
separado do seu banco de dev, com o `schema.sql` já aplicado nele — assim
os testes não sujam (nem apagam) o que você está usando pra debugar na
mão.

**O arquivo de teste.** Cada `email` usa `Date.now()` pra não colidir com
execuções anteriores (alternativa mais robusta: limpar a tabela `Usuario`
antes de cada teste — mas isso já é refinamento, não obrigatório pro card).

```ts
test('registro válido cria usuário e não devolve senha_hash', async () => {
  const resposta = await request(app)
    .post('/auth/register')
    .send({ nome: 'Teste', email: `teste${Date.now()}@exemplo.com`, senha: '123456' });

  assert.equal(resposta.status, 201);
  assert.ok(resposta.body.usuario.id_usuario);
  assert.equal(resposta.body.usuario.senha_hash, undefined);
});
```

```ts
test('registro com e-mail duplicado retorna 400', async () => {
  const email = `dup${Date.now()}@exemplo.com`;
  await request(app).post('/auth/register').send({ nome: 'A', email, senha: '123456' });

  const resposta = await request(app)
    .post('/auth/register')
    .send({ nome: 'B', email, senha: '123456' });

  assert.equal(resposta.status, 400);
});
```

```ts
test('login correto retorna token', async () => {
  const email = `login${Date.now()}@exemplo.com`;
  await request(app).post('/auth/register').send({ nome: 'C', email, senha: '123456' });

  const resposta = await request(app)
    .post('/auth/login')
    .send({ email, senha: '123456' });

  assert.equal(resposta.status, 200);
  assert.ok(resposta.body.token);
});
```

```ts
test('/me sem token retorna 401, com token retorna 200', async () => {
  const semToken = await request(app).get('/me');
  assert.equal(semToken.status, 401);

  const email = `me${Date.now()}@exemplo.com`;
  await request(app).post('/auth/register').send({ nome: 'E', email, senha: '123456' });
  const login = await request(app).post('/auth/login').send({ email, senha: '123456' });

  const comToken = await request(app)
    .get('/me')
    .set('Authorization', `Bearer ${login.body.token}`);

  assert.equal(comToken.status, 200);
  assert.equal(comToken.body.usuario.email, email);
});
```

**Token adulterado** — cobre o item 8 do card "Testes de unidade F1"
(token válido ≠ token qualquer). Mudar um caractere do fim já é suficiente
pra invalidar a assinatura e cair no `catch` do middleware.

```ts
test('/me com token adulterado retorna 401', async () => {
  const email = `adult${Date.now()}@exemplo.com`;
  await request(app).post('/auth/register').send({ nome: 'G', email, senha: '123456' });
  const login = await request(app).post('/auth/login').send({ email, senha: '123456' });
  const tokenAdulterado = login.body.token.slice(0, -1) + 'x';

  const resposta = await request(app)
    .get('/me')
    .set('Authorization', `Bearer ${tokenAdulterado}`);

  assert.equal(resposta.status, 401);
});
```

**Senha guardada em hash** — cobre o item 9 (`senha nunca volta na
resposta e está em hash no banco`). Usa o `userModel` direto pra confirmar
o que ficou gravado, sem passar pela API — o hash do bcrypt sempre começa
com `$2`, e nunca é igual à senha em texto puro.

```ts
test('senha é gravada como hash bcrypt, não em texto puro', async () => {
  const email = `hash${Date.now()}@exemplo.com`;
  await request(app).post('/auth/register').send({ nome: 'H', email, senha: '123456' });

  const usuario = await userModel.buscarPorEmail(email);

  assert.ok(usuario);
  assert.notEqual(usuario!.senha_hash, '123456');
  assert.match(usuario!.senha_hash, /^\$2/);
});
```

### Arquivo completo — `server/src/auth.test.ts`

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from './app';
import * as userModel from './models/userModel';

test('registro válido cria usuário e não devolve senha_hash', async () => {
  const resposta = await request(app)
    .post('/auth/register')
    .send({ nome: 'Teste', email: `teste${Date.now()}@exemplo.com`, senha: '123456' });

  assert.equal(resposta.status, 201);
  assert.ok(resposta.body.usuario.id_usuario);
  assert.equal(resposta.body.usuario.senha_hash, undefined);
});

test('registro com e-mail duplicado retorna 400', async () => {
  const email = `dup${Date.now()}@exemplo.com`;
  await request(app).post('/auth/register').send({ nome: 'A', email, senha: '123456' });

  const resposta = await request(app)
    .post('/auth/register')
    .send({ nome: 'B', email, senha: '123456' });

  assert.equal(resposta.status, 400);
});

test('registro com senha curta retorna 400', async () => {
  const resposta = await request(app)
    .post('/auth/register')
    .send({ nome: 'F', email: `curta${Date.now()}@exemplo.com`, senha: '123' });

  assert.equal(resposta.status, 400);
});

test('login correto retorna token', async () => {
  const email = `login${Date.now()}@exemplo.com`;
  await request(app).post('/auth/register').send({ nome: 'C', email, senha: '123456' });

  const resposta = await request(app)
    .post('/auth/login')
    .send({ email, senha: '123456' });

  assert.equal(resposta.status, 200);
  assert.ok(resposta.body.token);
});

test('login com senha errada retorna 401', async () => {
  const email = `errada${Date.now()}@exemplo.com`;
  await request(app).post('/auth/register').send({ nome: 'D', email, senha: '123456' });

  const resposta = await request(app)
    .post('/auth/login')
    .send({ email, senha: 'senhaerrada' });

  assert.equal(resposta.status, 401);
});

test('/me sem token retorna 401, com token retorna 200', async () => {
  const semToken = await request(app).get('/me');
  assert.equal(semToken.status, 401);

  const email = `me${Date.now()}@exemplo.com`;
  await request(app).post('/auth/register').send({ nome: 'E', email, senha: '123456' });
  const login = await request(app).post('/auth/login').send({ email, senha: '123456' });

  const comToken = await request(app)
    .get('/me')
    .set('Authorization', `Bearer ${login.body.token}`);

  assert.equal(comToken.status, 200);
  assert.equal(comToken.body.usuario.email, email);
});

test('/me com token adulterado retorna 401', async () => {
  const email = `adult${Date.now()}@exemplo.com`;
  await request(app).post('/auth/register').send({ nome: 'G', email, senha: '123456' });
  const login = await request(app).post('/auth/login').send({ email, senha: '123456' });
  const tokenAdulterado = login.body.token.slice(0, -1) + 'x';

  const resposta = await request(app)
    .get('/me')
    .set('Authorization', `Bearer ${tokenAdulterado}`);

  assert.equal(resposta.status, 401);
});

test('senha é gravada como hash bcrypt, não em texto puro', async () => {
  const email = `hash${Date.now()}@exemplo.com`;
  await request(app).post('/auth/register').send({ nome: 'H', email, senha: '123456' });

  const usuario = await userModel.buscarPorEmail(email);

  assert.ok(usuario);
  assert.notEqual(usuario!.senha_hash, '123456');
  assert.match(usuario!.senha_hash, /^\$2/);
});
```

**Saída pro TCC:** print/relatório da suíte verde vira evidência do RF01 no
capítulo de resultados — guardar junto com os prints de tela desta semana.

---

## Passo 7 — Front: `client/src/services/api.ts`

Ponto único de contato com a API — todas as telas das semanas seguintes vão
usar isso, então vale caprichar agora em vez de espalhar `fetch` solto.

**`apiFetch`** monta a URL, injeta o token automaticamente quando existe, e
transforma resposta de erro (`!resposta.ok`) numa exceção com a mensagem
que veio da API — assim a tela só precisa de um `try/catch` pra mostrar o
erro certo, sem repetir essa lógica em cada lugar.

```ts
const API_URL = 'http://localhost:3000';

interface OpcoesFetch extends RequestInit {
  body?: any;
}

async function apiFetch(caminho: string, opcoes: OpcoesFetch = {}) {
  const token = localStorage.getItem('token');

  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opcoes.headers,
    },
    body: opcoes.body ? JSON.stringify(opcoes.body) : undefined,
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro ?? 'Erro na requisição');
  }

  return dados;
}
```

**Funções específicas** por cima do helper — cada tela só chama isso, sem
saber como o fetch é montado por dentro.

```ts
export function registrar(nome: string, email: string, senha: string) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: { nome, email, senha },
  }) as Promise<{ usuario: Usuario }>;
}

export function login(email: string, senha: string) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: { email, senha },
  }) as Promise<{ token: string; usuario: Usuario }>;
}

export function buscarPerfil() {
  return apiFetch('/me') as Promise<{ usuario: Usuario }>;
}
```

### Arquivo completo — `client/src/services/api.ts`

```ts
const API_URL = 'http://localhost:3000';

interface OpcoesFetch extends RequestInit {
  body?: any;
}

async function apiFetch(caminho: string, opcoes: OpcoesFetch = {}) {
  const token = localStorage.getItem('token');

  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opcoes.headers,
    },
    body: opcoes.body ? JSON.stringify(opcoes.body) : undefined,
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro ?? 'Erro na requisição');
  }

  return dados;
}

export interface Usuario {
  id_usuario: string;
  nome: string;
  email: string;
}

export function registrar(nome: string, email: string, senha: string) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: { nome, email, senha },
  }) as Promise<{ usuario: Usuario }>;
}

export function login(email: string, senha: string) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: { email, senha },
  }) as Promise<{ token: string; usuario: Usuario }>;
}

export function buscarPerfil() {
  return apiFetch('/me') as Promise<{ usuario: Usuario }>;
}
```

> Se quiser deixar a URL configurável em vez de fixa, troque `API_URL` por
> `import.meta.env.VITE_API_URL` e crie `client/.env` com
> `VITE_API_URL=http://localhost:3000` — não obrigatório pro card, mas
> evita mexer no código quando for fazer deploy (fora do escopo do TCC, mas
> é hábito bom).

---

## Passo 8 — Front: `client/src/context/AuthContext.tsx`

**No mount, tenta restaurar a sessão** lendo o token do `localStorage` e
validando contra `/me` — se o token expirou, a chamada falha e o usuário é
deslogado nesse momento, em vez de a UI achar que está logado até a
primeira ação falhar no meio do uso.

```ts
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
```

**`login` e `registrar`** guardam o token no `localStorage` (sobrevive ao
F5) e atualizam o estado em memória. `registrar` reaproveita o `login` no
final — depois de criar a conta, já efetua o login com as mesmas
credenciais, então quem chama `registrar` já cai autenticado.

```ts
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
```

**`useAuth`** é o hook que as telas vão usar — evita importar `AuthContext`
e `useContext` em todo componente, e falha alto (`throw`) se alguém usar o
hook fora do `<AuthProvider>`, o que ajuda a pegar esse erro de composição
cedo, no console, em vez de um bug silencioso.

```ts
export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth precisa ser usado dentro de um AuthProvider');
  }
  return contexto;
}
```

### Arquivo completo — `client/src/context/AuthContext.tsx`

```tsx
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import * as api from '../services/api';
import type { Usuario } from '../services/api';

interface AuthContextValor {
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  registrar: (nome: string, email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValor | null>(null);

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

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth precisa ser usado dentro de um AuthProvider');
  }
  return contexto;
}
```

---

## Passo 9 — Front: telas e ligação final

**`AuthView.tsx`** — um estado local (`modo`) alterna entre login e
registro no mesmo componente, evitando duplicar o formulário inteiro. O
campo `nome` só aparece no modo registro. `enviando` desabilita o botão
durante a chamada (evita duplo clique criando dois registros), e `erro`
mostra a mensagem que veio do `AuthContext`/`api.ts` — nunca um "algo deu
errado" genérico.

```tsx
async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
  e.preventDefault();
  setErro('');
  setEnviando(true);
  try {
    if (modo === 'login') {
      await login(email, senha);
    } else {
      await registrar(nome, email, senha);
    }
  } catch (erro) {
    setErro(erro instanceof Error ? erro.message : 'Erro inesperado');
  } finally {
    setEnviando(false);
  }
}
```

> `FormEvent` está `@deprecated` no `@types/react` 19.x — o tipo atual pra
> `onSubmit` de `<form>` é `SubmitEvent`.

### Arquivo completo — `client/src/views/AuthView.tsx`

```tsx
import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export function AuthView() {
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { login, registrar } = useAuth();

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      if (modo === 'login') {
        await login(email, senha);
      } else {
        await registrar(nome, email, senha);
      }
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : 'Erro inesperado');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1>{modo === 'login' ? 'Entrar' : 'Criar conta'}</h1>
      <form onSubmit={handleSubmit}>
        {modo === 'registro' && (
          <input
            type="text"
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        )}
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        {erro && <p role="alert">{erro}</p>}
        <button type="submit" disabled={enviando}>
          {enviando ? 'Enviando...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>
      <button type="button" onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}>
        {modo === 'login' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
      </button>
    </div>
  );
}
```

**`App.tsx`** troca a lógica da Semana 1 (mostrar status de `/health`) por
uma checagem simples de sessão: sem usuário → `AuthView`; com usuário →
placeholder "logado como {nome}" (as telas de verdade chegam nas semanas
seguintes). Ainda não precisa de biblioteca de rotas — só vira necessário
quando houver mais de uma tela pra usuário logado navegar (S3 em diante).

```tsx
import { useAuth } from './context/AuthContext'
import { AuthView } from './views/AuthView'
import './App.css'

function App() {
  const { usuario, carregando, logout } = useAuth()

  if (carregando) {
    return <p>Carregando...</p>
  }

  if (!usuario) {
    return <AuthView />
  }

  return (
    <div>
      <h1>Logado como {usuario.nome}</h1>
      <button onClick={logout}>Sair</button>
    </div>
  )
}

export default App
```

**`main.tsx`** só precisa envolver `<App />` com o `<AuthProvider>`, pra
todo componente da árvore ter acesso ao `useAuth()`.

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
```

### Arquivos completos

`client/src/App.tsx`:

```tsx
import { useAuth } from './context/AuthContext'
import { AuthView } from './views/AuthView'
import './App.css'

function App() {
  const { usuario, carregando, logout } = useAuth()

  if (carregando) {
    return <p>Carregando...</p>
  }

  if (!usuario) {
    return <AuthView />
  }

  return (
    <div>
      <h1>Logado como {usuario.nome}</h1>
      <button onClick={logout}>Sair</button>
    </div>
  )
}

export default App
```

`client/src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
```

---

## Passo 10 — Fechar a semana

1. Testar o fluxo pela interface: registrar → cair "logado" → F5 continua
   logado → logout → tentar logar com senha errada mostra mensagem clara.
2. Rodar `npm run test` no server — suíte verde.
3. Rodar `npm run build` nos dois lados — sem erro de tipo.
4. Print/vídeo curto do fluxo (registro → login → rota protegida) — vira
   figura do capítulo de resultados.
5. Commit + push. Sugestão de mensagem: algo que descreva as duas frentes
   (auth backend + telas), já que normalmente as duas sessões da semana
   viram um commit por sessão.

---

## Ordem sugerida pra essa sessão

1. **Sessão A (backend):** Passos 0 → 6 (types → model → middleware →
   controller → rotas → split app/index → testes). Confirmar cada endpoint
   com o cliente HTTP antes de escrever o teste automatizado — mais rápido
   de debugar um erro por vez.
2. **Sessão B (frontend):** Passos 7 → 9 (api.ts → AuthContext → telas),
   já contra o backend funcionando da Sessão A.
3. Passo 10 fecha a semana, idealmente ao final da Sessão B.

## Armadilhas comuns desta semana

- Guardar `JWT_SECRET` (ou qualquer segredo) direto no código em vez de
  vir do `.env` — sempre `process.env.JWT_SECRET`.
- Validar só no front e confiar que o backend recebe dado limpo — toda
  validação de verdade tem que estar no controller (RNF03 vale desde já,
  não só para RPE/RIR mais pra frente).
- Devolver mensagem de erro diferente para "e-mail não existe" e "senha
  errada" — ajuda quem está tentando adivinhar contas.
- Deixar o erro de `UNIQUE` do Postgres vazar como `500` em vez de virar
  `400` tratado.
- Esquecer de conferir `server/.env` antes de começar: `DATABASE_URL`,
  `JWT_SECRET` e `PORT` precisam estar preenchidos (ficaram vazios ao final
  da Semana 1 — reveja o `.env.example`).
