import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { Sidebar } from './Sidebar';
import { PageLayout } from './PageLayout';


//espaco reservado pra navegacao nao cobrir o conteudo
//a esquerda no pc, embaixo no celular
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Sidebar />
      <Box sx={{ pl: { xs: 0, sm: '116px', md: '136px' }, pb: { xs: '96px', sm: 0 } }}>
        <PageLayout>{children}</PageLayout>
      </Box>
    </Box>
  );
}