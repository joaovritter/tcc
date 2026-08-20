import { pool } from '../config/db';
import type { Divisao, DivisaoInput } from '../types/indexTypes';


//lista divisoes do usuario logado, ordena por dia a semana
export async function buscarPorUsuario(
    fkUsuario: string
): Promise<Divisao[]> {
    const resultado = await pool.query<Divisao>(
        'SELECT * FROM Divisao WHERE fk_usuario = $1 ORDER BY dia_semana',
        [fkUsuario]
    );
    return resultado.rows;
}

// Recebe a lista completa da semana
// faz UPSERT (atualiza o nome se o dia já existe pro usuário, insere se não existe) e
// só apaga os dias que o usuário efetivamente removeu da semana.
export async function substituirSemana(
    fkUsuario: string,
    divisoes: DivisaoInput[]
): Promise<Divisao[]> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const diasMantidos = divisoes.map((d) => d.dia_semana);

        // Remove só os dias que não vieram no payload (o usuário tirou esse dia da semana)
        await client.query(
            `DELETE FROM Divisao
             WHERE fk_usuario = $1
             AND dia_semana != ALL($2::int[])`,
            [fkUsuario, diasMantidos]
        );

        const salvas: Divisao[] = [];
        for (const divisao of divisoes) {
            const resultado = await client.query<Divisao>(
                `INSERT INTO Divisao (fk_usuario, dia_semana, nome)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (fk_usuario, dia_semana)
                 DO UPDATE SET nome = EXCLUDED.nome
                 RETURNING *`,
                [fkUsuario, divisao.dia_semana, divisao.nome]
            );
            salvas.push(resultado.rows[0]);
        }

        await client.query('COMMIT');
        return salvas;
    } catch (erro) {
        await client.query('ROLLBACK');
        throw erro;
    } finally {
        client.release();
    }
}
