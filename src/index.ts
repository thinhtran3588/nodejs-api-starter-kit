import { OpenAPIHono } from '@hono/zod-openapi';
import pino from 'pino';
import { moduleConfiguration as baseModule } from '@app/application/base-module-configuration';
import {
  createContainer,
  registerModules,
  type Container,
} from '@app/application/container';
import { initializeDatabases } from '@app/application/database';
import { registerAttachUser } from '@app/application/middleware/register-attach-user';
import { registerContainer } from '@app/application/middleware/register-container';
import { registerCors } from '@app/application/middleware/register-cors';
import { registerErrorHandler } from '@app/application/middleware/register-error-handler';
import { registerGraphQL } from '@app/application/middleware/register-graphql';
import { registerIpExtractor } from '@app/application/middleware/register-ip-extractor';
import { registerLogger } from '@app/application/middleware/register-logger';
import { registerRateLimit } from '@app/application/middleware/register-rate-limit';
import { registerSwagger } from '@app/application/middleware/register-swagger';
import type { AppEnv } from '@app/common';
import { moduleConfiguration as authModule } from '@app/modules/auth/module-configuration';

// Create and configure the Hono application instance
const app = new OpenAPIHono<AppEnv<Container>>();

app.get('/', (c) => {
  return c.json({ message: 'Server is running' });
});

// Create a logger instance for startup
const logger = pino({
  base: {},
});

// Load modules
const modules = [baseModule, authModule];

// Initialize databases and register models/associations
const { readDatabase, writeDatabase } = initializeDatabases(modules, logger);

// Create dependency injection container
const container = createContainer({
  logger,
  writeDatabase,
  readDatabase,
});

// Apply Middlewares (order is important)
registerCors(app);
registerContainer(app, container);
registerIpExtractor(app);
registerRateLimit(app);
registerLogger(app);
registerAttachUser(app);
registerErrorHandler(app);

// Register routes
registerModules(app, modules, container);
registerGraphQL(app, modules);
registerSwagger(app);

// Initialize external services and globals in Awilix
container.cradle.externalAuthenticationService.initialize();
container.cradle.jwtService.initialize();

export default app;
