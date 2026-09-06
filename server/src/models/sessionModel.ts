import { pool } from '../config/db';
import { Treino, SerieTreino, NovaSerieTreino, SerieComExercicio } from '../types/indexTypes';


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