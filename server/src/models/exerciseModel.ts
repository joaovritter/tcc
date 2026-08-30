import { pool } from '../config/db';
import type { Exercicio, ExercicioComGrupamento } from '../types/indexTypes';


//somente leitura, o catalogo de exercicios é fixo, não tem crud
export async function listarTodos(
    fkGrupamento?: number
): Promise<ExercicioComGrupamento[]>{
    const condicao = fkGrupamento ? 'WHERE e.fk_grupamento = $1' : '';
    const parametros = fkGrupamento ? [fkGrupamento] : [];

    const resultado = await pool.query<ExercicioComGrupamento>(
        `SELECT e.id_exercicio, e.nome_exercicio, e.fk_grupamento, g.nome AS nome_grupamento
        FROM Exercicio e 
        JOIN GrupamentoMuscular g ON g.id_grupamento = e.fk_grupamento
        ${condicao}
        ORDER BY g.nome, e.nome_exercicio`,
        parametros
    );
    return resultado.rows;
}