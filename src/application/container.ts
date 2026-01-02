import {
  asClass,
  asValue,
  createContainer,
  type AwilixContainer,
} from 'awilix';
import type { FastifyBaseLogger } from 'fastify';
import { Sequelize } from 'sequelize';
import { AuthorizationService } from '@app/common/application/services/authorization.service';
import type { EventDispatcher as IEventDispatcher } from '@app/common/domain/interfaces/event-dispatcher';
import type { Logger } from '@app/common/domain/interfaces/logger';
import { EventDispatcher } from '@app/common/infrastructure/event-dispatcher';
import { FastifyLogger } from '@app/common/infrastructure/logger';
import type { DomainEventRepository } from '@app/common/infrastructure/repositories/domain-event.repository';
import { SequelizeDomainEventRepository } from '@app/common/infrastructure/repositories/domain-event.repository-impl';
import { JwtService } from '@app/common/infrastructure/services/jwt.service';

/**
 * Application-level services (shared across all modules)
 */
export interface ApplicationServices {
  authorizationService: AuthorizationService;
  jwtService: JwtService;
  writeDatabase: Sequelize;
  readDatabase: Sequelize;
  logger: Logger;
  eventDispatcher: IEventDispatcher;
  domainEventRepository: DomainEventRepository;
}

/**
 * Application container type
 * Composed from all module containers + application-level services
 */
export type Container = ApplicationServices;
// Future modules will extend this type automatically
// e.g., type Container = AuthContainer & AssetTrackerContainer & OtherModuleContainer & ApplicationServices;

/**
 * Creates and configures the dependency injection container
 * @param writeDatabase - The Sequelize write database instance
 * @param readDatabase - The Sequelize read database instance
 * @param logger - The Fastify logger instance
 * @returns The dependency injection container
 */
export function createDIContainer(
  writeDatabase: Sequelize,
  readDatabase: Sequelize,
  logger: FastifyBaseLogger
): AwilixContainer<Container> {
  const container = createContainer<Container>({
    injectionMode: 'CLASSIC', // Use constructor injection
  });

  // Create logger implementation
  const loggerInstance = new FastifyLogger(logger);

  // Register application-level services (shared across all modules)
  container.register({
    authorizationService: asClass(AuthorizationService).singleton(),
    jwtService: asClass(JwtService).singleton(),
    writeDatabase: asValue<Sequelize>(writeDatabase),
    readDatabase: asValue<Sequelize>(readDatabase),
    logger: asValue<Logger>(loggerInstance),
    eventDispatcher: asClass(EventDispatcher).singleton(),
    domainEventRepository: asClass(SequelizeDomainEventRepository).singleton(),
  });

  return container;
}
