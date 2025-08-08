import { useMemo, useState } from 'react';
import './App.css';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

type AssetSummary = {
  policy_id?: string;
  asset_name?: string;
  quantity?: string | number;
  [key: string]: unknown;
};

type ApiResponse =
  | {
      address: string;
      provider: string;
      fetchedAt: string;
      info?: Record<string, unknown>;
      assetsCount: number;
      utxosCount?: number;
      assets: AssetSummary[];
      utxos?: Array<Record<string, unknown>>;
    }
  | unknown;

function App() {
  const [address, setAddress] = useState(
    'addr1q9872xmn7jqgnh4n2h9nr52v38a4mm2xvgeg9tq3nhrhan45hmjtmx580zvj4dcylkp6w2twlzekrk9apsreqah8glhsjeuc96',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [raw, setRaw] = useState(false);

  const apiBaseUrl = useMemo(() => {
    return (import.meta as any).env.VITE_API_BASE_URL ?? 'http://localhost:3000';
  }, []);

  async function fetchAssets() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const url = new URL(`${apiBaseUrl}/address/${address}/assets`);
      if (raw) url.searchParams.set('raw', '1');
      const res = await fetch(url.toString());
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const json = (await res.json()) as ApiResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const maybeSummary = data as any;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Cardano Address Assets
      </Typography>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        sx={{ width: '100%' }}
      >
        <TextField
          fullWidth
          label="Cardano address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="addr..."
        />
        <FormControlLabel
          control={<Checkbox checked={raw} onChange={(e) => setRaw(e.target.checked)} />}
          label="Raw"
        />
        <Button
          variant="contained"
          onClick={fetchAssets}
          disabled={loading || !address}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          {loading ? 'Loading...' : 'Fetch'}
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {data && (
        <Box mt={2}>
          {raw && (
            <Paper sx={{ p: 2 }}>
              <pre style={{ margin: 0 }}>{JSON.stringify(data, null, 2)}</pre>
            </Paper>
          )}

          {!raw && 'address' in maybeSummary && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1">Summary</Typography>
              <Typography variant="body2">Address: {maybeSummary.address}</Typography>
              <Typography variant="body2">Assets count: {maybeSummary.assetsCount}</Typography>
              <Typography variant="body2">Provider: {maybeSummary.provider}</Typography>
              <Typography variant="body2">Fetched: {maybeSummary.fetchedAt}</Typography>
              {'utxosCount' in maybeSummary && (
                <Typography variant="body2">UTXOs count: {maybeSummary.utxosCount}</Typography>
              )}
              {'info' in maybeSummary && maybeSummary.info && (
                <Box mt={1}>
                  <Typography variant="subtitle2">Info</Typography>
                  <pre style={{ margin: 0 }}>{JSON.stringify(maybeSummary.info, null, 2)}</pre>
                </Box>
              )}
            </Paper>
          )}

          {!raw && 'assets' in maybeSummary && Array.isArray(maybeSummary.assets) && (
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>policy_id</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>asset_name</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>quantity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {maybeSummary.assets.map((a: AssetSummary, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ wordBreak: 'break-all' }}>
                        {String(a.policy_id ?? '')}
                      </TableCell>
                      <TableCell sx={{ wordBreak: 'break-all' }}>
                        {String(a.asset_name ?? '')}
                      </TableCell>
                      <TableCell sx={{ wordBreak: 'break-all' }}>
                        {String(a.quantity ?? '')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {!raw && 'utxos' in maybeSummary && Array.isArray(maybeSummary.utxos) && (
            <TableContainer component={Paper} sx={{ mt: 2, overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>tx_hash</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>tx_index</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {maybeSummary.utxos.map((u: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ wordBreak: 'break-all' }}>{String(u.tx_hash ?? '')}</TableCell>
                      <TableCell sx={{ wordBreak: 'break-all' }}>{String(u.tx_index ?? '')}</TableCell>
                      <TableCell sx={{ wordBreak: 'break-all' }}>{String(u.value ?? '')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
    </Container>
  );
}

export default App;
