import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { Sidebar } from './Sidebar';
import { PageLayout } from './PageLayout';


//Casca de toda tela logada
//sidebar fixa na esquerda + conteudo com espaço reservado (padding-left) para ela nunca sobrepor o texto

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Sidebar />
      <Box sx={{ pl: { xs: '20px', md: '136px' } }}>
        <PageLayout>{children}</PageLayout>
      </Box>
    </Box>
  );
}