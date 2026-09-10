import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app'
import { registrarELogar, registrarComDivisao} from './testHelpers';


test ('GET /exercises devolve catálogo com grupamento', async () => {
    const { token } = await registrarELogar();
    const resposta = await request(app)
        .get('/exercises')
        .set('Authorization', `Bearer ${token}`);

    assert.equal(resposta.status, 200);
    assert.ok(resposta.body.exercicios.length > 0);
    assert.ok(resposta.body.exercicios[0].nome_exercicio);
});


test('PUT /divisions/:id/exercises salva e GET devolve na ordem certa', async () => {
  const { token, idDivisao } = await registrarComDivisao();
  const catalogo = await request(app)
    .get('/exercises')
    .set('Authorization', `Bearer ${token}`);
  const [ex1, ex2] = catalogo.body.exercicios;

  const resposta = await request(app)
    .put(`/divisions/${idDivisao}/exercises`)
    .set('Authorization', `Bearer ${token}`)
    .send({ exercicios: [{ fk_exercicio: ex1.id_exercicio }, { fk_exercicio: ex2.id_exercicio }] });

  assert.equal(resposta.status, 200);
  assert.equal(resposta.body.exercicios[0].ordem, 1);
  assert.equal(resposta.body.exercicios[0].fk_exercicio, ex1.id_exercicio);
  assert.equal(resposta.body.exercicios[1].ordem, 2);
});


test('PUT /divisions/:id/exercises em divisão de outro usuário retorna 404', async () => {
  const { idDivisao } = await registrarComDivisao();
  const { token: tokenOutro } = await registrarELogar();

  const resposta = await request(app)
    .put(`/divisions/${idDivisao}/exercises`)
    .set('Authorization', `Bearer ${tokenOutro}`)
    .send({ exercicios: [] });

  assert.equal(resposta.status, 404);
});


test('GET /divisions/muscle-summary reflete os exercícios salvos', async () => {
  const { token, idDivisao } = await registrarComDivisao();
  const catalogo = await request(app)
    .get('/exercises')
    .set('Authorization', `Bearer ${token}`);
  const exercicio = catalogo.body.exercicios[0];

  await request(app)
    .put(`/divisions/${idDivisao}/exercises`)
    .set('Authorization', `Bearer ${token}`)
    .send({ exercicios: [{ fk_exercicio: exercicio.id_exercicio }] });

  const resumo = await request(app)
    .get('/divisions/muscle-summary')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(resumo.status, 200);
  assert.equal(resumo.body.resumo[0].grupamentos[0], exercicio.nome_grupamento);
});