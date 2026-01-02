import cors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';
import { webConfig } from '@app/application/config/web.config';

/**
 * Registers the CORS middleware with the Fastify instance
 * @param app - The Fastify instance to register the middleware with
 * @returns void
 */
export async function registerCors(app: FastifyInstance): Promise<void> {
  const {
    cors: { enabled, origins },
  } = webConfig();

  if (!enabled) {
    return;
  }

  await app.register(cors, {
    origin: origins?.length ? origins : true,
    credentials: true,
  });
}
