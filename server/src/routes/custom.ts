import { Router } from 'express';
import { z } from 'zod';
import { validateParams } from '../middleware/validate';
import { env } from '../config/env';

export const customRouter = Router();

const AddressParamsSchema = z.object({
  addr: z.string().min(10),
});

customRouter.get(
  '/custom/:addr/assets',
  validateParams(AddressParamsSchema),
  async (req, res) => {
    const { addr } = req.params as { addr: string };
    const raw = req.query.raw === '1' || req.query.raw === 'true';

    if (!env.CUSTOM_INFO_URL || !env.CUSTOM_UTXOS_URL || !env.CUSTOM_ASSETS_URL) {
      return res.status(501).json({ error: 'Custom provider not configured' });
    }

    try {
      const [infoRes, utxosRes, assetsRes] = await Promise.all([
        fetch(env.CUSTOM_INFO_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ _addresses: [addr] }),
        }),
        fetch(env.CUSTOM_UTXOS_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ _addresses: [addr] }),
        }),
        fetch(env.CUSTOM_ASSETS_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ _addresses: [addr] }),
        }),
      ]);

      if (!infoRes.ok || !utxosRes.ok || !assetsRes.ok) {
        return res.status(502).json({
          error: 'Upstream error from Custom provider',
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

      return res.json({
        address: addr,
        provider: 'custom',
        fetchedAt: new Date().toISOString(),
        info: infoFirst ?? infoRaw,
        utxosCount: utxos.length,
        assetsCount: assets.length,
        utxos,
        assets,
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch assets' });
    }
  },
);


