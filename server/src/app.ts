import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { healthRouter } from './routes/health';
import { echoRouter } from './routes/echo';
import { addressRouter } from './routes/address';
import { customRouter } from './routes/custom';
import { cardanoscanRouter } from './routes/cardanoscan';

export const app = express();

// Trust proxy if running behind a reverse proxy
app.set('trust proxy', env.TRUST_PROXY);

// Security & parsing
app.use(helmet());
app.use(hpp());
app.use(express.json({ limit: '1mb' }));

// CORS allowlist
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (env.CORS_ORIGINS.includes('*') || env.CORS_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS not allowed'), false);
    },
    credentials: true,
  }),
);

// Structured logging
const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
});
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === '/health',
    },
  }),
);

// Rate limiting
app.use(
  rateLimit({
    windowMs: env.RATE_WINDOW_MS,
    max: env.RATE_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// Routes
app.use(healthRouter);
app.use(echoRouter);
app.use(addressRouter);
app.use(customRouter);
app.use(cardanoscanRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
import type { Request, Response, NextFunction } from 'express';
type RequestWithLog = Request & { log?: { error: (obj: unknown, msg?: string) => void } };
app.use((err: unknown, req: RequestWithLog, res: Response, _next: NextFunction) => {
  req.log?.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal Server Error' });
});
