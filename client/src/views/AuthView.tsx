import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { Typography, TextField, Button, Stack } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { PageLayout } from '../components/PageLayout';
import { FeedbackAlert } from '../components/FeedbackAlert';

export function AuthView() {
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { login, registrar } = useAuth();

  //funcao manipuladora de envio do formulario 
  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault(); //evita o comportamento padrão: regarregar a pagina ao enviar o formulario 
    setErro('');
    setEnviando(true);
    try {
      if (modo === 'login') {
        await login(email, senha);
      } else {
        await registrar(nome, email, senha);
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro inesperado'); //se for objeto Error, pega a mensagem, senao retorna 'Erro inesperado'
    } finally {
      setEnviando(false);
    }
  }

  return (
    <PageLayout>
      <Typography variant="h1" gutterBottom>
        {modo === 'login' ? 'Entrar' : 'Criar conta'}
      </Typography>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          {modo === 'registro' && (
            <TextField
              label="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              fullWidth
            />
          )}
          <TextField
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            fullWidth
          />
          <FeedbackAlert erro={erro} />
          <Button type="submit" variant="contained" disabled={enviando}>
            {enviando ? 'Enviando...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
          </Button>
        </Stack>
      </form>
      <Button
        variant="text"
        onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}
        sx={{ mt: 2 }}
      >
        {modo === 'login' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
      </Button>
    </PageLayout>
  );
}