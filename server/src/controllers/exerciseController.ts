import { Request, Response } from "express";
import * as exerciseModel from '../models/exerciseModel';

export async function listar (req: Request, res: Response){
    const grupamento = req.query.grupamento
    ? Number(req.query.grupamento)
    : undefined;

    if(grupamento !== undefined && Number.isNaN(grupamento)){
        return res.status(400).json({ erro: 'Grupamento precisa ser un número'});
    }

    const exercicios = await exerciseModel.listarTodos(grupamento);
    return res.status(200).json({ exercicios});

}