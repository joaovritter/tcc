
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
            ...(token ? {Authorization: `Bearer ${token}`} : {} ),
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

export interface Usuario {
    id_usuario: string;
    nome: string;
    email: string;
}

//funcao de registrar 
export function registrar (nome: string, email: string, senha: string){
    return apiFetch('/auth/register', {
        method: 'POST',
        body: {nome, email, senha},
    }) as Promise <{usuario: Usuario}>;
}

//funcao de login
export function login (email: string, senha: string){
    return apiFetch('/auth/login', {
        method: 'POST',
        body: {email, senha},
    }) as Promise <{token: string; usuario: Usuario}>;
}

//funcao de /me, traz informacoes do usuario
export function buscarPerfil(){
    return apiFetch('/me') as Promise<{usuario: Usuario}>;
}