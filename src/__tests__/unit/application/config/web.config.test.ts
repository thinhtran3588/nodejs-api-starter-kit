import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { webConfig } from '@app/application/config/web.config';

describe('webConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('happy path', () => {
    it('should return configuration object with required properties', () => {
      const config = webConfig();

      expect(config).toHaveProperty('cors');
      expect(config).toHaveProperty('rateLimit');
      expect(config.cors).toHaveProperty('enabled');
      expect(config.cors).toHaveProperty('origins');
      expect(config.rateLimit).toHaveProperty('max');
      expect(config.rateLimit).toHaveProperty('timeWindow');
    });

    it('should return configuration with CORS settings', () => {
      const config = webConfig();

      expect(typeof config.cors.enabled).toBe('boolean');
      expect(Array.isArray(config.cors.origins)).toBe(true);
    });

    it('should return configuration with rate limit settings', () => {
      const config = webConfig();

      expect(typeof config.rateLimit.max).toBe('number');
      expect(typeof config.rateLimit.timeWindow).toBe('string');
    });
  });

  describe('edge cases', () => {
    it('should handle CORS disabled', async () => {
      // Set environment variable before resetting modules
      process.env['WEB_CORS_ENABLED'] = 'false';
      vi.resetModules();
      // Re-import to get fresh config with new env var
      const { webConfig: freshWebConfig } = await import(
        '@app/application/config/web.config'
      );

      const config = freshWebConfig();

      expect(config.cors.enabled).toBe(false);
    });

    it('should have valid rate limit max value', () => {
      const config = webConfig();

      expect(config.rateLimit.max).toBeGreaterThan(0);
      expect(Number.isInteger(config.rateLimit.max)).toBe(true);
    });
  });
});
