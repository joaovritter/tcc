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
    repeticoes: number;
    rpe: number | null;
    rir: number | null;
}

export interface SerieTreinoInput {
    fk_exercicio: number;
    tipo: TipoSerie;
    carga: number;
    repeticoes: number;
    rpe?: number | null;
    rir?: number | null;

}