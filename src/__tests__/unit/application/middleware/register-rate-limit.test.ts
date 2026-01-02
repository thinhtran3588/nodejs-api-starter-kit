import rateLimit from '@fastify/rate-limit';
import fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { webConfig } from '@app/application/config/web.config';
import { registerRateLimit } from '@app/application/middleware/register-rate-limit';

vi.mock('@app/application/config/web.config', () => ({
  webConfig: vi.fn(),
}));

vi.mock('@fastify/rate-limit', () => ({
  default: vi.fn(),
}));

describe('registerRateLimit', () => {
  let app: FastifyInstance;
  const originalEnv = process.env;
  let keyGenerator: ((request: unknown) => string) | undefined;

  beforeEach(async () => {
    vi.resetModules();
    process.env = { ...originalEnv };
    app = fastify();
    keyGenerator = undefined;
    vi.mocked(rateLimit).mockImplementation(async (_instance, options) => {
      if (options && typeof options === 'object' && 'keyGenerator' in options) {
        keyGenerator = options.keyGenerator as (request: unknown) => string;
      }
    });
  });

  afterEach(async () => {
    process.env = originalEnv;
    await app.close();
  });

  describe('happy path', () => {
    it('should register rate limit with default configuration', async () => {
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

      await registerRateLimit(app);

      expect(webConfig).toHaveBeenCalled();
      expect(rateLimit).toHaveBeenCalled();
    });

    it('should register rate limit with custom configuration', async () => {
      vi.mocked(webConfig).mockReturnValue({
        cors: {
          enabled: false,
          origins: [],
        },
        rateLimit: {
          max: 200,
          timeWindow: '5 minutes',
        },
      });

      await registerRateLimit(app);

      expect(webConfig).toHaveBeenCalled();
      expect(rateLimit).toHaveBeenCalled();
    });
  });

  describe('keyGenerator', () => {
    beforeEach(async () => {
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
      await registerRateLimit(app);
    });

    it('should use x-forwarded-for header when available', () => {
      expect(keyGenerator).toBeDefined();
      if (!keyGenerator) return;

      const mockRequest = {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      };

      const key = keyGenerator(mockRequest);
      expect(key).toBe('192.168.1.1');
    });

    it('should use x-real-ip header when x-forwarded-for is not available', () => {
      expect(keyGenerator).toBeDefined();
      if (!keyGenerator) return;

      const mockRequest = {
        headers: {
          'x-real-ip': '192.168.1.2',
        },
        ip: '127.0.0.1',
      };

      const key = keyGenerator(mockRequest);
      expect(key).toBe('192.168.1.2');
    });

    it('should use request.ip when headers are not available', () => {
      expect(keyGenerator).toBeDefined();
      if (!keyGenerator) return;

      const mockRequest = {
        headers: {},
        ip: '192.168.1.3',
      };

      const key = keyGenerator(mockRequest);
      expect(key).toBe('192.168.1.3');
    });

    it('should use socket.remoteAddress as fallback', () => {
      expect(keyGenerator).toBeDefined();
      if (!keyGenerator) return;

      const mockRequest = {
        headers: {},
        socket: {
          remoteAddress: '192.168.1.4',
        },
      };

      const key = keyGenerator(mockRequest);
      expect(key).toBe('192.168.1.4');
    });

    it('should return "unknown" when no IP information is available', () => {
      expect(keyGenerator).toBeDefined();
      if (!keyGenerator) return;

      const mockRequest = {
        headers: {},
        socket: {},
      };

      const key = keyGenerator(mockRequest);
      expect(key).toBe('unknown');
    });

    it('should handle x-forwarded-for with multiple IPs and trim whitespace', () => {
      expect(keyGenerator).toBeDefined();
      if (!keyGenerator) return;

      const mockRequest = {
        headers: {
          'x-forwarded-for': ' 192.168.1.5 , 10.0.0.2 ',
        },
      };

      const key = keyGenerator(mockRequest);
      expect(key).toBe('192.168.1.5');
    });
  });
});
