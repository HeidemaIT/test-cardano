import { useMemo, useState } from 'react';
import { Alert, Box, Button, Checkbox, FormControlLabel, Paper, TextField, Typography, Snackbar } from '@mui/material';
import { useServerSavedAddresses } from '../hooks/useServerSavedAddresses';
import { SavedAddresses } from './SavedAddresses';
import { supabase } from '../lib/supabase';

type ResponseShape = unknown;

export function CustomForm() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ResponseShape | null>(null);
  const [raw, setRaw] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [lastSuccessfulAddress, setLastSuccessfulAddress] = useState<string>('');

  const { savedAddresses, addAddress, removeAddress, clearAddresses, loading: addressesLoading } = useServerSavedAddresses();

  const apiBaseUrl = useMemo(() => {
    return (import.meta as unknown as { env: { VITE_API_BASE_URL?: string } }).env
      .VITE_API_BASE_URL ?? 'http://localhost:3000';
  }, []);

  async function fetchAssets() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const url = new URL(`${apiBaseUrl}/custom/${address}/assets`);
      if (raw) url.searchParams.set('raw', '1');
      // Get auth headers
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const res = await fetch(url.toString(), { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      setData(result);
      
      // Show save prompt if this is a new address and it was successfully saved
      if (result.address && result.saved) {
        const isAlreadySaved = savedAddresses.some(addr => addr.address === result.address);
        if (!isAlreadySaved) {
          setLastSuccessfulAddress(result.address);
          setShowSavePrompt(true);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const handleSaveAddress = async () => {
    if (lastSuccessfulAddress) {
      const success = await addAddress(lastSuccessfulAddress, 'custom');
      if (success) {
        setShowSavePrompt(false);
      }
    }
  };

  const handleDismissSavePrompt = () => {
    setShowSavePrompt(false);
  };

  const handleAddressClick = (clickedAddress: string) => {
    setAddress(clickedAddress);
  };

  const handleAddressRemove = async (addressToRemove: string) => {
    await removeAddress(addressToRemove, 'custom');
  };

  return (
    <Box>
      <Box display="flex" gap={2} alignItems="center">
        <TextField fullWidth label="Cardano address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="addr..." />
        <FormControlLabel control={<Checkbox checked={raw} onChange={(e) => setRaw(e.target.checked)} />} label="Raw" />
        <Button variant="contained" onClick={fetchAssets} disabled={loading || !address}>
          {loading ? 'Loading...' : 'Fetch'}
        </Button>
      </Box>

      <SavedAddresses
        addresses={savedAddresses.map(addr => addr.address)}
        onAddressClick={handleAddressClick}
        onAddressRemove={handleAddressRemove}
        onClearAll={clearAddresses}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {data ? (
        <Box mt={2}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1">Response</Typography>
            <pre style={{ margin: 0 }}>{JSON.stringify(data, null, 2)}</pre>
          </Paper>
        </Box>
      ) : null}

      <Snackbar
        open={showSavePrompt}
        autoHideDuration={6000}
        onClose={handleDismissSavePrompt}
        message={`Successfully fetched data for ${lastSuccessfulAddress}. Save this address for quick access?`}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button color="primary" size="small" onClick={handleSaveAddress}>
              Save
            </Button>
            <Button color="inherit" size="small" onClick={handleDismissSavePrompt}>
              Dismiss
            </Button>
          </Box>
        }
      />
    </Box>
  );
}


