import { useMemo, useState, useEffect } from 'react';
import { Alert, Box, Button, Checkbox, FormControlLabel, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Snackbar } from '@mui/material';
import { useServerSavedAddresses } from '../hooks/useServerSavedAddresses';
import { SavedAddresses } from './SavedAddresses';
import { supabase } from '../lib/supabase';

type AssetSummary = {
  policy_id?: string;
  asset_name?: string;
  display_name?: string;
  ticker?: string;
  decimals?: number;
  logo?: string;
  quantity?: string | number;
  ada_value?: number;
  usd_value?: number;
  eur_value?: number;
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

interface KoiosFormProps {
  initialAddress?: string;
}

export function KoiosForm({ initialAddress }: KoiosFormProps) {
  // Helper function to format currency values
  const formatCurrency = (value: number | undefined, currency: 'USD' | 'EUR') => {
    if (value === undefined || value === 0) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const [address, setAddress] = useState(initialAddress || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Summary | null>(null);
  const [raw, setRaw] = useState(false);
  const [showTechnicalColumns, setShowTechnicalColumns] = useState(true);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [lastSuccessfulAddress, setLastSuccessfulAddress] = useState<string>('');

          const { savedAddresses, addAddress, removeAddress, clearAddresses } = useServerSavedAddresses();

  // Update address when initialAddress prop changes
  useEffect(() => {
    if (initialAddress) {
      setAddress(initialAddress);
    }
  }, [initialAddress]);

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
      const result = await res.json() as Summary;
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
      const success = await addAddress(lastSuccessfulAddress, 'koios');
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
          await removeAddress(addressToRemove, 'koios');
        };

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
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2">Assets ({summary.assets.length})</Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showTechnicalColumns}
                      onChange={(e) => setShowTechnicalColumns(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Show technical details"
                />
              </Box>
              <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                <Table size="small">
                <TableHead>
                  <TableRow>
                    {showTechnicalColumns && <TableCell>Policy ID</TableCell>}
                    {showTechnicalColumns && <TableCell>Asset Name</TableCell>}
                    <TableCell>Display Name</TableCell>
                    {showTechnicalColumns && <TableCell>Ticker</TableCell>}
                    <TableCell>Quantity</TableCell>
                    <TableCell>Value (USD)</TableCell>
                    <TableCell>Value (EUR)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.assets.map((a: AssetSummary, idx: number) => (
                    <TableRow key={idx}>
                      {showTechnicalColumns && (
                        <TableCell sx={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>{String(a.policy_id ?? '')}</TableCell>
                      )}
                      {showTechnicalColumns && (
                        <TableCell sx={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>{String(a.asset_name ?? '')}</TableCell>
                      )}
                      <TableCell sx={{ wordBreak: 'break-all', fontWeight: 'bold' }}>{String(a.display_name ?? a.asset_name ?? '')}</TableCell>
                      {showTechnicalColumns && (
                        <TableCell sx={{ wordBreak: 'break-all' }}>{String(a.ticker ?? '')}</TableCell>
                      )}
                      <TableCell sx={{ wordBreak: 'break-all' }}>{String(a.quantity ?? '')}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        {formatCurrency(a.usd_value, 'USD')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        {formatCurrency(a.eur_value, 'EUR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            </Box>
          )}
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


