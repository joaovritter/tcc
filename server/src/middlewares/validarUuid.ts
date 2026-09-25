import { Request, Response, NextFunction } from 'express';

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

//bloqueia id malformado ANTES de chegar no Postgres: sem isso, 'abc' vira erro
//22P02 do banco e o Express responde 500. 404 igual nao diferencia "nao existe" de "id invalido"
export function validarUuid(parametro: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!FORMATO_UUID.test(String(req.params[parametro]))) {
            return res.status(404).json({ erro: 'Recurso não encontrado' });
        }
        next();
    };
}