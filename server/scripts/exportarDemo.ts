// Exporta os usuarios de demonstracao do banco local para src/demo/usuariosDemo.json,
// que vai pro git e e carregado de volta pelo seedDemo (npm run seed:demo).
// Uso: npm run demo:export  (rodar depois de mudar os dados desses usuarios)
//
// Exercicio e divisao vao pelo nome, nao pelo id: os ids sao SERIAL/UUID e mudam
// a cada db:reset. Os diagnosticos vao prontos, para nao depender do Gemini.
import fs from 'fs';
import path from 'path';
import { pool } from '../src/config/db';
import { EMAILS_DEMO, UsuarioDemo } from '../src/seedDemo';

const ARQUIVO = path.join(__dirname, '../src/demo/usuariosDemo.json');

async function exportarUsuario(email: string): Promise<UsuarioDemo> {
  const usuario = (await pool.query<{ id_usuario: string; nome: string; senha_hash: string }>(
    'SELECT id_usuario, nome, senha_hash FROM Usuario WHERE email = $1', [email]
  )).rows[0];
  if (!usuario) throw new Error(`usuário ${email} não existe no banco local`);

  const divisoes = (await pool.query(
    `SELECT d.id_divisao, d.dia_semana, d.nome,
            COALESCE(array_agg(e.nome_exercicio ORDER BY de.ordem) FILTER (WHERE e.id_exercicio IS NOT NULL), '{}') AS exercicios
     FROM Divisao d
     LEFT JOIN DivisaoExercicio de ON de.fk_divisao = d.id_divisao
     LEFT JOIN Exercicio e ON e.id_exercicio = de.fk_exercicio
     WHERE d.fk_usuario = $1
     GROUP BY d.id_divisao
     ORDER BY d.dia_semana`,
    [usuario.id_usuario]
  )).rows;

  //data como texto: TIMESTAMP sem fuso, assim volta exatamente igual
  const treinos = (await pool.query(
    `SELECT t.id_treino, d.dia_semana, t.completed, t.duracao_total,
            to_char(t.data, 'YYYY-MM-DD HH24:MI:SS.US') AS data
     FROM Treino t
     LEFT JOIN Divisao d ON d.id_divisao = t.fk_divisao
     WHERE t.fk_usuario = $1
     ORDER BY t.data`,
    [usuario.id_usuario]
  )).rows;

  const resultado: UsuarioDemo = {
    nome: usuario.nome,
    email,
    senha_hash: usuario.senha_hash,
    divisoes: divisoes.map((d) => ({ dia_semana: d.dia_semana, nome: d.nome, exercicios: d.exercicios })),
    treinos: [],
  };

  for (const t of treinos) {
    const series = (await pool.query(
      `SELECT e.nome_exercicio AS exercicio, s.tipo, s.carga::float AS carga, s.repeticoes, s.rir
       FROM SerieTreino s JOIN Exercicio e ON e.id_exercicio = s.fk_exercicio
       WHERE s.fk_treino = $1
       ORDER BY s.id_serie`,
      [t.id_treino]
    )).rows;
    const diagnostico = (await pool.query(
      `SELECT score_geral, to_char(data_geracao, 'YYYY-MM-DD HH24:MI:SS.US') AS data_geracao, conteudo_json
       FROM DiagnosticoIA WHERE fk_treino = $1`,
      [t.id_treino]
    )).rows[0] ?? null;

    resultado.treinos.push({
      data: t.data,
      dia_divisao: t.dia_semana,
      completed: t.completed,
      duracao_total: t.duracao_total,
      series,
      diagnostico,
    });
  }
  return resultado;
}

async function main() {
  const usuarios = [];
  for (const email of EMAILS_DEMO) usuarios.push(await exportarUsuario(email));
  fs.mkdirSync(path.dirname(ARQUIVO), { recursive: true });
  fs.writeFileSync(ARQUIVO, JSON.stringify(usuarios, null, 2) + '\n');
  for (const u of usuarios) console.log(`${u.email}: ${u.divisoes.length} divisões, ${u.treinos.length} treinos`);
  console.log(`salvo em ${path.relative(process.cwd(), ARQUIVO)}`);
}

main()
  .catch((erro) => {
    console.error('ERRO:', erro.message ?? erro);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
