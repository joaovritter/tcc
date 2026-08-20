import { useEffect, useState } from 'react';
import { Card, CardContent, Typography, TextField, Button, Stack } from '@mui/material';
import * as api from '../services/api';
import { FeedbackAlert } from '../components/FeedbackAlert';


const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function DivisionView() {
    const [nomes, setNomes] = useState<string[]>(Array(7).fill('')) //inicia uma lista com 7 posicoes vaizas ''
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState(false);

    // CARREGAMENTO INICIAL: Roda uma única vez ao abrir a tela. Busca os treinos salvos e preenche o array dos 7 dias da semana.
    useEffect(() => {
        async function carregar() {
            try {
                const { divisoes } = await api.buscarDivisoes();
                const novosNomes = Array(7).fill('');
                for (const divisao of divisoes) {
                    novosNomes[divisao.dia_semana] = divisao.nome;
                }
                setNomes(novosNomes)
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
            await api.salvarDivisoes(divisoes);
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
                    {DIAS.map((dia, i) => (
                        <TextField
                            key={i}
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
                    ))}
                    <FeedbackAlert
                        erro={erro}
                        sucesso={sucesso ? 'Divisão salva com sucesso!' : undefined}
                    />
                    <Button variant="contained" onClick={handleSalvar} disabled={salvando}>
                        {salvando ? 'Salvando...' : 'Salvar semana'}
                    </Button>
                </Stack>
            </CardContent>
        </Card>
    );

}