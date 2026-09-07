import { Request, Response } from 'express';
import * as sessionModel from '../models/sessionModel';
import * as divisionModel from '../models/divisionModel';
import { AuthenticateRequest } from '../middlewares/auth';
import { Treino, TipoSerie, SerieTreino, SerieComExercicio, SerieTreinoInput, NovaSerieTreino, TreinoDeHoje } from '../types/indexTypes';


//monta a tela inteira numa requisição: descobre dia da semana, divisao daquele dia,
//puxa os exercicios da rotina, devolve o treino aberto com series registradas (se ja tiver)
export async function treinoDeHoje(req: AuthenticateRequest, res: Response) {
    const fkUsuario = req.userId as string;
    const diaSemana = new Date().getDay(); // 0 = domingo

    const divisoes = await divisionModel.buscarDivisaoPorUsuario(fkUsuario);
    const divisaoHoje = divisoes.find((d) => d.dia_semana === diaSemana) ?? null;

    const exercicios = divisaoHoje ? await divisionModel.buscarExerciciosDoDia(divisaoHoje.id_divisao) : [];

    const treino = await sessionModel.buscarTreinoAberto(fkUsuario);
    const series = treino ? await sessionModel.buscarSeries(treino.id_treino) : [];

    return res.status(200).json({
        hoje: { dia_semana: diaSemana, divisaoHoje, treino, exercicios, series },
    });
}


//comeca o treino com divisao do dia, se ja tiver treino aberto devolve ele.
export async function comecarTreino(req: AuthenticateRequest, res: Response) {
    const fkUsuario = req.userId as string;

    const aberto = await sessionModel.buscarTreinoAberto(fkUsuario);
    if (aberto) {
        return res.status(200).json({ treino: aberto });
    }

    const diaSemana = new Date().getDay();
    const divisoes = await divisionModel.buscarDivisaoPorUsuario(fkUsuario);
    const divisaoHoje = divisoes.find((d) => d.dia_semana === diaSemana) ?? null;

    const treino = await sessionModel.criarTreino(
        fkUsuario,
        divisaoHoje ? divisaoHoje.id_divisao : null
    );
    return res.status(201).json({ treino });
}


//valida os campos basicos e resolve a nota de esforço.
//recebe rir/rpe do SerieTreinoInput e devolve um NovaSerieTreino ja com rir pronto pro model.
function validarSerie(
    serie: SerieTreinoInput
): { valor: NovaSerieTreino } | { erro: string } {
    const tipos: TipoSerie[] = ['aquecimento', 'feeder', 'work'];

    if (!tipos.includes(serie.tipo)) {
        return { erro: `Tipo de série inválido. Deve ser um dos seguintes: ${tipos.join(', ')}` };
    }
    if (typeof serie.fk_exercicio !== 'number') {
        return { erro: 'fk_exercicio deve ser um número.' };
    }
    if (typeof serie.carga !== 'number' || serie.carga < 0) {
        return { erro: 'carga precisa ser um número maior ou igual a zero' };
    }
    if (!Number.isInteger(serie.repeticoes) || serie.repeticoes <= 0) {
        return { erro: 'repeticoes precisa ser um inteiro maior que zero' };
    }

    const base = {
        fk_exercicio: serie.fk_exercicio,
        tipo: serie.tipo,
        carga: serie.carga,
        repeticoes: serie.repeticoes,
    };

    //só serie valida leva nota.
    if (serie.tipo !== 'work') {
        if (serie.rir !== null || serie.rpe !== null) {
            return { erro: 'Séries de aquecimento e feeder não recebem rir/rpe' };
        }
        return { valor: { ...base, rir: null } };
    }

    //serie valida: escolhe rir ou rpe, converte pra rir e devolve.
    const informouRir = serie.rir != null;
    const informouRpe = serie.rpe != null;

    if (informouRir === informouRpe) {
        return { erro: 'Informe rir ou rpe'}
    }

    if (informouRir) {
        if (serie.rir! < 0 || serie.rir! > 4) {
            return { erro: 'rir deve ser um número entre 0 e 4' };
        }
    }
    return { valor: { ...base, rir: 10 - serie.rpe! } };
}


//Post: confirma dono, valida, insere
export async function registrarSerie(req: AuthenticateRequest, res: Response) {
    const idTreino = req.params.id as string;
    const serie = req.body as SerieTreinoInput;

    const treino = await sessionModel.buscarPorId(idTreino, req.userId as string);
    if (!treino) {
        return res.status(404).json({ erro: 'Treino não encontrado' });
    }

    const validado = validarSerie(serie);
    if ('erro' in validado) {
        return res.status(400).json({ erro: validado.erro });
    }

    try {
        const serieSalva = await sessionModel.registrarSerie(idTreino, validado.valor);
        return res.status(201).json({ serie: serieSalva});
    }catch (erro){
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao registrar série' });
    }
}


// Delete: req.params.idSerie chega como string
// Number() + Number.isNaN antes de ir pro banco evita mandar NaN pro Postgres
export async function apagarSerie(req: AuthenticateRequest, res: Response){
    const idTreino = req.params.id as string;
    const idSerie = Number(req.params.idSeries);

    if (Number.isNaN(idSerie)){
        return res.status(400).json({ erro: 'id da serie invalido'});
    }

    const treino = await sessionModel.buscarPorId(idTreino, req.userId as string);
    if(!treino){
        return res.status(404).json({ erro: 'serie nao encontrada'});
    }

    const apagou = await sessionModel.apagarSerie(idTreino, idSerie);
    if(!apagou){
        return res.status(404).json({ erro: 'serie nao encontrada'});
    }
    return res.status(204).send();
}



