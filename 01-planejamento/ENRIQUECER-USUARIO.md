# Enriquecer usuário — massa de dados para a avaliação de Nielsen

> **Caminho usado de fato (simulação real):** Fase 1 pelo Postman (divisões) e depois
> `npx tsx scripts/simularDuasSemanas.ts` em `tcc/server` (use `--limpar` para refazer).
> O script cria as 8 sessões em ordem cronológica, já com a data e a duração, e gera
> cada diagnóstico com a IA real. O volume semanal entra **como estava no dia da sessão**.
> As Fases 2–5 abaixo (Postman + SQL) ficam como alternativa, mas nelas o contexto de volume
> dos diagnósticos é o da semana atual, não o da sessão.

Cria **um usuário com 2 semanas de treino** (PPL + Upper), séries de
aquecimento/feeder/válidas, treinos finalizados com duração realista e
diagnósticos, tudo via Postman (Collection Runner) + 2 scripts SQL curtos.

- Usuário (já existe): `joao@teste.com` / senha `www.com.brj`
- ⚠️ Como é uma conta real: a Fase 1 **sobrescreve a divisão semanal** dela (`PUT /divisions`), e o SQL #1 só mexe nos treinos criados **hoje** pela Fase 2. Treinos antigos da conta ficam intactos.
- Período: **28/09/2026 a 09/10/2026** (seg 28/09 → sex 09/10; hoje, 11/10, é domingo e fica sem treino)
- 8 sessões · 200 séries · 8 diagnósticos
- Arquivo de dados do runner: [`enriquecer-usuario.dados.json`](enriquecer-usuario.dados.json) (mesma pasta)

---

## 0. Por que existe SQL no meio (limitação da API)

A API **não aceita data nem duração**:

- `POST /sessions/start` grava `data = NOW()` e usa a divisão do **dia da semana de hoje** (domingo = sem divisão → `fk_divisao = NULL`).
- `POST /sessions/:id/finish` calcula `duracao_total = NOW() - data` (aqui daria **1 min**, porque o Postman termina em segundos).

Então o fluxo é: **Postman cria tudo "hoje"** → **SQL #1 volta no tempo** (data, duração, divisão) → **Postman gera os diagnósticos** → **SQL #2 acerta a data dos diagnósticos**.

> Os diagnósticos precisam vir **depois** do SQL #1 porque o `GET /history/sessions`
> (usado pra achar os ids) e o volume semanal dependem da data correta.

---

## 1. Pré-requisitos

1. Servidor rodando: `npm run dev` em `tcc/server` (porta **3000**).
2. Exercícios já semeados (`npm run seed` ou equivalente) — os ids abaixo dependem da ordem do `seed.ts` (`RESTART IDENTITY`). A requisição 1.3 **confere isso** e falha se algum id estiver errado.
3. `.env` do server com `GEMINI_MOCK=true` (rápido, sem custo) **ou** `GEMINI_API_KEY` válida (texto de IA real; 8 chamadas — use delay de 4000 ms no runner).
4. Postman → crie a collection **"Enriquecer usuário"** com:
   - **Variables**: use o Environment **Tcc local** (a collection grava lá). Já existem `baseUrl`, `token` e `idTreino`; crie também `div_push`, `div_pull`, `div_legs`, `div_upper`, `series_ok`, `series_falhas` (vazias). Selecione esse Environment no canto superior direito.
   - **Authorization** da collection: *Bearer Token* = `{{token}}` (todas as requests herdam; só o register/login ficam *No Auth*).
   - No Runner, marque **"Keep variable values"** (persistir variáveis ao fim da run), senão o `token` some entre uma run e outra.

---

## 2. Plano do treino

### Divisão semanal (`dia_semana`: 0 = domingo)

| Dia | `dia_semana` | Divisão | Exercícios (ids, na ordem) |
|---|---|---|---|
| Seg | 1 | **Push** | 1, 5, 31, 34, 73, 77 |
| Ter | 2 | **Pull** | 16, 21, 25, 42, 62, 64 |
| Qua | 3 | **Legs** | 44, 47, 53, 50, 51, 59, 82 |
| Sex | 5 | **Upper** | 2, 17, 33, 23, 66, 74 |
| Qui / Sáb / Dom | — | descanso | — |

