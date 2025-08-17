import { useState } from 'react';
import './App.css';
import { AppBar, Box, Tab, Tabs, Toolbar, Typography, Button } from '@mui/material';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Home from './pages/Home';
import KoiosPage from './pages/KoiosPage';
import CardanoscanPage from './pages/CardanoscanPage';
import CustomPage from './pages/CustomPage';
import BitvavoPage from './pages/BitvavoPage';
import LoginPage from './pages/LoginPage';

function AppContent() {
  const [, setProvider] = useState<'koios' | 'cardanoscan' | 'custom'>('koios');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  // Sync tab selection with route
  const currentTab: 'home' | 'koios' | 'cardanoscan' | 'custom' =
    location.pathname.startsWith('/cardanoscan')
      ? 'cardanoscan'
      : location.pathname.startsWith('/custom')
      ? 'custom'
      : location.pathname.startsWith('/koios')
      ? 'koios'
      : 'home';

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Cardano Wallet Assets
          </Typography>
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2">
                {user.email}
              </Typography>
              <Button 
                color="inherit" 
                onClick={handleLogout}
                variant="outlined"
                size="small"
              >
                Logout
              </Button>
            </Box>
          )}
        </Toolbar>
        {user && (
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
        )}
      </AppBar>

      <Box component="main" sx={{ flex: 1, minHeight: '100vh', width: '100%', bgcolor: 'background.default' }}>
        <Box sx={{ width: '100%' }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/koios" element={
              <ProtectedRoute>
                <KoiosPage />
              </ProtectedRoute>
            } />
            <Route path="/cardanoscan" element={
              <ProtectedRoute>
                <CardanoscanPage />
              </ProtectedRoute>
            } />
            <Route path="/custom" element={
              <ProtectedRoute>
                <CustomPage />
              </ProtectedRoute>
            } />
            <Route path="/bitvavo" element={
              <ProtectedRoute>
                <BitvavoPage />
              </ProtectedRoute>
            } />
            {/* Catch all route - redirect to login if not authenticated */}
            <Route path="*" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
          </Routes>
        </Box>
      </Box>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
