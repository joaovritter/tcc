import { Treino, VolumeSemanal, SerieValidaDaSessao, DiagnosticoConteudo } from '../types/indexTypes';
import { LIMIAR_SERIES } from './volumeService';
import { ai, GEMINI_MOCK, GEMINI_MODEL } from '../config/gemini';



// diagnostico eé gerado por SESSAO de treino finalizada (fk_treino), nao
// por corte semanal. 
// volume é o acumulado semanal (RF04) e entra so como CONTEXTO (ex faltam N series pro limiar), 
function montarPrompt(treino: Treino, volume: VolumeSemanal, series: SerieValidaDaSessao[]): string {

    //Bloco 1 - Persona
    const persona = `Você é um especialista em fisiologia do exercício e treinamento de força, `
        + `focado exclusivamente em analisar dados objetivos de treino de hipertrofia. `
        + `Não responda perguntas fora desse domínio.`;

    //Bloco 2 - Contexto: sessao de treino avaliada + grupamentos treinados nela
    const grupamentosTreinados = [...new Set(series.map((s) => s.nome_grupamento))];

    const contexto = `Sessão de treino avaliada: ${treino.data}. `
        + `Grupamentos treinados nesta sessão: ${grupamentosTreinados.join(', ') || 'nenhum'}. `
        + `(Semana de referência do volume acumulado abaixo: ${volume.semana_referencia}, segunda a domingo.)`;


    // Bloco 3 - Dados de treino: series desta sessao + volume semanal acumulado como contexto
    const linhasVolume = volume.grupamentos
        .map((g) => `- ${g.nome_grupamento}: ${g.series_validas} séries válidas`
            + ` acumuladas na semana (limiar: ${LIMIAR_SERIES}, ${g.atingiu_limiar ? 'atingido' : 'não atingido'})`)
        .join('\n');

    const linhasSeries = series
        .map((s) => `- ${s.nome_exercicio} (${s.nome_grupamento}): ${s.carga}kg x `
            + `${s.repeticoes} reps, RPE ${s.rpe} (RIR ${s.rir})`)
        .join('\n');

    const dados = `Séries válidas registradas nesta sessão:\n${linhasSeries}\n\n`
        + `Volume semanal acumulado por grupamento (contexto, não é o foco da avaliação):\n${linhasVolume}`;

    //Bloco 4 - Diretrizes científicas: os dois limiares (RIR e RPE) do referencial
    const diretrizes = `Considere: (1) 10 ou mais séries semanais por grupamento é o limiar `
        + `mínimo associado a ganhos hipertróficos [Schoenfeld, Ogborn, Krieger]; grupamentos `
        + `abaixo disso estão com volume insuficiente. (2) Na escala RPE/RIR, RPE 9 (1 RIR) `
        + `indica estímulo otimizado; quanto mais perto de RPE 6 (4 RIR) ao longo da sessão, `
        + `menor a intensidade relativa efetiva do treino [Zourdos; Helms].`;

    // Bloco 5 — Formato de saída: só JSON, sem texto fora do schema
    const formato = `Responda apenas em JSON com os campos: diagnostico_exercicios `
        + `(array de {nome_exercicio, comentario}), analise_grupamentos (array de `
        + `{nome_grupamento, comentario}) e recomendacoes_proxima_sessao (array de strings). `
        + `Não inclua nenhum campo numérico de pontuação — isso é calculado fora da IA.`;

    return [persona, contexto, dados, diretrizes, formato].join('\n\n');

}
// schema de validação do JSON de saída, para o Gemini filtrar respostas inválidas
//isso é o formato que o Gemini vai tentar devolver
const SCHEMA = {
  type: 'object',
  properties: {
    diagnostico_exercicios: {
      type: 'array',
      items: {
        type: 'object',
        properties: { nome_exercicio: { type: 'string' }, comentario: { type: 'string' } },
        required: ['nome_exercicio', 'comentario'],
      },
    },
    analise_grupamentos: {
      type: 'array',
      items: {
        type: 'object',
        properties: { nome_grupamento: { type: 'string' }, comentario: { type: 'string' } },
        required: ['nome_grupamento', 'comentario'],
      },
    },
    recomendacoes_proxima_sessao: { type: 'array', items: { type: 'string' } },
  },
  required: ['diagnostico_exercicios', 'analise_grupamentos', 'recomendacoes_proxima_sessao'],
};


// resposta determinística a partir do dado real - não é lorem ipsum fixo,
// senão o teste de score bate com o cálculo manual não prova nada
function mockDiagnostico(volume: VolumeSemanal, series: SerieValidaDaSessao[]): DiagnosticoConteudo {
  return {
    diagnostico_exercicios: series.slice(0, 3).map((s) => ({
      nome_exercicio: s.nome_exercicio,
      comentario: `Mock: ${s.repeticoes} reps a RPE ${s.rpe}.`,
    })),
    analise_grupamentos: volume.grupamentos.map((g) => ({
      nome_grupamento: g.nome_grupamento,
      comentario: g.atingiu_limiar
        ? `Mock: limiar de ${LIMIAR_SERIES} séries atingido.`
        : `Mock: abaixo do limiar (${g.series_validas}/${LIMIAR_SERIES}).`,
    })),
    recomendacoes_proxima_sessao: ['Mock: manter a intensidade nas séries válidas.'],
  };
}


export async function gerarDiagnostico(
  treino: Treino,
  volume: VolumeSemanal,
  series: SerieValidaDaSessao[]
): Promise<DiagnosticoConteudo> {
  if (GEMINI_MOCK){
    return mockDiagnostico(volume, series);
  }

  const prompt = montarPrompt(treino, volume, series);
  const resposta = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: { responseMimeType: 'application/json', responseSchema: SCHEMA },
  });

  const texto = resposta.text;
  if (!texto) throw new Error('Gemini não retornou conteúdo');

  return JSON.parse(texto) as DiagnosticoConteudo;
}



