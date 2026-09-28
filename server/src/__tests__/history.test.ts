import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app';
import { registrarELogar, registrarComTreinoAberto } from './testHelpers';


//registra uma serie; so work leva nota (D9)
async function registrarSerie(
  token: string,
  idTreino: string,
  fkExercicio: number,
  tipo: 'aquecimento' | 'feeder' | 'work',
  carga: number,
  repeticoes = 8
) {
  await request(app)
    .post(`/sessions/${idTreino}/sets`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      fk_exercicio: fkExercicio,
      tipo,
      carga,
      repeticoes,
      ...(tipo === 'work' ? { rir: 2 } : {}),
    });
}

async function finalizar(token: string, idTreino: string) {
  await request(app)
    .post(`/sessions/${idTreino}/finish`)
    .set('Authorization', `Bearer ${token}`);
}

function gerarDiagnostico(token: string, idTreino: string) {
  return request(app)
    .post(`/sessions/${idTreino}/diagnostics/generate`)
    .set('Authorization', `Bearer ${token}`);
}

function buscar(caminho: string, token: string) {
  return request(app).get(caminho).set('Authorization', `Bearer ${token}`);
}


//============================ sessoes do mes (D18) ============================

test('GET /history/sessions sem token retorna 401', async () => {
  const resposta = await request(app).get('/history/sessions');
  assert.equal(resposta.status, 401);
});


test('sessões do mês: só treino finalizado, series_validas só work, dia em texto (D18)', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 60);
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 60);
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'aquecimento', 30);

  //treino aberto e assunto do "Treino de hoje", nao do historico
  const aberto = await buscar('/history/sessions', token);
  assert.equal(aberto.status, 200);
  assert.deepEqual(aberto.body.sessoes, []);
  assert.equal(aberto.body.primeira_sessao, null);

  await finalizar(token, idTreino);
  const resposta = await buscar('/history/sessions', token); //sem ?mes = mes atual
  assert.equal(resposta.status, 200);
  assert.equal(resposta.body.sessoes.length, 1);

  const sessao = resposta.body.sessoes[0];
  assert.equal(sessao.series_validas, 2);
  assert.equal(sessao.nome_divisao, 'Treino de hoje');
  assert.equal(sessao.id_diagnostico, null);
  assert.match(sessao.dia, /^\d{4}-\d{2}-\d{2}$/); //texto do to_char, sem T...Z
  assert.equal(resposta.body.primeira_sessao, sessao.dia);

  //o mesmo mes pedido explicitamente - o mes vem do backend, nao do relogio do teste
  const explicito = await buscar(`/history/sessions?mes=${sessao.dia.slice(0, 7)}`, token);
  assert.equal(explicito.body.sessoes.length, 1);
  assert.equal(explicito.body.sessoes[0].id_treino, idTreino);
});


test('sessões do mês: mês sem treino volta vazio, mas primeira_sessao continua', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 60);
  await finalizar(token, idTreino);

  const resposta = await buscar('/history/sessions?mes=2020-01', token);
  assert.equal(resposta.status, 200);
  assert.deepEqual(resposta.body.sessoes, []);
  assert.ok(resposta.body.primeira_sessao); //e ela que trava a seta de voltar do calendario
});


test('sessões do mês: mes fora do formato AAAA-MM retorna 400', async () => {
  const { token } = await registrarELogar();
  for (const valor of ['2026-13', '2026-9', '2026-09-01', 'abc']) {
    const resposta = await buscar(`/history/sessions?mes=${valor}`, token);
    assert.equal(resposta.status, 400, `mes=${valor}`);
  }
});


test('D14: gerar duas vezes - a sessão aparece uma vez só e aponta pro diagnóstico mais novo', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 60);
  await finalizar(token, idTreino);

  await gerarDiagnostico(token, idTreino);
  const segundo = await gerarDiagnostico(token, idTreino);
  const idMaisNovo = segundo.body.diagnostico.id_diagnostico;

  const sessoes = await buscar('/history/sessions', token);
  //um LEFT JOIN comum (sem LATERAL ... LIMIT 1) duplicaria a sessao aqui
  assert.equal(sessoes.body.sessoes.length, 1);
  assert.equal(sessoes.body.sessoes[0].id_diagnostico, idMaisNovo);
  assert.equal(sessoes.body.sessoes[0].series_validas, 1);

  const detalhe = await buscar(`/history/sessions/${idTreino}`, token);
  assert.equal(detalhe.body.diagnostico.id_diagnostico, idMaisNovo);
});


//============================ detalhe da sessao ============================

test('detalhe: séries agrupadas por exercício, com a preparação e o resumo D17', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  const id = exercicio.id_exercicio;
  await registrarSerie(token, idTreino, id, 'aquecimento', 40, 12);
  await registrarSerie(token, idTreino, id, 'work', 70, 8);
  await registrarSerie(token, idTreino, id, 'work', 70, 10);
  await registrarSerie(token, idTreino, id, 'work', 60, 12);
  await finalizar(token, idTreino);

  const resposta = await buscar(`/history/sessions/${idTreino}`, token);
  assert.equal(resposta.status, 200);
  assert.equal(resposta.body.sessao.id_treino, idTreino);
  assert.equal(resposta.body.diagnostico, null);
  assert.equal(resposta.body.exercicios.length, 1);

  const ex = resposta.body.exercicios[0];
  //a preparacao tambem vem, na ordem de registro - a tela e que separa por tipo
  assert.deepEqual(
    ex.series.map((s: { tipo: string }) => s.tipo),
    ['aquecimento', 'work', 'work', 'work']
  );
  //empate em 70 kg: fica a de mais reps (10). tonelagem = 70x8 + 70x10 + 60x12
  assert.deepEqual(ex.resumo, {
    series_validas: 3,
    carga_maxima: 70,
    reps_carga_maxima: 10,
    tonelagem: 1980,
  });
});


