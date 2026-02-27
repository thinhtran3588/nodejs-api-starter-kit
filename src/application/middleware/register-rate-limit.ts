import { rateLimiter } from 'hono-rate-limiter';
import type { App, Context } from '@app/common';

export const registerRateLimit = (app: App) => {
  if (process.env['RATE_LIMIT_ENABLED'] === 'true') {
    const limiter = rateLimiter({
      windowMs: Number(process.env['RATE_LIMIT_WINDOW_MS']) || 1 * 60 * 1000,
      limit: Number(process.env['RATE_LIMIT_MAX']) || 100,
      standardHeaders: 'draft-6',
      keyGenerator: (c: Context) => c.var.ip,
    });

    app.use('*', limiter);
  }
};
