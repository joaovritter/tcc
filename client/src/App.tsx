import { Navigate, Route, Routes } from 'react-router'
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

function App() {
  const { usuario, carregando } = useAuth();

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
    <AppShell>
      <Routes>
        <Route path="/divisao" element={<DivisionView />} />
        <Route path="/treino" element={<TodaySessionView />} />
        <Route path="/volume" element={<WeeklyVolumeView />} />
        <Route path="/diagnostico" element={<DiagnosticView />} />
        <Route path="/historico" element={<HistoryView />} />
        {/* qualquer outra URL vai pra primeira tela */}
        <Route path="*" element={<Navigate to="/divisao" replace />} />
      </Routes>
    </AppShell>
  )
}

export default App