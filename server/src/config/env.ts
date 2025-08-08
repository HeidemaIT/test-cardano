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
});
