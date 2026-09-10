import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app'
import { registrarELogar, registrarComRotinaDeHoje} from './testHelpers';


test('GET /sessions/today monta o treino a partir da divisão do dia', async () => {
  const { token, exercicio } = await registrarComRotinaDeHoje();

  const resposta = await request(app)
    .get('/sessions/today')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(resposta.status, 200);
  assert.equal(resposta.body.hoje.divisaoHoje.dia_semana, new Date().getDay());
  assert.equal(resposta.body.hoje.exercicios[0].fk_exercicio, exercicio.id_exercicio);
  assert.equal(resposta.body.hoje.treino, null); // GET não cria treino
});


test('POST /sessions/start é idempotente no mesmo dia', async () => {
  const { token } = await registrarComRotinaDeHoje();

  const primeira = await request(app)
    .post('/sessions/start')
    .set('Authorization', `Bearer ${token}`);
  const segunda = await request(app)
    .post('/sessions/start')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(primeira.status, 201);
  assert.equal(segunda.status, 200);
  assert.equal(segunda.body.treino.id_treino, primeira.body.treino.id_treino);
});


test('registrar série com rir grava e deriva o rpe correspondente', async () => {
  const { token, exercicio } = await registrarComRotinaDeHoje();
  const inicio = await request(app)
    .post('/sessions/start')
    .set('Authorization', `Bearer ${token}`);
  const idTreino = inicio.body.treino.id_treino as string;

  const resposta = await request(app)
    .post(`/sessions/${idTreino}/sets`)
    .set('Authorization', `Bearer ${token}`)
    .send({ fk_exercicio: exercicio.id_exercicio, tipo: 'work', carga: 60, repeticoes: 10, rir: 2 });

  assert.equal(resposta.status, 201);
  assert.equal(resposta.body.serie.rir, 2);
  assert.equal(resposta.body.serie.rpe, 8); // 10 - rir, calculado pelo banco (coluna gerada)
  assert.equal(Number(resposta.body.serie.carga), 60); // NUMERIC volta string
});


test('registrar série com rpe grava e deriva o rir correspondente', async () => {
  const { token, exercicio } = await registrarComRotinaDeHoje();
  const inicio = await request(app)
    .post('/sessions/start')
    .set('Authorization', `Bearer ${token}`);
  const idTreino = inicio.body.treino.id_treino as string;

  const resposta = await request(app)
    .post(`/sessions/${idTreino}/sets`)
    .set('Authorization', `Bearer ${token}`)
    .send({ fk_exercicio: exercicio.id_exercicio, tipo: 'work', carga: 60, repeticoes: 10, rpe: 8 });

  assert.equal(resposta.status, 201);
  assert.equal(resposta.body.serie.rpe, 8);
  assert.equal(resposta.body.serie.rir, 2); // 10 - rpe, convertido no controller antes de gravar
});


test('rir e rpe fora da faixa nova (0–4 / 6–10) são recusados com 400', async () => {
  const { token, exercicio } = await registrarComRotinaDeHoje();
  const inicio = await request(app)
    .post('/sessions/start')
    .set('Authorization', `Bearer ${token}`);
  const idTreino = inicio.body.treino.id_treino as string;

  const base = { fk_exercicio: exercicio.id_exercicio, tipo: 'work', carga: 60, repeticoes: 10 };

  // rir 5 era válido no CHECK antigo (0–5); com a faixa nova (0–4) é 400
  const rirAlto = await request(app)
    .post(`/sessions/${idTreino}/sets`)
    .set('Authorization', `Bearer ${token}`)
    .send({ ...base, rir: 5 });
  const rpeBaixo = await request(app)
    .post(`/sessions/${idTreino}/sets`)
    .set('Authorization', `Bearer ${token}`)
    .send({ ...base, rpe: 5 });

  assert.equal(rirAlto.status, 400);
  assert.equal(rpeBaixo.status, 400);
});


test('mandar rir e rpe juntos é recusado — a pessoa escolhe um dos dois', async () => {
  const { token, exercicio } = await registrarComRotinaDeHoje();
  const inicio = await request(app)
    .post('/sessions/start')
    .set('Authorization', `Bearer ${token}`);
  const idTreino = inicio.body.treino.id_treino as string;

  const resposta = await request(app)
    .post(`/sessions/${idTreino}/sets`)
    .set('Authorization', `Bearer ${token}`)
    .send({ fk_exercicio: exercicio.id_exercicio, tipo: 'work', carga: 60, repeticoes: 10, rir: 2, rpe: 8 });

  assert.equal(resposta.status, 400);
});


test('aquecimento e feeder não aceitam rpe/rir', async () => {
  const { token, exercicio } = await registrarComRotinaDeHoje();
  const inicio = await request(app)
    .post('/sessions/start')
    .set('Authorization', `Bearer ${token}`);
  const idTreino = inicio.body.treino.id_treino as string;

  const comNota = await request(app)
    .post(`/sessions/${idTreino}/sets`)
    .set('Authorization', `Bearer ${token}`)
    .send({ fk_exercicio: exercicio.id_exercicio, tipo: 'aquecimento', carga: 20, repeticoes: 15, rpe: 8 });

  const semNota = await request(app)
    .post(`/sessions/${idTreino}/sets`)
    .set('Authorization', `Bearer ${token}`)
    .send({ fk_exercicio: exercicio.id_exercicio, tipo: 'aquecimento', carga: 20, repeticoes: 15 });

  assert.equal(comNota.status, 400);
  assert.equal(semNota.status, 201);
  assert.equal(semNota.body.serie.rpe, null);
  assert.equal(semNota.body.serie.rir, null);
});


test('série válida sem nenhuma nota (nem rir nem rpe) é recusada', async () => {
  const { token, exercicio } = await registrarComRotinaDeHoje();
  const inicio = await request(app)
    .post('/sessions/start')
    .set('Authorization', `Bearer ${token}`);
  const idTreino = inicio.body.treino.id_treino as string;

  const resposta = await request(app)
    .post(`/sessions/${idTreino}/sets`)
    .set('Authorization', `Bearer ${token}`)
    .send({ fk_exercicio: exercicio.id_exercicio, tipo: 'work', carga: 60, repeticoes: 10 });

  assert.equal(resposta.status, 400);
});


test('registrar série no treino de outro usuário retorna 404', async () => {
  const { token, exercicio } = await registrarComRotinaDeHoje();
  const inicio = await request(app)
    .post('/sessions/start')
    .set('Authorization', `Bearer ${token}`);
  const idTreino = inicio.body.treino.id_treino as string;

  const { token: tokenOutro } = await registrarELogar();
  const resposta = await request(app)
    .post(`/sessions/${idTreino}/sets`)
    .set('Authorization', `Bearer ${tokenOutro}`)
    .send({ fk_exercicio: exercicio.id_exercicio, tipo: 'work', carga: 60, repeticoes: 10 });

  assert.equal(resposta.status, 404);
});