import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TokenPayload } from '../types/indexTypes';

// estende o request do express com um campo userId,
// controller consegue ler req.userId de forma tipada, sem any.
export interface AuthenticateRequest extends Request {
    userId?: string;
}

//primeiro confere se veio o header no formato Bearer <token>, sem isso nem tenta validar
export function autenticar (
    req: AuthenticateRequest,
    res: Response,
    next: NextFunction
){
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ erro: 'Token nao informado' });
    }

    const token = header.slice('Bearer '.length);

    try { // tenta verificar o token (jwt.verify)
        const payload = jwt.verify( // Valida o token e injeta o ID do user no "req" para ser usado na próxima rota.
            token,
            process.env.JWT_SECRET as string
        ) as TokenPayload;
        req.userId = payload.id;
        next();
    } catch { //lanca exceção 401, para não derrubar o servidor com 500
        return res.status(401).json({ erro: 'Token invalido ou expirado' })

    }
}