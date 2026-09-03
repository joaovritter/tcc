import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem,
  ListItemText, IconButton, MenuItem, TextField, Stack, Chip, Typography,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../services/api';
import { FeedbackAlert } from './FeedbackAlert';

interface Props {
  idDivisao: string;
  nomeDia: string;
  aberto: boolean;
  onFechar: () => void;
}

export function DayExercisesDialog({ idDivisao, nomeDia, aberto, onFechar }: Props) {
  const [catalogo, setCatalogo] = useState<api.Exercicio[]>([]);
  const [selecionados, setSelecionados] = useState<api.Exercicio[]>([]);
  const [paraAdicionar, setParaAdicionar] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState('');
  const [grupamentoFiltro, setGrupamentoFiltro] = useState<string | null>(null);

  const grupamentos = Array.from(new Set(catalogo.map((e) => e.nome_grupamento))).sort();

  const catalogoFiltrado = catalogo.filter((e) => {
    const bateBusca = e.nome_exercicio.toLowerCase().includes(busca.toLowerCase());
    const bateGrupamento = !grupamentoFiltro || e.nome_grupamento === grupamentoFiltro;
    return bateBusca && bateGrupamento;
  });

  function alternarGrupamento(nome: string) {
    setGrupamentoFiltro((atual) => (atual === nome ? null : nome));
  }

  useEffect(() => {
    if (!aberto) return;
    async function carregar() {
      try {
        const [{ exercicios: todos }, { exercicios: doDia }] = await Promise.all([
          api.buscarExercicios(),
          api.buscarExerciciosDivisao(idDivisao),
        ]);
        setCatalogo(todos);
        setSelecionados(
          doDia.map((d) => todos.find((e) => e.id_exercicio === d.fk_exercicio)!)
        );
      } catch (erro) {
        setErro(erro instanceof Error ? erro.message : 'Erro ao carregar');
      }
    }
    carregar();
  }, [aberto, idDivisao]);

  function adicionar() {
    const exercicio = catalogo.find((e) => String(e.id_exercicio) === String(paraAdicionar));
    if (!exercicio) return;
    setSelecionados([...selecionados, exercicio]);
    setParaAdicionar('');
  }

  function remover(index: number) {
    setSelecionados(selecionados.filter((_, i) => i !== index));
  }

  function mover(index: number, direcao: -1 | 1) {
    const alvo = index + direcao;
    if (alvo < 0 || alvo >= selecionados.length) return;
    const nova = [...selecionados];
    [nova[index], nova[alvo]] = [nova[alvo], nova[index]];
    setSelecionados(nova);
  }

  async function salvar() {
    setSalvando(true);
    setErro('');
    try {
      await api.salvarExerciciosDivisao(
        idDivisao,
        selecionados.map((e) => ({ fk_exercicio: e.id_exercicio }))
      );
      onFechar();
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={aberto} onClose={onFechar} fullWidth maxWidth="sm">
      <DialogTitle>Exercícios — {nomeDia}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <TextField
            label="Buscar exercício"
            placeholder="Ex.: Supino"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            fullWidth
            size="small"
          />

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {grupamentos.map((grupamento) => (
              <Chip
                key={grupamento}
                label={grupamento}
                color={grupamentoFiltro === grupamento ? 'primary' : 'default'}
                onClick={() => alternarGrupamento(grupamento)}
              />
            ))}
          </Stack>

          <Stack direction="row" spacing={1}>
            <TextField
              select
              label="Adicionar exercício"
              value={paraAdicionar}
              onChange={(e) => setParaAdicionar(e.target.value)}
              fullWidth
            >
              {catalogoFiltrado.map((e) => (
                <MenuItem key={e.id_exercicio} value={e.id_exercicio}>
                  {e.nome_exercicio} ({e.nome_grupamento})
                </MenuItem>
              ))}
            </TextField>
            <Button onClick={adicionar} disabled={!paraAdicionar}>
              Adicionar
            </Button>
          </Stack>

          <Typography variant="subtitle2">
            Exercícios selecionados ({selecionados.length})
          </Typography>

          <List>
            {selecionados.map((exercicio, i) => (
              <ListItem
                key={`${exercicio.id_exercicio}-${i}`}
                secondaryAction={
                  <>
                    <IconButton onClick={() => mover(i, -1)} disabled={i === 0}>
                      <ArrowUpwardIcon />
                    </IconButton>
                    <IconButton onClick={() => mover(i, 1)} disabled={i === selecionados.length - 1}>
                      <ArrowDownwardIcon />
                    </IconButton>
                    <IconButton onClick={() => remover(i)}>
                      <DeleteIcon color="error" />
                    </IconButton>
                  </>
                }
              >
                <ListItemText
                  primary={`${i + 1}. ${exercicio.nome_exercicio}`}
                  secondary={exercicio.nome_grupamento}
                />
              </ListItem>
            ))}
          </List>

          <FeedbackAlert erro={erro} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onFechar}>Cancelar</Button>
        <Button variant="contained" onClick={salvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar exercícios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}