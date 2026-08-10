import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import * as userModel from '../models/userModel'
import { AuthenticateRequest } from '../middlewares/auth';
import jwt from 'jsonwebtoken';

//peso do embaralhamento da senha. proteje contra ataques, deixando o calculo mais pesado
const SALT_ROUNS = 10;


//valida campos obrigatórios e tamanho minimo de senha; Gera hash com bycript; tratamento de erro
export async function register(req: Request, res: Response) {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ err: 'Nome, e-mail e senha são obrigatórios' });
    }
    if (senha.length < 6) {
        return res.status(400).json({ erro: 'Senha precisa ter no minimo 6 caracteres' });
    }

    try {
        const senhaHash = await bcrypt.hash(senha, SALT_ROUNS);
        const usuario = await userModel.criarUsuario(nome, email, senhaHash);
        return res.status(201).json({ usuario });

    } catch (erro: any) {
        if (erro.code == '23505') {
            return res.status(400).json({ erro: 'Email ja cadastrao' });
        }
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao criar usuario' })
    }
}


//Login - mensagem genérica para email e senha
export async function login(req: Request, res: Response) {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
    }

    const usuario = await userModel.buscarPorEmail(email);
    if (!usuario) {
        return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    const senhaConfere = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaConfere) {
        return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
        { id: usuario.id_usuario },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' }
    );

    return res.status(200).json({
        token,
        usuario: {
            id_usuario: usuario.id_usuario,
            nome: usuario.nome,
            email: usuario.email,
        },
    });
}

// rota who am I
// Rota protegida (Meu Perfil). Retorna os dados do usuário logado com base no token recebido.
export async function me(req: AuthenticateRequest, res: Response) {
    const usuario = await userModel.buscarPorId(req.userId as string);
    if (!usuario) {
        return res.status(404).json({ erro: 'Usuario nao encontrado' })
    }

    return res.status(200).json({ usuario });
}