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
      const response = await fetch('https://api.koios.rest/api/v1/address_assets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ _addresses: [addr] }),
      });
      if (!response.ok) {
        return res.status(502).json({ error: 'Upstream error from Koios', status: response.status });
      }
      const data = await response.json();

      if (raw) {
        return res.json(data);
      }

      // Normalize shape for convenience
      // Koios may return [{ address, asset_list: [...] }] or a flat array of assets
      const first = Array.isArray(data) ? data[0] : undefined;
      const assets: unknown[] = Array.isArray(first?.asset_list)
        ? (first.asset_list as unknown[])
        : Array.isArray(data)
          ? (data as unknown[])
          : [];

      return res.json({
        address: addr,
        provider: 'koios',
        fetchedAt: new Date().toISOString(),
        assetsCount: assets.length,
        assets,
      });
    } catch (err) {
      (req as any).log?.error({ err }, 'Failed to fetch assets from Koios');
      return res.status(500).json({ error: 'Failed to fetch assets' });
    }
  },
);

