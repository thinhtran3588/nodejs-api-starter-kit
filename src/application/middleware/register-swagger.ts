import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import {
  swaggerConfig,
  swaggerUiConfig,
} from '@app/application/config/swagger.config';
import type { RouteTag } from '@app/common/interfaces/configuration';

/**
 * Registers the Swagger middleware with the Fastify instance
 * @param app - The Fastify instance to register the middleware with
 * @param tags - The tags to register with the Swagger middleware
 * @returns void
 */
export async function registerSwagger(
  app: FastifyInstance,
  tags: RouteTag[]
): Promise<void> {
  const enableSwagger = process.env['SWAGGER_ENABLED'] === 'true';
  if (!enableSwagger) {
    return;
  }
  await app.register(swagger, {
    openapi: {
      ...swaggerConfig().openapi,
      tags,
    },
  });
  await app.register(swaggerUi, swaggerUiConfig());
}
