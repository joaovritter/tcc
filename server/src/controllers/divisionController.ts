import { Request, Response } from "express";
import * as divisionModel from '../models/divisionModel';
import { AuthenticateRequest } from "../middlewares/auth";
import { DivisaoExercicioInput, DivisaoInput } from "../types/indexTypes";



export async function listarDivisoes(req: AuthenticateRequest, res: Response) {
    const divisoes = await divisionModel.buscarPorUsuario(req.userId as string);
    return res.status(200).json({ divisoes });
}



//valida os dados recebidos e substitui toda semana
export async function salvarDivisoes(req: AuthenticateRequest, res: Response) {
    const { divisoes } = req.body as { divisoes: DivisaoInput[] } //pega array do json

    if (!Array.isArray(divisoes)) {  //garante que o payload é array
        return res.status(400).json({ erro: 'Corpo precisa ter um array "divisoes"' });
    }

    for (const divisao of divisoes) { //garante campos preenchidos e valores no intervalo correto
        if (!divisao.nome || !divisao.nome.trim()) {
            return res.status(400).json({ erro: 'Todo dia precisa de um nome' });
        }
        if (typeof divisao.dia_semana !== 'number' || divisao.dia_semana < 0 || divisao.dia_semana > 6) {
            return res.status(400).json({ erro: 'dia_semana precisa estar entre 0 e 6' })
        }
    }

    //garante que não existe dois itens para o mesmo dia da semana 
    const dias = divisoes.map((d) => d.dia_semana);
    if (new Set(dias).size !== dias.length) {
        return res.status(400).json({ erro: 'nao pode haver dois registros no mesmo dia' });

    }

    try { //tenta persistir no banco usando a funcao de substituição transacional
        const divisoesSalvas = await divisionModel.substituirSemana(req.userId as string, divisoes);
        return res.status(200).json({ divisoes: divisoesSalvas })
    } catch (erro) {
        console.error(erro)
        return res.status(500).json({ erro: 'erro ao salvar divisao semanal' });
    }
}


//confirma o dono antes de divisaoExercicio, confere que id_divisao da URL pertence ao usuario do token
async function confirmarDonoDivisao(idDivisao: string, fkUsuario: string) {
    const divisoes = await divisionModel.buscarPorUsuario(fkUsuario);
    return divisoes.some((d) => d.id_divisao === idDivisao);
}

//lista exercicios de uma divisao
export async function listarExerciciosDivisao(req: AuthenticateRequest, res: Response) {
    const id = req.params.id as string;
    if (!(await confirmarDonoDivisao(id, req.userId as string))) {
        return res.status(404).json({ erro: 'Divisão não encontrada' });
    }
    const exercicios = await divisionModel.buscarExerciciosDoDia(id);
    return res.status(200).json({ exercicios });
}

//salva os exericios na divisao
export async function salvarExerciciosDivisao(req: AuthenticateRequest, res: Response) {
    const id = req.params.id as string;
    const { exercicios } = req.body as { exercicios: DivisaoExercicioInput[] }

    if (!(await confirmarDonoDivisao(id, req.userId as string))) {
        return res.status(404).json({ erro: 'Divisão não encontrada' });
    }
    if (!Array.isArray(exercicios)) {
        return res.status(400).json({ erro: 'Corpo precisa ter um array "exercicios"' });
    }
    for (const item of exercicios) {
        if (typeof item.fk_exercicio !== 'number') {
            return res.status(400).json({ erro: 'fk_exercicio precisa ser um número' });
        }
    }
    try {
        const salvos = await divisionModel.substituirExerciciosDoDia(id, exercicios);
        return res.status(200).json({ exercicios: salvos });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao salvar exercícios da divisão' });
    }
}

//lista todos musculos da divisao
export async function listarResumoMusculos(req: AuthenticateRequest, res: Response) {
    const resumo = await divisionModel.buscarResumoMusculos(req.userId as string);
    return res.status(200).json({ resumo });
}