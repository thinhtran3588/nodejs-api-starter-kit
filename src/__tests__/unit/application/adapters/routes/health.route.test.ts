import fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { routeConfiguration } from '@app/application/adapters/routes/health.route';

describe('health.route', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = fastify();
    routeConfiguration.register(app);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('routeConfiguration', () => {
    it('should have correct tags', () => {
      expect(routeConfiguration.tags).toEqual([
        { name: 'health', description: 'Health check endpoints' },
      ]);
    });

    it('should have register function', () => {
      expect(typeof routeConfiguration.register).toBe('function');
    });
  });

  describe('GET /health - happy path', () => {
    it('should return status ok', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ status: 'ok' });
    });

    it('should have correct schema definition', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe('GET /health - schema', () => {
    it('should register health endpoint', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
    });
  });
});
