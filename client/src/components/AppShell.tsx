import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { Sidebar } from './Sidebar';
import { PageLayout } from './PageLayout';
import type { Tela } from '../App';


//Casca de toda tela logada
//sidebar fixa na esquerda + conteudo com espaço reservado (padding-left) para ela nunca sobrepor o texto

export function AppShell({
  children,
  tela,
  onNavegar,
}: {
  children: ReactNode;
  tela: Tela;
  onNavegar: (tela: Tela) => void;
}) {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Sidebar tela={tela} onNavegar={onNavegar} />
      <Box sx={{ pl: { xs: '116px', md: '136px' } }}>
        <PageLayout>{children}</PageLayout>
      </Box>
    </Box>
  );
}