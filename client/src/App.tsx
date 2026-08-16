
import { AuthView } from './views/AuthView';
import { useAuth } from './context/AuthContext';

import './App.css';

function App() {
  const { usuario, carregando, logout } = useAuth()

  if (carregando) {
    return <p>Carregando...</p>

  }

  if (!usuario) {
    return <AuthView />
  }

  return (
    <div>
      <h1>Logado como {usuario.nome}</h1>
      <button onClick={logout}>Sair</button>
    </div>
  )
}

export default App
