import type { MiddlewareHandler } from 'hono';
import { rateLimiter } from 'hono-rate-limiter';
import type { App } from '@app/common';

let limiter: MiddlewareHandler | undefined;

export const registerRateLimit = (app: App) => {
  if (process.env['RATE_LIMIT_ENABLED'] === 'true') {
    limiter ??= rateLimiter({
      windowMs: Number(process.env['RATE_LIMIT_WINDOW_MS'] ?? 1 * 60 * 1000),
      limit: Number(process.env['RATE_LIMIT_MAX'] ?? 100),
      standardHeaders: 'draft-6',
      keyGenerator: (ctx) => String(ctx.var['ip']),
    });

    app.use('*', limiter);
  }
};
