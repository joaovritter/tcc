import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app';
import { registrarComTreinoAberto } from './testHelpers';
import { calcularPv, calcularPi, calcularScoreGeral } from '../services/scoreService';
import { response } from 'express';


test('POST /sessions/:id/diagnostics/generate sem série válida retorna 400', async () => {
    const { token, idTreino } = await registrarComTreinoAberto(); //treino sem série válida
    const resposta = await request(app)
        .post(`/sessions/${idTreino}/diagnostics/generate`)
        .set('Authorization', `Bearer ${token}`);
    assert.equal(resposta.status, 400);
});


test('Fluxo completo: registrar work set, gera diagnóstico, score bate com o cálculo manual', async () => {
    const { token, idTreino, exercicio } = await registrarComTreinoAberto();

    await request(app)
        .post(`/sessions/${idTreino}/sets`)
        .set('Authorization', `Bearer ${token}`)
        .send({ fk_exercicio: exercicio.id_exercicio, tipo: 'work', carga: 80, repeticoes: 8, rir: 1 });

    const geracao = await request(app)
        .post(`/sessions/${idTreino}/diagnostics/generate`)
        .set('Authorization', `Bearer ${token}`)
    assert.equal(geracao.status, 201);

    const { score_geral, conteudo_json } = geracao.body.diagnostico;
    //com 1 serie com RPE=9 em 1 grupamento fora do limiar: pv baixo, pi = 100
    const piEsperado = calcularPi([{ rpe: 9 } as any]);
    assert.equal(conteudo_json.score_detalhe.pi, piEsperado);
    assert.equal(score_geral, calcularScoreGeral(conteudo_json.score_detalhe.pv, piEsperado));

    const atual = await request(app)
        .get('/diagnostics/latest')
        .set('Authorization', `Bearer ${token}`);
    assert.equal(atual.status, 200);
    assert.equal(atual.body.diagnostico.id_diagnostico, geracao.body.diagnostico.id_diagnostico);
});


//testes puros de ScoreService, não toca no banco nem gemini

test('calcularPi: RPE 6 vale 0, RPE 9 vale 100', () => {
    assert.equal(calcularPi([{ rpe: 6 } as any]), 0)
    assert.equal(calcularPi([{ rpe: 9 } as any]), 100)
});


test('calcularPi: grupamento fora da rotina não entra na média', () => {
    const volume = {
        semana_referencia: '2026-09-14',
        limiar: 10,
        grupamentos: [
            { id_grupamento: 1, nome_grupamento: 'Peito', series_validas: 10, atingiu_limiar: true },
            { id_grupamento: 2, nome_grupamento: 'Panturrilha', series_validas: 0, atingiu_limiar: false },
        ],
    };
    // só o grupamento 1 está na rotina: Pv = 100, não (100+0)/2 = 50
    assert.equal(calcularPv(volume as any, new Set([1])), 100);
})