test('detalhe: sessão só com preparação vem com resumo null e series_validas 0', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'aquecimento', 40, 12);
  await finalizar(token, idTreino);

  const resposta = await buscar(`/history/sessions/${idTreino}`, token);
  assert.equal(resposta.status, 200);
  assert.equal(resposta.body.sessao.series_validas, 0);
  assert.equal(resposta.body.exercicios[0].resumo, null);
  assert.equal(resposta.body.exercicios[0].series.length, 1);
});


test('detalhe: treino aberto, de outro usuário ou id malformado dão 404', async () => {
  const { token, idTreino } = await registrarComTreinoAberto();

  const aberto = await buscar(`/history/sessions/${idTreino}`, token);
  assert.equal(aberto.status, 404); //historico e so treino finalizado (D18)

  await finalizar(token, idTreino);
  const outro = await registrarELogar();
  const alheio = await buscar(`/history/sessions/${idTreino}`, outro.token);
  assert.equal(alheio.status, 404);

  const malformado = await buscar('/history/sessions/abc', token);
  assert.equal(malformado.status, 404); //validarUuid (Passo 2) - sem ele seria 500
});


//============================ progressao (D17) ============================

test('progressão: um ponto por sessão com o resumo D17; aquecimento pesado não conta', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 60, 12);
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 70, 8);
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'aquecimento', 100, 5);

  const resposta = await buscar(`/history/exercises/${exercicio.id_exercicio}/load-progression`, token);
  assert.equal(resposta.status, 200);
  assert.equal(resposta.body.progressao.length, 1);

  const ponto = resposta.body.progressao[0];
  //number, nao '70': sem o ::float o NUMERIC voltaria string
  assert.equal(ponto.carga_maxima, 70);
  assert.equal(ponto.reps_carga_maxima, 8);
  assert.equal(ponto.series_validas, 2);
  assert.equal(ponto.tonelagem, 60 * 12 + 70 * 8); //1280 - os 100 kg de aquecimento ficam de fora
});


test('progressão e detalhe mostram os mesmos números pra mesma sessão (uma régua só, D17)', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 80, 6);
  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 80, 8);
  await finalizar(token, idTreino);

  const progressao = await buscar(`/history/exercises/${exercicio.id_exercicio}/load-progression`, token);
  const detalhe = await buscar(`/history/sessions/${idTreino}`, token);

  const p = progressao.body.progressao[0];
  assert.deepEqual(detalhe.body.exercicios[0].resumo, {
    series_validas: p.series_validas,
    carga_maxima: p.carga_maxima,
    reps_carga_maxima: p.reps_carga_maxima,
    tonelagem: p.tonelagem,
  });
});


test('progressão: id de exercício não numérico retorna 400', async () => {
  const { token } = await registrarELogar();
  const resposta = await buscar('/history/exercises/abc/load-progression', token);
  assert.equal(resposta.status, 400);
});


test('exercícios treinados: só entra exercício com série work', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();

  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'aquecimento', 40);
  const antes = await buscar('/history/exercises', token);
  assert.equal(antes.body.exercicios.length, 0);

  await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 60);
  const depois = await buscar('/history/exercises', token);
  assert.equal(depois.body.exercicios.length, 1);
  assert.equal(depois.body.exercicios[0].id_exercicio, exercicio.id_exercicio);
});


test('histórico não vaza dado de outro usuário', async () => {
  const outro = await registrarComTreinoAberto();
  await registrarSerie(outro.token, outro.idTreino, outro.exercicio.id_exercicio, 'work', 90);
  await finalizar(outro.token, outro.idTreino);

  const { token } = await registrarELogar();
  const progressao = await buscar(
    `/history/exercises/${outro.exercicio.id_exercicio}/load-progression`,
    token
  );
  assert.deepEqual(progressao.body.progressao, []);

  const exercicios = await buscar('/history/exercises', token);
  assert.deepEqual(exercicios.body.exercicios, []);

  const sessoes = await buscar('/history/sessions', token);
  assert.deepEqual(sessoes.body, { primeira_sessao: null, sessoes: [] });
});


//============================ volume (D18) ============================

test('volume histórico: semana atual é idêntica ao GET /metrics/weekly-volume (mesma régua, D10)', async () => {
  const { token, idTreino, exercicio } = await registrarComTreinoAberto();
  for (let i = 0; i < 3; i++) {
    await registrarSerie(token, idTreino, exercicio.id_exercicio, 'work', 60);
  }

  const historico = await buscar('/history/weekly-volume', token);
  const atual = await buscar('/metrics/weekly-volume', token);

  assert.equal(historico.status, 200);
  assert.deepEqual(historico.body.historico[0], atual.body.volume);
});


test('volume histórico: 8 semanas por padrão, todos os grupamentos em cada uma (D18)', async () => {
  const { token } = await registrarELogar();

  const padrao = await buscar('/history/weekly-volume', token);
  assert.equal(padrao.body.historico.length, 8);
  for (const semana of padrao.body.historico) {
    assert.equal(semana.grupamentos.length, 7); //grupamento zerado nao some
  }

  const tres = await buscar('/history/weekly-volume?semanas=3', token);
  assert.equal(tres.body.historico.length, 3);
});


test('volume histórico: semanas fora de 1–26 retorna 400', async () => {
  const { token } = await registrarELogar();
  for (const valor of ['0', '27', 'abc']) {
    const resposta = await buscar(`/history/weekly-volume?semanas=${valor}`, token);
    assert.equal(resposta.status, 400, `semanas=${valor}`);
  }
});