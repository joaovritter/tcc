import { useEffect, useState } from 'react';
import { Card, CardContent, Typography, TextField, Button, Stack } from '@mui/material';
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

    const [resumo, setResumo] = useState<{ dia_semana: number; grupamentos: string[] }[]>([]);
    const [dialogAberto, setDialogAberto] = useState<{ dia: number; idDivisao: string } | null>(null);

    // CARREGAMENTO INICIAL: Roda uma única vez ao abrir a tela. Busca os treinos salvos e preenche o array dos 7 dias da semana.
    useEffect(() => {
        async function carregar() {
            try {
                const { divisoes } = await api.buscarDivisoes();
                const { resumo } = await api.buscarResumoMusculos();
                const novosNomes = Array(7).fill('');
                const novosIds: (string | null)[] = Array(7).fill(null);
                for (const divisao of divisoes) {
                    novosNomes[divisao.dia_semana] = divisao.nome;
                    novosIds[divisao.dia_semana] = divisao.id_divisao;
                }
                setNomes(novosNomes);
                setIdsDivisao(novosIds);
                setResumo(resumo);
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
                        const resumoDoDia = resumo.find((r) => r.dia_semana === i);
                        return (
                            <Stack key={i} direction="row" spacing={2} alignItems="center">
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
                                {idsDivisao[i] && (
                                    <Button onClick={() => setDialogAberto({ dia: i, idDivisao: idsDivisao[i]! })}>
                                        Exercícios
                                    </Button>
                                )}
                                {resumoDoDia && resumoDoDia.grupamentos.length > 0 && (
                                    <Typography variant="body2" color="text.secondary">
                                        {resumoDoDia.grupamentos.join(', ')}
                                    </Typography>
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