### Por exercício: 4 séries

`aquecimento` → `feeder` → `work` (válida 1) → `work` (válida 2).
Aquecimento e feeder **não** levam RIR/RPE (a API rejeita com 400 se mandar). As válidas levam `rir`.

### Volume semanal resultante (séries válidas / limiar 10)

| Grupamento | Séries válidas/semana | Limiar |
|---|---|---|
| Pernas | 12 | atinge |
| Costas | 10 (6 Pull + 4 Upper) | atinge |
| Ombros | 8 | não atinge |
| Peito | 6 | não atinge |
| Bíceps | 6 | não atinge |
| Tríceps | 6 | não atinge |
| Abdômen | 2 | não atinge |

(Mistura de "atingiu" e "não atingiu" de propósito: o diagnóstico e o painel de volume ficam com conteúdo variado pra avaliar.)

### Duração e horário de cada sessão

| # | Dia | Início | Divisão | Duração |
|---|---|---|---|---|
| 1 | seg 28/09 | 18:30 | Push | 62 min |
| 2 | ter 29/09 | 18:40 | Pull | 55 min |
| 3 | qua 30/09 | 18:20 | Legs | 68 min |
| 4 | sex 02/10 | 19:00 | Upper | 51 min |
| 5 | seg 05/10 | 18:30 | Push | 59 min |
| 6 | ter 06/10 | 18:35 | Pull | 53 min |
| 7 | qua 07/10 | 18:25 | Legs | 70 min |
| 8 | sex 09/10 | 19:00 | Upper | 57 min |

Semana 2 tem carga/reps um pouco maiores (progressão visível no gráfico de carga) e a sessão 3 (Legs) é mais leve (RIR 3/2) pra gerar um diagnóstico de "intensidade baixa".

---

## 3. FASE 1 — Setup (folder "1 - Setup", rodar 1 vez, 8 requests em ordem)

### 1.1 register — **PULAR** (o usuário `joao@teste.com` já existe)

Desative/ignore essa request no Runner (desmarque o checkbox dela).

### 1.2 `POST {{baseUrl}}/auth/login` — *No Auth*

```json
{
  "email": "joao@teste.com",
  "senha": "www.com.brj"
}
```

Tests:

```js
pm.test('login 200', () => pm.response.to.have.status(200));
pm.environment.set('token', pm.response.json().token);
```

### 1.3 `GET {{baseUrl}}/exercises` — conferência dos ids

Sem body. Tests (falha se o seed estiver em ordem diferente):

```js
const esperado = {
  1: 'Supino Reto com Barra', 2: 'Supino Reto com Halteres', 5: 'Supino Inclinado com Halteres',
  16: 'Puxada Aberta na Polia', 17: 'Puxada Fechada (Triângulo)', 21: 'Remada Curvada com Barra',
  23: 'Remada Unilateral (Serrote)', 25: 'Remada Baixa Sentado', 31: 'Desenvolvimento com Halteres',
  33: 'Desenvolvimento na Máquina', 34: 'Elevação Lateral com Halteres', 42: 'Face Pull',
  44: 'Agachamento Livre com Barra', 47: 'Leg Press 45', 50: 'Cadeira Extensora',
  51: 'Mesa Flexora (Deitada)', 53: 'Stiff com Barra', 59: 'Gêmeos em Pé',
  62: 'Rosca Direta com Barra W', 64: 'Rosca Martelo com Halteres', 66: 'Rosca Scott (Barra W)',
  73: 'Tríceps Pulldown (Corda)', 74: 'Tríceps Testa com Barra W', 77: 'Tríceps Francês na Polia',
  82: 'Abdominal na Polia Alta',
};
const lista = pm.response.json().exercicios;
const porId = Object.fromEntries(lista.map(e => [e.id_exercicio, e.nome_exercicio]));
Object.entries(esperado).forEach(([id, nome]) =>
  pm.test(`id ${id} = ${nome}`, () => pm.expect(porId[id]).to.eql(nome)));
```

