import { useMemo, useState } from 'react';
import './App.css';

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
    <div style={{ maxWidth: 880, margin: '0 auto', padding: 24 }}>
      <h1>Cardano Address Assets</h1>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          style={{ flex: 1, padding: 8 }}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter Cardano address (addr...)"
        />
        <button onClick={fetchAssets} disabled={loading || !address}>
          {loading ? 'Loading...' : 'Fetch'}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 12, color: 'crimson' }}>Error: {error}</div>
      )}

      {data && (
        <div style={{ marginTop: 16 }}>
          {'address' in maybeSummary && (
            <div style={{ marginBottom: 12 }}>
              <div>
                <strong>Address:</strong> {maybeSummary.address}
              </div>
              <div>
                <strong>Assets count:</strong> {maybeSummary.assetsCount}
              </div>
              <div>
                <strong>Provider:</strong> {maybeSummary.provider}
              </div>
              <div>
                <strong>Fetched:</strong> {maybeSummary.fetchedAt}
              </div>
            </div>
          )}

          {'assets' in maybeSummary && Array.isArray(maybeSummary.assets) && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>policy_id</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>asset_name</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>quantity</th>
                </tr>
              </thead>
              <tbody>
                {maybeSummary.assets.map((a: AssetSummary, idx: number) => (
                  <tr key={idx}>
                    <td style={{ padding: '6px 4px' }}>{String(a.policy_id ?? '')}</td>
                    <td style={{ padding: '6px 4px' }}>{String(a.asset_name ?? '')}</td>
                    <td style={{ padding: '6px 4px' }}>{String(a.quantity ?? '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!('assets' in maybeSummary) && (
            <pre style={{ marginTop: 12 }}>{JSON.stringify(data, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
