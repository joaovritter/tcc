import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {

  type HealthResponse = { status : string }
  const [health, setHealth] = useState<HealthResponse | null>(null)

  useEffect(() => {
    async function carregarHealth() {
      const response = await fetch('http://localhost:3000/health');
      const data: HealthResponse = await response.json();
      setHealth(data)
    }
    carregarHealth()
  },[])

  return (
    //health? = optional chaining (health pode ser null). ?? se health for null, mostra 'carregando...'
    <div> 
      <h1> Status da API: {health?.status ?? 'carregando...'}</h1>  
    </div>
  )
}

export default App
