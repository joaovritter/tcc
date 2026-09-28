import { useEffect, useState } from 'react';
import {
  Box, Button, Card, CardContent, Chip, IconButton, Stack, Table, TableBody,
  TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InsightsIcon from '@mui/icons-material/Insights';
import * as api from '../services/api';
import { FeedbackAlert } from './FeedbackAlert';
import { DiagnosticContent } from './DiagnosticContent';

//detalhe de UMA sessao finalizada: os registros (treino) e embaixo a avaliacao da IA.
//abre ao tocar no treino do dia no calendario

//72.5 -> "72,5"; 1980 -> "1.980"
function formatarNumero(valor: number) {
  return valor.toLocaleString('pt-BR');
}

//timestamp do Treino (UTC, com Z): new Date converte pro fuso local
function formatarDataHora(timestamp: string) {
  return new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ROTULO_TIPO: Record<api.TipoSerie, string> = {
  aquecimento: 'Aquecimento',
  feeder: 'Feeder',
  work: 'Válida',
};

function TabelaSeries({
  titulo,
  series,
  variante,
}: {
  titulo: string;
  series: api.SerieDaSessao[];
  variante: 'validas' | 'preparacao';
}) {
  return (
    <Box>
      <Typography
        variant="overline"
        sx={{ fontWeight: 700, color: variante === 'validas' ? 'primary.main' : 'text.secondary' }}
      >
        {titulo}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Carga</TableCell>
            <TableCell>Reps</TableCell>
            <TableCell>{variante === 'validas' ? 'RIR' : 'Tipo'}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {series.map((s, i) => (
            <TableRow key={s.id_serie}>
              <TableCell>{i + 1}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{formatarNumero(s.carga)} kg</TableCell>
              <TableCell>{s.repeticoes}</TableCell>
              <TableCell>{variante === 'validas' ? s.rir : ROTULO_TIPO[s.tipo]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

function CardExercicio({ exercicio }: { exercicio: api.ExercicioDaSessao }) {
  const { resumo, series } = exercicio;
  //separar por tipo e so apresentacao: o que e "valida" o backend ja decidiu,
  //e o resumo chegou pronto (RNF03) - a tela nao soma nada
  const validas = series.filter((s) => s.tipo === 'work');
  const preparacao = series.filter((s) => s.tipo !== 'work');

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Typography sx={{ fontWeight: 700 }}>{exercicio.nome_exercicio}</Typography>
            <Chip size="small" variant="outlined" label={exercicio.nome_grupamento} />
          </Stack>

          <Typography variant="body2" color="text.secondary">
            {resumo
              ? `${resumo.series_validas} séries válidas · Mais pesada: ${formatarNumero(resumo.carga_maxima)} kg × ${resumo.reps_carga_maxima} · Tonelagem: ${formatarNumero(resumo.tonelagem)} kg`
              : 'Só preparação — nenhuma série válida'}
          </Typography>

          {validas.length > 0 && <TabelaSeries titulo="Séries válidas" series={validas} variante="validas" />}
          {preparacao.length > 0 && <TabelaSeries titulo="Preparação" series={preparacao} variante="preparacao" />}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function SessionDetail({ idTreino, onVoltar }: { idTreino: string; onVoltar: () => void }) {
  const [detalhe, setDetalhe] = useState<api.DetalheSessao | null>(null);
  const [versao, setVersao] = useState(0); //somar 1 recarrega o detalhe
  const [avaliando, setAvaliando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    //voltar e abrir outra sessao rapido: a resposta atrasada da anterior nao sobrescreve
    let ativo = true;

    async function carregar() {
      try {
        const resposta = await api.buscarDetalheSessao(idTreino);
        if (ativo) setDetalhe(resposta);
      } catch (erro) {
        if (ativo) setErro(erro instanceof Error ? erro.message : 'Erro ao carregar a sessão');
      }
    }
    carregar();
    return () => {
      ativo = false;
    };
  }, [idTreino, versao]);

  //sessao que ficou sem diagnostico (saiu da tela antes, ou 502)
  async function avaliar() {
    setErro('');
    setAvaliando(true);
    try {
      await api.gerarDiagnostico(idTreino);
      setVersao((v) => v + 1); //recarrega, agora com o diagnostico
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : 'Erro ao avaliar o treino');
    } finally {
      setAvaliando(false);
    }
  }

  const voltar = (
    <IconButton onClick={onVoltar} aria-label="Voltar ao calendário" edge="start">
      <ArrowBackIcon />
    </IconButton>
  );

  if (!detalhe) {
    return (
      <Stack spacing={2}>
        {voltar}
        {erro ? <FeedbackAlert erro={erro} /> : <Typography>Carregando...</Typography>}
      </Stack>
    );
  }

  const { sessao, exercicios, diagnostico } = detalhe;

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} alignItems="center">
        {voltar}
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontFamily: '"Sora", sans-serif', fontWeight: 700, fontSize: '1.2rem' }}>
            {sessao.nome_divisao ?? 'Sem divisão'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatarDataHora(sessao.data)}
            {sessao.duracao_total !== null ? ` · ${sessao.duracao_total} min` : ''}
          </Typography>
        </Box>
      </Stack>

      {/* 1) os registros: o que foi feito */}
      <Stack spacing={1.5}>
        <Typography sx={{ fontWeight: 700 }}>Exercícios</Typography>
        {exercicios.length === 0 ? (
          <Typography color="text.secondary">Nenhuma série registrada nesta sessão.</Typography>
        ) : (
          exercicios.map((e) => <CardExercicio key={e.id_exercicio} exercicio={e} />)
        )}
      </Stack>

      {/* 2) embaixo, a avaliacao da IA */}
      <Stack spacing={1.5}>
        <Typography sx={{ fontWeight: 700 }}>Avaliação da IA</Typography>
        <FeedbackAlert erro={erro} />

        {diagnostico ? (
          <DiagnosticContent diagnostico={diagnostico} />
        ) : sessao.series_validas > 0 ? (
          <Button
            variant="contained"
            startIcon={<InsightsIcon />}
            onClick={avaliar}
            disabled={avaliando}
            sx={{ alignSelf: 'flex-start' }}
          >
            {avaliando ? 'Analisando a sessão…' : 'Avaliar treino'}
          </Button>
        ) : (
          //sem serie valida a IA nao avalia - nem oferece o botao
          <Typography color="text.secondary">
            Treino salvo sem séries válidas, então não há o que avaliar.
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}