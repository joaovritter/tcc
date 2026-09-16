import { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography, Stack, Chip, LinearProgress,
} from '@mui/material';
import * as api from '../services/api';
import { FeedbackAlert } from '../components/FeedbackAlert';


function formatarDia(iso: string) {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

export function WeeklyVolumeView() {
  const [volume, setVolume] = useState<api.VolumeSemanal | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        const { volume } = await api.buscarVolumeSemanal();
        setVolume(volume);
      } catch (erro) {
        setErro(erro instanceof Error ? erro.message : 'Erro ao carregar o volume');
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
          Volume da Semana
        </Typography>

        <FeedbackAlert erro={erro} />

        {volume && (
          <>
            <Typography color="text.secondary" gutterBottom>
              Semana de {formatarDia(volume.semana_referencia)} · séries válidas por
              grupamento · limiar de {volume.limiar} séries [Schoenfeld]
            </Typography>

            <Stack spacing={2.5} sx={{ mt: 3 }}>
              {volume.grupamentos.map((g) => (
                <Stack key={g.id_grupamento} spacing={0.75}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography sx={{ fontWeight: 600 }}>{g.nome_grupamento}</Typography>
                    <Chip
                      size="small"
                      //atingiu_limiar vem pronto do backend (RNF03) - a tela nao compara nada
                      color={g.atingiu_limiar ? 'success' : 'default'}
                      label={`${g.series_validas} / ${volume.limiar} séries`}
                    />
                  </Stack>

                  {/* a unica conta da tela e a LARGURA da barra: geometria de desenho,
                      nao a metrica. Math.min evita estourar 100% em quem passa do limiar */}
                  <LinearProgress
                    variant="determinate"
                    color={g.atingiu_limiar ? 'success' : 'primary'}
                    value={Math.min(100, (g.series_validas / volume.limiar) * 100)}
                    sx={{ height: 10, borderRadius: 999 }}
                  />

                  {/* o "faltam N" e subtracao de dois numeros que ja vieram do
                      backend, no mesmo nivel da largura da barra - a metrica e o
                      limiar continuam sendo decididos la (RNF03) */}
                  {!g.atingiu_limiar && (
                    <Typography variant="caption" color="text.secondary">
                      {g.series_validas === 0
                        ? 'Nenhuma série válida nesta semana'
                        : `Faltam ${volume.limiar - g.series_validas} séries para o limiar`}
                    </Typography>
                  )}
                </Stack>
              ))}
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
}