
import { useEffect, useState } from 'react';
import {
  Box, ButtonBase, Card, CardActionArea, CardContent, Chip, IconButton, MenuItem,
  Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { LineChart } from '@mui/x-charts/LineChart';
import * as api from '../services/api';
import { FeedbackAlert } from '../components/FeedbackAlert';
import { corDoScore } from '../components/DiagnosticContent';
import { SessionDetail } from '../components/SessionDetail';

type Aba = 'cargas' | 'volume' | 'sessoes';

//============================ datas ============================

function doisDigitos(n: number) {
  return String(n).padStart(2, '0');
}

//'AAAA-MM' e 'AAAA-MM-DD' pelo relogio LOCAL - mesma forma do to_char do backend
function mesDe(data: Date) {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}`;
}
function diaDe(data: Date) {
  return `${mesDe(data)}-${doisDigitos(data.getDate())}`;
}

//soma meses em 'AAAA-MM' pelo construtor numerico (local): new Date(2026, 12, 1) vira jan/2027 sozinho
function somarMes(mes: string, delta: number) {
  const [ano, numero] = mes.split('-').map(Number);
  return mesDe(new Date(ano, numero - 1 + delta, 1));
}

//'2026-09' -> "setembro de 2026"
function nomeDoMes(mes: string) {
  const [ano, numero] = mes.split('-').map(Number);
  return new Date(ano, numero - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

//'2026-09-18' -> "sexta-feira, 18 de setembro" - split + construtor numerico, nunca new Date(texto)
function nomeDoDia(dia: string) {
  const [ano, mes, numero] = dia.split('-').map(Number);
  return new Date(ano, mes - 1, numero).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

//'YYYY-MM-DD' da semana do volume: split, nunca new Date - viraria UTC e voltaria um dia
function formatarDia(iso: string) {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

//timestamp do Treino (UTC, com Z): new Date converte pro fuso local
function formatarData(timestamp: string) {
  return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
function formatarHora(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

//faixa do score (a mesma do circulo do diagnostico); cinza = sessao sem diagnostico
function corDaSessao(score: number | null) {
  return score === null ? 'grey.400' : `${corDoScore(score)}.main`;
}


export function HistoryView() {
  const [aba, setAba] = useState<Aba>('cargas');

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h2" gutterBottom>
          Histórico
        </Typography>

        <Tabs value={aba} onChange={(_, nova: Aba) => setAba(nova)} variant="fullWidth" sx={{ mb: 3 }}>
          <Tab value="cargas" label="Cargas" />
          <Tab value="volume" label="Volume" />
          <Tab value="sessoes" label="Sessões" />
        </Tabs>

        {aba === 'cargas' && <AbaCargas />}
        {aba === 'volume' && <AbaVolume />}
        {aba === 'sessoes' && <AbaSessoes />}
      </CardContent>
    </Card>
  );
}


//============================ cargas (D17) ============================

function AbaCargas() {
  const [exercicios, setExercicios] = useState<api.ExercicioTreinado[] | null>(null);
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const [progressao, setProgressao] = useState<api.PontoProgressaoCarga[]>([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        const { exercicios } = await api.buscarExerciciosTreinados();
        setExercicios(exercicios);
        setSelecionado(exercicios[0]?.id_exercicio ?? null);
      } catch (erro) {
        setErro(erro instanceof Error ? erro.message : 'Erro ao carregar exercícios');
      }
    }
    carregar();
  }, []);

  useEffect(() => {
    if (selecionado === null) return;
    const idExercicio = selecionado;
    //trocar de exercicio rapido: a resposta atrasada do anterior nao pode
    //sobrescrever o grafico do atual
    let ativo = true;

    async function carregar() {
      try {
        const { progressao } = await api.buscarProgressaoCarga(idExercicio);
        if (ativo) setProgressao(progressao);
      } catch (erro) {
        if (ativo) setErro(erro instanceof Error ? erro.message : 'Erro ao carregar a progressão');
      }
    }
    carregar();
    return () => {
      ativo = false;
    };
  }, [selecionado]);

  if (erro) return <FeedbackAlert erro={erro} />;
  if (!exercicios) return <Typography>Carregando...</Typography>;
  if (exercicios.length === 0) {
    return <Typography color="text.secondary">Nenhuma série válida registrada ainda.</Typography>;
  }

  return (
    <Stack spacing={2}>
      <TextField
        select
        label="Exercício"
        value={selecionado ?? ''}
        onChange={(e) => setSelecionado(Number(e.target.value))}
      >
        {exercicios.map((e) => (
          <MenuItem key={e.id_exercicio} value={e.id_exercicio}>
            {e.nome_exercicio} · {e.nome_grupamento}
          </MenuItem>
        ))}
      </TextField>

      {progressao.length > 0 && (
        <LineChart
          height={260}
          //eixo x = indice da sessao: data direto no eixo juntaria duas sessoes do mesmo dia
          xAxis={[{
            scaleType: 'point',
            data: progressao.map((_, i) => i),
            valueFormatter: (i: number) => formatarData(progressao[i].data),
          }]}
          series={[{
            data: progressao.map((p) => p.carga_maxima),
            label: 'Maior carga válida da sessão (kg)',
            color: '#1E6F5C',
            //tooltip com o resto da: reps da mais pesada, series e tonelagem.
            //tudo pronto do backend - a tela so formata
            valueFormatter: (valor, { dataIndex }) => {
              const p = progressao[dataIndex];
              return `${valor} kg × ${p.reps_carga_maxima} · ${p.series_validas} séries · `
                + `tonelagem ${p.tonelagem.toLocaleString('pt-BR')} kg`;
            },
          }]}
        />
      )}

      {progressao.length === 1 && (
        <Typography variant="caption" color="text.secondary">
          Uma sessão só — a linha aparece a partir da segunda.
        </Typography>
      )}
    </Stack>
  );
}


//============================ volume (D18) ============================

function AbaVolume() {
  const [historico, setHistorico] = useState<api.VolumeSemanal[] | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        const { historico } = await api.buscarHistoricoVolume();
        setHistorico(historico);
      } catch (erro) {
        setErro(erro instanceof Error ? erro.message : 'Erro ao carregar o volume');
      }
    }
    carregar();
  }, []);

  if (erro) return <FeedbackAlert erro={erro} />;
  if (!historico) return <Typography>Carregando...</Typography>;

  return (
    <Stack spacing={2.5}>
      <Typography variant="body2" color="text.secondary">
        Séries válidas por grupamento nas últimas {historico.length} semanas · limiar de{' '}
        {historico[0]?.limiar} séries [Schoenfeld]
      </Typography>

      {historico.map((semana) => (
        <Stack key={semana.semana_referencia} spacing={1}>
          <Typography sx={{ fontWeight: 700 }}>
            Semana de {formatarDia(semana.semana_referencia)}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {semana.grupamentos.map((g) => (
              <Chip
                key={g.id_grupamento}
                size="small"
                //atingiu_limiar vem pronto do backend (RNF03)
                color={g.atingiu_limiar ? 'success' : 'default'}
                variant={g.series_validas === 0 ? 'outlined' : 'filled'}
                label={`${g.nome_grupamento} ${g.series_validas}/${semana.limiar}`}
              />
            ))}
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}


//================ sessoes: calendario + diagnosticos anteriores (D18) ================

const DIAS_DA_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']; //comeca no domingo

function AbaSessoes() {
  const hoje = diaDe(new Date());
  const mesAtual = hoje.slice(0, 7);

  const [mes, setMes] = useState(mesAtual);
  const [dados, setDados] = useState<api.SessoesDoMes | null>(null);
  const [dia, setDia] = useState<string | null>(null);
  const [aberta, setAberta] = useState<string | null>(null); //id_treino no detalhe
  const [recarga, setRecarga] = useState(0); //somar 1 recarrega o mes
  const [erro, setErro] = useState('');

  useEffect(() => {
    //trocar de mes rapido: a resposta atrasada do anterior nao sobrescreve
    let ativo = true;

    async function carregar() {
      try {
        const resposta = await api.buscarSessoesDoMes(mes);
        if (!ativo) return;
        setDados(resposta);
        //dia ja selecionado neste mes (voltou do detalhe): mantem.
        //senao, o treino mais recente do mes - ou nada, se o mes esta vazio
        setDia((atual) =>
          atual?.startsWith(mes) ? atual : (resposta.sessoes.at(-1)?.dia ?? null)
        );
      } catch (erro) {
        if (ativo) setErro(erro instanceof Error ? erro.message : 'Erro ao carregar as sessões');
      }
    }
    carregar();
    return () => {
      ativo = false;
    };
  }, [mes, recarga]);

  if (aberta) {
    return (
      <SessionDetail
        idTreino={aberta}
        onVoltar={() => {
          setAberta(null);
          setRecarga((r) => r + 1); //se avaliou la dentro, o ponto do dia muda de cor
        }}
      />
    );
  }

  if (!dados) {
    return erro ? <FeedbackAlert erro={erro} /> : <Typography>Carregando...</Typography>;
  }

  //sessoes por dia ('YYYY-MM-DD' do banco); ja vem em ordem de horario (ASC)
  const porDia = new Map<string, api.SessaoHistorico[]>();
  for (const s of dados.sessoes) {
    porDia.set(s.dia, [...(porDia.get(s.dia) ?? []), s]);
  }

  const [ano, numeroMes] = mes.split('-').map(Number);
  const vaziasAntes = new Date(ano, numeroMes - 1, 1).getDay(); //0 = domingo
  const diasNoMes = new Date(ano, numeroMes, 0).getDate(); //dia 0 do mes seguinte = ultimo deste
  const celulas: (string | null)[] = [
    ...Array.from({ length: vaziasAntes }, () => null),
    ...Array.from({ length: diasNoMes }, (_, i) => `${mes}-${doisDigitos(i + 1)}`),
  ];

  //'AAAA-MM' compara certo como texto
  const podeVoltar = dados.primeira_sessao !== null && mes > dados.primeira_sessao.slice(0, 7);
  const podeAvancar = mes < mesAtual;
  const sessoesDoDia = dia ? (porDia.get(dia) ?? []) : [];

  return (
    <Stack spacing={3}>
      <FeedbackAlert erro={erro} />

      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <IconButton onClick={() => setMes(somarMes(mes, -1))} disabled={!podeVoltar} aria-label="Mês anterior">
            <ChevronLeftIcon />
          </IconButton>
          <Typography sx={{ fontWeight: 700 }}>{nomeDoMes(mes)}</Typography>
          <IconButton onClick={() => setMes(somarMes(mes, 1))} disabled={!podeAvancar} aria-label="Próximo mês">
            <ChevronRightIcon />
          </IconButton>
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 0.5 }}>
          {DIAS_DA_SEMANA.map((d) => (
            <Typography key={d} variant="caption" color="text.secondary" align="center" sx={{ pb: 1 }}>
              {d}
            </Typography>
          ))}

          {celulas.map((celula, i) => {
            if (!celula) return <Box key={`vazia-${i}`} />;

            const doDia = porDia.get(celula);
            const selecionado = celula === dia;
            const ehHoje = celula === hoje;

            return (
              <ButtonBase
                key={celula}
                onClick={() => setDia(celula)}
                aria-label={nomeDoDia(celula)}
                sx={{ flexDirection: 'column', py: 0.5, borderRadius: 2 }}
              >
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: selecionado || ehHoje ? 700 : 400,
                    bgcolor: selecionado ? 'primary.main' : 'transparent',
                    color: selecionado ? 'primary.contrastText' : 'text.primary',
                    //hoje: contorno; selecionado: preenchido (o preenchimento ganha)
                    border: ehHoje && !selecionado ? 2 : 0,
                    borderColor: 'primary.main',
                  }}
                >
                  {Number(celula.slice(8))}
                </Box>
                {/* um ponto por dia, com a cor do treino mais recente dele */}
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    mt: 0.5,
                    borderRadius: '50%',
                    bgcolor: doDia ? corDaSessao(doDia[doDia.length - 1].score_geral) : 'transparent',
                  }}
                />
              </ButtonBase>
            );
          })}
        </Box>
      </Box>

      {dia ? (
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
            {nomeDoDia(dia)}
          </Typography>
          {sessoesDoDia.length === 0 ? (
            <Typography color="text.secondary">Nenhum treino neste dia.</Typography>
          ) : (
            sessoesDoDia.map((s) => (
              <CardSessao key={s.id_treino} sessao={s} onAbrir={() => setAberta(s.id_treino)} />
            ))
          )}
        </Stack>
      ) : (
        <Typography color="text.secondary">Nenhum treino finalizado neste mês.</Typography>
      )}
    </Stack>
  );
}

//o card do treino embaixo do calendario; tocar abre o detalhe
function CardSessao({ sessao, onAbrir }: { sessao: api.SessaoHistorico; onAbrir: () => void }) {
  const cor = corDaSessao(sessao.score_geral);

  return (
    <Card variant="outlined">
      <CardActionArea onClick={onAbrir}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            {/* selo do score: o numero com a cor da faixa; "—" = ainda sem avaliacao */}
            <Box
              sx={{
                width: 44,
                height: 44,
                flexShrink: 0,
                borderRadius: '50%',
                border: 2,
                borderColor: cor,
                color: cor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '"Sora", sans-serif',
                fontWeight: 700,
              }}
            >
              {sessao.score_geral ?? '—'}
            </Box>

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700 }} noWrap>
                {sessao.nome_divisao ?? 'Sem divisão'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatarHora(sessao.data)} · {sessao.series_validas} séries válidas
                {sessao.duracao_total !== null ? ` · ${sessao.duracao_total} min` : ''}
              </Typography>
            </Box>

            <ChevronRightIcon color="action" />
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}