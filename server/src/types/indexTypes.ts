
export interface Usuario {
    id_usuario: string; //driver do pg sempre devolve UUID como string
    nome: string;
    email: string;
    senha_hash: string;
}

export interface UsuarioPublico{
    id_usuario: string;
    nome: string;
    email: string;
}

// Tipo de retorno do jwt.verify(), por padrão não tem formato definido
// Evita usar "any", garante que o TS reconheça "id"
export interface TokenPayload {
    id: string;
}

export interface Divisao {
    id_divisao: string;
    fk_usuario: string;
    dia_semana: number;
    nome: string;
}

//formato que o front manda no put não tem id_divisao nem fk_usuario. esse tipo evita aceitar um payload que escreve divisao de outro usuario
export interface DivisaoInput{
    dia_semana: string;
    nome: string;
}


export interface Exercicio {
    id_exercicio: string;
    nome_exercicio: string;
    fk_grupamento: string;
}


