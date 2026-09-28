import { useState, type ReactNode } from 'react'
import { useAuth } from './context/AuthContext'
import { AuthView } from './views/AuthView'
import { DivisionView } from './views/DivisionView'
import { TodaySessionView } from './views/TodaySessionView'
import { WeeklyVolumeView } from './views/WeeklyVolumeView'
import { DiagnosticView } from './views/DiagnosticView'
import { HistoryView } from './views/HistoryView'

import { AppShell } from './components/AppShell'
import { PageLayout } from './components/PageLayout'
import { Typography } from '@mui/material'

export type Tela = 'divisao' | 'treino' | 'volume' | 'diagnostico' | 'historico'

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

  //dentro do App, o Treino de hoje precisa do setTela pra levar a pessoa ao diagnostico recem-gerado 
  const telas: Record<Tela, ReactNode> = {
    divisao: <DivisionView />,
    treino: <TodaySessionView onVerDiagnostico={() => setTela('diagnostico')} />,
    volume: <WeeklyVolumeView />,
    diagnostico: <DiagnosticView />,
    historico: <HistoryView />,
  }

  return (
    <AppShell tela={tela} onNavegar={setTela}>
      {telas[tela]}
    </AppShell>
  )
}

export default App