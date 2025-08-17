import { Router } from 'express';
import { z } from 'zod';
import { validateParams } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.js';
import { AddressService } from '../services/addressService.js';
import { env } from '../config/env';

export const cardanoscanRouter = Router();

// Apply authentication middleware to all routes
cardanoscanRouter.use(authMiddleware.authenticate);

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

    // Debug logging
    console.log('Cardanoscan environment variables:');
    console.log('CARDANOSCAN_INFO_URL_TEMPLATE:', env.CARDANOSCAN_INFO_URL_TEMPLATE);
    console.log('CARDANOSCAN_UTXOS_URL_TEMPLATE:', env.CARDANOSCAN_UTXOS_URL_TEMPLATE);
    console.log('CARDANOSCAN_ASSETS_URL_TEMPLATE:', env.CARDANOSCAN_ASSETS_URL_TEMPLATE);
    console.log('CARDANOSCAN_BASE_URL:', env.CARDANOSCAN_BASE_URL);
    console.log('CARDANOSCAN_API_KEY:', env.CARDANOSCAN_API_KEY ? '***' : 'not set');

    // Temporary hardcoded URLs for testing
    const infoUrl = `https://api.cardanoscan.io/api/v1/address/${encodeURIComponent(addr)}/info`;
    const utxosUrl = `https://api.cardanoscan.io/api/v1/address/${encodeURIComponent(addr)}/utxos`;
    const assetsUrl = `https://api.cardanoscan.io/api/v1/address/${encodeURIComponent(addr)}/assets`;
    
    console.log('Built URLs:');
    console.log('infoUrl:', infoUrl);
    console.log('utxosUrl:', utxosUrl);
    console.log('assetsUrl:', assetsUrl);

    const headers: Record<string, string> = {};
    if (env.CARDANOSCAN_API_KEY) headers['authorization'] = `Bearer ${env.CARDANOSCAN_API_KEY}`;

    try {
      const [infoRes, utxosRes, assetsRes] = await Promise.all([
        fetch(infoUrl, { headers }),
        fetch(utxosUrl, { headers }),
        fetch(assetsUrl, { headers }),
      ]);

      if (!infoRes.ok || !utxosRes.ok || !assetsRes.ok) {
        // Check if it's an authentication error
        if (infoRes.status === 401 || utxosRes.status === 401 || assetsRes.status === 401) {
          return res.status(401).json({
            error: 'Cardanoscan API authentication failed. Please check your API key or use a different provider.',
            suggestion: 'Try using the Koios provider instead, which doesn\'t require authentication.',
            statuses: {
              info: infoRes.status,
              utxos: utxosRes.status,
              assets: assetsRes.status,
            },
          });
        }
        
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

      // If user is authenticated, save the address automatically
      if (req.user) {
        try {
          await AddressService.saveAddress(req.user.id, addr, 'cardanoscan');
        } catch (error) {
          console.error('Failed to save address:', error);
          // Don't fail the request if saving fails
        }
      }

      return res.json({
        address: addr,
        provider: 'cardanoscan',
        fetchedAt: new Date().toISOString(),
        info: infoFirst ?? infoRaw,
        utxosCount: utxos.length,
        assetsCount: assets.length,
        utxos,
        assets,
        saved: req.user ? true : false,
      });
    } catch (_err) {
      return res.status(500).json({ error: 'Failed to fetch assets' });
    }
  },
);
