import { useState, type ReactNode } from 'react';
import { Avatar, Box, ButtonBase, Stack, Typography, useMediaQuery } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import BarChartIcon from '@mui/icons-material/BarChart';
import InsightsIcon from '@mui/icons-material/Insights';
import TimelineIcon from '@mui/icons-material/Timeline';
import LogoutIcon from '@mui/icons-material/Logout';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

//modelo de sidebar encontrado no site 21st.dev e adaptado para o projeto.

//desktop: lateral que expande no hover. 
//celular: barra embaixo so com icones (D6)


interface NavItem {
  label: string;
  icon: ReactNode;
  rota: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Minha divisão', icon: <CalendarViewWeekIcon fontSize="small" />, rota: '/divisao' },
  { label: 'Treino de hoje', icon: <FitnessCenterIcon fontSize="small" />, rota: '/treino' },
  { label: 'Volume da semana', icon: <BarChartIcon fontSize="small" />, rota: '/volume' },
  { label: 'Diagnóstico', icon: <InsightsIcon fontSize="small" />, rota: '/diagnostico' },
  { label: 'Histórico', icon: <TimelineIcon fontSize="small" />, rota: '/historico' },
];

const COLLAPSED = 76;
const EXPANDED = 244;

export function Sidebar() {
  const celular = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'), { noSsr: true });
  return celular ? <BarraInferior /> : <BarraLateral />;
}

function BarraLateral() {
  const [aberta, setAberta] = useState(false);
  const { usuario, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <Box
      component={motion.nav}
      animate={{ width: aberta ? EXPANDED : COLLAPSED }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      onMouseEnter={() => setAberta(true)}
      onMouseLeave={() => setAberta(false)}
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
        {NAV_ITEMS.map((item) => {
          const ativo = pathname === item.rota;

          return (
            <Stack
              key={item.rota}
              direction="row"
              spacing={1.75}
              alignItems="center"
              onClick={() => navigate(item.rota)}
              sx={{
                px: 1.75,
                py: 1.25,
                borderRadius: '999px',
                cursor: 'pointer',
                bgcolor: ativo ? 'primary.main' : 'transparent',
                color: ativo ? '#F3F6F4' : 'inherit',
                '&:hover': { bgcolor: ativo ? 'primary.main' : 'rgba(255,255,255,0.07)' },
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
          );
        })}
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


//========================celular========================

function BarraInferior() {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <Box
      component="nav"
      sx={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 12,
        height: 64,
        px: 1,
        bgcolor: '#0F1B17',
        borderRadius: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        boxShadow: '0 20px 45px -18px rgba(15, 27, 23, 0.55)',
        zIndex: 10,
      }}
    >
      {NAV_ITEMS.map((item) => {
        const ativo = pathname === item.rota;
        return (
          <ButtonBase
            key={item.rota}
            aria-label={item.label}
            onClick={() => navigate(item.rota)}
            sx={{
              width: 44,
              height: 44,
              borderRadius: '999px',
              color: ativo ? '#F3F6F4' : '#C7D3CE',
              bgcolor: ativo ? 'primary.main' : 'transparent',
            }}
          >
            {item.icon}
          </ButtonBase>
        );
      })}
      <ButtonBase
        aria-label="Sair"
        onClick={logout}
        sx={{ width: 44, height: 44, borderRadius: '999px', color: '#7C8B85' }}
      >
        <LogoutIcon fontSize="small" />
      </ButtonBase>
    </Box>
  );
}