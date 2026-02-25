import { cors } from 'hono/cors';
import type { App } from '@app/common';

export const registerCors = (app: App) => {
  if (process.env['CORS_ENABLED'] === 'true') {
    app.use(
      '*',
      cors({
        origin: process.env['CORS_ORIGINS']
          ? process.env['CORS_ORIGINS'].split(',')
          : '*',
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
      })
    );
  }
};
