import request from 'supertest';
import app from '../app'

//arquivo com funcoes utilizadas em diversos testes, para evitar repeticao de codigo


export async function registrarELogar() {
    const email = `div${Date.now()}${Math.random()}@exemplo.com`;
    await request(app).post('/auth/register').send({ nome: 'T', email, senha: '123456' });

    const login = await request(app).post('/auth/login').send({ email, senha: '123456' });
    return { token: login.body.token as string };
}



export async function registrarComDivisao() {
    const { token } = await registrarELogar();
    const divisao = await request(app)
        .put('/divisions')
        .set('Authorization', `Bearer ${token}`)
        .send({ divisoes: [{ dia_semana: 1, nome: 'Peito e triceps' }] });
    return { token, idDivisao: divisao.body.divisoes[0].id_divisao as string };
}



export async function registrarComRotinaDeHoje() {
  const { token } = await registrarELogar();
  const diaHoje = new Date().getDay();

  const divisao = await request(app)
    .put('/divisions')
    .set('Authorization', `Bearer ${token}`)
    .send({ divisoes: [{ dia_semana: diaHoje, nome: 'Treino de hoje' }] });
  const idDivisao = divisao.body.divisoes[0].id_divisao as string;

  const catalogo = await request(app)
    .get('/exercises')
    .set('Authorization', `Bearer ${token}`);
  const exercicio = catalogo.body.exercicios[0];

  await request(app)
    .put(`/divisions/${idDivisao}/exercises`)
    .set('Authorization', `Bearer ${token}`)
    .send({ exercicios: [{ fk_exercicio: exercicio.id_exercicio }] });

  return { token, idDivisao, exercicio };
}