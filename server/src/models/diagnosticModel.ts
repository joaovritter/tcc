import { pool } from '../config/db';
import { DiagnosticoIA, DiagnosticoConteudoPersistido, DiagnosticoComTreino } from '../types/indexTypes';

export async function salvar(
  fkUsuario: string,
  idTreino: string,
  scoreGeral: number,
  conteudo: DiagnosticoConteudoPersistido
): Promise<DiagnosticoIA> {
  const resultado = await pool.query<DiagnosticoIA>(
    `INSERT INTO DiagnosticoIA (fk_usuario, fk_treino, score_geral, conteudo_json)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [fkUsuario, idTreino, scoreGeral, conteudo]
  );
  return resultado.rows[0];
}


// diagnóstico atual = o mais recente do usuário, ja com a data da sessão
export async function buscarUltimoDoUsuario(fkUsuario: string): Promise<DiagnosticoComTreino | null> {
  const resultado = await pool.query<DiagnosticoComTreino>(
    `SELECT d.*, t.data AS data_treino
     FROM DiagnosticoIA d
     JOIN Treino t ON t.id_treino = d.fk_treino
     WHERE d.fk_usuario = $1
     ORDER BY d.data_geracao DESC
     LIMIT 1`,
    [fkUsuario]
  );
  return resultado.rows[0] ?? null;
}

