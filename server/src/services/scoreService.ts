import { VolumeSemanal, SerieValidaDaSessao } from '../types/indexTypes';
import { LIMIAR_SERIES } from './volumeService';

/**
 * Pv = Pontuacao de Volume Semanal
 *  - média só sobre os grupamentos da divisão (não de todos existentes)
 *  - Continua usando volume semanal acumulado como contexto
 */
export function calcularPv(volume: VolumeSemanal, grupamentosDaRotina: Set<number>): number {
    const grupamentosRelevantes = volume.grupamentos.filter((g) => grupamentosDaRotina.has(g.id_grupamento));
    if (grupamentosRelevantes.length === 0) {
        return 0;
    }
    //reduce acumula a pontuacao de cada grupamento
    //Math.min trava a taxa em no maximo 1 (100%)
    const soma = grupamentosRelevantes.reduce( 
        (acc, g) => acc + Math.min(g.series_validas / LIMIAR_SERIES, 1) * 100,
        0
    );

    return soma / grupamentosRelevantes.length; 
}


// Pi: Pontuaçã de Intensidade - séries válidas DA SESSÃO 
// RPE 6 (menor valor possível) vale 0; RPE 9 ou 10 vale 100 (teto) 
//(s.rpe - 6) / 3 Normaliza o RPE considerando 6 como base (0%) e 9 
export function calcularPi(series: SerieValidaDaSessao[]): number {
  if (series.length === 0) return 0;

  const soma = series.reduce(
    (acc, s) => acc + Math.min(((s.rpe - 6) / 3) * 100, 100),
    0
  );
  return soma / series.length;
}

export function calcularScoreGeral(pv: number, pi: number): number {
  return Math.round((pv + pi) / 2);
}