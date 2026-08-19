import { Alert } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';


//Componente para exibir mensagens de feedback (erro ou sucesso) com animação suave. 

interface FeedbackAlertProps {
  erro?: string;
  sucesso?: string;
}

export function FeedbackAlert({ erro, sucesso }: FeedbackAlertProps) {
  const mensagem = erro ?? sucesso;
  if (!mensagem) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Alert severity={erro ? 'error' : 'success'} sx={{ mb: 2 }}>
          {mensagem}
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
}