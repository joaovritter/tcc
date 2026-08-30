import { readFileSync } from 'fs';
import path from 'path';
import { pool } from './config/db';

// Recria o banco a partir do schema.sql. O projeto nao usa migrations, entao
// editar o schema.sql nao muda o banco local sozinho — os dois so voltam a
// bater rodando este script (npm run db:reset, que ja chama o seed depois).
// Caminho a partir do __dirname para funcionar de qualquer diretorio.
const caminhoSchema = path.join(__dirname, '..', 'schema.sql');

async function resetarBanco() {
  console.log('Recriando schema a partir de schema.sql...');
  try {
    const schema = readFileSync(caminhoSchema, 'utf8');
    await pool.query(schema); //o pg aceita varios comandos numa query so
    console.log('Schema recriado com sucesso.');
  } catch (erro) {
    console.error('Erro ao recriar o schema: ', erro);
    process.exitCode = 1;
  } finally {
    await pool.end(); //fecha o pool, para o processo nao ficar pendurado
  }
}

resetarBanco();
