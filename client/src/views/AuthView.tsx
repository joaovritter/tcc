import type { SubmitEvent } from "react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

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
         <div>
      <h1>{modo === 'login' ? 'Entrar' : 'Criar conta'}</h1>
      <form onSubmit={handleSubmit}>
        {modo === 'registro' && (
          <input
            type="text"
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        )}
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        {erro && <p role="alert">{erro}</p>}
        <button type="submit" disabled={enviando}>
          {enviando ? 'Enviando...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>
      <button type="button" onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}>
        {modo === 'login' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
      </button>
    </div>
    );
}