### 1.4 `PUT {{baseUrl}}/divisions`

```json
{
  "divisoes": [
    { "dia_semana": 1, "nome": "Push" },
    { "dia_semana": 2, "nome": "Pull" },
    { "dia_semana": 3, "nome": "Legs" },
    { "dia_semana": 5, "nome": "Upper" },
    { "dia_semana": 6, "nome": "Peito e tríceps" }
  ]
}
```

> **Por que o sábado está aí:** `PUT /divisions` apaga os dias que não vêm no payload. A conta já tem
> "Peito e tríceps" no sábado com 3 treinos ligados, e o banco local ainda está com a FK antiga
> (`Treino.fk_divisao` **sem** `ON DELETE SET NULL`; o `schema.sql` atual tem, mas não foi reaplicado).
> Sem o sábado no payload, o DELETE viola a FK e a API devolve 500.

Tests (guarda o id de cada divisão):

```js
pm.test('200', () => pm.response.to.have.status(200));
const d = pm.response.json().divisoes;
const id = n => d.find(x => x.nome === n).id_divisao;
pm.environment.set('div_push', id('Push'));
pm.environment.set('div_pull', id('Pull'));
pm.environment.set('div_legs', id('Legs'));
pm.environment.set('div_upper', id('Upper'));
```

### 1.5 `PUT {{baseUrl}}/divisions/{{div_push}}/exercises`

```json
{ "exercicios": [
  { "fk_exercicio": 1 }, { "fk_exercicio": 5 }, { "fk_exercicio": 31 },
  { "fk_exercicio": 34 }, { "fk_exercicio": 73 }, { "fk_exercicio": 77 }
] }
```

### 1.6 `PUT {{baseUrl}}/divisions/{{div_pull}}/exercises`

```json
{ "exercicios": [
  { "fk_exercicio": 16 }, { "fk_exercicio": 21 }, { "fk_exercicio": 25 },
  { "fk_exercicio": 42 }, { "fk_exercicio": 62 }, { "fk_exercicio": 64 }
] }
```

### 1.7 `PUT {{baseUrl}}/divisions/{{div_legs}}/exercises`

```json
{ "exercicios": [
  { "fk_exercicio": 44 }, { "fk_exercicio": 47 }, { "fk_exercicio": 53 },
  { "fk_exercicio": 50 }, { "fk_exercicio": 51 }, { "fk_exercicio": 59 },
  { "fk_exercicio": 82 }
] }
```

### 1.8 `PUT {{baseUrl}}/divisions/{{div_upper}}/exercises`

```json
{ "exercicios": [
  { "fk_exercicio": 2 }, { "fk_exercicio": 17 }, { "fk_exercicio": 33 },
  { "fk_exercicio": 23 }, { "fk_exercicio": 66 }, { "fk_exercicio": 74 }
] }
```

(Todas as PUT de exercícios: Tests `pm.test('200', () => pm.response.to.have.status(200));`)

> **Run da Fase 1:** Runner → folder "1 - Setup" → 1 iteração → Run. Deve ficar tudo verde.

---

## 4. FASE 2 — Sessões, séries e finalização (folder "2 - Sessões")

Aqui entra o **arquivo de dados**. O Runner roda a folder **8 vezes** (1 iteração = 1 sessão),
cada uma lendo `enriquecer-usuario.dados.json`:

```json
{ "sessao": 1, "dia": "2026-09-28", "hora": "18:30", "divisao": "Push", "duracao_min": 62,
  "series": [ { "fk_exercicio": 1, "tipo": "aquecimento", "carga": 40, "repeticoes": 12, "rir": null }, "..." ] }
```

3 requests na folder, nesta ordem:

### 2.1 `POST {{baseUrl}}/sessions/start`

Sem body. Tests:

```js
pm.test('treino criado', () => pm.expect([200, 201]).to.include(pm.response.code));
pm.environment.set('idTreino', pm.response.json().treino.id_treino);
```

### 2.2 `GET {{baseUrl}}/sessions/today` — "Registrar séries (lote)"

