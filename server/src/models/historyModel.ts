import { pool } from '../config/db';
import {
    SessaoHistorico, ExercicioTreinado, PontoProgressaoCarga, ResumoSeriesValidas,
    SerieDaSessao, ExercicioDaSessao,
} from '../types/indexTypes';


//sessão FINALIZADA: base da lista do mes e do cabecalho do detalhe,
//com a contagem de series validas e o ultimo diagnostico.
const SELECT_SESSAO = `
  SELECT t.id_treino,
         t.data,
         to_char(t.data, 'YYYY-MM-DD') AS dia,
         t.duracao_total,
         d.nome AS nome_divisao,
         COUNT(s.id_serie) FILTER (WHERE s.tipo = 'work')::int AS series_validas,
         ult.id_diagnostico,
         ult.score_geral
  FROM Treino t
  LEFT JOIN Divisao d ON d.id_divisao = t.fk_divisao
  LEFT JOIN SerieTreino s ON s.fk_treino = t.id_treino
  LEFT JOIN LATERAL (
    SELECT dg.id_diagnostico, dg.score_geral
    FROM DiagnosticoIA dg
    WHERE dg.fk_treino = t.id_treino
    ORDER BY dg.data_geracao DESC
    LIMIT 1
  ) ult ON TRUE
  WHERE t.fk_usuario = $1
    AND t.completed = TRUE`;

const GROUP_BY_SESSAO = `GROUP BY t.id_treino, d.nome, ult.id_diagnostico, ult.score_geral`;




//dia do treino finalizado mais antigo - trava a seta de voltar do calendario.
//MIN sem linha nenhuma devolve UMA linha com NULL, entao rows[0] sempre existe
export async function buscarPrimeiraSessao(fkUsuario: string): Promise<string | null> {
  const resultado = await pool.query<{ primeira: string | null }>(
    `SELECT to_char(MIN(data), 'YYYY-MM-DD') AS primeira
     FROM Treino
     WHERE fk_usuario = $1
       AND completed = TRUE`,
    [fkUsuario]
  );
  return resultado.rows[0].primeira;
}



//mes = 'AAAA-MM' (o controller ja validou) ou null = mes atual.
//sem LIMIT: navega entre todos meses com histórico
export async function listarSessoesDoMes(fkUsuario: string, mes: string | null): Promise<SessaoHistorico[]> {
    const resultado = await pool.query<SessaoHistorico>(
        `${SELECT_SESSAO}
       AND t.data >= COALESCE(to_date($2, 'YYYY-MM'), date_trunc('month', current_date)::date)
       AND t.data <  COALESCE(to_date($2, 'YYYY-MM'), date_trunc('month', current_date)::date) + INTERVAL '1 month'
     ${GROUP_BY_SESSAO}
     ORDER BY t.data ASC`,
        [fkUsuario, mes]
    );
    return resultado.rows;
}

//cabecalho do detalhe. treino aberto ou de outro usuario -> null (o controller devolve 404)
export async function buscarSessao(fkUsuario: string, idTreino: string): Promise<SessaoHistorico | null> {
    const resultado = await pool.query<SessaoHistorico>(
        `${SELECT_SESSAO}
       AND t.id_treino = $2
     ${GROUP_BY_SESSAO}`,
        [fkUsuario, idTreino]
    );
    return resultado.rows[0] ?? null;
}


//====================== resumo das series validas ======================

//Um dado só, usada pelo grafico e pelo detalhe 
//reps_carga_maxima: se tiver empate de carga -> a de mais reps
//- tonelagem: soma de carga x reps. não chamar de volume (volume = contagem de series)
//- ::float/::int: NUMERIC voltaria string pro front
//como esta subconsulta nao tem dono, usar SEMPRE com JOIN Treino + t.fk_usuario
const RESUMO_SERIES_WORK = `
  SELECT s.fk_treino,
         s.fk_exercicio,
         COUNT(*)::int AS series_validas,
         MAX(s.carga)::float AS carga_maxima,
         (ARRAY_AGG(s.repeticoes ORDER BY s.carga DESC, s.repeticoes DESC))[1]::int AS reps_carga_maxima,
         SUM(s.carga * s.repeticoes)::float AS tonelagem
  FROM SerieTreino s
  WHERE s.tipo = 'work'
  GROUP BY s.fk_treino, s.fk_exercicio`;



