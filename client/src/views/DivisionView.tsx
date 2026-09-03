import { useEffect, useState } from 'react';
import { Card, CardContent, Typography, TextField, Button, Stack, IconButton, Tooltip } from '@mui/material';
import SnoozeIcon from '@mui/icons-material/Snooze';
import * as api from '../services/api';
import { FeedbackAlert } from '../components/FeedbackAlert';
import { DayExercisesDialog } from '../components/DayExerciseDialog';


const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function DivisionView() {
    const [nomes, setNomes] = useState<string[]>(Array(7).fill('')) //inicia uma lista com 7 posicoes vaizas ''
    const [idsDivisao, setIdsDivisao] = useState<(string | null)[]>(Array(7).fill(null));
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState(false);

    const [dialogAberto, setDialogAberto] = useState<{ dia: number; idDivisao: string } | null>(null);
    const [descansos, setDescansos] = useState<boolean[]>(Array(7).fill(false));

    // CARREGAMENTO INICIAL: Roda uma única vez ao abrir a tela. Busca os treinos salvos e preenche o array dos 7 dias da semana.
    useEffect(() => {
        async function carregar() {
            try {
                const { divisoes } = await api.buscarDivisoes();
                const novosNomes = Array(7).fill('');
                const novosIds: (string | null)[] = Array(7).fill(null);
                for (const divisao of divisoes) {
                    novosNomes[divisao.dia_semana] = divisao.nome;
                    novosIds[divisao.dia_semana] = divisao.id_divisao;
                }
                setNomes(novosNomes);
                setIdsDivisao(novosIds);
            } catch (erro) {
                setErro(erro instanceof Error ? erro.message : 'Erro ao carregar');
            } finally {
                setCarregando(false);
            }
        }
        carregar();
    }, []);

    // SALVAMENTO: Pega os nomes dos inputs, ignora dias vazios e envia a nova rotina formatada para a API.
    async function handleSalvar() {
        setErro('');
        setSucesso(false);
        setSalvando(true);
        try { // Converte a lista em objeto { dia_semana, nome } e descarta inputs em branco
            const divisoes = nomes
                .map((nome, dia_semana) => ({ dia_semana, nome: nome.trim() }))
                .filter((d) => d.nome.length > 0);
            const { divisoes: divisoesSalvas } = await api.salvarDivisoes(divisoes);
            const novosIds = [...idsDivisao];
            for (const divisao of divisoesSalvas) {
                novosIds[divisao.dia_semana] = divisao.id_divisao;
            }
            setIdsDivisao(novosIds);
            setSucesso(true);
        } catch (erro) {
            setErro(erro instanceof Error ? erro.message : 'Erro ao salvar');
        } finally {
            setSalvando(false);
        }
    }
    if (carregando) {
        return <Typography>Carregando...</Typography>;
    }

    return (
        <Card variant="outlined">
            <CardContent>
                <Typography variant="h2" gutterBottom>
                    Minha Divisão
                </Typography>
                <Stack spacing={2}>
                    {DIAS.map((dia, i) => {
                        const emDescanso = descansos[i];
                        return (
                            <Stack key={i} direction="row" spacing={2} alignItems="center">
                                {emDescanso ? (
                                    <Typography sx={{ flex: 1 }} color="text.secondary" fontStyle="italic">
                                        {dia} — Descanso
                                    </Typography>
                                ) : (
                                    <TextField
                                        label={dia}
                                        placeholder="Ex.: Peito e tríceps"
                                        value={nomes[i]}
                                        onChange={(e) => {
                                            const novos = [...nomes];
                                            novos[i] = e.target.value;
                                            setNomes(novos);
                                        }}
                                        fullWidth
                                    />
                                )}
                                <Tooltip title={emDescanso ? 'Marcar como dia de treino' : 'Marcar como descanso'}>
                                    <IconButton
                                        onClick={() => {
                                            const novosDescansos = [...descansos];
                                            novosDescansos[i] = !novosDescansos[i];
                                            setDescansos(novosDescansos);
                                            if (novosDescansos[i]) {
                                                const novosNomes = [...nomes];
                                                novosNomes[i] = '';
                                                setNomes(novosNomes);
                                            }
                                        }}
                                    >
                                        <SnoozeIcon sx={{ color: emDescanso ? '#8e24aa' : undefined }} />
                                    </IconButton>
                                </Tooltip>
                                {!emDescanso && nomes[i].trim() && (
                                    <Button
                                        onClick={async () => {
                                            let id = idsDivisao[i];
                                            if (!id) {
                                                await handleSalvar();
                                                id = idsDivisao[i];
                                            }
                                            if (id) setDialogAberto({ dia: i, idDivisao: id });
                                        }}
                                    >
                                        Exercícios
                                    </Button>
                                )}
                            </Stack>
                        )
                    })}
                    <FeedbackAlert
                        erro={erro}
                        sucesso={sucesso ? 'Divisão salva com sucesso!' : undefined}
                    />
                    <Button variant="contained" onClick={handleSalvar} disabled={salvando}>
                        {salvando ? 'Salvando...' : 'Salvar semana'}
                    </Button>
                </Stack>
                {dialogAberto && (
                    <DayExercisesDialog
                        idDivisao={dialogAberto.idDivisao}
                        nomeDia={DIAS[dialogAberto.dia]}
                        aberto={dialogAberto !== null}
                        onFechar={() => setDialogAberto(null)}
                    />
                )}
            </CardContent>
        </Card>
    );

}