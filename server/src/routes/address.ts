import { Router, type Request } from 'express';
import { z } from 'zod';
import { validateParams } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.js';
import { AddressService } from '../services/addressService.js';

export const addressRouter = Router();

// Apply authentication middleware to all routes
addressRouter.use(authMiddleware.authenticate);

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

      // Fetch asset metadata for user-friendly names
      const assetsWithMetadata = await Promise.all(
        assets.map(async (asset) => {
          if (!asset.policy_id || !asset.asset_name) return asset;

          try {
            const metadataRes = await fetch('https://api.koios.rest/api/v1/asset_info', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                _asset_list: [
                  {
                    policy_id: asset.policy_id,
                    asset_name: asset.asset_name,
                  },
                ],
              }),
            });

            if (metadataRes.ok) {
              const metadata = await metadataRes.json();
              const assetInfo = Array.isArray(metadata) ? metadata[0] : metadata;

              // Extract user-friendly name from metadata
              let displayName = asset.asset_name;
              if (assetInfo?.asset_name_ascii) {
                displayName = assetInfo.asset_name_ascii;
              } else if (assetInfo?.asset_name_utf8) {
                displayName = assetInfo.asset_name_utf8;
              } else if (assetInfo?.ticker) {
                displayName = assetInfo.ticker;
              }

              return {
                ...asset,
                display_name: displayName,
                ticker: assetInfo?.ticker,
                decimals: assetInfo?.decimals,
                logo: assetInfo?.logo,
              };
            }
          } catch (error) {
            console.error(
              'Failed to fetch metadata for asset:',
              asset.policy_id,
              asset.asset_name,
              error,
            );
          }

          return asset;
        }),
      );

      // Intentionally not logging Koios summary to reduce noise

      // If user is authenticated, save the address automatically
      if (req.user) {
        try {
          await AddressService.saveAddress(req.user.id, addr, 'koios');
        } catch (error) {
          console.error('Failed to save address:', error);
          // Don't fail the request if saving fails
        }
      }

      return res.json({
        address: addr,
        provider: 'koios',
        fetchedAt: new Date().toISOString(),
        info: infoFirst ?? infoRaw,
        utxosCount: utxos.length,
        assetsCount: assetsWithMetadata.length,
        utxos,
        assets: assetsWithMetadata,
        saved: req.user ? true : false,
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
