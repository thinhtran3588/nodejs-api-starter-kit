import type { FastifyReply, FastifyRequest } from 'fastify';
import type { MercuriusContext } from 'mercurius';
import type { AppContext } from '@app/common/interfaces/context';

declare module 'mercurius' {
  interface MercuriusContext {
    appContext: AppContext;
    request: FastifyRequest;
    reply: FastifyReply;
  }
}

/**
 * Creates GraphQL context from Fastify request
 * This function is used by Mercurius to build the context for GraphQL resolvers
 *
 * @param request - Fastify request object
 * @param reply - Fastify reply object
 * @returns GraphQL context with AppContext, request, and reply
 */
export function createGraphQLContext(
  request: FastifyRequest,
  reply: FastifyReply
): MercuriusContext {
  return {
    // already attached by attachAppContext middleware
    appContext: request.appContext,
    request,
    reply,
  } as MercuriusContext;
}
