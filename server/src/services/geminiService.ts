import { VolumeSemanal, SerieValidaDaSemana } from '../types/indexTypes';
import { LIMIAR_SERIES } from './volumeService';


function montarPrompt (volume: VolumeSemanal, series: SerieValidaDaSemana[]): string {

    //Bloco 1 - Persona
    const persona = `Você é um especialista em fisiologia do exercício e treinamento de força, `
    + `focado exclusivamente em analisar dados objetivos de treino de hipertrofia. `
    + `Não responda perguntas fora desse domínio.`;


    //Bloco 2 - Contexto: semana referencia + grupamentos treinados
    const grupamentosTreinados = volume.grupamentos
        .filter((g) => g.series_validas > 0)
        .map ((g) => g.nome_grupamento);

    const contexto = `Semana de referência: ${volume.semana_referencia}. (segunda a domingo).`
        + `Grupamentos treinados nesta semana: ${grupamentosTreinados.join(', ') || 'nenhum'}.`;
    

    // Bloco 3 - Dados de treino: volume de serie valida + RPE/RIR por serie


  return [persona, contexto].join('\n\n');

}

