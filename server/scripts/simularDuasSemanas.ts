// Simulação das 2 semanas de treino (28/09 a 09/10/2026) para a avaliação de Nielsen.
// Uso: npx tsx scripts/simularDuasSemanas.ts [--limpar]
//
// A API não aceita data nem duração (start/finish usam NOW()), então este script
// reproduz o fluxo em ordem cronológica direto no banco, com o código real do app:
// mesmas queries de série/diagnóstico, scoreService (Pv/Pi), geminiService (IA real
// se GEMINI_MOCK != true). A única coisa local é o volume semanal "na data da sessão":
// o volumeService usa current_date, aqui a semana é a da sessão e só conta o que
// já tinha sido treinado até ela - é o que o usuário teria visto naquele dia.
import fs from 'fs';
import path from 'path';
import { pool } from '../src/config/db';
import * as sessionModel from '../src/models/sessionModel';
import * as diagnosticModel from '../src/models/diagnosticModel';
import * as geminiService from '../src/services/geminiService';
import { LIMIAR_SERIES } from '../src/services/volumeService';
import { calcularPv, calcularPi, calcularScoreGeral } from '../src/services/scoreService';
import { NovaSerieTreino, Treino, VolumeGrupamento, VolumeSemanal } from '../src/types/indexTypes';

const EMAIL = 'joao@teste.com';
const INICIO = '2026-09-28';
const FIM = '2026-10-11'; // exclusivo
const ARQUIVO = path.join(__dirname, '../../01-planejamento/enriquecer-usuario.dados.json');

interface Sessao {
  sessao: number;
  dia: string;
  hora: string;
  divisao: string;
  duracao_min: number;
  series: NovaSerieTreino[];
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));


//mesma conta do volumeService.calcularVolumeSemanal, mas com a semana da sessão
//e cortando no inicio dela (sessoes posteriores ainda "não aconteceram")
async function volumeNaData(fkUsuario: string, dataSessao: string): Promise<VolumeSemanal> {
  const semana = (await pool.query<{ inicio: string }>(
    "SELECT to_char(date_trunc('week', $1::timestamp), 'YYYY-MM-DD') AS inicio",
    [dataSessao]
  )).rows[0].inicio;

  const resultado = await pool.query<Omit<VolumeGrupamento, 'atingiu_limiar'>>(
    `SELECT g.id_grupamento,
            g.nome AS nome_grupamento,
            COUNT(sv.id_serie)::int AS series_validas
     FROM GrupamentoMuscular g
     LEFT JOIN (
       SELECT s.id_serie, e.fk_grupamento
       FROM SerieTreino s
       JOIN Exercicio e ON e.id_exercicio = s.fk_exercicio
       JOIN Treino t     ON t.id_treino   = s.fk_treino
       WHERE s.tipo = 'work'
         AND t.fk_usuario = $1
         AND t.data >= $2::date
         AND t.data <= $3::timestamp
     ) sv ON sv.fk_grupamento = g.id_grupamento
     GROUP BY g.id_grupamento, g.nome
     ORDER BY g.nome`,
    [fkUsuario, semana, dataSessao]
  );

  const grupamentos = resultado.rows.map((linha) => ({
    ...linha,
    atingiu_limiar: linha.series_validas >= LIMIAR_SERIES,
  }));
  return { semana_referencia: semana, limiar: LIMIAR_SERIES, grupamentos };
}


async function gerarComRetry(treino: Treino, volume: VolumeSemanal, series: Awaited<ReturnType<typeof sessionModel.buscarSeriesValidasDaSessao>>) {
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      return await geminiService.gerarDiagnostico(treino, volume, series);
    } catch (erro) {
      console.warn(`   IA falhou (tentativa ${tentativa}/3): ${(erro as Error).message}`);
      if (tentativa === 3) throw erro;
      await esperar(tentativa * 10_000);
    }
  }
  throw new Error('inalcançável');
}


