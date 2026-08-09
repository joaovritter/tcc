import { pool } from '../config/db'
import type { UsuarioPublico } from '../types/indexTypes'

export async function criarUsuario(
    nome: string,
    email: string,
    senhaHash: string
): Promise<UsuarioPublico> { //tipo de retorno esperado (usuario sem a senha)
    const resultado = await pool.query<UsuarioPublico>(
        `INSERT INTO Usuario (nome, email, senha_hash) 
         VALUES ($1, $2, $3)
         RETURNING id_usuario, nome, email`,
        [nome, email, senhaHash]
    ); //query que insere usuário mas não retorna senha
    return resultado.rows[0];
}

export async function buscarPorEmail(
    email: string
): Promise<UsuarioPublico | null> {
    const resultado = await pool.query<UsuarioPublico>(
        `SELECT * FROM Usuario WHERE email = $1`,
        [email]
    );
    return resultado.rows[0] ?? null;
}

export async function buscarPorId(
    idUsuario: string
): Promise<UsuarioPublico | null> {
    const resutlado = await pool.query<UsuarioPublico>(
        `SELECT id_usuario, nome, email FROM Usuario WHERE id_usuario = $1`,
        [idUsuario]
    );
    return resutlado.rows[0] ?? null;
}