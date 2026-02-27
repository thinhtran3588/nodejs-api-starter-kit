import {
  asClass,
  asValue,
  createContainer as createAwilixContainer,
  type AwilixContainer,
} from 'awilix';
import {
  AuthorizationService,
  DrizzleDomainEventRepository,
  EventDispatcherImpl,
  JwtService,
  type App,
  type DatabaseClient,
  type DomainEventRepository,
  type EventDispatcher,
  type Logger,
  type ModuleConfiguration,
} from '@app/common';
import type { AuthContainer } from '@app/modules/auth/interfaces/auth-container';

/**
 * Application-level services (shared across all modules)
 */
export interface BaseContainer {
  authorizationService: AuthorizationService;
  jwtService: JwtService;
  writeDatabase: DatabaseClient;
  readDatabase: DatabaseClient;
  logger: Logger;
  eventDispatcher: EventDispatcher;
  domainEventRepository: DomainEventRepository;
}

/**
 * Application container type
 * Composed from all module containers + application-level services
 */
export type Container = BaseContainer & AuthContainer;

/**
 * Creates and configures the dependency injection container
 * @param options - Initialization options
 * @returns The dependency injection container
 */
export function createContainer({
  logger,
  writeDatabase,
  readDatabase,
}: {
  logger: Logger;
  writeDatabase: DatabaseClient;
  readDatabase: DatabaseClient;
}): AwilixContainer<Container> {
  const container = createAwilixContainer<Container>({
    injectionMode: 'PROXY', // Use proxy injection (cradle)
  });

  // Register application-level services (shared across all modules)
  container.register({
    authorizationService: asClass(AuthorizationService).singleton(),
    jwtService: asClass(JwtService).singleton(),
    writeDatabase: asValue<DatabaseClient>(writeDatabase),
    readDatabase: asValue<DatabaseClient>(readDatabase),
    logger: asValue<Logger>(logger),
    eventDispatcher: asClass(EventDispatcherImpl).singleton(),
    domainEventRepository: asClass(DrizzleDomainEventRepository).singleton(),
  });

  return container;
}

export function registerModules(
  app: App<Container>,
  modules: ModuleConfiguration[],
  container: AwilixContainer<Container>
): void {
  modules.forEach((module) => {
    module.registerDependencies(container);
    module.adapters.forEach((adapter) => {
      adapter.registerRoutes(app);
    });
  });
}
