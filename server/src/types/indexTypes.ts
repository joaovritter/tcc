//============== usuario =====================================

export interface Usuario {
    id_usuario: string; //driver do pg sempre devolve UUID como string
    nome: string;
    email: string;
    senha_hash: string;
}

export interface UsuarioPublico {
    id_usuario: string;
    nome: string;
    email: string;
}

// Tipo de retorno do jwt.verify(), por padrão não tem formato definido
// Evita usar "any", garante que o TS reconheça "id"
export interface TokenPayload {
    id: string;
}



//============== divisao =====================================

export interface Divisao {
    id_divisao: string;
    fk_usuario: string;
    dia_semana: number;
    nome: string;
}

//formato que o front manda no put não tem id_divisao nem fk_usuario. esse tipo evita aceitar um payload que escreve divisao de outro usuario
export interface DivisaoInput {
    dia_semana: string;
    nome: string;
}



//============== divisao_exercicio e exercicio =====================================

export interface Exercicio {
    id_exercicio: number;
    nome_exercicio: string;
    fk_grupamento: number;
}

// GET /exercises devolve ja com nome do grupamento (JOIN), não só id
//evita o front buscar GrupamentoMuscular à parte pra exibir o filtro
export interface ExercicioComGrupamento extends Exercicio {
    nome_grupamento: string;
}

export interface DivisaoExercicio {
    id_divisao_exercicio: number;
    fk_divisao: string;
    fk_exercicio: number;
    ordem: number;
}

//payload do front pro PUT: sí o id do exercicio, evita mandar ordem duplicado
export interface DivisaoExercicioInput {
    fk_exercicio: number;
}

// GET /divisions/:id/exercises devolve já com nome do exercicio e do grupamento (JOIN)
// evita o front cruzar catalogo + DivisaoExercicio na mão pra montar a lista do dia
export interface ExercicioDoDia extends DivisaoExercicio {
    nome_exercicio: string;
    nome_grupamento: string;
}



//============== treino e serie =====================================

export interface Treino {
    id_treino: string;
    fk_usuario: string;
    fk_divisao: string | null;
    completed: boolean;
    data: string;
    duracao_total: number | null;
}

// faz o TS barrar um tipo inválido antes mesmo de o Postgres reclamar
export type TipoSerie = 'aquecimento' | 'feeder' | 'work';

export interface SerieTreino {
    id_serie: number;
    fk_treino: string;
    fk_exercicio: number;
    tipo: TipoSerie;
    carga: string; // NUMERIC volta como string no driver pg
    rpe: number | null;
    rir: number | null;
    repeticoes: number;
}

//rir/rpe: o usuário escolhe: UM dos dois pra reportar (nunca os dois, nunca nenhum em série válida)
// o controller resolve qual foi mandado e converte pro canônico antes de chamar o model.
export interface SerieTreinoInput {
    fk_exercicio: number;
    tipo: TipoSerie;
    carga: number; // NUMERIC volta como string no driver pg
    repeticoes: number;
    rpe?: number | null;
    rir?: number | null;

}

//nunca tem `rpe` (é coluna gerada, o Postgres calcula sozinho), só o canônico `rir`, ou `null` quando a série não é válida
export interface NovaSerieTreino {
  fk_exercicio: number;
  tipo: TipoSerie;
  carga: number;
  repeticoes: number;
  rir: number | null;
}

//serie com nome do exercicio, usada na resposta do GET /sessions/today para listar séries ja registradas na rotina do dia
export interface SerieComExercicio extends SerieTreino {
  nome_exercicio: string;
}

export interface TreinoDeHoje {
  dia_semana: number;
  divisaoHoje: Divisao | null;
  treino: Treino | null;
  exercicios: ExercicioDoDia[];
  series: SerieComExercicio[];
}




//============== métricas (RF04) =====================================

//uma linha do painel de volume semanal: quantas series validas o usuario
//acumulou naquele grupamento na semana de referencia
export interface VolumeGrupamento {
    id_grupamento: number;
    nome_grupamento: string;
    series_validas: number; // COUNT(...)::int - sem ::int o pg devolve como string (BIGINT)
    atingiu_limiar: boolean; //comaparação feita no backend (RNF03)
}

