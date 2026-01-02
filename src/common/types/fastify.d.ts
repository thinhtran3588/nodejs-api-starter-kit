import type { AwilixContainer } from 'awilix';
import type { Container } from '@app/application/container';
import type { AppContext } from '@app/common/interfaces/context';

/**
 * Extend FastifyInstance to include the dependency injection container
 */
declare module 'fastify' {
  interface FastifyInstance {
    diContainer: AwilixContainer<Container>;
  }

  /**
   * Extend FastifyRequest to include appContext
   * This is populated by the attachAppContext middleware
   * appContext.user will be undefined if no token was provided or token was invalid
   */
  interface FastifyRequest {
    appContext: AppContext;
  }
}


