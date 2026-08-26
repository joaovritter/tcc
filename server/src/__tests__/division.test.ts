import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app'
import * as userModel from '../models/userModel'

async function registrarELogar() {
    const email = `div${Date.now()}${Math.random()}@exemplo.com`;
    await request(app).post('/auth/register').send({ nome: 'T', email, senha: '123456' });

    const login = await request(app).post('/auth/login').send({ email, senha: '123456' });
    return { token: login.body.token as string };
}


test('PUT /divisions salva a semana e GET devolve igual', async () => {
    const { token } = await registrarELogar();

    const resposta = await request(app)
        .put('/divisions')
        .set('Authorization', `Bearer ${token}`)
        .send({
            divisoes: [
                { dia_semana: 1, nome: 'Peitoe triceps' },
                { dia_semana: 3, nome: 'Costas e biceps' },
            ]
        });

    assert.equal(resposta.status, 200);
    assert.equal(resposta.body.divisoes.length, 2);

    const listagem = await request(app)
        .get('/divisions')
        .set('Authorization', `Bearer ${token}`);

    assert.equal(listagem.body.divisoes.length, 2);
    assert.equal(listagem.body.divisoes[0].dia_semana, 1);
})


test('PUT /divisions com dia_semana fora de 0-6 retorna 400', async () => {
  const { token } = await registrarELogar();

  const resposta = await request(app)
    .put('/divisions')
    .set('Authorization', `Bearer ${token}`)
    .send({ divisoes: [{ dia_semana: 7, nome: 'Inválido' }] });

  assert.equal(resposta.status, 400);
});


test('PUT /divisions sem nome retorna 400', async () => {
  const { token } = await registrarELogar();

  const resposta = await request(app)
    .put('/divisions')
    .set('Authorization', `Bearer ${token}`)
    .send({ divisoes: [{ dia_semana: 0, nome: '' }] });

  assert.equal(resposta.status, 400);
});


test('PUT /divisions com dois registros no mesmo dia retorna 400', async () => {
  const { token } = await registrarELogar();

  const resposta = await request(app)
    .put('/divisions')
    .set('Authorization', `Bearer ${token}`)
    .send({ divisoes: [
      { dia_semana: 2, nome: 'Pernas' },
      { dia_semana: 2, nome: 'Pernas de novo' },
    ] });

  assert.equal(resposta.status, 400);
});


test('GET /divisions sem token retorna 401', async () => {
  const resposta = await request(app).get('/divisions');
  assert.equal(resposta.status, 401);
});


test('segundo PUT /divisions substitui a semana anterior', async () => {
  const { token } = await registrarELogar();

  await request(app)
    .put('/divisions')
    .set('Authorization', `Bearer ${token}`)
    .send({ divisoes: [{ dia_semana: 0, nome: 'Primeira versão' }] });

  const segunda = await request(app)
    .put('/divisions')
    .set('Authorization', `Bearer ${token}`)
    .send({ divisoes: [{ dia_semana: 5, nome: 'Segunda versão' }] });

  assert.equal(segunda.status, 200);
  assert.equal(segunda.body.divisoes.length, 1);
  assert.equal(segunda.body.divisoes[0].dia_semana, 5);
});


test('id_divisao é preservado ao editar um dia que já existia', async () => {
  const { token } = await registrarELogar();

  const primeira = await request(app)
    .put('/divisions')
    .set('Authorization', `Bearer ${token}`)
    .send({ divisoes: [{ dia_semana: 1, nome: 'Nome original' }] });
  const idOriginal = primeira.body.divisoes[0].id_divisao;

  const segunda = await request(app)
    .put('/divisions')
    .set('Authorization', `Bearer ${token}`)
    .send({ divisoes: [{ dia_semana: 1, nome: 'Nome editado' }] });

  assert.equal(segunda.body.divisoes[0].id_divisao, idOriginal);
  assert.equal(segunda.body.divisoes[0].nome, 'Nome editado');
});


