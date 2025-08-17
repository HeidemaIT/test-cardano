import { useMemo, useState } from 'react';
import { Alert, Box, Button, Checkbox, FormControlLabel, Paper, TextField, Typography, Snackbar } from '@mui/material';
import { useSavedAddresses } from '../hooks/useSavedAddresses';
import { SavedAddresses } from './SavedAddresses';

type ResponseShape = unknown;

export function CustomForm() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ResponseShape | null>(null);
  const [raw, setRaw] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [lastSuccessfulAddress, setLastSuccessfulAddress] = useState<string>('');

  const { savedAddresses, addAddress, removeAddress, clearAddresses } = useSavedAddresses();

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
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      setData(result);
      
      // Show save prompt if this is a new address
      if (address && !savedAddresses.includes(address)) {
        setLastSuccessfulAddress(address);
        setShowSavePrompt(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const handleSaveAddress = () => {
    if (lastSuccessfulAddress) {
      addAddress(lastSuccessfulAddress);
      setShowSavePrompt(false);
    }
  };

  const handleDismissSavePrompt = () => {
    setShowSavePrompt(false);
  };

  const handleAddressClick = (clickedAddress: string) => {
    setAddress(clickedAddress);
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
        addresses={savedAddresses}
        onAddressClick={handleAddressClick}
        onAddressRemove={removeAddress}
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


