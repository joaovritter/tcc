import { pool } from '../config/db';
import type { Divisao, DivisaoInput, DivisaoExercicioInput, ExercicioDoDia } from '../types/indexTypes';


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


//lista todos exercicios de uma divisão, na ordem salva, 
// ja com nome do exercicio e nome do grupamento muscular
export async function buscarExerciciosDoDia(
  fkDivisao: string
): Promise<ExercicioDoDia[]> {
  const resultado = await pool.query<ExercicioDoDia>(
    `SELECT de.id_divisao_exercicio, de.fk_divisao, de.fk_exercicio, de.ordem,
            e.nome_exercicio, g.nome AS nome_grupamento
     FROM DivisaoExercicio de
     JOIN Exercicio e ON e.id_exercicio = de.fk_exercicio
     JOIN GrupamentoMuscular g ON g.id_grupamento = e.fk_grupamento
     WHERE de.fk_divisao = $1
     ORDER BY de.ordem`,
    [fkDivisao]
  );
  return resultado.rows;
}


//apaga tudo que existia naquela divisao e insere de novo na ordem do array recebido
export async function substituirExerciciosDoDia(
  fkDivisao: string,
  exercicios: DivisaoExercicioInput[]
): Promise<ExercicioDoDia[]> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM DivisaoExercicio WHERE fk_divisao = $1', [
      fkDivisao,
    ]);

    for (let i = 0; i < exercicios.length; i++) {
      await client.query(
        `INSERT INTO DivisaoExercicio (fk_divisao, fk_exercicio, ordem)
         VALUES ($1, $2, $3)`,
        [fkDivisao, exercicios[i].fk_exercicio, i + 1]
      );
    }

    await client.query('COMMIT');
  } catch (erro) {
    await client.query('ROLLBACK');
    throw erro;
  } finally {
    client.release();
  }

  return buscarExerciciosDoDia(fkDivisao);
}


//grupamentos distintos treinados em cada dia da semana do usuario 
// (Decisão D: sempre calculado via JOIN, nunca coluna)
export async function buscarResumoMusculos(
  fkUsuario: string
): Promise<{ dia_semana: number; grupamentos: string[] }[]> {
  const resultado = await pool.query<{ dia_semana: number; nome: string }>(
    `SELECT DISTINCT d.dia_semana, g.nome
     FROM Divisao d
     JOIN DivisaoExercicio de ON de.fk_divisao = d.id_divisao
     JOIN Exercicio e ON e.id_exercicio = de.fk_exercicio
     JOIN GrupamentoMuscular g ON g.id_grupamento = e.fk_grupamento
     WHERE d.fk_usuario = $1
     ORDER BY d.dia_semana, g.nome`,
    [fkUsuario]
  );

  const porDia = new Map<number, string[]>();
  for (const linha of resultado.rows) {
    const lista = porDia.get(linha.dia_semana) ?? [];
    lista.push(linha.nome);
    porDia.set(linha.dia_semana, lista);
  }
  return Array.from(porDia, ([dia_semana, grupamentos]) => ({
    dia_semana,
    grupamentos,
  }));
}