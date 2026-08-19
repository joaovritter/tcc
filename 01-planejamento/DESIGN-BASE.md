# Design Base — Sistema de design mínimo (MUI + Framer Motion)

> Isto é um **roteiro de instruções**, não código pronto pra colar sem
> entender. Objetivo: parar de escrever telas em HTML cru (S1–S3) e passar a
> usar um vocabulário visual único — poucas peças, reaproveitadas em toda
> tela nova daqui pra frente. Nada de sistema de design complexo: um tema, um
> layout de página, e 3–4 componentes.
>
> **Não é uma semana do cronograma (S1–S9)** — é uma tarefa transversal,
> encaixada agora porque a S3 (Divisão Semanal) ficou atrasada e ainda não
> foi implementada. Faça esta base **antes** de implementar a tela da S3, e
> reaproveite nela desde o início (evita ter que redesenhar depois).

> **Visual decidido em 19/08:** sidebar flutuante e arredondada, ícone-only
> quando colapsada, expandindo no hover/foco pra mostrar os rótulos (padrão
> testado a partir de um modelo de referência — Aceternity UI —, adaptado
> pra HTML/CSS puro primeiro e aprovado em artifact, e aqui reimplementado
> em React/MUI/Framer Motion, sem depender de Next.js nem da lib original).
> Fontes: **Sora** (display/títulos) + **Plus Jakarta Sans** (corpo/labels)
> — nada de fonte monoespaçada, feedback do usuário foi que "soa como
> programador". Botões em pílula (`border-radius: 999px`).

## Por que MUI + Framer Motion, e por que pouco de cada

- **MUI**: componentes prontos e acessíveis (`Button`, `TextField`, `Card`,
  `AppBar`) com um sistema de tema (`createTheme`) que centraliza cor,
  tipografia e espaçamento num lugar só. Isso resolve o problema real, que é
  "cada tela nasce sem nenhum padrão visual" — sem precisar desenhar
  componente nenhum do zero.
- **Framer Motion**: só pra transições simples (entrada de tela, fade em
  mensagens de erro/sucesso, e a expansão da sidebar no hover). **Não** é
  pra animação de layout complexa, drag, gestos, etc. — isso seria
  complexidade que este TCC não precisa.
- **Sem Tailwind.** O modelo de sidebar que serviu de referência é
  Tailwind-first, mas rodar Tailwind e MUI juntos significa dois sistemas
  de estilo resolvendo o mesmo problema ao mesmo tempo (reset de CSS de um
  brigando com o do outro, sem ganho real). A mecânica de hover foi
  recriada com `sx`/`styled` do MUI (cor/tipografia, puxando do
  `theme.ts`) + Framer Motion (a animação em si) — mesmo resultado visual,
  uma lib de estilo só.
- Os três juntos (tema único, feedback consistente, navegação persistente)
  cobrem o que a "Frente 2 — Avaliação heurística de Nielsen" (outubro) vai
  cobrar: consistência visual e navegação previsível, sem exigir nenhum
  trabalho de ilustração/design gráfico seu.

---

## Passo 0 — Instalar dependências

Em `client/`:

```
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material framer-motion
```

- `@mui/material` — os componentes.
- `@emotion/react` + `@emotion/styled` — motor de estilo que o MUI usa por
  baixo (obrigatório, não é opcional).
- `@mui/icons-material` — ícones prontos (usar com moderação: só onde
  ajudar a entender a ação, ex. olho de mostrar/ocultar senha).
- `framer-motion` — as transições simples citadas acima.

---

## Passo 1 — `client/src/theme.ts`

Um tema único, pequeno, que já reflete a identidade do produto (treino /
hipertrofia — tom sério, não "fitness colorido"). Fica fácil de ajustar
cor/tipografia depois porque é **um arquivo só**, nunca estilo solto em cada
componente.

**Paleta**: um tom principal (usar pra botões primários, links, foco) e
neutros pra fundo/texto — não usar mais de 2 cores fortes além dos
neutros, senão a tela vira poluída.

**Fontes**: Sora pros títulos/marca (tem mais personalidade, usar com
moderação — só `h1`/`h2`/nome do produto na sidebar) e Plus Jakarta Sans
pra tudo mais (corpo, labels, botões) — ela substitui tanto a fonte de
texto quanto a mono que estava no primeiro rascunho (rejeitada por soar
"técnica demais" pra uma tela que usuário final vai usar no treino).

```ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1E6F5C', // verde escuro — remete a progresso/saúde sem ser "academia neon"
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
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: {
    borderRadius: 14,
  },
});
```

> `textTransform: 'none'` no `button` é pra tirar o "MAIÚSCULO" padrão do
> MUI nos botões — combina mais com o tom "amigável" pedido, e casa com o
> resto do texto da interface (que também não é maiúsculo).

### Carregar as fontes — `client/index.html`