Essa request é só o "carrier": o trabalho está no **Pre-request Script**, que dispara
as séries **uma por vez, em ordem** (a ordem de `id_serie` define a ordem dos exercícios no histórico):

```js
let series = pm.iterationData.get('series');
if (typeof series === 'string') series = JSON.parse(series);

const base = pm.variables.get('baseUrl');
const treino = pm.environment.get('idTreino');
const token = pm.environment.get('token');
let enviadas = 0;
const falhas = [];

function enviar(i) {
  if (i >= series.length) {
    pm.environment.set('series_ok', String(enviadas));
    pm.environment.set('series_falhas', JSON.stringify(falhas));
    return;
  }
  pm.sendRequest({
    url: `${base}/sessions/${treino}/sets`,
    method: 'POST',
    header: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: { mode: 'raw', raw: JSON.stringify(series[i]) },
  }, (err, res) => {
    if (err || res.code !== 201) falhas.push({ i, code: res && res.code, msg: err ? String(err) : res.text() });
    else enviadas++;
    enviar(i + 1);   // só dispara a próxima quando a anterior voltou
  });
}
enviar(0);
```

Tests:

```js
let series = pm.iterationData.get('series');
if (typeof series === 'string') series = JSON.parse(series);
pm.test('todas as séries registradas', () => {
  pm.expect(Number(pm.environment.get('series_ok'))).to.eql(series.length);
  pm.expect(pm.environment.get('series_falhas')).to.eql('[]');
});
```

O body de **cada** série enviada (para referência / teste manual de uma só):

```json
{ "fk_exercicio": 1, "tipo": "aquecimento", "carga": 40, "repeticoes": 12, "rir": null }
```
```json
{ "fk_exercicio": 1, "tipo": "feeder", "carga": 55, "repeticoes": 6, "rir": null }
```
```json
{ "fk_exercicio": 1, "tipo": "work", "carga": 70, "repeticoes": 8, "rir": 2 }
```

> Série `work` aceita `rir` (0–4) **ou** `rpe` (6–10), nunca os dois; aqui usamos `rir`
> (o banco deriva `rpe = 10 - rir`). Se quiser testar a entrada por RPE depois, troque `"rir": 2` por `"rpe": 8`.

### 2.3 `POST {{baseUrl}}/sessions/{{idTreino}}/finish`

Sem body. Tests: `pm.test('finalizado', () => pm.response.to.have.status(200));`

> **Run da Fase 2:** Runner → folder "2 - Sessões" → **Iterations: 8** → *Select File*
> `enriquecer-usuario.dados.json` → Run. Resultado: 8 treinos finalizados (todos com
> data de hoje e duração ~1 min — isso é corrigido na fase 3).
>
> ⚠️ Rode **uma vez só**. Se rodar de novo, duplica as sessões (use o SQL de limpeza da seção 8).

---

## 5. FASE 3 — SQL #1: voltar no tempo (data, duração, divisão)

Rode no `psql`/pgAdmin/DBeaver **depois** da Fase 2. Identifica as sessões pela ordem de criação **entre os treinos de hoje** (a 1ª criada = sessão 1). Se a conta já tinha treino criado hoje antes da Fase 2, apague/ajuste ele antes, senão a numeração desliza.

