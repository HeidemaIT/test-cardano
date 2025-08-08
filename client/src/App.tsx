import { useMemo, useState } from 'react';
import './App.css';
import {
  Alert,
  Box,
  Button,
  Container,
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
      assetsCount: number;
      assets: AssetSummary[];
    }
  | unknown;

function App() {
  const [address, setAddress] = useState(
    'addr1q9d9p4k0q3yqf7xp9a9h5r0d7k6l0cnyy9n9r5f2w9c9vqd0gqf0a99u0q2',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);

  const apiBaseUrl = useMemo(() => {
    return (import.meta as any).env.VITE_API_BASE_URL ?? 'http://localhost:3000';
  }, []);

  async function fetchAssets() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`${apiBaseUrl}/address/${address}/assets`);
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Cardano Address Assets
      </Typography>

      <Box display="flex" gap={2}>
        <TextField
          fullWidth
          label="Cardano address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="addr..."
        />
        <Button variant="contained" onClick={fetchAssets} disabled={loading || !address}>
          {loading ? 'Loading...' : 'Fetch'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {data && (
        <Box mt={2}>
          {'address' in maybeSummary && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1">Summary</Typography>
              <Typography variant="body2">Address: {maybeSummary.address}</Typography>
              <Typography variant="body2">Assets count: {maybeSummary.assetsCount}</Typography>
              <Typography variant="body2">Provider: {maybeSummary.provider}</Typography>
              <Typography variant="body2">Fetched: {maybeSummary.fetchedAt}</Typography>
            </Paper>
          )}

          {'assets' in maybeSummary && Array.isArray(maybeSummary.assets) && (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>policy_id</TableCell>
                    <TableCell>asset_name</TableCell>
                    <TableCell>quantity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {maybeSummary.assets.map((a: AssetSummary, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{String(a.policy_id ?? '')}</TableCell>
                      <TableCell>{String(a.asset_name ?? '')}</TableCell>
                      <TableCell>{String(a.quantity ?? '')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {!('assets' in maybeSummary) && (
            <Paper sx={{ p: 2, mt: 2 }}>
              <pre style={{ margin: 0 }}>{JSON.stringify(data, null, 2)}</pre>
            </Paper>
          )}
        </Box>
      )}
    </Container>
  );
}

export default App;
