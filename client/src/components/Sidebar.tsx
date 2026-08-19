import { useState, type ReactNode } from 'react';
import { Box, Stack, Typography, Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import InsightsIcon from '@mui/icons-material/Insights';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useAuth } from '../context/AuthContext';

//Sidebar lateral fixa, com animação de expansão suave (Frame Motion) e itens de navegação.
//icone only quando colapsada (76px)

interface NavItem {
  label: string;
  icon: ReactNode;
  ativo?: boolean;
  disponivel?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Minha divisão', icon: <CalendarViewWeekIcon fontSize="small" />, ativo: true },
  { label: 'Treino de hoje', icon: <FitnessCenterIcon fontSize="small" />, disponivel: false },
  { label: 'Diagnóstico', icon: <InsightsIcon fontSize="small" />, disponivel: false },
  { label: 'Histórico', icon: <TimelineIcon fontSize="small" />, disponivel: false },
];

const COLLAPSED = 76;
const EXPANDED = 244;

export function Sidebar() {
  const [aberta, setAberta] = useState(false);
  const { usuario, logout } = useAuth();

  return (
    <Box
      component={motion.nav}
      animate={{ width: aberta ? EXPANDED : COLLAPSED }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      onMouseEnter={() => setAberta(true)}
      onMouseLeave={() => setAberta(false)}
      onFocus={() => setAberta(true)}
      onBlur={() => setAberta(false)}
      sx={{
        position: 'fixed',
        top: 20,
        left: 20,
        bottom: 20,
        bgcolor: '#0F1B17',
        color: '#C7D3CE',
        borderRadius: '28px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        px: 1.75,
        py: 2.5,
        boxShadow: '0 20px 45px -18px rgba(15, 27, 23, 0.55)',
        zIndex: 10,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 0.5, pb: 2.5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '12px',
            flexShrink: 0,
            background: 'linear-gradient(155deg, #2F8A73, #1E6F5C)',
          }}
        />
        {aberta && (
          <Typography
            component={motion.span}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            sx={{ fontFamily: '"Sora", sans-serif', fontWeight: 700, fontSize: 15, color: '#F3F6F4', whiteSpace: 'nowrap' }}
          >
            HyperTrack
          </Typography>
        )}
      </Stack>

      <Stack spacing={0.5} sx={{ flex: 1 }}>
        {NAV_ITEMS.map((item) => (
          <Stack
            key={item.label}
            direction="row"
            spacing={1.75}
            alignItems="center"
            sx={{
              px: 1.75,
              py: 1.25,
              borderRadius: '999px',
              cursor: item.disponivel === false ? 'default' : 'pointer',
              opacity: item.disponivel === false ? 0.45 : 1,
              bgcolor: item.ativo ? 'primary.main' : 'transparent',
              color: item.ativo ? '#F3F6F4' : 'inherit',
              '&:hover': item.disponivel === false ? undefined : { bgcolor: item.ativo ? 'primary.main' : 'rgba(255,255,255,0.07)' },
            }}
          >
            {item.icon}
            {aberta && (
              <Typography
                component={motion.span}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                sx={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                {item.label}
              </Typography>
            )}
          </Stack>
        ))}
      </Stack>

      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        onClick={logout}
        sx={{ px: 1.25, py: 1, borderRadius: '999px', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' } }}
      >
        <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(170,59,255,0.15)', color: '#D9A6FF', fontSize: 13, fontWeight: 700 }}>
          {usuario?.nome?.slice(0, 2).toUpperCase()}
        </Avatar>
        {aberta && (
          <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} sx={{ overflow: 'hidden' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#F3F6F4', whiteSpace: 'nowrap' }}>
              {usuario?.nome}
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: '#7C8B85' }}>Sair</Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
