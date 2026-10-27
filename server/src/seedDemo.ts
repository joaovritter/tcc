import { readFileSync } from 'fs';
import path from 'path';
import { pool } from './config/db';

// Carrega os usuarios de demonstracao (avaliacao heuristica e prints do artigo)
// a partir de demo/usuariosDemo.json. Precisa do seed rodado antes, porque as
// series apontam para os exercicios pelo nome.
//   joao@teste.com  -> 5 semanas de treino com diagnostico
//   joao2@teste.com -> sem dados, para ver as telas vazias
// Senha dos dois: www.com.brj. Pode rodar mais de uma vez: apaga e recria os dois.
// Para atualizar o JSON depois de mexer nesses usuarios: npm run demo:export.

export const EMAILS_DEMO = ['joao@teste.com', 'joao2@teste.com'];

export interface UsuarioDemo {
  nome: string;
  email: string;
  senha_hash: string;
  divisoes: { dia_semana: number; nome: string; exercicios: string[] }[];
  treinos: {
    data: string;
    dia_divisao: number | null; //divisao do treino, pelo dia da semana
    completed: boolean;
    duracao_total: number | null;
    series: { exercicio: string; tipo: string; carga: number; repeticoes: number; rir: number | null }[];
    diagnostico: { score_geral: number; data_geracao: string; conteudo_json: unknown } | null;
  }[];
}

const caminhoDados = path.join(__dirname, 'demo', 'usuariosDemo.json');

async function runSeedDemo() {
  console.log('Carregando usuarios de demonstracao...');
  const usuarios: UsuarioDemo[] = JSON.parse(readFileSync(caminhoDados, 'utf8'));
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const exercicios = await client.query<{ id_exercicio: number; nome_exercicio: string }>(
      'SELECT id_exercicio, nome_exercicio FROM Exercicio'
    );
    const idPorExercicio = new Map(exercicios.rows.map((e) => [e.nome_exercicio, e.id_exercicio]));
    const idExercicio = (nome: string) => {
      const id = idPorExercicio.get(nome);
      if (id === undefined) throw new Error(`exercicio "${nome}" nao existe - rode npm run seed antes`);
      return id;
    };

    for (const u of usuarios) {
      await apagarUsuario(client, u.email); //recria do zero

      const idUsuario = (await client.query<{ id_usuario: string }>(
        'INSERT INTO Usuario (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id_usuario',
        [u.nome, u.email, u.senha_hash]
      )).rows[0].id_usuario;

      const idPorDia = new Map<number, string>();
      for (const d of u.divisoes) {
        const idDivisao = (await client.query<{ id_divisao: string }>(
          'INSERT INTO Divisao (fk_usuario, dia_semana, nome) VALUES ($1, $2, $3) RETURNING id_divisao',
          [idUsuario, d.dia_semana, d.nome]
        )).rows[0].id_divisao;
        idPorDia.set(d.dia_semana, idDivisao);

        for (const [i, nome] of d.exercicios.entries()) {
          await client.query(
            'INSERT INTO DivisaoExercicio (fk_divisao, fk_exercicio, ordem) VALUES ($1, $2, $3)',
            [idDivisao, idExercicio(nome), i + 1]
          );
        }
      }

      for (const t of u.treinos) {
        const idTreino = (await client.query<{ id_treino: string }>(
          `INSERT INTO Treino (fk_usuario, fk_divisao, completed, data, duracao_total)
           VALUES ($1, $2, $3, $4::timestamp, $5) RETURNING id_treino`,
          [idUsuario, t.dia_divisao === null ? null : idPorDia.get(t.dia_divisao) ?? null, t.completed, t.data, t.duracao_total]
        )).rows[0].id_treino;

        //em ordem: o id_serie define a ordem das series no historico
        for (const s of t.series) {
          await client.query(
            'INSERT INTO SerieTreino (fk_treino, fk_exercicio, tipo, carga, repeticoes, rir) VALUES ($1, $2, $3, $4, $5, $6)',
            [idTreino, idExercicio(s.exercicio), s.tipo, s.carga, s.repeticoes, s.rir]
          );
        }

        if (t.diagnostico) {
          await client.query(
            `INSERT INTO DiagnosticoIA (fk_usuario, fk_treino, score_geral, data_geracao, conteudo_json)
             VALUES ($1, $2, $3, $4::timestamp, $5)`,
            [idUsuario, idTreino, t.diagnostico.score_geral, t.diagnostico.data_geracao, JSON.stringify(t.diagnostico.conteudo_json)]
          );
        }
      }
      console.log(`${u.email}: ${u.divisoes.length} divisoes, ${u.treinos.length} treinos`);
    }

    await client.query('COMMIT');
    console.log('Usuarios de demonstracao carregados.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao carregar usuarios de demonstracao: ', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

//filhas primeiro, como no schema.sql
async function apagarUsuario(client: import('pg').PoolClient, email: string) {
  const sub = 'SELECT id_usuario FROM Usuario WHERE email = $1';
  await client.query(`DELETE FROM DiagnosticoIA WHERE fk_usuario IN (${sub})`, [email]);
  await client.query(`DELETE FROM SerieTreino WHERE fk_treino IN (SELECT id_treino FROM Treino WHERE fk_usuario IN (${sub}))`, [email]);
  await client.query(`DELETE FROM Treino WHERE fk_usuario IN (${sub})`, [email]);
  await client.query(`DELETE FROM DivisaoExercicio WHERE fk_divisao IN (SELECT id_divisao FROM Divisao WHERE fk_usuario IN (${sub}))`, [email]);
  await client.query(`DELETE FROM Divisao WHERE fk_usuario IN (${sub})`, [email]);
  await client.query('DELETE FROM Usuario WHERE email = $1', [email]);
}

//so roda quando chamado direto (o exportarDemo importa os tipos daqui)
if (require.main === module) runSeedDemo();