//so exercicio com serie work, aquecimento sozinho nao gera progressao
export async function listarExerciciosTreinados(fkUsuario: string): Promise<ExercicioTreinado[]> {
    const resultado = await pool.query<ExercicioTreinado>(
        `SELECT DISTINCT e.id_exercicio,
            e.nome_exercicio,
            g.nome AS nome_grupamento
     FROM SerieTreino s
     JOIN Treino t ON t.id_treino = s.fk_treino
     JOIN Exercicio e ON e.id_exercicio = s.fk_exercicio
     JOIN GrupamentoMuscular g ON g.id_grupamento = e.fk_grupamento
     WHERE s.tipo = 'work'
       AND t.fk_usuario = $1
     ORDER BY g.nome, e.nome_exercicio`,
        [fkUsuario]
    );
    return resultado.rows;
} 


//Ponto do gráfico: um ponto por sessao, com o resumo das series work daquele exercicio.
//ordem cronologica (ASC) porque vira o eixo x do grafico.
//serie registrada conta, treino finalizado ou nao
export async function progressaoDeCarga(
  fkUsuario: string,
  idExercicio: number
): Promise<PontoProgressaoCarga[]> {
  const resultado = await pool.query<PontoProgressaoCarga>(
    `SELECT t.id_treino,
            t.data,
            r.series_validas,
            r.carga_maxima,
            r.reps_carga_maxima,
            r.tonelagem
     FROM (${RESUMO_SERIES_WORK}) r
     JOIN Treino t ON t.id_treino = r.fk_treino
     WHERE t.fk_usuario = $1
       AND r.fk_exercicio = $2
     ORDER BY t.data ASC`,
    [fkUsuario, idExercicio]
  );
  return resultado.rows;
}



//detalhe da sessao: todas as series (validas e de preparacao) agrupadas por
//exercicio, cada exercicio com o resumo (null se so teve preparacao)
export async function listarExerciciosDaSessao(
  fkUsuario: string,
  idTreino: string
): Promise<ExercicioDaSessao[]> {
  type LinhaSerie = SerieDaSessao & { id_exercicio: number; nome_exercicio: string; nome_grupamento: string };
  type LinhaResumo = ResumoSeriesValidas & { fk_exercicio: number };

  const [series, resumos] = await Promise.all([
    pool.query<LinhaSerie>(
      `SELECT s.id_serie,
              s.tipo,
              s.carga::float AS carga,
              s.repeticoes,
              s.rir,
              e.id_exercicio,
              e.nome_exercicio,
              g.nome AS nome_grupamento
       FROM SerieTreino s
       JOIN Treino t ON t.id_treino = s.fk_treino
       JOIN Exercicio e ON e.id_exercicio = s.fk_exercicio
       JOIN GrupamentoMuscular g ON g.id_grupamento = e.fk_grupamento
       WHERE s.fk_treino = $1
         AND t.fk_usuario = $2
       ORDER BY s.id_serie`,
      [idTreino, fkUsuario]
    ),
    pool.query<LinhaResumo>(
      `SELECT r.fk_exercicio,
              r.series_validas,
              r.carga_maxima,
              r.reps_carga_maxima,
              r.tonelagem
       FROM (${RESUMO_SERIES_WORK}) r
       JOIN Treino t ON t.id_treino = r.fk_treino
       WHERE r.fk_treino = $1
         AND t.fk_usuario = $2`,
      [idTreino, fkUsuario]
    ),
  ]);

  const resumoPorExercicio = new Map(
    resumos.rows.map(({ fk_exercicio, ...resumo }) => [fk_exercicio, resumo])
  );


  //agrupa as series por exercicio. Map preserva a ordem de insercao e as series
  //vem por id_serie, entao os exercicios ficam na ordem em que foram feitos
  const porExercicio = new Map<number, ExercicioDaSessao>();
  for (const { id_exercicio, nome_exercicio, nome_grupamento, ...serie } of series.rows) {
    if (!porExercicio.has(id_exercicio)) {
      porExercicio.set(id_exercicio, {
        id_exercicio,
        nome_exercicio,
        nome_grupamento,
        resumo: resumoPorExercicio.get(id_exercicio) ?? null,
        series: [],
      });
    }
    porExercicio.get(id_exercicio)!.series.push(serie);
  }

  return [...porExercicio.values()];
}
