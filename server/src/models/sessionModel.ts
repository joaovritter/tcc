import { pool } from '../config/db';
import { Treino, SerieTreino, NovaSerieTreino, SerieComExercicio } from '../types/indexTypes';
import { SerieValidaDaSessao } from '../types/indexTypes';


//o treino de hoje é o do usuário com completed = false e data no dia corrente
export async function buscarTreinoAberto(
    fkUsuario: string
): Promise<Treino | null> {
    const resultado = await pool.query<Treino>(
        `SELECT * FROM Treino
        WHERE fk_usuario = $1 AND completed = FALSE AND data::date = CURRENT_DATE
        ORDER BY data DESC
        LIMIT 1`,
        [fkUsuario]
    );
    return resultado.rows[0] ?? null;
}

// insere um treino vazio ligado (opcionalmente) à divisão do dia
export async function criarTreino(
  fkUsuario: string,
  fkDivisao: string | null
): Promise<Treino> {
  const resultado = await pool.query<Treino>(
    `INSERT INTO Treino (fk_usuario, fk_divisao)
     VALUES ($1, $2)
     RETURNING *`,
    [fkUsuario, fkDivisao]
  );
  return resultado.rows[0];
}

export async function buscarSeries(
  fkTreino: string
): Promise<SerieComExercicio[]> {
  const resultado = await pool.query<SerieComExercicio>(
    `SELECT s.*, e.nome_exercicio
     FROM SerieTreino s
     JOIN Exercicio e ON e.id_exercicio = s.fk_exercicio
     WHERE s.fk_treino = $1
     ORDER BY s.id_serie`,
    [fkTreino]
  );
  return resultado.rows;
}

//um insert sem transação ja basta
export async function registrarSerie(
  fkTreino: string,
  serie: NovaSerieTreino
): Promise<SerieTreino> {
  const resultado = await pool.query<SerieTreino>(
    `INSERT INTO SerieTreino
       (fk_treino, fk_exercicio, tipo, carga, repeticoes, rir)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      fkTreino,
      serie.fk_exercicio,
      serie.tipo,
      serie.carga,
      serie.repeticoes,
      serie.rir,
    ]
  );
  return resultado.rows[0]; // já vem com o rpe derivado, calculado pelo banco
}

export async function apagarSerie(
  fkTreino: string,
  idSerie: number
): Promise<boolean> {
  const resultado = await pool.query(
    'DELETE FROM SerieTreino WHERE fk_treino = $1 AND id_serie = $2',
    [fkTreino, idSerie]
  );
  return (resultado.rowCount ?? 0) > 0;
}

export async function buscarPorId(
  idTreino: string,
  fkUsuario: string
): Promise<Treino | null> {
  const resultado = await pool.query<Treino>(
    'SELECT * FROM Treino WHERE id_treino = $1 AND fk_usuario = $2',
    [idTreino, fkUsuario]
  );
  return resultado.rows[0] ?? null;
}

/**
 * query de finalizar o treino
 * - marca completed = true;
 * - duracao_total = calcula a diferença entre NOW() e data;
 * - EXTRACT(EPOCH FROM ...): Converte a diferença de tempo para segundos;
 * - /60: Converte os segundos para minutos;
 * - ROUND(...)::int: Arredonda e converte para número inteiro;
 * - GREATEST(1, ...): Garante que a duração mínima seja de 1 minuto, mesmo se o treino tiver durado menos.
*/
export async function finalizarTreino(
  idTreino: string,
  fkUsuario: string
): Promise<Treino | null> {
  const resultado = await pool.query<Treino>( 
    `UPDATE Treino
    SET completed = TRUE,
      duracao_total = GREATEST(1, ROUND(EXTRACT(EPOCH FROM (NOW() - data)) /60)::int)
    WHERE id_treino = $1 AND fk_usuario = $2 AND completed = FALSE
    RETURNING *`,
    [idTreino, fkUsuario]
  );
  return resultado.rows[0] ?? null;
}


//serie valida de UMA sessao (fk_treino), nao mais de uma janela de semana
export async function buscarSeriesValidasDaSessao (
  idTreino: string,
  fkUsuario: string
): Promise<SerieValidaDaSessao[]> {
  const resultado = await pool.query<SerieValidaDaSessao>(
    `SELECT g.id_grupamento,
            g.nome AS nome_grupamento,
            e.nome_exercicio,
            s.carga,
            s.repeticoes,
            s.rpe,
            s.rir
      FROM SerieTreino s
      JOIN Exercicio e ON e.id_exercicio = s.fk_exercicio
      JOIN GrupamentoMuscular g ON g.id_grupamento = e.fk_grupamento
      JOIN Treino t ON t.id_treino = s.fk_treino
      WHERE s.tipo = 'work'
        AND t.id_treino = $1
        AND t.fk_usuario = $2
      ORDER BY g.nome, e.nome_exercicio`,
    [idTreino, fkUsuario]
  );
  return resultado.rows;
}