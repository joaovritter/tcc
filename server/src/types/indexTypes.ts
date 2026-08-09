
export interface Usuario {
    id_usuario: string; //driver do pg sempre devolve UUID como string
    nome: string;
    email: string;
    senhaHash: string;
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