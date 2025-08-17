import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useServerSavedAddresses } from '../hooks/useServerSavedAddresses';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Email as EmailIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Logout as LogoutIcon,
  ArrowBack as ArrowBackIcon,
  AccountBalance as AccountBalanceIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

export default function UserPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const { savedAddresses, removeAddress, clearAddresses, loading: addressesLoading } = useServerSavedAddresses();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleAddressClick = (address: string) => {
    // Navigate to Koios page with the address pre-filled
    navigate('/koios', { state: { selectedAddress: address } });
  };

  const handleAddressRemove = async (address: string) => {
    // Find the provider for this address
    const savedAddress = savedAddresses.find(addr => addr.address === address);
    if (savedAddress) {
      await removeAddress(address, savedAddress.provider);
    }
  };

  const handleClearAllAddresses = () => {
    clearAddresses();
    setShowClearDialog(false);
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">You must be logged in to view this page.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToHome}
          variant="outlined"
        >
          Back to Home
        </Button>
        <Typography variant="h4" component="h1">
          User Profile
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon />
          Account Information
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <List>
          <ListItem>
            <ListItemIcon>
              <EmailIcon />
            </ListItemIcon>
            <ListItemText
              primary="Email Address"
              secondary={user.email || 'No email available'}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <SecurityIcon />
            </ListItemIcon>
            <ListItemText
              primary="User ID"
              secondary={user.id}
            />
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceIcon />
            Saved Addresses
          </Typography>
          {savedAddresses.length > 0 && (
            <Tooltip title="Clear all saved addresses">
              <IconButton
                size="small"
                onClick={() => setShowClearDialog(true)}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        {savedAddresses.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography color="text.secondary" variant="body2">
              No saved addresses yet. Addresses will appear here after you successfully fetch data for them.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {savedAddresses.map((savedAddress) => (
              <Box
                key={savedAddress.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <Chip
                  label={`${savedAddress.address} (${savedAddress.provider})`}
                  size="small"
                  clickable
                  onClick={() => handleAddressClick(savedAddress.address)}
                  sx={{
                    flexGrow: 1,
                    justifyContent: 'flex-start',
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    },
                  }}
                />
                <Tooltip title="Remove address">
                  <IconButton
                    size="small"
                    onClick={() => handleAddressRemove(savedAddress.address)}
                    color="error"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon />
          Account Actions
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/')}
          >
            View Wallet Assets
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={() => setShowLogoutDialog(true)}
          >
            Sign Out
          </Button>
        </Box>
      </Paper>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onClose={() => setShowLogoutDialog(false)}>
        <DialogTitle>Confirm Sign Out</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to sign out? You will need to log in again to access your account.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLogoutDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleLogout} color="error" variant="contained">
            Sign Out
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear All Addresses Confirmation Dialog */}
      <Dialog open={showClearDialog} onClose={() => setShowClearDialog(false)}>
        <DialogTitle>Clear All Saved Addresses</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove all saved addresses? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowClearDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleClearAllAddresses} color="error" variant="contained">
            Clear All
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
