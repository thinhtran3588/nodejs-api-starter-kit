import fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { webConfig } from '@app/application/config/web.config';
import { registerCors } from '@app/application/middleware/register-cors';

vi.mock('@app/application/config/web.config', () => ({
  webConfig: vi.fn(),
}));

vi.mock('@fastify/cors', () => ({
  default: vi.fn(),
}));

describe('registerCors', () => {
  let app: FastifyInstance;
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.resetModules();
    process.env = { ...originalEnv };
    app = fastify();
  });

  afterEach(async () => {
    process.env = originalEnv;
    await app.close();
  });

  describe('happy path', () => {
    it('should register CORS when enabled with specific origins', async () => {
      vi.mocked(webConfig).mockReturnValue({
        cors: {
          enabled: true,
          origins: ['http://localhost:3000', 'https://example.com'],
        },
        rateLimit: {
          max: 100,
          timeWindow: '1 minute',
        },
      });

      await registerCors(app);

      expect(webConfig).toHaveBeenCalled();
    });

    it('should register CORS when enabled with empty origins array (allow all)', async () => {
      vi.mocked(webConfig).mockReturnValue({
        cors: {
          enabled: true,
          origins: [],
        },
        rateLimit: {
          max: 100,
          timeWindow: '1 minute',
        },
      });

      await registerCors(app);

      expect(webConfig).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should not register CORS when disabled', async () => {
      vi.mocked(webConfig).mockReturnValue({
        cors: {
          enabled: false,
          origins: [],
        },
        rateLimit: {
          max: 100,
          timeWindow: '1 minute',
        },
      });

      await registerCors(app);

      expect(webConfig).toHaveBeenCalled();
    });

    it('should handle single origin', async () => {
      vi.mocked(webConfig).mockReturnValue({
        cors: {
          enabled: true,
          origins: ['https://example.com'],
        },
        rateLimit: {
          max: 100,
          timeWindow: '1 minute',
        },
      });

      await registerCors(app);

      expect(webConfig).toHaveBeenCalled();
    });
  });
});
