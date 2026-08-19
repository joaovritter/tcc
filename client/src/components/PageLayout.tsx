import type { ReactNode } from 'react';
import { Container, Box } from '@mui/material';
import { motion } from 'framer-motion';


//Casca unica para todas telas, centraliza o conteudo, define largura maixa e aplica fade suave (Frame Motion).
//toda tela herda a animação de transição
export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <Container maxWidth="sm">
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        sx={{ py: 6 }}
      >
        {children}
      </Box>
    </Container>
  );
}