```sql
BEGIN;

WITH ordem AS (
  SELECT t.id_treino,
         ROW_NUMBER() OVER (ORDER BY t.data, t.id_treino) AS n
  FROM Treino t
  JOIN Usuario u ON u.id_usuario = t.fk_usuario
  WHERE u.email = 'joao@teste.com'
    AND t.data::date = CURRENT_DATE   -- só os 8 treinos criados agora pela Fase 2
),
alvo (n, inicio, duracao, divisao) AS (
  VALUES
    (1, '2026-09-28 18:30', 62, 'Push'),
    (2, '2026-09-29 18:40', 55, 'Pull'),
    (3, '2026-09-30 18:20', 68, 'Legs'),
    (4, '2026-10-02 19:00', 51, 'Upper'),
    (5, '2026-10-05 18:30', 59, 'Push'),
    (6, '2026-10-06 18:35', 53, 'Pull'),
    (7, '2026-10-07 18:25', 70, 'Legs'),
    (8, '2026-10-09 19:00', 57, 'Upper')
)
UPDATE Treino t
SET data          = a.inicio::timestamp,
    duracao_total = a.duracao,
    completed     = TRUE,
    fk_divisao    = (SELECT d.id_divisao FROM Divisao d
                     WHERE d.fk_usuario = t.fk_usuario AND d.nome = a.divisao)
FROM ordem o
JOIN alvo a ON a.n = o.n
WHERE t.id_treino = o.id_treino;

-- conferência: deve listar as 8 sessões com data/duração/divisão corretas
SELECT t.data, t.duracao_total, d.nome AS divisao, COUNT(s.id_serie) AS series
FROM Treino t
JOIN Usuario u ON u.id_usuario = t.fk_usuario
LEFT JOIN Divisao d ON d.id_divisao = t.fk_divisao
LEFT JOIN SerieTreino s ON s.fk_treino = t.id_treino
WHERE u.email = 'joao@teste.com'
GROUP BY t.id_treino, d.nome ORDER BY t.data;

COMMIT;   -- se a conferência não bateu, troque por ROLLBACK
```

Cada sessão deve ter **24 séries** (Push/Pull/Upper) ou **28** (Legs).

---

## 6. FASE 4 — Diagnósticos (folder "4 - Diagnósticos")

1 request, **8 iterações**, sem arquivo de dados. O pre-request descobre os ids pelo
histórico (já com as datas corretas da Fase 3) e escolhe a sessão `n = iteração`, em ordem cronológica.

### 4.1 `POST {{baseUrl}}/sessions/{{idTreino}}/diagnostics/generate`

Sem body. **Pre-request Script:**

```js
const base = pm.variables.get('baseUrl');
const token = pm.environment.get('token');
const meses = ['2026-09', '2026-10'];
const idx = pm.info.iteration;           // 0..7
const todas = [];

function buscar(i) {
  if (i >= meses.length) {
    todas.sort((a, b) => new Date(a.data) - new Date(b.data));
    pm.environment.set('idTreino', todas[idx].id_treino);
    return;
  }
  pm.sendRequest({
    url: `${base}/history/sessions?mes=${meses[i]}`,
    method: 'GET',
    header: { 'Authorization': `Bearer ${token}` },
  }, (err, res) => {
    if (!err && res.code === 200) todas.push(...res.json().sessoes);
    buscar(i + 1);
  });
}
buscar(0);
```

Tests:

```js
pm.test('diagnóstico criado', () => pm.response.to.have.status(201));
pm.test('tem score', () => pm.expect(pm.response.json().diagnostico.score_geral).to.be.a('number'));
```

> **Run da Fase 4:** Runner → folder "4 - Diagnósticos" → **Iterations: 8** → *Delay* 4000 ms
> (só importa com Gemini real) → Run. O último diagnóstico gerado é a sessão 8, então
> `GET /diagnostics/latest` devolve ela.
>
> Observação do app: o `Pv` do score usa o **volume da semana corrente** (05–11/10) no
> momento da geração, então os diagnósticos das sessões 1–4 usam o volume da semana atual como
> contexto, não o da semana delas. É a regra do sistema, não erro do seed.

---

## 7. FASE 5 — SQL #2: data dos diagnósticos

Sem isso todos os diagnósticos têm `data_geracao = hoje`. Isso joga cada um pra logo depois do fim da sua sessão:

```sql
UPDATE DiagnosticoIA dg
SET data_geracao = t.data + (t.duracao_total + 3) * INTERVAL '1 minute'
FROM Treino t
WHERE t.id_treino = dg.fk_treino
  AND dg.fk_usuario = (SELECT id_usuario FROM Usuario WHERE email = 'joao@teste.com')
  AND t.data >= '2026-09-28' AND t.data < '2026-10-11';  -- só a massa deste guia
```

---

## 8. Conferência final e limpeza

**Conferir no Postman** (Authorization herdada):

