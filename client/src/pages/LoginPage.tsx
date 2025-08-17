import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Alert, 
  Box, 
  Button, 
  Container, 
  TextField, 
  Typography, 
  AppBar, 
  Toolbar, 
  IconButton,
  Paper 
} from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  async function sendMagicLink() {
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (err) throw err;
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Cardano Wallet Assets
          </Typography>
          <IconButton
            color="inherit"
            onClick={toggleTheme}
            sx={{ ml: 1 }}
            aria-label="toggle theme"
          >
            {isDarkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
            Welcome Back
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Enter your email to receive a magic link for secure login
          </Typography>
          
          <Box component="form" onSubmit={(e) => { e.preventDefault(); sendMagicLink(); }}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              sx={{ mb: 3 }}
              required
            />
            <Button 
              fullWidth
              variant="contained" 
              onClick={sendMagicLink} 
              disabled={loading || !email}
              size="large"
              sx={{ mb: 2 }}
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </Button>
          </Box>
          
          {sent && (
            <Alert sx={{ mt: 3 }} severity="success">
              Check your email for a login link. It may take a few minutes to arrive.
            </Alert>
          )}
          {error && (
            <Alert sx={{ mt: 3 }} severity="error">
              {error}
            </Alert>
          )}
        </Paper>
      </Container>
    </>
  );
}




