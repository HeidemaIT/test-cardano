import { useState } from 'react';
import './App.css';
import { AppBar, Box, Tab, Tabs, Toolbar, Typography } from '@mui/material';
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
  const currentTab: 'home' | 'koios' | 'cardanoscan' | 'custom' =
    location.pathname.startsWith('/cardanoscan')
      ? 'cardanoscan'
      : location.pathname.startsWith('/custom')
      ? 'custom'
      : location.pathname.startsWith('/koios')
      ? 'koios'
      : 'home';

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Cardano Wallet Assets
          </Typography>
        </Toolbar>
        <Tabs
          value={currentTab}
          onChange={(_e, v) => {
            setProvider(v);
            navigate(
              v === 'home' ? '/' : v === 'koios' ? '/koios' : v === 'cardanoscan' ? '/cardanoscan' : '/custom',
            );
          }}
          textColor="inherit"
          indicatorColor="secondary"
          sx={{ px: 2 }}
        >
          <Tab value="home" label="Home" />
          <Tab value="koios" label="Koios" />
          <Tab value="cardanoscan" label="Cardanoscan" />
          <Tab value="custom" label="Custom" />
        </Tabs>
      </AppBar>

      <Box component="main" sx={{ flex: 1, minHeight: '100vh', width: '100%', bgcolor: 'background.default' }}>
        <Box sx={{ width: '100%' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/koios" element={<KoiosPage />} />
            <Route path="/cardanoscan" element={<CardanoscanPage />} />
            <Route path="/custom" element={<CustomPage />} />
          </Routes>
        </Box>
      </Box>
    </>
  );
}

export default App;
