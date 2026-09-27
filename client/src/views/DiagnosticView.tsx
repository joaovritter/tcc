import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import * as api from '../services/api';
import { FeedbackAlert } from '../components/FeedbackAlert';
import { DiagnosticContent } from '../components/DiagnosticContent';

//timestamp do banco chega em UTC (…Z): new Date converte pro fuso local
function formatarDataHora(timestamp: string) {
  return new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DiagnosticView() {
  const [diagnostico, setDiagnostico] = useState<api.DiagnosticoComTreino | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        const { diagnostico } = await api.buscarDiagnosticoAtual();
        setDiagnostico(diagnostico);
      } catch (erro) {
        //404 = nenhum diagnostico gerado ainda: estado vazio, nao falha
        if (!(erro instanceof api.ApiErro && erro.status === 404)) {
          setErro(erro instanceof Error ? erro.message : 'Erro ao carregar o diagnóstico');
        }
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  if (carregando) {
    return <Typography>Carregando...</Typography>;
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h2" gutterBottom>
          Diagnóstico da Sessão
        </Typography>

        <FeedbackAlert erro={erro} />

        {!diagnostico && !erro && (
          <Typography color="text.secondary">
            Nenhum diagnóstico ainda. Em "Treino de hoje", toque em "Finalizar e
            avaliar treino" no fim da sessão.
          </Typography>
        )}

        {diagnostico && (
          <>
            <Typography color="text.secondary" gutterBottom>
              Sessão de {formatarDataHora(diagnostico.data_treino)} · gerado em{' '}
              {formatarDataHora(diagnostico.data_geracao)}
            </Typography>
            <Box sx={{ mt: 3 }}>
              <DiagnosticContent diagnostico={diagnostico} />
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}