O Google Fonts precisa ser importado uma vez, no HTML raiz do Vite (não em
CSS/JS) — igual foi feito nos artifacts de teste. Adicionar dentro do
`<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
  rel="stylesheet"
>
```

> Se quiser dark mode automático (o `index.css` atual já tem
> `prefers-color-scheme`), isso é refinamento — não obrigatório agora. Fazer
> só depois que o modo claro estiver estável em todas as telas, pra não
> duplicar trabalho de ajuste de cor duas vezes.

### Ligar o tema em `client/src/main.tsx`

Envolver o `<App />` (que já está dentro de `<AuthProvider>`, da S2) com o
`ThemeProvider` do MUI. `CssBaseline` reseta o CSS padrão do navegador pro
baseline do MUI — sem ele, sobra estilo do `index.css` antigo brigando com
os componentes novos.

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { theme } from './theme'

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
```

> Pode remover `import './index.css'` neste arquivo — o `CssBaseline` +
> `theme.ts` passam a cobrir o que o `index.css` fazia. Se preferir manter
> `index.css` só pro `#root`/`body` por enquanto, tudo bem, mas não misture
> as duas fontes de cor (não usar `var(--accent)` numa tela e
> `theme.palette.primary` em outra).

---

## Passo 2 — `client/src/components/PageLayout.tsx`

Uma casca única pra toda tela logada/deslogada: centraliza o conteúdo,
define largura máxima, e entra com fade suave (Framer Motion) — é o único
lugar do sistema que usa animação de "entrada de página", então toda tela
nova herda isso de graça sem precisar repetir.

```tsx
import type { ReactNode } from 'react';
import { Container, Box } from '@mui/material';
import { motion } from 'framer-motion';

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
```

---

## Passo 3 — `client/src/components/FeedbackAlert.tsx`

Toda tela até agora (`AuthView`, e a `DivisionView` planejada na S3) mostra
erro/sucesso com um `<p role="alert">` cru. Trocar por um componente único
resolve isso em todo lugar de uma vez — usa `Alert` do MUI (já acessível,
já com cor semântica) com uma entrada em fade.

```tsx
import { Alert } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';

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
```

---

## Passo 4 — `client/src/components/Sidebar.tsx`

Navegação persistente pra quem está logado. Ícone-only quando colapsada
(76px), expande no hover **ou** foco de teclado (244px) revelando os
rótulos — a versão HTML/CSS que você aprovou no artifact vira isto em
React: cor/tipografia através do `theme.ts` (`sx`), a animação de largura e
o fade dos rótulos com Framer Motion.

**Os itens de navegação são uma lista simples** (`label`, `icon`,
`ativo`) — cada semana nova que adicionar uma tela (S5 "Treino de Hoje", S7
"Diagnóstico", S8 "Histórico") só precisa acrescentar um item aqui, não
redesenhar a sidebar.

```tsx
import { useState } from 'react';
import { Box, Stack, Typography, Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import InsightsIcon from '@mui/icons-material/Insights';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  ativo?: boolean;
  disponivel?: boolean; // false = tela ainda não existe (chega em semana futura)
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
```

> **Itens com `disponivel: false`** (Treino de hoje, Diagnóstico, Histórico)
> aparecem esmaecidos e sem clique — é assim que a sidebar já "anuncia" o
> mapa do app inteiro desde a S3, sem fingir que uma tela existe antes da
> hora. Quando a S5/S7/S8 implementarem essas telas, tirar o
> `disponivel: false` e ligar o roteamento de verdade (Passo 5).

---

## Passo 5 — `client/src/components/AppShell.tsx`

A casca de toda tela **logada**: sidebar fixa à esquerda + conteúdo com
espaço reservado (`padding-left`) pra ela nunca sobrepor o texto. É a
única mudança estrutural no fluxo: antes (S1–S3 sem design) o `App.tsx`
colocava o conteúdo direto; agora ele entra dentro do `AppShell`, que por
sua vez usa o `PageLayout` (Passo 2) só pro conteúdo — a sidebar fica fora
do `PageLayout`, porque não deve ter fade de entrada nem largura máxima
centralizada.

```tsx
import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { Sidebar } from './Sidebar';
import { PageLayout } from './PageLayout';

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
```

> `pl: '136px'` = 76px (largura colapsada da sidebar) + 20px (margem da
> sidebar até a borda) + 40px (respiro até o conteúdo). Não usa a largura
> **expandida** porque a sidebar flutua por cima do conteúdo quando abre
> (`position: fixed`) — não empurra o layout, é a mesma lógica do modelo
> original.
>
> **Telas sem usuário logado (`AuthView`) não usam `AppShell`** — não faz
> sentido mostrar navegação pra quem ainda não tem conta. `AuthView` continua
> usando só `<PageLayout>` direto (Passo 4 a seguir).

---

## Passo 6 — Ajustar `client/src/views/AuthView.tsx` (retroativo à S2)

