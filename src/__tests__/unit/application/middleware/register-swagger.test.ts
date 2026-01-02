import fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  swaggerConfig,
  swaggerUiConfig,
} from '@app/application/config/swagger.config';
import { registerSwagger } from '@app/application/middleware/register-swagger';
import type { RouteTag } from '@app/common/interfaces/configuration';

vi.mock('@app/application/config/swagger.config', () => ({
  swaggerConfig: vi.fn(),
  swaggerUiConfig: vi.fn(),
}));

vi.mock('@fastify/swagger', () => ({
  default: vi.fn(),
}));

vi.mock('@fastify/swagger-ui', () => ({
  default: vi.fn(),
}));

describe('registerSwagger', () => {
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
    it('should register Swagger when SWAGGER_ENABLED is true', async () => {
      process.env['SWAGGER_ENABLED'] = 'true';

      vi.mocked(swaggerConfig).mockReturnValue({
        openapi: {
          openapi: '3.0.0',
          info: {
            title: 'Test App',
            description: 'Test',
            version: '1.0.0',
            contact: {
              name: '',
              email: '',
              url: '',
            },
          },
          servers: [],
          components: {
            securitySchemes: {
              bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter JWT access token',
              },
            },
          },
          tags: [],
        },
      });

      vi.mocked(swaggerUiConfig).mockReturnValue({
        routePrefix: '/docs',
        uiConfig: {
          docExpansion: 'list',
          deepLinking: false,
          persistAuthorization: true,
        },
        staticCSP: false,
      });

      const tags: RouteTag[] = [
        { name: 'auth', description: 'Authentication endpoints' },
      ];

      await registerSwagger(app, tags);

      expect(swaggerConfig).toHaveBeenCalled();
      expect(swaggerUiConfig).toHaveBeenCalled();
    });

    it('should register Swagger with multiple tags', async () => {
      process.env['SWAGGER_ENABLED'] = 'true';

      vi.mocked(swaggerConfig).mockReturnValue({
        openapi: {
          openapi: '3.0.0',
          info: {
            title: 'Test App',
            description: 'Test',
            version: '1.0.0',
            contact: {
              name: '',
              email: '',
              url: '',
            },
          },
          servers: [],
          components: {
            securitySchemes: {
              bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter JWT access token',
              },
            },
          },
          tags: [],
        },
      });

      vi.mocked(swaggerUiConfig).mockReturnValue({
        routePrefix: '/docs',
        uiConfig: {
          docExpansion: 'list',
          deepLinking: false,
          persistAuthorization: true,
        },
        staticCSP: false,
      });

      const tags: RouteTag[] = [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'users', description: 'User management endpoints' },
      ];

      await registerSwagger(app, tags);

      expect(swaggerConfig).toHaveBeenCalled();
      expect(swaggerUiConfig).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should not register Swagger when SWAGGER_ENABLED is false', async () => {
      const originalValue = process.env['SWAGGER_ENABLED'];
      process.env['SWAGGER_ENABLED'] = 'false';

      const tags: RouteTag[] = [];

      await registerSwagger(app, tags);

      if (originalValue) {
        process.env['SWAGGER_ENABLED'] = originalValue;
      } else {
        delete process.env['SWAGGER_ENABLED'];
      }
    });

    it('should not register Swagger when SWAGGER_ENABLED is not set', async () => {
      const originalValue = process.env['SWAGGER_ENABLED'];
      delete process.env['SWAGGER_ENABLED'];

      const tags: RouteTag[] = [];

      await registerSwagger(app, tags);

      if (originalValue) {
        process.env['SWAGGER_ENABLED'] = originalValue;
      }
    });

    it('should handle empty tags array', async () => {
      process.env['SWAGGER_ENABLED'] = 'true';

      vi.mocked(swaggerConfig).mockReturnValue({
        openapi: {
          openapi: '3.0.0',
          info: {
            title: 'Test App',
            description: 'Test',
            version: '1.0.0',
            contact: {
              name: '',
              email: '',
              url: '',
            },
          },
          servers: [],
          components: {
            securitySchemes: {
              bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter JWT access token',
              },
            },
          },
          tags: [],
        },
      });

      vi.mocked(swaggerUiConfig).mockReturnValue({
        routePrefix: '/docs',
        uiConfig: {
          docExpansion: 'list',
          deepLinking: false,
          persistAuthorization: true,
        },
        staticCSP: false,
      });

      const tags: RouteTag[] = [];

      await registerSwagger(app, tags);

      expect(swaggerConfig).toHaveBeenCalled();
      expect(swaggerUiConfig).toHaveBeenCalled();
    });
  });
});
