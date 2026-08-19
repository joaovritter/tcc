import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { theme } from './theme'

//CssBaseline + theme.ts passam a cobrir o que o index.css fazia

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)