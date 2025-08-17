import { useState } from 'react';
import './App.css';
import { AppBar, Box, Tab, Tabs, Toolbar, Typography, Button, IconButton } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { ProtectedRoute } from './components/ProtectedRoute';
import Home from './pages/Home';
import KoiosPage from './pages/KoiosPage';
import CardanoscanPage from './pages/CardanoscanPage';
import CustomPage from './pages/CustomPage';
import BitvavoPage from './pages/BitvavoPage';
import LoginPage from './pages/LoginPage';
import UserPage from './pages/UserPage';

function AppContent() {
  const [, setProvider] = useState<'koios' | 'cardanoscan' | 'custom' | 'bitvavo'>('koios');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  
  // Sync tab selection with route
  const currentTab: 'home' | 'koios' | 'cardanoscan' | 'custom' | 'bitvavo' =
    location.pathname.startsWith('/cardanoscan')
      ? 'cardanoscan'
      : location.pathname.startsWith('/custom')
      ? 'custom'
      : location.pathname.startsWith('/koios')
      ? 'koios'
      : location.pathname.startsWith('/bitvavo')
      ? 'bitvavo'
      : 'home';

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleTabChange = (_e: React.SyntheticEvent, v: string) => {
    setProvider(v as 'koios' | 'cardanoscan' | 'custom' | 'bitvavo');
    navigate(
      v === 'home' ? '/' : 
      v === 'koios' ? '/koios' : 
      v === 'cardanoscan' ? '/cardanoscan' : 
      v === 'custom' ? '/custom' :
      v === 'bitvavo' ? '/bitvavo' : '/'
    );
  };

  const handleUserClick = () => {
    navigate('/user');
  };

  return (
    <>
      {user && (
        <AppBar position="sticky">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Cardano Wallet Assets
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                color="inherit"
                onClick={toggleTheme}
                sx={{ ml: 1 }}
                aria-label="toggle theme"
              >
                {isDarkMode ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
              <Button
                color="inherit"
                onClick={handleUserClick}
                variant="outlined"
                size="small"
                sx={{ textTransform: 'none' }}
              >
                {user.email}
              </Button>
              <Button
                color="inherit"
                onClick={handleLogout}
                variant="outlined"
                size="small"
              >
                Logout
              </Button>
            </Box>
          </Toolbar>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ px: 2 }}
          >
            <Tab value="home" label="Home" />
            <Tab value="koios" label="Koios" />
            <Tab value="cardanoscan" label="Cardanoscan" />
            <Tab value="custom" label="Custom" />
            <Tab value="bitvavo" label="Bitvavo" />
          </Tabs>
        </AppBar>
      )}

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
            <Route path="/koios/:address" element={
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
            <Route path="/user" element={
              <ProtectedRoute>
                <UserPage />
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
