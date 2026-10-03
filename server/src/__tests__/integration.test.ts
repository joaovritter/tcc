import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app';
import { pool } from '../config/db';
import { registrarComTreinoAberto } from './testHelpers';

//testes de integracao da Tabela VI do TCC

const TREINO_INEXISTENTE = '00000000-0000-0000-0000-000000000000';

function get(caminho: string, token: string) {
  return request(app).get(caminho).set('Authorization', `Bearer ${token}`);
}

function post(caminho: string, token: string, corpo?: object) {
  const pedido = request(app).post(caminho).set('Authorization', `Bearer ${token}`);
  return corpo ? pedido.send(corpo) : pedido;
}

function put(caminho: string, token: string, corpo: object) {
  return request(app).put(caminho).set('Authorization', `Bearer ${token}`).send(corpo);
}

//treino com 2 series validas, ja finalizado
async function treinoFinalizado() {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  const serie = { fk_exercicio: exercicio.id_exercicio, tipo: 'work', carga: 80 };
  await post(`/sessions/${idTreino}/sets`, token, { ...serie, repeticoes: 8, rir: 1 });
  await post(`/sessions/${idTreino}/sets`, token, { ...serie, repeticoes: 7, rir: 2 });
  await post(`/sessions/${idTreino}/finish`, token);
  return { token, idTreino };
}


test('fluxo completo: cadastro, rotina, treino, volume, diagnóstico e histórico', async () => {
  //1. cadastro e login
  const email = `integracao${Date.now()}@teste.com`;
  const cadastro = await request(app).post('/auth/register').send({ nome: 'Integração', email, senha: '123456' });
  assert.equal(cadastro.status, 201);
  const login = await request(app).post('/auth/login').send({ email, senha: '123456' });
  const token = login.body.token;

  //2. rotina de hoje com um exercicio
  const divisao = await put('/divisions', token, {
    divisoes: [{ dia_semana: new Date().getDay(), nome: 'Peito' }],
  });
  const idDivisao = divisao.body.divisoes[0].id_divisao;
  const catalogo = await get('/exercises', token);
  const exercicio = catalogo.body.exercicios[0];
  await put(`/divisions/${idDivisao}/exercises`, token, {
    exercicios: [{ fk_exercicio: exercicio.id_exercicio }],
  });

  //3. treino: 1 aquecimento + 2 validas (uma com RIR e outra com RPE)
  const inicio = await post('/sessions/start', token);
  const idTreino = inicio.body.treino.id_treino;
  const base = { fk_exercicio: exercicio.id_exercicio };
  await post(`/sessions/${idTreino}/sets`, token, { ...base, tipo: 'aquecimento', carga: 40, repeticoes: 12 });
  await post(`/sessions/${idTreino}/sets`, token, { ...base, tipo: 'work', carga: 80, repeticoes: 8, rir: 1 });
  await post(`/sessions/${idTreino}/sets`, token, { ...base, tipo: 'work', carga: 80, repeticoes: 7, rpe: 8 });
  const fim = await post(`/sessions/${idTreino}/finish`, token);
  assert.equal(fim.status, 200);

  //4. volume: so as 2 validas contam
  const volume = await get('/metrics/weekly-volume', token);
  const grupo = volume.body.volume.grupamentos.find(
    (g: { nome_grupamento: string }) => g.nome_grupamento === exercicio.nome_grupamento
  );
  assert.equal(grupo.series_validas, 2);

  //5. diagnostico: os 3 campos + score calculado no backend
  const geracao = await post(`/sessions/${idTreino}/diagnostics/generate`, token);
  assert.equal(geracao.status, 201);
  const diagnostico = geracao.body.diagnostico;
  assert.ok(diagnostico.conteudo_json.recomendacoes_proxima_sessao.length > 0);
  assert.equal(diagnostico.score_geral, 52);

  //o diagnostico esta gravado no banco
  const salvo = await pool.query('SELECT score_geral FROM DiagnosticoIA WHERE fk_treino = $1', [idTreino]);
  assert.equal(salvo.rowCount, 1);
  assert.equal(salvo.rows[0].score_geral, 52);

  //6. historico: a sessao aparece no mes e o detalhe traz series e diagnostico
  const mes = await get('/history/sessions', token);
  const sessao = mes.body.sessoes.find((s: { id_treino: string }) => s.id_treino === idTreino);
  assert.equal(sessao.score_geral, 52);

  const detalhe = await get(`/history/sessions/${idTreino}`, token);
  assert.equal(detalhe.body.exercicios[0].series.length, 3);
  assert.equal(detalhe.body.diagnostico.id_diagnostico, diagnostico.id_diagnostico);
});


test('o banco recusa série e diagnóstico de treino inexistente', async () => {
  await assert.rejects(
    pool.query(
      `INSERT INTO SerieTreino (fk_treino, fk_exercicio, tipo, carga, repeticoes)
       VALUES ($1, (SELECT MIN(id_exercicio) FROM Exercicio), 'aquecimento', 20, 10)`,
      [TREINO_INEXISTENTE]
    )
  );
  await assert.rejects(
    pool.query(
      `INSERT INTO DiagnosticoIA (fk_usuario, fk_treino, score_geral, conteudo_json)
       VALUES ($1, $1, 50, '{}')`,
      [TREINO_INEXISTENTE]
    )
  );
});


test('o banco não deixa apagar um treino que tem séries', async () => {
  const { idTreino } = await treinoFinalizado();

  await assert.rejects(pool.query('DELETE FROM Treino WHERE id_treino = $1', [idTreino]));
});


test('falha simulada da IA devolve 502 e o treino continua intacto', async () => {
  const { token, idTreino } = await treinoFinalizado();

  process.env.GEMINI_MOCK = 'falha';
  const geracao = await post(`/sessions/${idTreino}/diagnostics/generate`, token);
  process.env.GEMINI_MOCK = 'true';

  assert.equal(geracao.status, 502);

  const detalhe = await get(`/history/sessions/${idTreino}`, token);
  assert.equal(detalhe.body.exercicios[0].series.length, 2);
  assert.equal(detalhe.body.diagnostico, null);
});