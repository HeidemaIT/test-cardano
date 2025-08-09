import { useState } from 'react';
import './App.css';
import { AppBar, Container, IconButton, Tab, Tabs, Toolbar, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import KoiosPage from './pages/KoiosPage';
import CardanoscanPage from './pages/CardanoscanPage';
import CustomPage from './pages/CustomPage';

function App() {
  const [, setProvider] = useState<'koios' | 'cardanoscan' | 'custom'>('koios');
  const location = useLocation();
  const navigate = useNavigate();
  // Sync tab selection with route
  const currentTab: 'koios' | 'cardanoscan' | 'custom' | false =
    location.pathname.startsWith('/cardanoscan')
      ? 'cardanoscan'
      : location.pathname.startsWith('/custom')
      ? 'custom'
      : location.pathname.startsWith('/koios')
      ? 'koios'
      : false;

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Cardano Wallet Assets
          </Typography>
        </Toolbar>
        <Tabs
          value={currentTab}
          onChange={(_e, v) => {
            setProvider(v);
            navigate(v === 'koios' ? '/koios' : v === 'cardanoscan' ? '/cardanoscan' : '/custom');
          }}
          textColor="inherit"
          indicatorColor="secondary"
          sx={{ px: 2 }}
        >
          <Tab value="koios" label="Koios" />
          <Tab value="cardanoscan" label="Cardanoscan" />
          <Tab value="custom" label="Custom" />
        </Tabs>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/koios" element={<KoiosPage />} />
          <Route path="/cardanoscan" element={<CardanoscanPage />} />
          <Route path="/custom" element={<CustomPage />} />
        </Routes>
      </Container>
    </>
  );
}

export default App;
