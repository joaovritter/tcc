const API_URL = 'http://localhost:3000';

//Estende as opções de configurações padrão do fetch (method, headers, etc.)
//e flexibiliza o 'body' para aceitar objetos JS antes da conversão para JSON.
interface OpcoesFetch extends RequestInit {
    body?: any;
}

//evita erros tipo: mensagem.includes('já foi finalizado'), se mudar a mensagem no backend, a tela quebra.
export class ApiErro extends Error {
    status: number;

    constructor(mensagem: string, status: number) {
        super(mensagem);
        this.status = status;
    }
}

//funcao que monta url, injeta o token quando existe, e transforma resposta de erro numa exceção
// ...(spread) tira a embalagem de objeto ou lista e despeja só o conteudo.
async function apiFetch(caminho: string, opcoes: OpcoesFetch = {}) {
    const token = localStorage.getItem('token');

    //junta url, injeta cabeçalho de autorizacao e converte o corpo da requisicao
    const resposta = await fetch(`${API_URL}${caminho}`, {
        ...opcoes, //repassa qualquer propriedade recebida em opcoes
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...opcoes.headers,
        },
        body: opcoes.body ? JSON.stringify(opcoes.body) : undefined,
    })

    const dados = resposta.status === 204 ? null : await resposta.json();
    if (!resposta.ok) {
        throw new ApiErro(dados?.erro ?? 'Erro na requisição', resposta.status);
    }

    return dados;
}

//============================usuario===================================

export interface Usuario {
    id_usuario: string;
    nome: string;
    email: string;
}

//funcao de registrar 
export function registrar(nome: string, email: string, senha: string) {
    return apiFetch('/auth/register', {
        method: 'POST',
        body: { nome, email, senha },
    }) as Promise<{ usuario: Usuario }>;
}

//funcao de login
export function login(email: string, senha: string) {
    return apiFetch('/auth/login', {
        method: 'POST',
        body: { email, senha },
    }) as Promise<{ token: string; usuario: Usuario }>;
}

//funcao de /me, traz informacoes do usuario
export function buscarPerfil() {
    return apiFetch('/me') as Promise<{ usuario: Usuario }>;
}


//============================divisao===================================

export interface Divisao {
    id_divisao: string;
    dia_semana: number;
    nome: string;
}

export function buscarDivisoes() {
    return apiFetch('/divisions') as Promise<{ divisoes: Divisao[] }>
}

export function salvarDivisoes(divisoes: { dia_semana: number; nome: string }[]) {
    return apiFetch('/divisions', {
        method: 'PUT',
        body: { divisoes },
    }) as Promise<{ divisoes: Divisao[] }>;
}


//============================exercicio===================================

export interface Exercicio {
    id_exercicio: number;
    nome_exercicio: string;
    fk_grupamento: number;
    nome_grupamento: string;
}

export interface ExercicioDoDia {
    id_divisao_exercicio: number;
    fk_exercicio: number;
    ordem: number;
    nome_exercicio: string;
    nome_grupamento: string;
}

export function buscarExercicios(fkGrupamento?: number) {
    const query = fkGrupamento ? `?grupamento=${fkGrupamento}` : '';
    return apiFetch(`/exercises${query}`) as Promise<{ exercicios: Exercicio[] }>;
}

export function buscarExerciciosDivisao(idDivisao: string) {
    return apiFetch(`/divisions/${idDivisao}/exercises`) as Promise<{
        exercicios: ExercicioDoDia[]
    }>;
}

export function salvarExerciciosDivisao(idDivisao: string, exercicios: { fk_exercicio: number }[]) {
    return apiFetch(`/divisions/${idDivisao}/exercises`, {
        method: 'PUT',
        body: { exercicios },
    }) as Promise<{ exercicios: ExercicioDoDia[] }>;

}

export function buscarResumoMusculos() {
    return apiFetch('/divisions/muscle-summary') as Promise<{
        resumo: { dia_semana: number; grupamentos: string[] }[];
    }>;
}


//============================treino===================================

export type TipoSerie = 'aquecimento' | 'feeder' | 'work';

export interface Treino {
    id_treino: string;
    fk_divisao: string | null;
    completed: boolean;
    data: string;
    duracao_total: number | null; //minutos, calculados pelo backend ao finalizar (D12)
}

export interface Serie {
    id_serie: number;
    fk_exercicio: number;
    tipo: TipoSerie;
    carga: string; //numeric do postgres chega como string
    repeticoes: number;
    rpe: number | null;
    rir: number | null;
    nome_exercicio: string;
}

export interface TreinoDeHoje {
    dia_semana: number;
    divisaoHoje: Divisao | null; //o backend devolve a chave com esse nome (Reparo 5)
    treino: Treino | null;
    exercicios: ExercicioDoDia[];
    series: Serie[];
}

export function buscarTreinoDeHoje() {
    return apiFetch('/sessions/today') as Promise<{ hoje: TreinoDeHoje }>;
}

export function comecarTreino() {
    return apiFetch('/sessions/start', { method: 'POST' }) as Promise<{ treino: Treino }>;
}

export function registrarSerie(
    idTreino: string,
    serie: {
        fk_exercicio: number;
        tipo: TipoSerie;
        carga: number;
        repeticoes: number;
        // manda SÓ UM dos dois em série válida. se for aquecimento/feeder, manda nenhum dos dois.
        rir?: number | null;
        rpe?: number | null;
    }
) {
    return apiFetch(`/sessions/${idTreino}/sets`, {
        method: 'POST',
        body: serie,
    }) as Promise<{ serie: Serie }>;
}


