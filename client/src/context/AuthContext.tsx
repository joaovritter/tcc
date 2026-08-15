import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import * as api from '../services/api';
import type { Usuario } from '../services/api';

/**
 * Contexto global de autenticação
 * Responsabilidades:
 * - Manter o estado do usuario logado ('usuario')e do carregamento inicial ('carregando')
 * - Restaurar a sessão automaticamente ao dar F5 validando o token do localStorage
 * - Centralizar as funcoes de login, registrar e logout
 * - Fornecer hook useAuth() para consumo simples em components.
 */

interface AuthContextValor { //contrato que define oq está disponivel para componentes que usarem a autenticação
    usuario: Usuario | null;
    carregando: boolean;
    login: (email: string, senha: string) => Promise<void>;
    registrar: (nome: string, email: string, senha: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValor | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function restaurarSessao() {
      const token = localStorage.getItem('token');
      if (!token) {
        setCarregando(false);
        return;
      }
      try {
        const { usuario } = await api.buscarPerfil();
        setUsuario(usuario);
      } catch {
        localStorage.removeItem('token');
      } finally {
        setCarregando(false);
      }
    }
    restaurarSessao();
  }, []);

  async function login(email: string, senha: string) {
    const { token, usuario } = await api.login(email, senha);
    localStorage.setItem('token', token);
    setUsuario(usuario);
  }

  async function registrar(nome: string, email: string, senha: string) {
    await api.registrar(nome, email, senha);
    await login(email, senha);
  }

  function logout() {
    localStorage.removeItem('token');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, registrar, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth precisa ser usado dentro de um AuthProvider');
  }
  return contexto;
}