| Request | Esperado |
|---|---|
| `GET /history/sessions?mes=2026-09` | 4 sessões (28, 29, 30/09 e 02/10) |
| `GET /history/sessions?mes=2026-10` | 4 sessões (05, 06, 07 e 09/10), cada uma com `score_geral` |
| `GET /history/weekly-volume?semanas=2` | Pernas 12 e Costas 10 atingindo o limiar |
| `GET /diagnostics/latest` | diagnóstico da sessão 8 (09/10) |
| `GET /sessions/today` | domingo: sem divisão hoje (estado vazio) |

**Treino de Hoje no dia da avaliação:** a massa só tem dias **passados**, então amanhã (segunda) a tela mostra a divisão **Push** com treino ainda aberto/vazio — é exatamente o que você precisa para avaliar o registro de série (RF03). Não rode a Fase 2 de novo antes disso.

**Estado vazio (heurística 10):** registre uma 2ª conta (`vazio@teste.com`) e não carregue nada.

**Limpar a massa e recomeçar** (apaga só os treinos do período 28/09–10/10 desta conta; usuário e divisão ficam):

```sql
BEGIN;
WITH alvo AS (
  SELECT t.id_treino FROM Treino t
  JOIN Usuario u ON u.id_usuario = t.fk_usuario
  WHERE u.email = 'joao@teste.com'
    AND t.data >= '2026-09-28' AND t.data < '2026-10-11'
)
, d AS (DELETE FROM DiagnosticoIA WHERE fk_treino IN (SELECT id_treino FROM alvo))
, s AS (DELETE FROM SerieTreino   WHERE fk_treino IN (SELECT id_treino FROM alvo))
DELETE FROM Treino WHERE id_treino IN (SELECT id_treino FROM alvo);
COMMIT;
```

---

## 9. Dados das 8 sessões (referência — o JSON do runner é gerado destes mesmos valores)

Formato: `carga × repetições (RIR)`. Aquecimento e feeder não têm RIR.

#### Sessão 1 — Push (2026-09-28 18:30, 62 min)

| # | Exercício (id) | Aquecimento | Feeder | Válida 1 (RIR) | Válida 2 (RIR) |
|---|---|---|---|---|---|
| 1 | Supino Reto com Barra (1) | 40kg × 12 | 55kg × 6 | 70kg × 8 (2) | 70kg × 7 (1) |
| 2 | Supino Inclinado com Halteres (5) | 14kg × 12 | 20kg × 6 | 26kg × 10 (2) | 26kg × 9 (1) |
| 3 | Desenvolvimento com Halteres (31) | 12kg × 12 | 18kg × 6 | 22kg × 10 (2) | 22kg × 9 (1) |
| 4 | Elevação Lateral com Halteres (34) | 5kg × 15 | 8kg × 8 | 10kg × 12 (2) | 10kg × 11 (1) |
| 5 | Tríceps Pulldown (Corda) (73) | 15kg × 15 | 25kg × 8 | 30kg × 12 (2) | 30kg × 11 (1) |
| 6 | Tríceps Francês na Polia (77) | 12.5kg × 15 | 20kg × 8 | 25kg × 12 (2) | 25kg × 11 (1) |

#### Sessão 2 — Pull (2026-09-29 18:40, 55 min)

| # | Exercício (id) | Aquecimento | Feeder | Válida 1 (RIR) | Válida 2 (RIR) |
|---|---|---|---|---|---|
| 1 | Puxada Aberta na Polia (16) | 30kg × 12 | 50kg × 6 | 60kg × 10 (2) | 60kg × 9 (1) |
| 2 | Remada Curvada com Barra (21) | 30kg × 12 | 50kg × 6 | 60kg × 8 (2) | 60kg × 7 (1) |
| 3 | Remada Baixa Sentado (25) | 30kg × 12 | 45kg × 6 | 55kg × 10 (2) | 55kg × 9 (1) |
| 4 | Face Pull (42) | 12.5kg × 15 | 20kg × 10 | 25kg × 15 (2) | 25kg × 14 (1) |
| 5 | Rosca Direta com Barra W (62) | 15kg × 12 | 25kg × 6 | 30kg × 10 (2) | 30kg × 9 (1) |
| 6 | Rosca Martelo com Halteres (64) | 8kg × 12 | 12kg × 6 | 14kg × 10 (2) | 14kg × 9 (1) |