Trocar os elementos HTML crus pelos equivalentes MUI. **A lógica de
`handleSubmit`, `useAuth`, os `useState` — nada disso muda.** É só a
camada visual.

- `<div>` externo → `<PageLayout>`
- `<h1>` → `<Typography variant="h1">`
- `<form>` → mantém `<form onSubmit={handleSubmit}>`, mas os `<input>` viram
  `<TextField>`
- `{erro && <p role="alert">...}` → `<FeedbackAlert erro={erro} />`
- `<button type="submit">` → `<Button type="submit" variant="contained">`
- `<button type="button">` (trocar login/registro) → `<Button variant="text">`

```tsx
import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { Typography, TextField, Button, Stack } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { PageLayout } from '../components/PageLayout';
import { FeedbackAlert } from '../components/FeedbackAlert';

export function AuthView() {
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { login, registrar } = useAuth();

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      if (modo === 'login') {
        await login(email, senha);
      } else {
        await registrar(nome, email, senha);
      }
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : 'Erro inesperado');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <PageLayout>
      <Typography variant="h1" gutterBottom>
        {modo === 'login' ? 'Entrar' : 'Criar conta'}
      </Typography>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          {modo === 'registro' && (
            <TextField
              label="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              fullWidth
            />
          )}
          <TextField
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            fullWidth
          />
          <FeedbackAlert erro={erro} />
          <Button type="submit" variant="contained" disabled={enviando}>
            {enviando ? 'Enviando...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
          </Button>
        </Stack>
      </form>
      <Button
        variant="text"
        onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}
        sx={{ mt: 2 }}
      >
        {modo === 'login' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
      </Button>
    </PageLayout>
  );
}
```

> **`App.tsx` e `DivisionView.tsx` (a tela da S3) não estão aqui** — como são
> específicos da S3, o código deles ficou direto em
> [`SEMANA3.md`](./SEMANA3.md) (Passo 6), já usando `AppShell`,
> `PageLayout` e `FeedbackAlert` definidos acima. Implemente os Passos 0–6
> deste arquivo primeiro (tema, fontes, `PageLayout`, `FeedbackAlert`,
> `Sidebar`, `AppShell`, `AuthView`); o Passo 6 do `SEMANA3.md` assume que
> eles já existem.

---

## Passo 7 — Fechar (parte desta base)

O fechamento completo (incluindo a tela "Minha Divisão") acontece no
Passo 7 do `SEMANA3.md`, depois que `App.tsx`/`DivisionView.tsx` existirem.
Aqui é só a checagem do que **esta base** já entrega sozinha:

1. Rodar `npm run dev` no client e conferir visualmente: tela de login e
   registro usando o tema (cor primária, fontes Sora/Plus Jakarta Sans,
   cantos arredondados).
2. Passar o mouse/dar Tab na sidebar (ela só aparece depois de logado —
   nesse ponto ainda sem `DivisionView`, o `AppShell` pode ser testado
   temporariamente envolvendo qualquer children, ex. um `<Typography>` de
   placeholder) — confirma que expande no hover **e** no foco de teclado.
3. Rodar `npm run build` — confirma que os tipos do MUI/Framer Motion não
   quebraram nada.
4. Commit descrevendo: "base de design (MUI + Framer Motion, sidebar
   flutuante) aplicada retroativamente ao Auth".

## Regras pra daqui pra frente (S4 em diante)

- Toda tela **logada** nova nasce dentro de `<AppShell>` (que já inclui
  `<PageLayout>` por dentro) — não usar `<PageLayout>` sozinho pra telas
  logadas, senão a sidebar some.
- Toda tela nova vira um item em `NAV_ITEMS` (`Sidebar.tsx`, Passo 4): tirar
  o `disponivel: false` quando a tela existir de verdade, e mover o
  `ativo: true` pra ela quando o roteamento existir.
- Todo erro/sucesso usa `<FeedbackAlert>` — nunca `<p role="alert">` cru de
  novo.
- Toda cor nova (se precisar) entra em `theme.ts`, nunca hardcoded
  (`sx={{ color: '#1E6F5C' }}`) espalhada pelos componentes — senão volta o
  mesmo problema que motivou esta base. Exceção assumida: os tons de fundo
  da sidebar (`#0F1B17`, `#C7D3CE`...) ficam hardcoded dentro do
  `Sidebar.tsx` mesmo, porque são específicos daquele componente (fundo
  sempre escuro, independente do tema claro/escuro do resto do app) — não
  espalhar esses valores em nenhum outro componente.
- Animação fica restrita a: entrada de página (`PageLayout`), aparecimento
  de alerta (`FeedbackAlert`), e expansão da sidebar (`Sidebar`). Não
  introduzir `motion` novo em outro lugar sem necessidade — o pedido foi
  "nada muito complexo", e sem Tailwind.
