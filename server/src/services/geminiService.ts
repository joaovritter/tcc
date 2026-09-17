import { VolumeSemanal, SerieValidaDaSemana } from '../types/indexTypes';
import { LIMIAR_SERIES } from './volumeService';


function montarPrompt(volume: VolumeSemanal, series: SerieValidaDaSemana[]): string {

    //Bloco 1 - Persona
    const persona = `Você é um especialista em fisiologia do exercício e treinamento de força, `
        + `focado exclusivamente em analisar dados objetivos de treino de hipertrofia. `
        + `Não responda perguntas fora desse domínio.`;

    //Bloco 2 - Contexto: semana referencia + grupamentos treinados
    const grupamentosTreinados = volume.grupamentos
        .filter((g) => g.series_validas > 0)
        .map((g) => g.nome_grupamento);

    const contexto = `Semana de referência: ${volume.semana_referencia}. (segunda a domingo).`
        + `Grupamentos treinados nesta semana: ${grupamentosTreinados.join(', ') || 'nenhum'}.`;


    // Bloco 3 - Dados de treino: volume de serie valida + RPE/RIR por serie
    const linhasVolume = volume.grupamentos
        .map((g) => {
            `- ${g.nome_grupamento}: ${g.series_validas} séries válidas`
                + ` (limiar: ${LIMIAR_SERIES}, ${g.atingiu_limiar ? 'atingido' : 'não atingido'})`
        })
        .join('\n');

    const linhasSeries = series
        .map((s) => `- ${s.nome_exercicio} (${s.nome_grupamento}): ${s.carga}kg x `
            + `${s.repeticoes} reps, RPE ${s.rpe} (RIR ${s.rir})`)
        .join('\n');

    const dados = `Volume semanal por grupamento:\n${linhasVolume}\n\n`
        + `Séries válidas registradas:\n${linhasSeries}`;

    //Bloco 4 - Diretrizes científicas: os dois limiares (RIR e RPE) do referencial
    const diretrizes = `Considere: (1) 10 ou mais séries semanais por grupamento é o limiar `
        + `mínimo associado a ganhos hipertróficos [Schoenfeld, Ogborn, Krieger]; grupamentos `
        + `abaixo disso estão com volume insuficiente. (2) Na escala RPE/RIR, RPE 9 (1 RIR) `
        + `indica estímulo otimizado; quanto mais perto de RPE 6 (4 RIR) ao longo da semana, `
        + `menor a intensidade relativa efetiva do treino [Zourdos; Helms].`;

    // Bloco 5 — Formato de saída: só JSON, sem texto fora do schema
    const formato = `Responda apenas em JSON com os campos: diagnostico_exercicios `
        + `(array de {nome_exercicio, comentario}), analise_grupamentos (array de `
        + `{nome_grupamento, comentario}) e recomendacoes_proxima_sessao (array de strings). `
        + `Não inclua nenhum campo numérico de pontuação — isso é calculado fora da IA.`;


    return [persona, contexto, dados, diretrizes, formato].join('\n\n');

}

