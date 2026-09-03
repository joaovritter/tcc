
const API_URL = 'http://localhost:3000';

//Estende as opções de configurações padrão do fetch (method, headers, etc.)
//e flexibiliza o 'body' para aceitar objetos JS antes da conversão para JSON.
interface OpcoesFetch extends RequestInit {
    body?: any;
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
    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(dados.erro ?? 'Erro na requisição');
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
    id_exercicio: string;
    nome_exercicio: string;
    fk_grupamento: string;
    nome_grupamento: string;
}

export interface ExercicioDoDia {
    id_divisao_exercicio: string;
    fk_exercicio: string;
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

export function salvarExerciciosDivisao(idDivisao: string, exercicios: { fk_exercicio: string }[]) {
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