#### Sessão 3 — Legs (2026-09-30 18:20, 68 min)

| # | Exercício (id) | Aquecimento | Feeder | Válida 1 (RIR) | Válida 2 (RIR) |
|---|---|---|---|---|---|
| 1 | Agachamento Livre com Barra (44) | 50kg × 10 | 75kg × 5 | 90kg × 8 (3) | 90kg × 7 (2) |
| 2 | Leg Press 45 (47) | 100kg × 12 | 160kg × 6 | 200kg × 10 (3) | 200kg × 9 (2) |
| 3 | Stiff com Barra (53) | 40kg × 12 | 60kg × 6 | 70kg × 10 (3) | 70kg × 9 (2) |
| 4 | Cadeira Extensora (50) | 30kg × 15 | 50kg × 8 | 60kg × 12 (3) | 60kg × 11 (2) |
| 5 | Mesa Flexora (Deitada) (51) | 25kg × 15 | 37.5kg × 8 | 45kg × 12 (3) | 45kg × 11 (2) |
| 6 | Gêmeos em Pé (59) | 40kg × 15 | 65kg × 10 | 80kg × 15 (3) | 80kg × 14 (2) |
| 7 | Abdominal na Polia Alta (82) | 20kg × 15 | 30kg × 10 | 40kg × 12 (3) | 40kg × 11 (2) |

#### Sessão 4 — Upper (2026-10-02 19:00, 51 min)

| # | Exercício (id) | Aquecimento | Feeder | Válida 1 (RIR) | Válida 2 (RIR) |
|---|---|---|---|---|---|
| 1 | Supino Reto com Halteres (2) | 16kg × 12 | 24kg × 6 | 30kg × 9 (2) | 30kg × 8 (1) |
| 2 | Puxada Fechada (Triângulo) (17) | 30kg × 12 | 45kg × 6 | 55kg × 10 (2) | 55kg × 9 (1) |
| 3 | Desenvolvimento na Máquina (33) | 20kg × 12 | 32.5kg × 6 | 40kg × 10 (2) | 40kg × 9 (1) |
| 4 | Remada Unilateral (Serrote) (23) | 14kg × 12 | 22kg × 6 | 28kg × 10 (2) | 28kg × 9 (1) |
| 5 | Rosca Scott (Barra W) (66) | 12.5kg × 12 | 20kg × 6 | 25kg × 10 (2) | 25kg × 9 (1) |
| 6 | Tríceps Testa com Barra W (74) | 15kg × 12 | 25kg × 6 | 30kg × 10 (2) | 30kg × 9 (1) |

#### Sessão 5 — Push (2026-10-05 18:30, 59 min)

| # | Exercício (id) | Aquecimento | Feeder | Válida 1 (RIR) | Válida 2 (RIR) |
|---|---|---|---|---|---|
| 1 | Supino Reto com Barra (1) | 40kg × 12 | 55kg × 6 | 72.5kg × 8 (1) | 72.5kg × 7 (0) |
| 2 | Supino Inclinado com Halteres (5) | 14kg × 12 | 20kg × 6 | 28kg × 9 (1) | 28kg × 8 (1) |
| 3 | Desenvolvimento com Halteres (31) | 12kg × 12 | 18kg × 6 | 24kg × 9 (1) | 24kg × 8 (1) |
| 4 | Elevação Lateral com Halteres (34) | 5kg × 15 | 8kg × 8 | 12kg × 10 (1) | 12kg × 9 (1) |
| 5 | Tríceps Pulldown (Corda) (73) | 15kg × 15 | 25kg × 8 | 32.5kg × 12 (1) | 32.5kg × 11 (1) |
| 6 | Tríceps Francês na Polia (77) | 12.5kg × 15 | 20kg × 8 | 27.5kg × 11 (1) | 27.5kg × 10 (1) |

#### Sessão 6 — Pull (2026-10-06 18:35, 53 min)

