import { Router } from 'express';
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

      if (raw) {
        return res.json({ info: infoRaw, utxos: utxosRaw, assets: assetsRaw });
      }

      const infoFirst = Array.isArray(infoRaw) ? infoRaw[0] : undefined;
      const assetsFirst = Array.isArray(assetsRaw) ? assetsRaw[0] : undefined;
      const assets: unknown[] = Array.isArray(assetsFirst?.asset_list)
        ? (assetsFirst.asset_list as unknown[])
        : Array.isArray(assetsRaw)
          ? (assetsRaw as unknown[])
          : [];
      const utxos: unknown[] = Array.isArray(utxosRaw) ? (utxosRaw as unknown[]) : [];

      // Log a concise summary
      try {
        (req as any).log?.info(
          { address: addr, assetsCount: assets.length, utxosCount: utxos.length },
          'Address data fetched from Koios',
        );
      } catch (_) {
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
      (req as any).log?.error({ err }, 'Failed to fetch assets from Koios');
      return res.status(500).json({ error: 'Failed to fetch assets' });
    }
  },
);

