import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { RouteConfiguration } from '@app/common/interfaces/configuration';

function registerRoutes(app: FastifyInstance): void {
  // Root route
  app.get(
    '/',
    {
      schema: {
        hide: true,
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
    (_request: FastifyRequest, reply: FastifyReply) => {
      reply.type('application/json').send({ status: 'RUNNING' });
    }
  );
}

/**
 * Route configuration for root routes
 */
export const routeConfiguration: RouteConfiguration = {
  tags: [],
  register: registerRoutes,
};
