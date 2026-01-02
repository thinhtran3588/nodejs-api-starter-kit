// Load environment variables first (before any other imports that might use them)
// This must be the first import to ensure env vars are loaded before other modules access process.env
import '@app/common/utils/load-env';

import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import { createDIContainer } from '@app/application/container';
import {
  initializeReadDatabase,
  initializeWriteDatabase,
} from '@app/application/database';
import { attachAppContext } from '@app/application/middleware/attach-app-context';
import { errorHandler } from '@app/application/middleware/error.handler';
import { notFoundHandler } from '@app/application/middleware/not-found.handler';
import { registerCors } from '@app/application/middleware/register-cors';
import { registerGraphQL } from '@app/application/middleware/register-graphql';
import { registerRateLimit } from '@app/application/middleware/register-rate-limit';
import { registerSwagger } from '@app/application/middleware/register-swagger';
import { discoverModules } from '@app/application/module-discovery';
import { AuthorizationExceptionCode } from '@app/common/enums/authorization-exception-code';
import { SystemExceptionCode } from '@app/common/enums/system-exception-code';
import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import { modelConfiguration as domainEventModelConfiguration } from '@app/common/infrastructure/models/domain-event.model';
import { ErrorCodeRegistry } from '@app/common/utils/error-code-registry';
import type { ExternalAuthenticationService } from '@app/modules/auth/domain/interfaces/services/external-authentication.service';

/**
 * Creates and configures the Fastify application instance
 * This function is exported for testing purposes
 */
export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env['NODE_ENV'] !== 'test',
    ajv: {
      customOptions: {
        removeAdditional: 'all', // Remove additional properties not defined in schemas
      },
    },
  });

  // Create error code registry
  const errorCodeRegistry = new ErrorCodeRegistry();
  // Register application-level error codes (shared across all modules)
  errorCodeRegistry.register({
    [AuthorizationExceptionCode.UNAUTHORIZED]: 401,
    [AuthorizationExceptionCode.FORBIDDEN]: 403,
    [AuthorizationExceptionCode.INSUFFICIENT_PERMISSIONS]: 403,
    [AuthorizationExceptionCode.INVALID_TOKEN]: 401,
    [ValidationErrorCode.ENTITY_NOT_FOUND]: 404,
    [ValidationErrorCode.ENTITY_ALREADY_EXISTS]: 400,
    [ValidationErrorCode.FIELD_IS_REQUIRED]: 400,
    [ValidationErrorCode.FIELD_IS_INVALID]: 400,
    [ValidationErrorCode.FIELD_IS_TOO_SHORT]: 400,
    [ValidationErrorCode.FIELD_IS_TOO_LONG]: 400,
    [ValidationErrorCode.FIELD_BELOW_MIN_VALUE]: 400,
    [ValidationErrorCode.FIELD_ABOVE_MAX_VALUE]: 400,
    [ValidationErrorCode.OUTDATED_VERSION]: 409,
    [SystemExceptionCode.INTERNAL_ERROR]: 500,
    [SystemExceptionCode.DATA_CORRUPTION_ERROR]: 400,
  });

  // Discover modules
  const {
    modules,
    models,
    modelAssociations,
    routes,
    graphqlSchemas,
    graphqlResolvers,
    moduleNames,
  } = await discoverModules();
  const tags = routes.flatMap((route) => route.tags);
  app.log.info(
    `Discovered ${modules.length} module(s): ${moduleNames.join(', ')}`
  );

  // Initialize databases
  // IMPORTANT: Initialize read database first, then write database
  // This ensures that when models are initialized twice, the model.sequelize property
  // points to writeDatabase (last init), which is what write repositories need.
  // Read repositories access models via readDatabase.models['ModelName'].
  const readDatabase = initializeReadDatabase(app);
  const writeDatabase = initializeWriteDatabase(app);
  app.log.info('Read database initialized');
  app.log.info('Write database initialized');

  // Create and register dependency injection container
  const container = createDIContainer(writeDatabase, readDatabase, app.log);
  app.decorate('diContainer', container);
  app.log.info('Dependency injection container created');

  // Register models with read database first (for read operations)
  for (const model of models) {
    model.register(readDatabase);
  }
  // Register common models with read database
  domainEventModelConfiguration.register(readDatabase);

  // Register models with write database second (for write operations)
  // Note: Calling init() twice is safe - it registers the model on both Sequelize instances
  // The model class will have sequelize pointing to writeDatabase (last init),
  // which is what write repositories need when using UserModel directly
  for (const model of models) {
    model.register(writeDatabase);
  }
  // Register common models (not in modules)
  domainEventModelConfiguration.register(writeDatabase);

  for (const modelAssociation of modelAssociations) {
    modelAssociation.register();
  }
  app.log.info('Database models and associations registered');

  // Register middleware
  await registerCors(app);
  await registerRateLimit(app);
  await registerGraphQL(app, graphqlSchemas, graphqlResolvers);
  await registerSwagger(app, tags);
  app.setErrorHandler((error, request, reply) =>
    errorHandler(
      error as FastifyError | Error,
      request,
      reply,
      errorCodeRegistry,
      app.log
    )
  );
  app.setNotFoundHandler(notFoundHandler);
  app.log.info('Middleware registered');

  // Register modules
  for (const module of modules) {
    module.registerDependencies(container);
    module.registerErrorCodes(errorCodeRegistry);
  }
  app.log.info('Modules registered');

  // Register routes
  for (const route of routes) {
    route.register(app);
  }
  app.log.info('Routes registered');

  // Initialize external services
  // externalAuthenticationService is registered by auth module at runtime, so we need type assertion
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const externalAuthenticationService = container.resolve(
    'externalAuthenticationService'
  ) as unknown as ExternalAuthenticationService;
  externalAuthenticationService.initialize();
  app.log.info('External authentication service initialized');

  container.resolve('jwtService').initialize();
  app.log.info('JWT service initialized');

  // Register global hook to extract application context (user context and permissions) from request
  app.addHook('onRequest', attachAppContext);

  return app;
}

/**
 * Starts the server.
 * This function is exported for testing purposes
 */
export async function startServer(app: FastifyInstance): Promise<void> {
  try {
    const portEnv = process.env['PORT'] ?? '8080';
    const portNumber = Number(portEnv);
    const port =
      Number.isNaN(portNumber) || portNumber <= 0 ? 8080 : portNumber;
    const host = process.env['HOST'] ?? '0.0.0.0';

    await app.listen({ port, host });
    app.log.info(`Server listening at http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
