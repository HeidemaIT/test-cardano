import { useMemo, useState } from 'react';
import { Alert, Box, Button, Checkbox, FormControlLabel, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';

type AssetSummary = {
  policy_id?: string;
  asset_name?: string;
  quantity?: string | number;
  [key: string]: unknown;
};

type Summary = {
  address?: string;
  provider?: string;
  fetchedAt?: string;
  assetsCount?: number;
  utxosCount?: number;
  info?: Record<string, unknown>;
  assets?: AssetSummary[];
  utxos?: Array<{ tx_hash?: string; tx_index?: number; value?: string | number }>;
};

export function KoiosForm() {
  const [address, setAddress] = useState('addr1...');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Summary | null>(null);
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
      const url = new URL(`${apiBaseUrl}/address/${address}/assets`);
      if (raw) url.searchParams.set('raw', '1');
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((await res.json()) as Summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const summary = data as Summary;

  return (
    <Box>
      <Box display="flex" gap={2} alignItems="center">
        <TextField fullWidth label="Cardano address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="addr..." />
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
          {raw && (
            <Paper sx={{ p: 2 }}>
              <pre style={{ margin: 0 }}>{JSON.stringify(data, null, 2)}</pre>
            </Paper>
          )}

          {!raw && 'address' in summary && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1">Summary</Typography>
              <Typography variant="body2">Address: {summary.address}</Typography>
              <Typography variant="body2">Assets count: {summary.assetsCount}</Typography>
              <Typography variant="body2">Provider: {summary.provider}</Typography>
              <Typography variant="body2">Fetched: {summary.fetchedAt}</Typography>
              {'utxosCount' in summary && (
                <Typography variant="body2">UTXOs count: {summary.utxosCount}</Typography>
              )}
            </Paper>
          )}

          {!raw && 'assets' in summary && Array.isArray(summary.assets) && (
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>policy_id</TableCell>
                    <TableCell>asset_name</TableCell>
                    <TableCell>quantity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.assets.map((a: AssetSummary, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ wordBreak: 'break-all' }}>{String(a.policy_id ?? '')}</TableCell>
                      <TableCell sx={{ wordBreak: 'break-all' }}>{String(a.asset_name ?? '')}</TableCell>
                      <TableCell sx={{ wordBreak: 'break-all' }}>{String(a.quantity ?? '')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      ) : null}
    </Box>
  );
}


