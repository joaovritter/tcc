CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE Usuario (
  id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL
);

CREATE TABLE GrupamentoMuscular (
  id_grupamento SERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE
);

CREATE TABLE Exercicio (
  id_exercicio SERIAL PRIMARY KEY,
  nome_exercicio TEXT NOT NULL,
  fk_grupamento INTEGER NOT NULL REFERENCES GrupamentoMuscular(id_grupamento)
);

CREATE TABLE Divisao (
  id_divisao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fk_usuario UUID NOT NULL REFERENCES Usuario(id_usuario),
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  nome TEXT NOT NULL
);

CREATE TABLE DivisaoExercicio (
  id_divisao_exercicio SERIAL PRIMARY KEY,
  fk_divisao UUID NOT NULL REFERENCES Divisao(id_divisao),
  fk_exercicio INTEGER NOT NULL REFERENCES Exercicio(id_exercicio),
  ordem INTEGER NOT NULL
);

CREATE TABLE Treino (
  id_treino UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fk_usuario UUID NOT NULL REFERENCES Usuario(id_usuario),
  fk_divisao UUID REFERENCES Divisao(id_divisao),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  data TIMESTAMP DEFAULT NOW(),
  duracao_total INTEGER
);

CREATE TABLE SerieTreino (
  id_serie SERIAL PRIMARY KEY,
  fk_treino UUID NOT NULL REFERENCES Treino(id_treino),
  fk_exercicio INTEGER NOT NULL REFERENCES Exercicio(id_exercicio),
  tipo TEXT NOT NULL CHECK (tipo IN ('aquecimento','feeder', 'work')),
  carga NUMERIC NOT NULL,
  repeticoes INTEGER NOT NULL,
  rpe INTEGER CHECK (rpe BETWEEN 6 AND 10),
  rir INTEGER CHECK (rir BETWEEN 0 AND 5)
);

CREATE TABLE DiagnosticoIA (
  id_diagnostico UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fk_usuario UUID NOT NULL REFERENCES Usuario(id_usuario),
  score_geral INT NOT NULL,
  semana_referencia DATE NOT NULL,
  data_geracao TIMESTAMP DEFAULT NOW(),
  conteudo_json JSONB NOT NULL
);