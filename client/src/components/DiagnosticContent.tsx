import type { ReactNode } from 'react';
import { Box, Stack, Typography, Chip, CircularProgress } from '@mui/material';
import type { DiagnosticoIA } from '../services/api';

//mostra UM diagnostico: score em circulo + sub-notas + o texto da IA.
//usado na DiagnosticView e na aba Sessoes do historico


//faixa de cor e so apresentacao: o score ja chegou pronto do backend.
//exportada: o calendario do historico usa a mesma faixa no ponto do dia
export function corDoScore(score: number): 'success' | 'warning' | 'error' {
  if (score >= 70) return 'success';
  if (score >= 40) return 'warning';
  return 'error';
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Stack spacing={1}>
      <Typography sx={{ fontWeight: 700 }}>{titulo}</Typography>
      {children}
    </Stack>
  );
}

export function DiagnosticContent({ diagnostico }: { diagnostico: DiagnosticoIA }) {
  const { score_geral, conteudo_json: conteudo } = diagnostico;

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3} alignItems="center">
        <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
          {/* trilho cinza de fundo + arco colorido por cima */}
          <CircularProgress
            variant="determinate"
            value={100}
            size={112}
            thickness={5}
            sx={{ color: 'action.hover' }}
          />
          <CircularProgress
            variant="determinate"
            value={score_geral}
            size={112}
            thickness={5}
            color={corDoScore(score_geral)}
            sx={{ position: 'absolute', left: 0 }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ fontFamily: '"Sora", sans-serif', fontSize: 30, fontWeight: 700, lineHeight: 1 }}>
              {score_geral}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              de 100
            </Typography>
          </Box>
        </Box>

        <Stack spacing={1}>
          <Chip size="small" variant="outlined" label={`Volume (Pv): ${Math.round(conteudo.score_detalhe.pv)}`} />
          <Chip size="small" variant="outlined" label={`Intensidade (Pi): ${Math.round(conteudo.score_detalhe.pi)}`} />
        </Stack>
      </Stack>

      <Secao titulo="Por grupamento">
        {conteudo.analise_grupamentos.map((a) => (
          <Typography key={a.nome_grupamento} variant="body2">
            <strong>{a.nome_grupamento}:</strong> {a.comentario}
          </Typography>
        ))}
      </Secao>

      <Secao titulo="Por exercício">
        {/* index na key: o mesmo exercicio pode ter mais de um comentario */}
        {conteudo.diagnostico_exercicios.map((d, i) => (
          <Typography key={`${d.nome_exercicio}-${i}`} variant="body2">
            <strong>{d.nome_exercicio}:</strong> {d.comentario}
          </Typography>
        ))}
      </Secao>

      <Secao titulo="Recomendações para a próxima sessão">
        <Box component="ol" sx={{ pl: 2.5, m: 0 }}>
          {conteudo.recomendacoes_proxima_sessao.map((r, i) => (
            <Typography component="li" key={i} variant="body2" sx={{ mb: 0.5 }}>
              {r}
            </Typography>
          ))}
        </Box>
      </Secao>
    </Stack>
  );
}