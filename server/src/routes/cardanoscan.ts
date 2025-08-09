import { Router } from 'express';
import { z } from 'zod';
import { validateParams } from '../middleware/validate';
import { env } from '../config/env';

export const cardanoscanRouter = Router();

const AddressParamsSchema = z.object({
  addr: z.string().min(10),
});

function buildUrl(template: string | undefined, addr: string): string | null {
  if (!template) return null;
  return template.replace('{addr}', encodeURIComponent(addr));
}

function buildFromBase(base: string | undefined, path: string, addr: string): string | null {
  if (!base) return null;
  const normalized = base.replace(/\/$/, '');
  return `${normalized}${path}`.replace('{addr}', encodeURIComponent(addr));
}

cardanoscanRouter.get(
  '/cardanoscan/:addr/assets',
  validateParams(AddressParamsSchema),
  async (req, res) => {
    const { addr } = req.params as { addr: string };
    const raw = req.query.raw === '1' || req.query.raw === 'true';

    const infoUrl =
      buildUrl(env.CARDANOSCAN_INFO_URL_TEMPLATE, addr) ||
      buildFromBase(env.CARDANOSCAN_BASE_URL, '/address/{addr}/info', addr);
    const utxosUrl =
      buildUrl(env.CARDANOSCAN_UTXOS_URL_TEMPLATE, addr) ||
      buildFromBase(env.CARDANOSCAN_BASE_URL, '/address/{addr}/utxos', addr);
    const assetsUrl =
      buildUrl(env.CARDANOSCAN_ASSETS_URL_TEMPLATE, addr) ||
      buildFromBase(env.CARDANOSCAN_BASE_URL, '/address/{addr}/assets', addr);
    if (!infoUrl || !utxosUrl || !assetsUrl) {
      return res.status(501).json({ error: 'Cardanoscan provider not configured' });
    }

    const headers: Record<string, string> = {};
    if (env.CARDANOSCAN_API_KEY) headers['authorization'] = `Bearer ${env.CARDANOSCAN_API_KEY}`;

    try {
      const [infoRes, utxosRes, assetsRes] = await Promise.all([
        fetch(infoUrl, { headers }),
        fetch(utxosUrl, { headers }),
        fetch(assetsUrl, { headers }),
      ]);

      if (!infoRes.ok || !utxosRes.ok || !assetsRes.ok) {
        return res.status(502).json({
          error: 'Upstream error from Cardanoscan provider',
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
        provider: 'cardanoscan',
        fetchedAt: new Date().toISOString(),
        info: infoFirst ?? infoRaw,
        utxosCount: utxos.length,
        assetsCount: assets.length,
        utxos,
        assets,
      });
    } catch (_err) {
      return res.status(500).json({ error: 'Failed to fetch assets' });
    }
  },
);
