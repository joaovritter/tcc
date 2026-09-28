import { pool } from '../config/db';
import { VolumeGrupamento, VolumeSemanal} from '../types/indexTypes';

export const LIMIAR_SERIES = 10;

//busca data de início da semana atual e retorna como uma string.
export async function inicioDaSemana(): Promise<string> {
    const resultado = await pool.query<{ inicio: string}> (
        "SELECT to_char(date_trunc('week', current_date), 'YYYY-MM-DD') AS inicio"
    );

    return resultado.rows[0].inicio;
}


export async function calcularVolumeSemanal(
  fkUsuario: string
): Promise<VolumeSemanal> {
  const semana = await inicioDaSemana();

  //consulta para contar series validas por grupamento, sem considerar o limiar
  //A subconsulta filtra dono/semana/tipo ANTES do LEFT JOIN, encadear os joins
  //direto contaria serie de outro usuario

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
         AND t.data <  $2::date + INTERVAL '7 days'
     ) sv ON sv.fk_grupamento = g.id_grupamento
     GROUP BY g.id_grupamento, g.nome
     ORDER BY g.nome`,
    [fkUsuario, semana]
  );

  //a comparacao com o limiar sai daqui pronta
  const grupamentos: VolumeGrupamento[] = resultado.rows.map((linha) => ({
    ...linha,
    atingiu_limiar: linha.series_validas >= LIMIAR_SERIES,
  }));

  return { semana_referencia: semana, limiar: LIMIAR_SERIES, grupamentos };
}



export const SEMANAS_HISTORICO_PADRAO = 8;

//RF07: a mesma conta do calcularVolumeSemanal, para as ultimas N semanas de
//calendario. cada semana volta como um VolumeSemanal completo - todos os
//grupamentos, zerado tambem, com o limiar ja comparado
export async function calcularHistoricoVolume(
  fkUsuario: string,
  semanas: number
): Promise<VolumeSemanal[]> {
  const resultado = await pool.query<
    Omit<VolumeGrupamento, 'atingiu_limiar'> & { semana_referencia: string }
  >(
    `WITH semanas AS (
       SELECT generate_series(
                date_trunc('week', current_date) - ($2::int - 1) * INTERVAL '1 week',
                date_trunc('week', current_date),
                INTERVAL '1 week'
              )::date AS inicio
     )
     SELECT to_char(sm.inicio, 'YYYY-MM-DD') AS semana_referencia,
            g.id_grupamento,
            g.nome AS nome_grupamento,
            COUNT(sv.id_serie)::int AS series_validas
     FROM semanas sm
     CROSS JOIN GrupamentoMuscular g
     LEFT JOIN (
       SELECT s.id_serie, e.fk_grupamento, t.data
       FROM SerieTreino s
       JOIN Exercicio e ON e.id_exercicio = s.fk_exercicio
       JOIN Treino t    ON t.id_treino   = s.fk_treino
       WHERE s.tipo = 'work'
         AND t.fk_usuario = $1
     ) sv ON sv.fk_grupamento = g.id_grupamento
         AND sv.data >= sm.inicio
         AND sv.data <  sm.inicio + INTERVAL '7 days'
     GROUP BY sm.inicio, g.id_grupamento, g.nome
     ORDER BY sm.inicio DESC, g.nome`,
    [fkUsuario, semanas]
  );

  //agrupa as linhas (semana x grupamento) num VolumeSemanal por semana
  const porSemana = new Map<string, VolumeSemanal>();
  for (const { semana_referencia, ...linha } of resultado.rows) {
    if (!porSemana.has(semana_referencia)) {
      porSemana.set(semana_referencia, { semana_referencia, limiar: LIMIAR_SERIES, grupamentos: [] });
    }
    porSemana.get(semana_referencia)!.grupamentos.push({
      ...linha,
      atingiu_limiar: linha.series_validas >= LIMIAR_SERIES,
    });
  }

  //Map preserva a ordem de insercao com semana mais recente primeiro
  return [...porSemana.values()];
}