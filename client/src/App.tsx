import { useAuth } from './context/AuthContext'
import { AuthView } from './views/AuthView'
import { DivisionView } from './views/DivisionView'
import { AppShell } from './components/AppShell'
import { PageLayout } from './components/PageLayout'
import { Typography } from '@mui/material'

function App() {
  const { usuario, carregando } = useAuth()

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
      <DivisionView />
    </AppShell>
  )
}

export default App 