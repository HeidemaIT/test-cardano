import { Router, type Request } from 'express';
import { z } from 'zod';
import { validateParams } from '../middleware/validate';

export const addressRouter = Router();

const AddressParamsSchema = z.object({
  addr: z.string().min(10),
});

addressRouter.get(
  '/address/:addr/assets',
  validateParams(AddressParamsSchema),
  async (req, res) => {
    const { addr } = req.params as { addr: string };
    const raw = req.query.raw === '1' || req.query.raw === 'true';
    try {
      // Fetch multiple datasets from Koios concurrently
      const [infoRes, utxosRes, assetsRes] = await Promise.all([
        fetch('https://api.koios.rest/api/v1/address_info', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ _addresses: [addr] }),
        }),
        fetch('https://api.koios.rest/api/v1/address_utxos', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ _addresses: [addr] }),
        }),
        fetch('https://api.koios.rest/api/v1/address_assets', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ _addresses: [addr] }),
        }),
      ]);

      // console.log('infoRes, utxosRes, assetsRes', infoRes, utxosRes, assetsRes);

      if (!infoRes.ok || !utxosRes.ok || !assetsRes.ok) {
        return res.status(502).json({
          error: 'Upstream error from Koios',
          statuses: {
            info: infoRes.status,
            utxos: utxosRes.status,
            assets: assetsRes.status,
          },
        });
      }

      const [infoRaw, utxosRaw, assetsRaw] = await Promise.all([
        infoRes.json(),
        utxosRes.json(),
        assetsRes.json(),
      ]);

      // Intentionally not logging raw Koios payloads to avoid verbose logs

      if (raw) {
        return res.json({ info: infoRaw, utxos: utxosRaw, assets: assetsRaw });
      }

      const infoFirst = Array.isArray(infoRaw) ? infoRaw[0] : undefined;
      const assetsFirst = Array.isArray(assetsRaw) ? assetsRaw[0] : undefined;
      type Asset = {
        policy_id?: string;
        asset_name?: string;
        quantity?: string | number;
        [k: string]: unknown;
      };
      type Utxo = {
        tx_hash?: string;
        tx_index?: number;
        value?: string | number;
        [k: string]: unknown;
      };
      const assets: Asset[] = Array.isArray(assetsFirst?.asset_list)
        ? (assetsFirst.asset_list as Asset[])
        : Array.isArray(assetsRaw)
          ? (assetsRaw as Asset[])
          : [];
      const utxos: Utxo[] = Array.isArray(utxosRaw) ? (utxosRaw as Utxo[]) : [];

      // Log a concise summary
      try {
        (req as Request & { log?: { info: (o: unknown, m?: string) => void } }).log?.info(
          { address: addr, assetsCount: assets.length, utxosCount: utxos.length },
          'Address data fetched from Koios',
        );
      } catch {
        // ignore logging errors
      }

      return res.json({
        address: addr,
        provider: 'koios',
        fetchedAt: new Date().toISOString(),
        info: infoFirst ?? infoRaw,
        utxosCount: utxos.length,
        assetsCount: assets.length,
        utxos,
        assets,
      });
    } catch (err) {
      (req as Request & { log?: { error: (o: unknown, m?: string) => void } }).log?.error(
        { err },
        'Failed to fetch assets from Koios',
      );
      return res.status(500).json({ error: 'Failed to fetch assets' });
    }
  },
);
