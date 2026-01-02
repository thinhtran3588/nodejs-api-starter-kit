import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { RouteConfiguration } from '@app/common/interfaces/configuration';

function registerRoutes(app: FastifyInstance): void {
  // Health check route
  app.get(
    '/health',
    {
      schema: {
        description: 'Health check endpoint',
        tags: ['health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
            },
          },
        },
      },
    },
    async (_request: FastifyRequest, _reply: FastifyReply) => {
      return { status: 'ok' };
    }
  );
}

/**
 * Route configuration for health check routes
 */
export const routeConfiguration: RouteConfiguration = {
  tags: [{ name: 'health', description: 'Health check endpoints' }],
  register: registerRoutes,
};
