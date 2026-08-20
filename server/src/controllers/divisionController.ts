import { Request, Response } from "express";
import * as divisionModel from '../models/divisionModel';
import { AuthenticateRequest } from "../middlewares/auth";
import { DivisaoInput } from "../types/indexTypes";

export async function listar(req: AuthenticateRequest, res: Response) {
    const divisoes = await divisionModel.buscarPorUsuario(req.userId as string);
    return res.status(200).json({ divisoes });
}

//valida os dados recebidos e substitui toda semana
export async function salvar (req: AuthenticateRequest, res: Response){
    const { divisoes } = req.body as { divisoes: DivisaoInput[] } //pega array do json

    if(!Array.isArray(divisoes)){  //garante que o payload é array
        return res.status(400).json({ erro: 'Corpo precisa ter um array "divisoes"'});
    }

    for (const divisao of divisoes) { //garante campos preenchidos e valores no intervalo correto
        if(!divisao.nome || !divisao.nome.trim()) {
            return res.status(400).json({ erro: 'Todo dia precisa de um nome'});
        }
        if (typeof divisao.dia_semana !== 'number' || divisao.dia_semana < 0 || divisao.dia_semana > 6) {
            return res.status(400).json({ erro: 'dia_semana precisa estar entre 0 e 6'})
        }
    }
    
   //garante que não existe dois itens para o mesmo dia da semana 
    const dias = divisoes.map((d) => d.dia_semana);
    if (new Set(dias).size !== dias.length){
        return res.status(400).json({ erro: 'nao pode haver dois registros no mesmo dia'});

    }

    try { //tenta persistir no banco usando a funcao de substituição transacional
        const divisoesSalvas = await divisionModel.substituirSemana(req.userId as string, divisoes);
        return res.status(200).json({ divisoes: divisoesSalvas})
    } catch (erro) {
        console.error(erro)
        return res.status(500).json({ erro: 'erro ao salvar divisao semanal'});
    }
}