| # | Exercício (id) | Aquecimento | Feeder | Válida 1 (RIR) | Válida 2 (RIR) |
|---|---|---|---|---|---|
| 1 | Puxada Aberta na Polia (16) | 30kg × 12 | 50kg × 6 | 62.5kg × 10 (1) | 62.5kg × 9 (0) |
| 2 | Remada Curvada com Barra (21) | 30kg × 12 | 50kg × 6 | 65kg × 8 (1) | 65kg × 7 (1) |
| 3 | Remada Baixa Sentado (25) | 30kg × 12 | 45kg × 6 | 57.5kg × 10 (1) | 57.5kg × 9 (1) |
| 4 | Face Pull (42) | 12.5kg × 15 | 20kg × 10 | 27.5kg × 15 (1) | 27.5kg × 14 (1) |
| 5 | Rosca Direta com Barra W (62) | 15kg × 12 | 25kg × 6 | 32.5kg × 9 (1) | 32.5kg × 8 (1) |
| 6 | Rosca Martelo com Halteres (64) | 8kg × 12 | 12kg × 6 | 16kg × 9 (1) | 16kg × 8 (1) |

#### Sessão 7 — Legs (2026-10-07 18:25, 70 min)

| # | Exercício (id) | Aquecimento | Feeder | Válida 1 (RIR) | Válida 2 (RIR) |
|---|---|---|---|---|---|
| 1 | Agachamento Livre com Barra (44) | 50kg × 10 | 75kg × 5 | 95kg × 8 (1) | 95kg × 7 (0) |
| 2 | Leg Press 45 (47) | 100kg × 12 | 160kg × 6 | 220kg × 10 (1) | 220kg × 9 (1) |
| 3 | Stiff com Barra (53) | 40kg × 12 | 60kg × 6 | 75kg × 10 (1) | 75kg × 9 (1) |
| 4 | Cadeira Extensora (50) | 30kg × 15 | 50kg × 8 | 65kg × 12 (1) | 65kg × 11 (1) |
| 5 | Mesa Flexora (Deitada) (51) | 25kg × 15 | 37.5kg × 8 | 47.5kg × 12 (1) | 47.5kg × 11 (1) |
| 6 | Gêmeos em Pé (59) | 40kg × 15 | 65kg × 10 | 90kg × 15 (1) | 90kg × 14 (1) |
| 7 | Abdominal na Polia Alta (82) | 20kg × 15 | 30kg × 10 | 42.5kg × 12 (1) | 42.5kg × 11 (1) |

#### Sessão 8 — Upper (2026-10-09 19:00, 57 min)

| # | Exercício (id) | Aquecimento | Feeder | Válida 1 (RIR) | Válida 2 (RIR) |
|---|---|---|---|---|---|
| 1 | Supino Reto com Halteres (2) | 16kg × 12 | 24kg × 6 | 32kg × 9 (1) | 32kg × 8 (0) |
| 2 | Puxada Fechada (Triângulo) (17) | 30kg × 12 | 45kg × 6 | 57.5kg × 10 (1) | 57.5kg × 9 (1) |
| 3 | Desenvolvimento na Máquina (33) | 20kg × 12 | 32.5kg × 6 | 42.5kg × 10 (1) | 42.5kg × 9 (1) |
| 4 | Remada Unilateral (Serrote) (23) | 14kg × 12 | 22kg × 6 | 30kg × 10 (1) | 30kg × 9 (1) |
| 5 | Rosca Scott (Barra W) (66) | 12.5kg × 12 | 20kg × 6 | 27.5kg × 10 (1) | 27.5kg × 9 (1) |
| 6 | Tríceps Testa com Barra W (74) | 15kg × 12 | 25kg × 6 | 32.5kg × 10 (1) | 32.5kg × 9 (1) |

---

## 10. Resumo da ordem de execução

1. Fase 1 — Setup (1 run, 8 requests)
2. Fase 2 — Sessões (8 iterações + arquivo `.json`)
3. **SQL #1** (seção 5)
4. Fase 4 — Diagnósticos (8 iterações)
5. **SQL #2** (seção 7)
6. Conferência (seção 8)
