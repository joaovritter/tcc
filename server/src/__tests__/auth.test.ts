import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app'
import * as userModel from '../models/userModel'

//supertest finge ser um front/postman
//datenow para gerar varios emails diferentes
test('Registro válido cria usuário e não devolve senha_hash', async () => {
    const resposta = await request(app)
        .post('auth/register')
        .send({ nome: 'Teste', email: `teste${Date.now()}@exemplo.com`, senha: '123456' });

    assert.equal(resposta.status, 201); //equal(valor_real, valor_esperado)
    assert.ok(resposta.body.usuario.id_usuario); //ok(existe/verdadeiro)
    assert.equal(resposta.body.usuario.senha_hash, undefined);
})


test('registro com email duplicado retorna 400', async () => {
    const email = `duplicado${Date.now()}@exemplo.com`;
    await request(app).post('auth/register').send({ nome: 'A', email, senha: '123456' });

    const resposta = await request(app)
        .post('auth/register')
        .send({ nome: 'B', email, senha: '123456' });

    assert.equal(resposta.status, 400);
});


test('login correto retorna token', async () => {
    const email = `login${Date.now()}@exemplo.com`;
    (await request(app).post('auth/register').send({ nome: 'C', email, senha: '123456' }))

    const resposta = await request(app)
        .post('auth/login')
        .send({ email, senha: '123456' });

    assert.equal(resposta.status, 200);
    assert.ok(resposta.body.token);
})


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
});


test('/me com token adulterado retorna 401', async () => {
    const email = `adulterado${Date.now()}@exemplo.com`;
    await request(app).post('/auth/register').send({ nome: 'F', email, senha: '123456' });

    const login = await request(app).post('/auth/login').send({ email, senha: '123456' });
    //slice do inicio até o ultimo; troca o ultimo pelo x
    const tokenAdulterado = login.body.token.slice(0, -1) + 'x';

    const resposta = await request(app)
        .get('/me')
        .set('Authorization', `Bearer ${tokenAdulterado}`);

    assert.equal(resposta.status, 401);
});


test('senha é gravada como hash bcrypt. não em texto puro', async () => {
    const email = `hash${Date.now()}@exemplo.com`;
    await request(app).post('/auth/register').send({ nome: 'F' })

    const usuario = await userModel.buscarPorEmail(email);

    assert.ok(usuario);
    assert.notEqual(usuario!.senha_hash, '123456'); //usuario! garante que o usuario existe (nao nulo)
    assert.match(usuario!.senha_hash, /^\$2/); //o texo obrigatoriamente tem que comecar com $2 (senha do bcrypt)
})