//resposta interia do GET /metrics/volume-weekly
export interface VolumeSemanal {
    semana_referencia: string; 
    limiar: number; 
    grupamentos: VolumeGrupamento[];
}



//============== diagnostico =====================================

//serie valida de UMA sessao de treino (fk_treino), nao da semana inteira
export interface SerieValidaDaSessao{
    id_grupamento: number;
    nome_grupamento: string;
    nome_exercicio: string;
    carga: string;
    repeticoes: number;
    rpe: number;
    rir: number;
}

//o qua a IA devolve, parte qualitativa. score é calculado no scoreService
export interface DiagnosticoConteudo {
    diagnostico_exercicios: { nome_exercicio: string; comentario: string; }[]; 
    analise_grupamentos: { nome_grupamento: string; comentario: string; }[];
    recomendacoes_proxima_sessao: string[];
}

// o que fica gravado em conteudo_json: o texto da IA + as duas sub-notas,
// pra auditar depois COMO o score_geral saiu daquele número 
export interface DiagnosticoConteudoPersistido extends DiagnosticoConteudo {
  score_detalhe: { pv: number; pi: number };  //pi = pontuação de intensidade, pv = pontuação de volume
}

export interface DiagnosticoIA{
    id_diagnostico: string;
    fk_usuario: string;
    fk_treino: string; // referencia é a sessão de treino do dia
    score_geral: number;
    data_geracao: string;
    conteudo_json: DiagnosticoConteudoPersistido;
}

// diagnostico + data da sessao que o gerou (JOIN Treino) - a tela mostra
export interface DiagnosticoComTreino extends DiagnosticoIA {
    data_treino: string;
}




//============== histórico (RF07) =====================================

//uma sessao finalizada (D18) com o resumo do que aconteceu nela
export interface SessaoHistorico {
    id_treino: string;
    data: string; // timestamp - a tela usa so pra mostrar a hora
    dia: string; // 'YYYY-MM-DD' (to_char no banco) - posiciona a sessao no calendario
    duracao_total: number | null;
    nome_divisao: string | null; // fk_divisao é nullable no schema
    series_validas: number; // COUNT(...)::int
    id_diagnostico: string | null; // o mais recente da sessao (D14); null se nunca gerou
    score_geral: number | null;
}

//resposta do calendario: GET /history/sessions?mes=AAAA-MM (D18)
export interface SessoesDoMes {
    primeira_sessao: string | null; // 'YYYY-MM-DD' do treino finalizado mais antigo; null se nunca finalizou
    sessoes: SessaoHistorico[];
}

//exercicios com pelo menos uma serie work - popula o seletor da aba Cargas
export interface ExercicioTreinado {
    id_exercicio: number;
    nome_exercicio: string;
    nome_grupamento: string;
}

//D17: o resumo das series work de UM exercicio em UMA sessao.
//mesmo tipo no grafico de progressao e no detalhe da sessao - sao os mesmos numeros
export interface ResumoSeriesValidas {
    series_validas: number;
    carga_maxima: number; // ::float na query - NUMERIC voltaria string
    reps_carga_maxima: number; // reps da serie mais pesada (empate de carga: a de mais reps)
    tonelagem: number; // soma de carga x reps. NAO e "volume" - volume e contagem de series (RF04)
}

//um ponto do grafico de progressao: uma sessao (D17)
export interface PontoProgressaoCarga extends ResumoSeriesValidas {
    id_treino: string;
    data: string;
}

//uma serie como aparece no detalhe - valida ou de preparacao
export interface SerieDaSessao {
    id_serie: number;
    tipo: TipoSerie;
    carga: number;
    repeticoes: number;
    rir: number | null; // null em aquecimento/feeder (D9)
}

export interface ExercicioDaSessao {
    id_exercicio: number;
    nome_exercicio: string;
    nome_grupamento: string;
    resumo: ResumoSeriesValidas | null; // null = o exercicio so teve preparacao
    series: SerieDaSessao[]; // na ordem em que foram registradas
}

//resposta do GET /history/sessions/:id - o que abre ao tocar no treino do dia
export interface DetalheSessao {
    sessao: SessaoHistorico;
    exercicios: ExercicioDaSessao[];
    diagnostico: DiagnosticoIA | null; // o mais novo da sessao (D14)
}
