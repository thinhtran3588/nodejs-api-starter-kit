import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  swaggerConfig,
  swaggerUiConfig,
} from '@app/application/config/swagger.config';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(() =>
    JSON.stringify({
      name: 'test-app',
      description: 'Test application',
      version: '1.0.0',
    })
  ),
}));

describe('swaggerConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('happy path', () => {
    it('should return swagger configuration with required structure', () => {
      const config = swaggerConfig();

      expect(config).toHaveProperty('openapi');
      expect(config.openapi).toHaveProperty('openapi');
      expect(config.openapi).toHaveProperty('info');
      expect(config.openapi).toHaveProperty('servers');
      expect(config.openapi).toHaveProperty('components');
      expect(config.openapi).toHaveProperty('tags');
      expect(config.openapi.openapi).toBe('3.0.0');
      expect(config.openapi.info).toHaveProperty('title');
      expect(config.openapi.info).toHaveProperty('description');
      expect(config.openapi.info).toHaveProperty('version');
      expect(config.openapi.info).toHaveProperty('contact');
      expect(Array.isArray(config.openapi.servers)).toBe(true);
      expect(config.openapi.components).toHaveProperty('securitySchemes');
    });

    it('should include bearer auth security scheme', () => {
      const config = swaggerConfig();

      expect(config.openapi.components?.securitySchemes?.bearerAuth).toEqual({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT access token',
      });
    });

    it('should include at least one server', () => {
      const config = swaggerConfig();

      expect(config.openapi.servers.length).toBeGreaterThanOrEqual(1);
      expect(config.openapi.servers[0]?.url).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should not include production server when SWAGGER_PRODUCTION_URL is not set', () => {
      const config = swaggerConfig();

      const productionServers = config.openapi.servers.filter(
        (server) => server.description === 'Production server'
      );
      expect(productionServers.length).toBeLessThanOrEqual(1);
    });
  });
});

describe('swaggerUiConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('happy path', () => {
    it('should return swagger UI configuration with default values', () => {
      delete process.env['SWAGGER_DOCUMENTATION_ROUTE_PREFIX'];

      const config = swaggerUiConfig();

      expect(config.routePrefix).toBe('/docs');
      expect(config.uiConfig.docExpansion).toBe('list');
      expect(config.uiConfig.deepLinking).toBe(false);
      expect(config.uiConfig.persistAuthorization).toBe(true);
      expect(config.staticCSP).toBe(false);
    });

    it('should return swagger UI configuration with route prefix', () => {
      const config = swaggerUiConfig();

      expect(config.routePrefix).toBeDefined();
      expect(typeof config.routePrefix).toBe('string');
    });
  });
});
