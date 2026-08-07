import { pool } from './config/db';

type GrupoChave = 'peito' | 'costas' | 'ombros' | 'biceps' | 'triceps' | 'pernas' | 'abdomen';

const gruposMusculares: { chave: GrupoChave; nome: string }[] = [
  { chave: 'peito', nome: 'Peito' },
  { chave: 'costas', nome: 'Costas' },
  { chave: 'ombros', nome: 'Ombros' },
  { chave: 'biceps', nome: 'Bíceps' },
  { chave: 'triceps', nome: 'Tríceps' },
  { chave: 'pernas', nome: 'Pernas' },
  { chave: 'abdomen', nome: 'Abdômen' },
];


const exercicios: { nome: string; grupo: GrupoChave }[] = [
  // --- PEITORAL ---
  { nome: 'Supino Reto com Barra', grupo: 'peito' },
  { nome: 'Supino Reto com Halteres', grupo: 'peito' },
  { nome: 'Supino Reto na Máquina', grupo: 'peito' },
  { nome: 'Supino Inclinado com Barra', grupo: 'peito' },
  { nome: 'Supino Inclinado com Halteres', grupo: 'peito' },
  { nome: 'Supino Inclinado na Máquina', grupo: 'peito' },
  { nome: 'Supino Declinado com Barra', grupo: 'peito' },
  { nome: 'Supino Declinado com Halteres', grupo: 'peito' },
  { nome: 'Crucifixo Reto com Halteres', grupo: 'peito' },
  { nome: 'Crucifixo na Polia (Crossover Alto)', grupo: 'peito' },
  { nome: 'Crucifixo na Polia (Crossover Médio)', grupo: 'peito' },
  { nome: 'Crucifixo na Polia (Crossover Baixo)', grupo: 'peito' },
  { nome: 'Voador (Peck Deck)', grupo: 'peito' },
  { nome: 'Paralelas para Peito', grupo: 'peito' },
  { nome: 'Flexão de Braços', grupo: 'peito' },

  // --- COSTAS ---
  { nome: 'Puxada Aberta na Polia', grupo: 'costas' },
  { nome: 'Puxada Fechada (Triângulo)', grupo: 'costas' },
  { nome: 'Puxada Articulada', grupo: 'costas' },
  { nome: 'Barra Fixa (Pronada)', grupo: 'costas' },
  { nome: 'Barra Fixa (Supinada)', grupo: 'costas' },
  { nome: 'Remada Curvada com Barra', grupo: 'costas' },
  { nome: 'Remada Curvada com Halteres', grupo: 'costas' },
  { nome: 'Remada Unilateral (Serrote)', grupo: 'costas' },
  { nome: 'Remada Cavalinho (T-Bar)', grupo: 'costas' },
  { nome: 'Remada Baixa Sentado', grupo: 'costas' },
  { nome: 'Remada na Máquina', grupo: 'costas' },
  { nome: 'Pulldown com Corda', grupo: 'costas' },
  { nome: 'Levantamento Terra', grupo: 'costas' },
  { nome: 'Extensão Lombar (Hiperestensão)', grupo: 'costas' },

  // --- OMBROS ---
  { nome: 'Desenvolvimento Militar com Barra', grupo: 'ombros' },
  { nome: 'Desenvolvimento com Halteres', grupo: 'ombros' },
  { nome: 'Desenvolvimento Arnold', grupo: 'ombros' },
  { nome: 'Desenvolvimento na Máquina', grupo: 'ombros' },
  { nome: 'Elevação Lateral com Halteres', grupo: 'ombros' },
  { nome: 'Elevação Lateral na Polia', grupo: 'ombros' },
  { nome: 'Elevação Lateral na Máquina', grupo: 'ombros' },
  { nome: 'Elevação Frontal com Halteres', grupo: 'ombros' },
  { nome: 'Elevação Frontal com Barra', grupo: 'ombros' },
  { nome: 'Crucifixo Inverso com Halteres', grupo: 'ombros' },
  { nome: 'Crucifixo Inverso na Polia', grupo: 'ombros' },
  { nome: 'Crucifixo Inverso na Máquina (Peck Deck Inverso)', grupo: 'ombros' },
  { nome: 'Face Pull', grupo: 'ombros' },
  { nome: 'Encolhimento de Ombros', grupo: 'ombros' },

  // --- PERNAS ---
  { nome: 'Agachamento Livre com Barra', grupo: 'pernas' },
  { nome: 'Agachamento Sumô com Halter', grupo: 'pernas' },
  { nome: 'Agachamento no Smith', grupo: 'pernas' },
  { nome: 'Leg Press 45', grupo: 'pernas' },
  { nome: 'Leg Press Horizontal', grupo: 'pernas' },
  { nome: 'Hack Squat', grupo: 'pernas' },
  { nome: 'Cadeira Extensora', grupo: 'pernas' },
  { nome: 'Mesa Flexora (Deitada)', grupo: 'pernas' },
  { nome: 'Cadeira Flexora (Sentada)', grupo: 'pernas' },
  { nome: 'Stiff com Barra', grupo: 'pernas' },
  { nome: 'Romanian Deadlift (RDL)', grupo: 'pernas' },
  { nome: 'Agachamento Búlgaro', grupo: 'pernas' },
  { nome: 'Passada (Lunges) com Barra', grupo: 'pernas' },
  { nome: 'Passada (Lunges) com Halteres', grupo: 'pernas' },
  { nome: 'Gêmeos Sentado', grupo: 'pernas' },
  { nome: 'Gêmeos em Pé', grupo: 'pernas' },
  { nome: 'Gêmeos no Leg Press', grupo: 'pernas' },
  { nome: 'Cadeira Adutora', grupo: 'pernas' },

  // --- BÍCEPS ---
  { nome: 'Rosca Direta com Barra W', grupo: 'biceps' },
  { nome: 'Rosca Direta com Halteres', grupo: 'biceps' },
  { nome: 'Rosca Martelo com Halteres', grupo: 'biceps' },
  { nome: 'Rosca Inclinada no Banco 45', grupo: 'biceps' },
  { nome: 'Rosca Scott (Barra W)', grupo: 'biceps' },
  { nome: 'Rosca Scott Unilateral', grupo: 'biceps' },
  { nome: 'Rosca Concentrada', grupo: 'biceps' },
  { nome: 'Rosca Direta na Polia', grupo: 'biceps' },
  { nome: 'Rosca Martelo com Corda', grupo: 'biceps' },
  { nome: 'Rosca Inversa', grupo: 'biceps' },

  // --- TRÍCEPS ---
  { nome: 'Tríceps Pulldown (Barra Reta)', grupo: 'triceps' },
  { nome: 'Tríceps Pulldown (Corda)', grupo: 'triceps' },
  { nome: 'Tríceps Testa com Barra W', grupo: 'triceps' },
  { nome: 'Tríceps Testa com Halteres', grupo: 'triceps' },
  { nome: 'Tríceps Francês com Halter', grupo: 'triceps' },
  { nome: 'Tríceps Francês na Polia', grupo: 'triceps' },
  { nome: 'Tríceps Coice com Halter', grupo: 'triceps' },
  { nome: 'Tríceps Coice na Polia', grupo: 'triceps' },
  { nome: 'Mergulho no Banco', grupo: 'triceps' },
  { nome: 'Supino Fechado', grupo: 'triceps' },

  // --- ABDÔMEN ---
  { nome: 'Abdominal na Polia Alta', grupo: 'abdomen' },
  { nome: 'Elevação de Pernas', grupo: 'abdomen' },
  { nome: 'Abdominal Supra (Crunch)', grupo: 'abdomen' },
  { nome: 'Prancha Isométrica', grupo: 'abdomen' },
  { nome: 'Abdominal com Roda', grupo: 'abdomen' },
];

