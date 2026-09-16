import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app';
import { registrarELogar, registrarComTreinoAberto } from './testHelpers';


//registra n series do tipo pedido, no exercicio da rotina de hoje
async function registrarSeries(
  token: string,
  idTreino: string,
  fkExercicio: number,
  tipo: 'aquecimento' | 'feeder' | 'work',
  quantidade: number
) {
  for (let i = 0; i < quantidade; i++) {
    await request(app)
      .post(`/sessions/${idTreino}/sets`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        fk_exercicio: fkExercicio,
        tipo,
        carga: 60,
        repeticoes: 10,
        //D9: so serie valida leva nota
        ...(tipo === 'work' ? { rir: 2 } : {}),
      });
  }
}

function acharGrupamento(volume: any, nome: string) {
  return volume.grupamentos.find((g: any) => g.nome_grupamento === nome);
}


test('GET /metrics/weekly-volume sem token retorna 401', async () => {
  const resposta = await request(app).get('/metrics/weekly-volume');
  assert.equal(resposta.status, 401);
});


test('volume conta só séries válidas (work) — aquecimento e feeder não entram', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();

  await registrarSeries(token, idTreino, exercicio.id_exercicio, 'work', 3);
  await registrarSeries(token, idTreino, exercicio.id_exercicio, 'aquecimento', 2);
  await registrarSeries(token, idTreino, exercicio.id_exercicio, 'feeder', 1);

  const resposta = await request(app)
    .get('/metrics/weekly-volume')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(resposta.status, 200);
  const grupamento = acharGrupamento(resposta.body.volume, exercicio.nome_grupamento);
  //6 series gravadas no total, so 3 valem volume
  assert.equal(grupamento.series_validas, 3);
});


test('soma do volume é igual à contagem manual de séries válidas (matriz RF04)', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();

  const VALIDAS = 7; //contagem manual: o numero que a gente registrou de proposito
  await registrarSeries(token, idTreino, exercicio.id_exercicio, 'work', VALIDAS);
  await registrarSeries(token, idTreino, exercicio.id_exercicio, 'aquecimento', 4);

  const resposta = await request(app)
    .get('/metrics/weekly-volume')
    .set('Authorization', `Bearer ${token}`);

  const total = resposta.body.volume.grupamentos.reduce(
    (soma: number, g: any) => soma + g.series_validas,
    0
  );
  assert.equal(total, VALIDAS);
});


test('todos os grupamentos aparecem, e os não treinados vêm com 0', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  await registrarSeries(token, idTreino, exercicio.id_exercicio, 'work', 2);

  const resposta = await request(app)
    .get('/metrics/weekly-volume')
    .set('Authorization', `Bearer ${token}`);

  //7 grupamentos do seed - grupamento zerado nao pode sumir da lista
  assert.equal(resposta.body.volume.grupamentos.length, 7);

  const naoTreinados = resposta.body.volume.grupamentos.filter(
    (g: any) => g.nome_grupamento !== exercicio.nome_grupamento
  );
  for (const g of naoTreinados) {
    assert.equal(g.series_validas, 0); //COUNT(coluna), nao COUNT(*)
    assert.equal(g.atingiu_limiar, false);
  }
});


test('atingiu_limiar vira true só a partir de 10 séries [Schoenfeld]', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();

  await registrarSeries(token, idTreino, exercicio.id_exercicio, 'work', 9);
  const antes = await request(app)
    .get('/metrics/weekly-volume')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(antes.body.volume.limiar, 10);
  assert.equal(acharGrupamento(antes.body.volume, exercicio.nome_grupamento).atingiu_limiar, false);

  await registrarSeries(token, idTreino, exercicio.id_exercicio, 'work', 1);
  const depois = await request(app)
    .get('/metrics/weekly-volume')
    .set('Authorization', `Bearer ${token}`);
  const grupamento = acharGrupamento(depois.body.volume, exercicio.nome_grupamento);
  assert.equal(grupamento.series_validas, 10);
  assert.equal(grupamento.atingiu_limiar, true);
});


test('volume de um usuário não conta séries de outro', async () => {
  const outro = await registrarComTreinoAberto();
  await registrarSeries(outro.token, outro.idTreino, outro.exercicio.id_exercicio, 'work', 5);

  const meu = await registrarComTreinoAberto();
  await registrarSeries(meu.token, meu.idTreino, meu.exercicio.id_exercicio, 'work', 2);

  const resposta = await request(app)
    .get('/metrics/weekly-volume')
    .set('Authorization', `Bearer ${meu.token}`);

  //se o filtro de dono estivesse no ON de um LEFT JOIN em vez da subconsulta,
  //aqui sairia 7 em vez de 2
  assert.equal(acharGrupamento(resposta.body.volume, meu.exercicio.nome_grupamento).series_validas, 2);
});


test('apagar série tira a série do volume (cobre o DELETE, Reparo 4)', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  await registrarSeries(token, idTreino, exercicio.id_exercicio, 'work', 3);

  const hoje = await request(app)
    .get('/sessions/today')
    .set('Authorization', `Bearer ${token}`);
  const idSerie = hoje.body.hoje.series[0].id_serie;

  const apagou = await request(app)
    .delete(`/sessions/${idTreino}/sets/${idSerie}`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(apagou.status, 204);

  const resposta = await request(app)
    .get('/metrics/weekly-volume')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(acharGrupamento(resposta.body.volume, exercicio.nome_grupamento).series_validas, 2);
});


test('POST /sessions/:id/finish grava completed e duracao_total (RF03)', async () => {
  const { token, idTreino } = await registrarComTreinoAberto();

  const resposta = await request(app)
    .post(`/sessions/${idTreino}/finish`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(resposta.status, 200);
  assert.equal(resposta.body.treino.completed, true);
  //GREATEST(1, ...): treino de teste dura segundos e arredondaria pra 0
  assert.ok(resposta.body.treino.duracao_total >= 1);
});


test('finalizar duas vezes retorna 409 e não recalcula a duração', async () => {
  const { token, idTreino } = await registrarComTreinoAberto();

  const primeira = await request(app)
    .post(`/sessions/${idTreino}/finish`)
    .set('Authorization', `Bearer ${token}`);
  const segunda = await request(app)
    .post(`/sessions/${idTreino}/finish`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(primeira.status, 200);
  assert.equal(segunda.status, 409);
});


test('finalizar treino de outro usuário retorna 404', async () => {
  const dono = await registrarComTreinoAberto();
  const { token: intruso } = await registrarELogar();

  const resposta = await request(app)
    .post(`/sessions/${dono.idTreino}/finish`)
    .set('Authorization', `Bearer ${intruso}`);

  assert.equal(resposta.status, 404);
});


test('séries de treino finalizado continuam contando no volume (D11)', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  await registrarSeries(token, idTreino, exercicio.id_exercicio, 'work', 4);

  await request(app)
    .post(`/sessions/${idTreino}/finish`)
    .set('Authorization', `Bearer ${token}`);

  const resposta = await request(app)
    .get('/metrics/weekly-volume')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(acharGrupamento(resposta.body.volume, exercicio.nome_grupamento).series_validas, 4);
});
