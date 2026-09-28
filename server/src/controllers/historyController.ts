import { Response } from 'express';
import { AuthenticateRequest } from '../middlewares/auth';
import * as historyModel from '../models/historyModel';
import * as diagnosticModel from '../models/diagnosticModel';
import * as volumeService from '../services/volumeService';

//so le e devolve. se aparecer conta aqui, a regra ta vazando do service/model

const FORMATO_MES = /^\d{4}-(0[1-9]|1[0-2])$/;

//calendario: ?mes=AAAA-MM; sem o parametro, o mes atual.
//todas as sessoes do mes (sem LIMIT) + o dia do primeiro treino, que trava a seta de voltar
export async function sessoesDoMes(req: AuthenticateRequest, res: Response) {
    const { mes } = req.query;
    //?mes=a&mes=b chega como array: typeof barra antes do regex
    if (mes !== undefined && (typeof mes !== 'string' || !FORMATO_MES.test(mes))) {
        return res.status(400).json({ erro: 'mes precisa estar no formato AAAA-MM' });
    }

    try {
        const fkUsuario = req.userId as string;
        const [sessoes, primeira_sessao] = await Promise.all([
            historyModel.listarSessoesDoMes(fkUsuario, typeof mes === 'string' ? mes : null),
            historyModel.buscarPrimeiraSessao(fkUsuario),
        ]);
        return res.status(200).json({ primeira_sessao, sessoes });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao carregar as sessões do mês' });
    }
}


//o que abre ao tocar no treino do dia: series por exercicio + resumo + diagnostico
export async function detalheSessao(req: AuthenticateRequest, res: Response) {
    const fkUsuario = req.userId as string;
    const idTreino = req.params.id as string; //ja passou pelo validarUuid na rota

    try {
        const sessao = await historyModel.buscarSessao(fkUsuario, idTreino);
        //treino aberto ou de outro usuario: o mesmo 404 - historico e so treino finalizado
        if (!sessao) {
            return res.status(404).json({ erro: 'Sessão não encontrada' });
        }

        const [exercicios, diagnostico] = await Promise.all([
            historyModel.listarExerciciosDaSessao(fkUsuario, idTreino),
            diagnosticModel.buscarUltimoDaSessao(idTreino, fkUsuario),
        ]);
        return res.status(200).json({ sessao, exercicios, diagnostico });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao carregar a sessão' });
    }
}


export async function exerciciosTreinados(req: AuthenticateRequest, res: Response) {
    try {
        const exercicios = await historyModel.listarExerciciosTreinados(req.userId as string);
        return res.status(200).json({ exercicios });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao carregar os exercícios treinados' });
    }
}


export async function progressaoCarga(req: AuthenticateRequest, res: Response) {
    const idExercicio = Number(req.params.id);
    if (!Number.isInteger(idExercicio)) {
        return res.status(400).json({ erro: 'id do exercicio invalido' });
    }

    try {
        const progressao = await historyModel.progressaoDeCarga(req.userId as string, idExercicio);
        return res.status(200).json({ progressao });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao carregar a progressão de carga' });
    }
}



//?semanas=N (1 a 26); sem o parametro, o padrao de 8
export async function volumeHistorico(req: AuthenticateRequest, res: Response) {
    const semanas = req.query.semanas === undefined
        ? volumeService.SEMANAS_HISTORICO_PADRAO
        : Number(req.query.semanas);

    if (!Number.isInteger(semanas) || semanas < 1 || semanas > 26) {
        return res.status(400).json({ erro: 'semanas precisa ser um inteiro entre 1 e 26' });
    }

    try {
        const historico = await volumeService.calcularHistoricoVolume(req.userId as string, semanas);
        return res.status(200).json({ historico });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao carregar o histórico de volume' });
    }
}