export function apagarSerie(idTreino: string, idSerie: number) {
    return apiFetch(`/sessions/${idTreino}/sets/${idSerie}`, {
        method: 'DELETE'
    });
}

//S6 - fecha o treino do dia. sem corpo: a duracao e calculada pelo backend (D12)
export function finalizarTreino(idTreino: string) {
    return apiFetch(`/sessions/${idTreino}/finish`, {
        method: 'POST',
    }) as Promise<{ treino: Treino }>;
}




//============================metricas (RF04)===========================
//espelho dos tipos do backend
export interface VolumeGrupamento {
    id_grupamento: number;
    nome_grupamento: string;
    series_validas: number;
    atingiu_limiar: boolean; //vem pronto do backend - a tela NAO refaz essa conta (RNF03)
}

export interface VolumeSemanal {
    semana_referencia: string; //'YYYY-MM-DD' da segunda-feira (D10)
    limiar: number; //10 series [Schoenfeld]
    grupamentos: VolumeGrupamento[];
}

export function buscarVolumeSemanal() {
    return apiFetch('/metrics/weekly-volume') as Promise<{ volume: VolumeSemanal }>;
}




//============================diagnostico (RF05/RF06)===========================

export interface DiagnosticoConteudo {
    diagnostico_exercicios: { nome_exercicio: string; comentario: string }[];
    analise_grupamentos: { nome_grupamento: string; comentario: string }[];
    recomendacoes_proxima_sessao: string[];
    score_detalhe: { pv: number; pi: number }; //sub-notas do scoreService (D13), nao da IA
}

export interface DiagnosticoIA {
    id_diagnostico: string;
    fk_treino: string;
    score_geral: number; //0-100, calculado no backend - a tela so desenha
    data_geracao: string;
    conteudo_json: DiagnosticoConteudo;
}

export interface DiagnosticoComTreino extends DiagnosticoIA {
    data_treino: string; //quando a pessoa treinou (JOIN Treino)
}

//so funciona com treino finalizado - aberto volta 409
export function gerarDiagnostico(idTreino: string) {
    return apiFetch(`/sessions/${idTreino}/diagnostics/generate`, {
        method: 'POST',
    }) as Promise<{ diagnostico: DiagnosticoIA }>;
}

export function buscarDiagnosticoAtual() {
    return apiFetch('/diagnostics/latest') as Promise<{ diagnostico: DiagnosticoComTreino }>;
}





//============================historico (RF07)===========================

export interface SessaoHistorico {
    id_treino: string;
    data: string; //timestamp com Z - so pra mostrar a hora
    dia: string; //'YYYY-MM-DD' do banco - posiciona no calendario (nunca new Date nele)
    duracao_total: number | null;
    nome_divisao: string | null;
    series_validas: number;
    id_diagnostico: string | null; //o mais recente da sessao
    score_geral: number | null;
}

export interface SessoesDoMes {
    primeira_sessao: string | null; //'YYYY-MM-DD' do primeiro treino finalizado
    sessoes: SessaoHistorico[];
}

export interface ExercicioTreinado {
    id_exercicio: number;
    nome_exercicio: string;
    nome_grupamento: string;
}

//D17: mesmos numeros no grafico e no detalhe
export interface ResumoSeriesValidas {
    series_validas: number;
    carga_maxima: number;
    reps_carga_maxima: number;
    tonelagem: number; //soma de carga x reps - nao e "volume" (volume = series/semana)
}

export interface PontoProgressaoCarga extends ResumoSeriesValidas {
    id_treino: string;
    data: string;
}

export interface SerieDaSessao {
    id_serie: number;
    tipo: TipoSerie;
    carga: number;
    repeticoes: number;
    rir: number | null;
}

export interface ExercicioDaSessao {
    id_exercicio: number;
    nome_exercicio: string;
    nome_grupamento: string;
    resumo: ResumoSeriesValidas | null; //null = so preparacao
    series: SerieDaSessao[];
}

export interface DetalheSessao {
    sessao: SessaoHistorico;
    exercicios: ExercicioDaSessao[];
    diagnostico: DiagnosticoIA | null;
}

//mes = 'AAAA-MM'
export function buscarSessoesDoMes(mes: string) {
    return apiFetch(`/history/sessions?mes=${mes}`) as Promise<SessoesDoMes>;
}

export function buscarDetalheSessao(idTreino: string) {
    return apiFetch(`/history/sessions/${idTreino}`) as Promise<DetalheSessao>;
}

export function buscarExerciciosTreinados() {
    return apiFetch('/history/exercises') as Promise<{ exercicios: ExercicioTreinado[] }>;
}

export function buscarProgressaoCarga(idExercicio: number) {
    return apiFetch(`/history/exercises/${idExercicio}/load-progression`) as Promise<{
        progressao: PontoProgressaoCarga[];
    }>;
}

//cada item tem o mesmo formato do GET /metrics/weekly-volume
export function buscarHistoricoVolume(semanas?: number) {
    const query = semanas ? `?semanas=${semanas}` : '';
    return apiFetch(`/history/weekly-volume${query}`) as Promise<{ historico: VolumeSemanal[] }>;
}