import { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography, TextField, Button, Stack, Chip,
  IconButton, MenuItem, Divider, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../services/api';
import { FeedbackAlert } from '../components/FeedbackAlert';

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const TIPOS: { valor: api.TipoSerie; label: string }[] = [
  { valor: 'aquecimento', label: 'Aquecimento' },
  { valor: 'feeder', label: 'Feeder' },
  { valor: 'work', label: 'Válida' },
];

//preferencia de regua (RIR/RPE) guardada no localStorage - conveniencia de exibicao,
//nao configuracao de conta, entao nao vira coluna no banco
const CHAVE_MODO_NOTA = 'hypertrack:modo-nota';

function lerModoNotaSalvo(): 'rir' | 'rpe' {
  try {
    return localStorage.getItem(CHAVE_MODO_NOTA) === 'rpe' ? 'rpe' : 'rir';
  } catch {
    return 'rir'; //localStorage pode falhar (modo privado); segue com o padrao
  }
}

//campos ficam como string no estado: se fossem number, apagar o campo daria NaN e travaria o input.
//um so campo de nota (`nota`), interpretado como RIR ou RPE conforme o modoNota global
interface Rascunho {
  tipo: api.TipoSerie;
  carga: string;
  repeticoes: string;
  nota: string;
}

const RASCUNHO_VAZIO: Rascunho = {
  tipo: 'work',
  carga: '',
  repeticoes: '',
  nota: '',
};

export function TodaySessionView() {
  const [hoje, setHoje] = useState<api.TreinoDeHoje | null>(null);
  const [rascunhos, setRascunhos] = useState<Record<number, Rascunho>>({});
  const [modoNota, setModoNota] = useState<'rir' | 'rpe'>(lerModoNotaSalvo);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  async function recarregar() {
    const { hoje } = await api.buscarTreinoDeHoje();
    setHoje(hoje);
  }

  useEffect(() => {
    async function carregar() {
      try {
        await recarregar();
      } catch (erro) {
        setErro(erro instanceof Error ? erro.message : 'Erro ao carregar');
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  function trocarModoNota(novo: 'rir' | 'rpe') {
    setModoNota(novo);
    try {
      localStorage.setItem(CHAVE_MODO_NOTA, novo);
    } catch {
      //localStorage indisponivel nao trava a tela, so nao persiste a preferencia
    }
  }

  //um rascunho por exercicio: um formulario global perderia o que foi digitado ao trocar de exercicio
  function atualizarRascunho(fk: number, campo: keyof Rascunho, valor: string) {
    setRascunhos((atual) => {
      const novo = { ...RASCUNHO_VAZIO, ...atual[fk], [campo]: valor };
      //D9: trocar pra aquecimento/feeder limpa a nota - o campo some da tela, mas o
      //que ja foi digitado continuaria no estado e iria junto no POST, tomando 400
      if (campo === 'tipo' && valor !== 'work') {
        novo.nota = '';
      }
      return { ...atual, [fk]: novo };
    });
  }

  async function comecar() {
    setErro('');
    try {
      await api.comecarTreino();
      await recarregar();
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : 'Erro ao começar treino');
    }
  }

  //converte pra number so no envio; manda so o campo do modo escolhido, o outro fica null -
  //nunca Number('') = 0, que gravaria "RIR 0" sem a pessoa ter digitado nada
  async function registrar(fkExercicio: number) {
    if (!hoje?.treino) return;
    const rascunho = rascunhos[fkExercicio] ?? RASCUNHO_VAZIO;
    const ehValida = rascunho.tipo === 'work';
    setErro('');
    try {
      await api.registrarSerie(hoje.treino.id_treino, {
        fk_exercicio: fkExercicio,
        tipo: rascunho.tipo,
        carga: Number(rascunho.carga),
        repeticoes: Number(rascunho.repeticoes),
        rir: ehValida && modoNota === 'rir' ? Number(rascunho.nota) : null,
        rpe: ehValida && modoNota === 'rpe' ? Number(rascunho.nota) : null,
      });
      setRascunhos((atual) => ({ ...atual, [fkExercicio]: RASCUNHO_VAZIO }));
      await recarregar(); //a lista de series vem do banco, nao do estado local
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : 'Erro ao registrar série');
    }
  }

  async function remover(idSerie: number) {
    if (!hoje?.treino) return;
    setErro('');
    try {
      await api.apagarSerie(hoje.treino.id_treino, idSerie);
      await recarregar();
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : 'Erro ao apagar série');
    }
  }

  if (carregando) {
    return <Typography>Carregando...</Typography>;
  }

  if (!hoje?.divisaoHoje) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h2" gutterBottom>
            Treino de Hoje
          </Typography>
          <Typography color="text.secondary">
            {DIAS[hoje?.dia_semana ?? new Date().getDay()]} não tem divisão cadastrada — dia de descanso.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h2" gutterBottom>
          Treino de Hoje
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          {DIAS[hoje.dia_semana]} — {hoje.divisaoHoje.nome}
        </Typography>

        <FeedbackAlert erro={erro} />

        {!hoje.treino ? (
          <Button variant="contained" size="large" fullWidth onClick={comecar} sx={{ mt: 2 }}>
            Começar treino
          </Button>
        ) : (
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* toggle unico pra sessao inteira, nao por exercicio - reportar em regua
                diferente por serie nao faz sentido pro usuario (D9) */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Reportar esforço em:
              </Typography>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={modoNota}
                onChange={(_, novo) => novo && trocarModoNota(novo)}
              >
                <ToggleButton value="rir">RIR</ToggleButton>
                <ToggleButton value="rpe">RPE</ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            {hoje.exercicios.map((exercicio) => {
              const rascunho = rascunhos[exercicio.fk_exercicio] ?? RASCUNHO_VAZIO;
              const series = hoje.series.filter(
                (s) => s.fk_exercicio === exercicio.fk_exercicio
              );

              return (
                <Stack key={exercicio.id_divisao_exercicio} spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography sx={{ fontWeight: 700 }}>
                      {exercicio.ordem}. {exercicio.nome_exercicio}
                    </Typography>
                    <Chip label={exercicio.nome_grupamento} size="small" />
                  </Stack>

                  {series.map((serie) => (
                    <Stack
                      key={serie.id_serie}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Typography variant="body2" color="text.secondary">
                        {Number(serie.carga)} kg × {serie.repeticoes}
                        {serie.rpe != null ? ` · RPE ${serie.rpe}` : ''}
                        {serie.rir != null ? ` · RIR ${serie.rir}` : ''}
                        {serie.tipo !== 'work' ? ` · ${serie.tipo}` : ''}
                      </Typography>
                      <IconButton size="small" onClick={() => remover(serie.id_serie)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}

                  {/* uma coluna no celular, linha no desktop: nada de tabela larga com rolagem */}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      select
                      label="Tipo"
                      size="small"
                      value={rascunho.tipo}
                      onChange={(e) =>
                        atualizarRascunho(exercicio.fk_exercicio, 'tipo', e.target.value)
                      }
                      sx={{ minWidth: 130 }}
                    >
                      {TIPOS.map((t) => (
                        <MenuItem key={t.valor} value={t.valor}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </TextField>
                    {/* inputMode decimal/numeric abre o teclado numerico no celular (RNF01) */}
                    <TextField
                      label="Carga (kg)"
                      size="small"
                      inputMode="decimal"
                      value={rascunho.carga}
                      onChange={(e) =>
                        atualizarRascunho(exercicio.fk_exercicio, 'carga', e.target.value)
                      }
                    />
                    <TextField
                      label="Reps"
                      size="small"
                      inputMode="numeric"
                      value={rascunho.repeticoes}
                      onChange={(e) =>
                        atualizarRascunho(exercicio.fk_exercicio, 'repeticoes', e.target.value)
                      }
                    />
                    {/* D9: nota de esforco so existe em serie valida - fora do DOM,
                        nao apenas disabled (campo morto ocupa espaco na tela do celular).
                        UM SO campo - o rotulo troca conforme o toggle RIR/RPE do topo */}
                    {rascunho.tipo === 'work' && (
                      <TextField
                        label={modoNota === 'rir' ? 'RIR (reps na reserva)' : 'RPE (esforço 6–10)'}
                        size="small"
                        inputMode="numeric"
                        value={rascunho.nota}
                        onChange={(e) =>
                          atualizarRascunho(exercicio.fk_exercicio, 'nota', e.target.value)
                        }
                      />
                    )}
                  </Stack>

                  <Button
                    variant="contained"
                    onClick={() => registrar(exercicio.fk_exercicio)}
                    disabled={
                      !rascunho.carga ||
                      !rascunho.repeticoes ||
                      //serie valida so fecha com a nota preenchida (D9)
                      (rascunho.tipo === 'work' && !rascunho.nota)
                    }
                  >
                    Registrar série
                  </Button>

                  <Divider />
                </Stack>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
