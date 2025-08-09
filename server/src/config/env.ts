import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),
  TRUST_PROXY: z
    .union([z.boolean(), z.string()])
    .transform((v) => (typeof v === 'string' ? v === 'true' : v))
    .default(false),
  CORS_ORIGINS: z
    .string()
    .default('*')
    .transform((v) =>
      v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  RATE_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_MAX: z.coerce.number().int().positive().default(100),
  // Optional self-hosted/custom provider endpoints (use same POST body as Koios: { _addresses: [addr] })
  CUSTOM_INFO_URL: z.string().url().optional(),
  CUSTOM_UTXOS_URL: z.string().url().optional(),
  CUSTOM_ASSETS_URL: z.string().url().optional(),
  // Optional generic base URL (e.g., Koios base: https://api.koios.rest/api/v1)
  CARDANO_BASE_URL: z.string().url().optional(),
  // Optional Cardanoscan provider (templated GET URLs; {addr} will be replaced)
  CARDANOSCAN_INFO_URL_TEMPLATE: z.string().url().optional(),
  CARDANOSCAN_UTXOS_URL_TEMPLATE: z.string().url().optional(),
  CARDANOSCAN_ASSETS_URL_TEMPLATE: z.string().url().optional(),
  CARDANOSCAN_BASE_URL: z.string().url().optional(),
  CARDANOSCAN_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  LOG_LEVEL: process.env.LOG_LEVEL,
  TRUST_PROXY: process.env.TRUST_PROXY,
  CORS_ORIGINS: process.env.CORS_ORIGINS,
  RATE_WINDOW_MS: process.env.RATE_WINDOW_MS,
  RATE_MAX: process.env.RATE_MAX,
  CUSTOM_INFO_URL: process.env.CUSTOM_INFO_URL,
  CUSTOM_UTXOS_URL: process.env.CUSTOM_UTXOS_URL,
  CUSTOM_ASSETS_URL: process.env.CUSTOM_ASSETS_URL,
  CARDANO_BASE_URL: process.env.CARDANO_BASE_URL,
  CARDANOSCAN_INFO_URL_TEMPLATE: process.env.CARDANOSCAN_INFO_URL_TEMPLATE,
  CARDANOSCAN_UTXOS_URL_TEMPLATE: process.env.CARDANOSCAN_UTXOS_URL_TEMPLATE,
  CARDANOSCAN_ASSETS_URL_TEMPLATE: process.env.CARDANOSCAN_ASSETS_URL_TEMPLATE,
  CARDANOSCAN_BASE_URL: process.env.CARDANOSCAN_BASE_URL,
  CARDANOSCAN_API_KEY: process.env.CARDANOSCAN_API_KEY,
});
