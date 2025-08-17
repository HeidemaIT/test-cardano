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
      const utxos: Utxo[] = Array.isArray(utxosRaw) ? (utxosRaw as Utxo[]) : [];

      // Calculate total ADA from UTXOs
      const totalADA = utxos.reduce((sum, utxo) => {
        const value = parseFloat(String(utxo.value || 0));
        return sum + value;
      }, 0);
      const adaValue = totalADA / Math.pow(10, 6); // Convert from lovelace to ADA

      const assets: Asset[] = Array.isArray(assetsFirst?.asset_list)
        ? (assetsFirst.asset_list as Asset[])
        : Array.isArray(assetsRaw)
          ? (assetsRaw as Asset[])
          : [];

      // Add ADA as the first asset if there's any ADA
      if (adaValue > 0) {
        const adaAsset: Asset = {
          policy_id: undefined,
          asset_name: '',
          quantity: adaValue.toString(), // Store in ADA units, not lovelace
        };
        assets.unshift(adaAsset);
      }

      // Fetch exchange rates for USD and EUR
      let usdRate = 1;
      let eurRate = 1;
      try {
        const adaPriceRes = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd,eur',
        );
        if (adaPriceRes.ok) {
          const adaPrice = (await adaPriceRes.json()) as {
            cardano?: { usd?: number; eur?: number };
          };
          usdRate = adaPrice.cardano?.usd || 1;
          eurRate = adaPrice.cardano?.eur || 1;
        }
      } catch (error) {
        console.error('Failed to fetch ADA exchange rates:', error);
      }

      // Fetch token prices from CoinGecko
      const tokenPrices: Record<string, { usd: number; eur: number }> = {};
      try {
        // Common Cardano tokens that might be in the wallet
        const tokenIds = ['snek', 'hosky', 'xerberus', 'smartplaces-x', 'flywifhat', 'amelda'];

        const tokenPriceRes = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds.join(',')}&vs_currencies=usd,eur`,
        );
        if (tokenPriceRes.ok) {
          const tokenPriceData = await tokenPriceRes.json();
          tokenPrices.cardano = { usd: usdRate, eur: eurRate };

          // Add individual token prices
          Object.keys(tokenPriceData as Record<string, { usd?: number; eur?: number }>).forEach(
            (tokenId) => {
              const price = (tokenPriceData as Record<string, { usd?: number; eur?: number }>)[
                tokenId
              ];
              tokenPrices[tokenId] = {
                usd: price.usd || 0,
                eur: price.eur || 0,
              };
            },
          );
        }
      } catch (error) {
        console.error('Failed to fetch token prices:', error);
        // Fallback to ADA only
        tokenPrices.cardano = { usd: usdRate, eur: eurRate };
      }

      // Fetch asset metadata for user-friendly names
      const assetsWithMetadata = await Promise.all(
        assets.map(async (asset) => {
          // Check if this is ADA (policy_id is undefined and asset_name is empty)
          const isADA = asset.policy_id === undefined && asset.asset_name === '';

          if (isADA) {
            // Handle ADA asset
            const quantity = parseFloat(String(asset.quantity || 0));
            const adaValue = quantity; // Already in ADA units
            const usdValue = adaValue * (tokenPrices.cardano?.usd || 0);
            const eurValue = adaValue * (tokenPrices.cardano?.eur || 0);

            return {
              ...asset,
              display_name: 'ADA',
              ada_value: adaValue,
              usd_value: usdValue,
              eur_value: eurValue,
            };
          }

          if (!asset.policy_id || !asset.asset_name) return asset;

          // Try to decode hex asset names to readable text
          let decodedName = asset.asset_name;
          try {
            if (asset.asset_name && /^[0-9a-fA-F]+$/.test(asset.asset_name)) {
              // Convert hex to string
              const hexString = asset.asset_name;
              const bytes = new Uint8Array(
                hexString.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [],
              );
              const decoded = new TextDecoder().decode(bytes);
              if (decoded && decoded.trim() && !/[\x00-\x1F\x7F]/.test(decoded)) {
                decodedName = decoded.trim();
              }
            }
          } catch (error) {
            // If hex decoding fails, keep original name
            console.error('Failed to decode hex asset name:', asset.asset_name, error);
          }

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
              console.log('Asset metadata response:', JSON.stringify(metadata, null, 2));

              const assetInfo = Array.isArray(metadata) ? metadata[0] : metadata;

              // Extract user-friendly name from metadata
              let displayName = decodedName;
              if (assetInfo?.asset_name_ascii) {
                displayName = assetInfo.asset_name_ascii;
              } else if (assetInfo?.asset_name_utf8) {
                displayName = assetInfo.asset_name_utf8;
              } else if (assetInfo?.ticker) {
                displayName = assetInfo.ticker;
              }

              // Calculate asset values in USD and EUR
              const quantity = parseFloat(String(asset.quantity || 0));
              let adaValue = 0;
              let usdValue = 0;
              let eurValue = 0;

              // Check if this is ADA (policy_id is undefined and asset_name is empty)
              const isADA = asset.policy_id === undefined && asset.asset_name === '';
              if (isADA) {
                adaValue = quantity; // Already in ADA units
                usdValue = adaValue * tokenPrices.cardano.usd;
                eurValue = adaValue * tokenPrices.cardano.eur;
              } else {
                // Try to find token price by ticker or display name
                const ticker = assetInfo?.ticker?.toLowerCase() || displayName.toLowerCase();
                const tokenPrice = tokenPrices[ticker] || tokenPrices[displayName.toLowerCase()];

                if (tokenPrice) {
                  usdValue = quantity * tokenPrice.usd;
                  eurValue = quantity * tokenPrice.eur;
                }
              }

              // Apply decimal places to quantity if available
              let formattedQuantity = asset.quantity;
              console.log(
                `Processing ${displayName}: decimals=${assetInfo?.decimals}, quantity=${asset.quantity}`,
              );
              if (assetInfo?.decimals !== undefined && assetInfo.decimals > 0) {
                const rawQuantity = parseFloat(String(asset.quantity || 0));
                formattedQuantity = (rawQuantity / Math.pow(10, assetInfo.decimals)).toString();
                console.log(`Applied decimals: ${asset.quantity} -> ${formattedQuantity}`);
              } else {
                // Fallback: apply known decimal places for common tokens
                const knownDecimals: Record<string, number> = {
                  XER: 6,
                  SPX: 6,
                  HOSKY: 0,
                  SNEK: 0,
                  flywifhat: 0,
                  AMELD: 0,
                  aMIN: 0,
                };

                const tokenName = displayName.toUpperCase();
                const decimals = knownDecimals[tokenName];
                if (decimals !== undefined) {
                  const rawQuantity = parseFloat(String(asset.quantity || 0));
                  formattedQuantity = (rawQuantity / Math.pow(10, decimals)).toString();
                }
              }

              return {
                ...asset,
                display_name: displayName,
                ticker: assetInfo?.ticker,
                decimals: assetInfo?.decimals,
                logo: assetInfo?.logo,
                quantity: formattedQuantity,
                ada_value: adaValue,
                usd_value: usdValue,
                eur_value: eurValue,
              };
            } else {
              console.log('Metadata request failed:', metadataRes.status, metadataRes.statusText);
            }
          } catch (error) {
            console.error(
              'Failed to fetch metadata for asset:',
              asset.policy_id,
              asset.asset_name,
              error,
            );
          }

          // Calculate asset values in USD and EUR for fallback case
          const quantity = parseFloat(String(asset.quantity || 0));
          let adaValue = 0;
          let usdValue = 0;
          let eurValue = 0;

          // Check if this is ADA (policy_id is undefined and asset_name is empty)
          const isADAAsset = asset.policy_id === undefined && asset.asset_name === '';
          if (isADAAsset) {
            adaValue = quantity; // Already in ADA units
            usdValue = adaValue * (tokenPrices.cardano?.usd || 0);
            eurValue = adaValue * (tokenPrices.cardano?.eur || 0);
          } else {
            // Try to find token price by display name
            const tokenPrice = tokenPrices[decodedName.toLowerCase()];
            if (tokenPrice) {
              usdValue = quantity * tokenPrice.usd;
              eurValue = quantity * tokenPrice.eur;
            }
          }

          // Return asset with decoded name as fallback
          return {
            ...asset,
            display_name: decodedName,
            ada_value: adaValue,
            usd_value: usdValue,
            eur_value: eurValue,
          };
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
