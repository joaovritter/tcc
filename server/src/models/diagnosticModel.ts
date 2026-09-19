import { pool } from '../config/db';
import { DiagnosticoIA, DiagnosticoConteudoPersistido } from '../types/indexTypes';

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


// diagnóstico atual = o mais recente do usuário 
export async function buscarUltimoDoUsuario(fkUsuario: string): Promise<DiagnosticoIA | null> {
  const resultado = await pool.query<DiagnosticoIA>(
    `SELECT * FROM DiagnosticoIA
     WHERE fk_usuario = $1
     ORDER BY data_geracao DESC
     LIMIT 1`,
    [fkUsuario]
  );
  return resultado.rows[0] ?? null;
}