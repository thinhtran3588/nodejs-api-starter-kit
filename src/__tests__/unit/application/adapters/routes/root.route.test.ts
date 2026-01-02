import fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { routeConfiguration } from '@app/application/adapters/routes/root.route';

describe('root.route', () => {
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
    it('should have empty tags array', () => {
      expect(routeConfiguration.tags).toEqual([]);
    });

    it('should have register function', () => {
      expect(typeof routeConfiguration.register).toBe('function');
    });
  });

  describe('GET / - happy path', () => {
    it('should return status RUNNING', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ status: 'RUNNING' });
    });

    it('should return application/json content type', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/',
      });

      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe('GET / - schema', () => {
    it('should register root endpoint', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/',
      });

      expect(response.statusCode).toBe(200);
    });
  });
});
