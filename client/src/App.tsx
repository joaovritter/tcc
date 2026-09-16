import { useState, type ReactNode } from 'react'
import { useAuth } from './context/AuthContext'
import { AuthView } from './views/AuthView'
import { DivisionView } from './views/DivisionView'
import { TodaySessionView } from './views/TodaySessionView'
import { WeeklyVolumeView } from './views/WeeklyVolumeView'
import { AppShell } from './components/AppShell'
import { PageLayout } from './components/PageLayout'
import { Typography } from '@mui/material'

export type Tela = 'divisao' | 'treino' | 'volume'


const TELAS: Record<Tela, ReactNode> = {
  divisao: <DivisionView />,
  treino: <TodaySessionView />,
  volume: <WeeklyVolumeView />,
}

function App() {
  const { usuario, carregando } = useAuth();
  const [tela, setTela] = useState<Tela>('divisao');

  if (carregando) {
    return (
      <PageLayout>
        <Typography>Carregando...</Typography>
      </PageLayout>
    )
  }

  if (!usuario) {
    return <AuthView />
  }

  return (
    <AppShell tela={tela} onNavegar={setTela}>
      {TELAS[tela]}
    </AppShell>
  )
}

export default App 