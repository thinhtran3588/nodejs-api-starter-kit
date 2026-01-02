import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Not found handler middleware for Fastify
 * Handles 404 errors when routes are not found
 */
export function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply
): void {
  reply.status(404).send({
    message: `Route ${request.method}:${request.url} not found`,
    error: 'Not Found',
  });
}
