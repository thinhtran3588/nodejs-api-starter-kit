import type { AwilixContainer } from 'awilix';
import type { FastifyInstance } from 'fastify';
import type { Sequelize } from 'sequelize';
import type { ErrorCodeRegistry } from '@app/common/utils/error-code-registry';

/**
 * Model configuration interface
 * Models should export a single modelConfiguration object with register function
 */
export interface ModelConfiguration {
  /**
   * Function to initialize the model with the Sequelize instance
   */
  register: (sequelize: Sequelize) => void;
}

/**
 * Model association configuration interface
 * Associations should export a single associationConfiguration object with register function
 */
export interface ModelAssociationConfiguration {
  /**
   * Function to register the associations
   */
  register: () => void;
}

/**
 * Module configuration interface
 * Each module should export a ModuleConfiguration object from module-configuration.ts
 */
export interface ModuleConfiguration {
  /**
   * Registers all dependencies for the module
   * @param container - The Awilix container to register dependencies in
   */
  registerDependencies: (container: AwilixContainer) => void;

  /**
   * Registers error code mappings for the module
   * @param registry - The error code registry instance
   */
  registerErrorCodes: (registry: ErrorCodeRegistry) => void;
}

export type RouteTag = {
  name: string;
  description: string;
};

/**
 * Route configuration interface
 * Routes should export a single routeConfiguration object with tags and register function
 */
export interface RouteConfiguration {
  /**
   * Swagger tags for routes in this configuration
   */
  tags: readonly RouteTag[];
  /**
   * Function to register all routes with the Fastify instance
   */
  register: (app: FastifyInstance) => void;
}

/**
 * GraphQL schema configuration
 * Schema files should export a schema string with a name ending in 'Schema'
 */
export interface GraphQLSchemaConfiguration {
  /**
   * GraphQL schema string
   */
  schema: string;
}

/**
 * GraphQL resolver configuration
 * Resolver files should export a resolver object with a name ending in 'Resolvers'
 */
export interface GraphQLResolverConfiguration {
  /**
   * GraphQL resolvers object
   */
  resolvers: Record<string, unknown>;
}