async function main() {
  const limpar = process.argv.includes('--limpar');
  console.log(`GEMINI_MOCK=${process.env.GEMINI_MOCK ?? '(vazio)'} -> ${process.env.GEMINI_MOCK === 'true' ? 'MOCK' : 'IA REAL'}`);

  const usuario = (await pool.query<{ id_usuario: string }>(
    'SELECT id_usuario FROM Usuario WHERE email = $1', [EMAIL]
  )).rows[0];
  if (!usuario) throw new Error(`usuário ${EMAIL} não existe`);
  const fkUsuario = usuario.id_usuario;

  const divisoes = (await pool.query<{ id_divisao: string; nome: string }>(
    'SELECT id_divisao, nome FROM Divisao WHERE fk_usuario = $1', [fkUsuario]
  )).rows;
  const idDivisao = (nome: string) => {
    const d = divisoes.find((x) => x.nome === nome);
    if (!d) throw new Error(`divisão "${nome}" não existe - rode a Fase 1 do Postman antes`);
    return d.id_divisao;
  };

  //nao duplica: se ja tem treino no periodo, so segue com --limpar
  const existentes = (await pool.query<{ id_treino: string }>(
    'SELECT id_treino FROM Treino WHERE fk_usuario = $1 AND data >= $2 AND data < $3',
    [fkUsuario, INICIO, FIM]
  )).rows.map((r) => r.id_treino);

  if (existentes.length > 0) {
    if (!limpar) {
      throw new Error(`já existem ${existentes.length} treinos entre ${INICIO} e ${FIM}. Rode com --limpar para apagar e refazer.`);
    }
    await pool.query('DELETE FROM DiagnosticoIA WHERE fk_treino = ANY($1::uuid[])', [existentes]);
    await pool.query('DELETE FROM SerieTreino WHERE fk_treino = ANY($1::uuid[])', [existentes]);
    await pool.query('DELETE FROM Treino WHERE id_treino = ANY($1::uuid[])', [existentes]);
    console.log(`limpou ${existentes.length} treinos do período`);
  }

  const sessoes: Sessao[] = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));

  for (const s of sessoes) {
    const inicio = `${s.dia} ${s.hora}`;
    console.log(`\n[${s.sessao}/8] ${s.divisao} - ${inicio} (${s.duracao_min} min)`);

    //1. comecar treino (mesmo INSERT do sessionModel.criarTreino, com a data da sessão)
    const treinoAberto = (await pool.query<Treino>(
      `INSERT INTO Treino (fk_usuario, fk_divisao, data) VALUES ($1, $2, $3::timestamp) RETURNING *`,
      [fkUsuario, idDivisao(s.divisao), inicio]
    )).rows[0];

    //2. registrar series, uma a uma e em ordem (id_serie define a ordem no historico)
    for (const serie of s.series) {
      await sessionModel.registrarSerie(treinoAberto.id_treino, serie);
    }

    //3. finalizar com a duração da sessão
    const treino = (await pool.query<Treino>(
      `UPDATE Treino SET completed = TRUE, duracao_total = $2 WHERE id_treino = $1 RETURNING *`,
      [treinoAberto.id_treino, s.duracao_min]
    )).rows[0];
    console.log(`   ${s.series.length} séries registradas, treino finalizado`);

    //4. diagnostico - mesmo caminho do diagnosticController.gerarDiagnostico
    const series = await sessionModel.buscarSeriesValidasDaSessao(treino.id_treino, fkUsuario);
    const volume = await volumeNaData(fkUsuario, inicio);
    const pv = calcularPv(volume, new Set(series.map((x) => x.id_grupamento)));
    const pi = calcularPi(series);
    const scoreGeral = calcularScoreGeral(pv, pi);

    const conteudo = await gerarComRetry(treino, volume, series);
    const diagnostico = await diagnosticModel.salvar(fkUsuario, treino.id_treino, scoreGeral, {
      ...conteudo,
      score_detalhe: { pv, pi },
    });

    //gerado 3 min depois do fim da sessao
    await pool.query(
      `UPDATE DiagnosticoIA SET data_geracao = $2::timestamp + ($3 + 3) * INTERVAL '1 minute' WHERE id_diagnostico = $1`,
      [diagnostico.id_diagnostico, inicio, s.duracao_min]
    );

    const semana = volume.grupamentos
      .filter((g) => g.series_validas > 0)
      .map((g) => `${g.nome_grupamento} ${g.series_validas}/${LIMIAR_SERIES}${g.atingiu_limiar ? ' ✓' : ''}`)
      .join(', ');
    console.log(`   semana ${volume.semana_referencia}: ${semana}`);
    console.log(`   score ${scoreGeral} (Pv ${pv.toFixed(1)} | Pi ${pi.toFixed(1)}) - ${conteudo.recomendacoes_proxima_sessao[0] ?? ''}`);

    if (process.env.GEMINI_MOCK !== 'true') await esperar(5_000); //folga pro limite de req/min
  }

  console.log('\nPronto: 8 sessões, 200 séries, 8 diagnósticos.');
}

main()
  .catch((erro) => {
    console.error('\nERRO:', erro.message ?? erro);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
