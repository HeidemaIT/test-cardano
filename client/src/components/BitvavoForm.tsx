import { useMemo, useState } from 'react';
import { Alert, Box, Button, Checkbox, FormControlLabel, Paper, TextField, Typography } from '@mui/material';

type ResponseShape = unknown;

export function BitvavoForm() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ResponseShape | null>(null);
  const [raw, setRaw] = useState(false);

  const apiBaseUrl = useMemo(() => {
    return (import.meta as unknown as { env: { VITE_API_BASE_URL?: string } }).env
      .VITE_API_BASE_URL ?? 'http://localhost:3000';
  }, []);

  async function fetchAssets() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const url = new URL(`${apiBaseUrl}/bitvavo/${address}/assets`);
      if (raw) url.searchParams.set('raw', '1');
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box>
      <Box display="flex" gap={2} alignItems="center">
        <TextField
          fullWidth
          label="Cardano address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="addr..."
        />
        <FormControlLabel control={<Checkbox checked={raw} onChange={(e) => setRaw(e.target.checked)} />} label="Raw" />
        <Button variant="contained" onClick={fetchAssets} disabled={loading || !address}>
          {loading ? 'Loading...' : 'Fetch'}
        </Button>
      </Box>

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
    </Box>
  );
}




