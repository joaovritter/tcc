import { Response } from 'express';
import { AuthenticateRequest } from '../middlewares/auth';
import * as volumeService from '../services/volumeService';
import * as sessionModel from '../models/sessionModel';
import * as geminiService from '../services/geminiService';
import * as diagnosticModel from '../models/diagnosticModel';
import { calcularPv, calcularPi, calcularScoreGeral } from '../services/scoreService';



export async function gerarDiagnostico(req: AuthenticateRequest, res: Response) {
  const fkUsuario = req.userId as string;
  const idTreino = req.params.id as string;

  const treino = await sessionModel.buscarPorId(idTreino, fkUsuario); 
  if (!treino) {
    return res.status(404).json({ erro: 'Treino não encontrado' });
  }

  const series = await sessionModel.buscarSeriesValidasDaSessao(idTreino, fkUsuario);
  if (series.length === 0) {
    return res.status(400).json({ erro: 'Nenhuma série válida registrada nesta sessão ainda' });
  }

  // Pv usa o volume semanal acumulado só como contexto 
  // é "onde a semana está" no momento deste treino
  const volume = await volumeService.calcularVolumeSemanal(fkUsuario);
  const grupamentosDaRotina = new Set(series.map((s) => s.id_grupamento));
  const pv = calcularPv(volume, grupamentosDaRotina);
  const pi = calcularPi(series);
  const scoreGeral = calcularScoreGeral(pv, pi);

  try {
    const conteudo = await geminiService.gerarDiagnostico(treino, volume, series);
    const diagnostico = await diagnosticModel.salvar(fkUsuario, idTreino, scoreGeral, {
      ...conteudo,
      score_detalhe: { pv, pi },
    });
    return res.status(201).json({ diagnostico });
  } catch (erro) {
    // nenhuma tabela de treino é mexida aqui, se IA falhar não arrisca dados de treino ou série
    console.error(erro);
    return res.status(502).json({ erro: 'Falha ao gerar diagnóstico com a IA' });
  }
}

export async function diagnosticoAtual(req: AuthenticateRequest, res: Response) {
  const fkUsuario = req.userId as string;

  const diagnostico = await diagnosticModel.buscarUltimoDoUsuario(fkUsuario);
  if (!diagnostico) {
    return res.status(404).json({ erro: 'Nenhum diagnóstico gerado ainda' });
  }
  return res.status(200).json({ diagnostico });
}