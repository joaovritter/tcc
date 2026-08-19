import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1E6F5C', // verde escuro - remete a progresso/saúde 
    },
    secondary: {
      main: '#AA3BFF', // reaproveita o --accent que já existia no index.css
    },
    background: {
      default: '#F7F7F5',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
    h1: { fontFamily: '"Sora", system-ui, sans-serif', fontSize: '2.5rem', fontWeight: 700 },
    h2: { fontFamily: '"Sora", system-ui, sans-serif', fontSize: '1.5rem', fontWeight: 700 },
    button: { fontWeight: 600, textTransform: 'none' }, //textTransform: 'none' é para tirar o MAIUSCULO padrão do MUI nos botões
  },
  shape: {
    borderRadius: 14,
  },
});