async function runSeed() {
  console.log('Iniciando seed do banco de dados...');
  const client = await pool.connect(); //conexao para transação

  try {
    await client.query('BEGIN'); //só grava tudo se chegar inteiro no fim

    await client.query('TRUNCATE TABLE Exercicio, GrupamentoMuscular RESTART IDENTITY CASCADE'); //limpa antes de inserir

    console.log('Inserirndo grupamentos musculares...');
    const idPorGrupo = {} as Record<GrupoChave, number>;

    for (const g of gruposMusculares) {
      const res = await client.query<{ id_grupamento: number }>(
        'INSERT INTO GrupamentoMuscular (nome) VALUES ($1) RETURNING id_grupamento', [g.nome]
      );
      idPorGrupo[g.chave] = res.rows[0].id_grupamento; //guarda id gerado para usar nos exercicios
    }

    console.log(`Inserindo ${exercicios.length} exercicios...`);
    for (const ex of exercicios) {
      await client.query(
        'INSERT INTO Exercicio (nome_exercicio, fk_grupamento) VALUES ($1, $2)',
        [ex.nome, idPorGrupo[ex.grupo]] //resolve grupo -> id usando o mapa acima
      );
    }

    await client.query('COMMIT') //confirma inserção
    console.log('Seed finalizado com sucesso.');

  } catch (error) {
    await client.query('ROLLBACK'); //falhou, desfaz tudo, não fica meio populado
    console.error('Erro ao rodar seed: ', error);
    process.exitCode = 1;
  } finally {
    client.release(); //devolve conexão pro pool
    await pool.end(); //fecha o pool, para o processo não ficar pendurado
  }
}
runSeed();