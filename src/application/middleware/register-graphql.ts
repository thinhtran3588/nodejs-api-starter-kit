import type { FastifyInstance } from 'fastify';
import mercurius from 'mercurius';
import {
  graphiqlConfig,
  graphqlConfig,
} from '@app/application/config/graphql.config';
import { commonSchema } from '@app/application/graphql/common.schema';
import { createGraphQLContext } from '@app/application/graphql/context';
import type {
  GraphQLResolverConfiguration,
  GraphQLSchemaConfiguration,
} from '@app/common/interfaces/configuration';
import { BusinessException } from '@app/common/utils/exceptions';

function mergeResolvers(
  resolvers: GraphQLResolverConfiguration[]
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  for (const resolverConfig of resolvers) {
    const resolver = resolverConfig.resolvers;
    for (const [key, value] of Object.entries(resolver)) {
      if (merged[key]) {
        merged[key] = {
          ...(merged[key] as Record<string, unknown>),
          ...(value as Record<string, unknown>),
        };
      } else {
        merged[key] = value;
      }
    }
  }
  return merged;
}

/**
 * Registers the GraphQL middleware with the Fastify instance
 * @param app - The Fastify instance to register the middleware with
 * @param schemas - GraphQL schema configurations discovered from modules
 * @param resolvers - GraphQL resolver configurations discovered from modules
 * @returns void
 */
export async function registerGraphQL(
  app: FastifyInstance,
  schemas: GraphQLSchemaConfiguration[],
  resolvers: GraphQLResolverConfiguration[]
): Promise<void> {
  const config = graphqlConfig();
  const uiConfig = graphiqlConfig();
  const enableUI = process.env['GRAPHQL_UI_ENABLED'] === 'true';

  const allSchemas: string[] = [commonSchema, ...schemas.map((s) => s.schema)];
  const mergedResolvers = mergeResolvers(resolvers);

  await app.register(mercurius, {
    schema: allSchemas.join('\n'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    resolvers: mergedResolvers as any,
    context: createGraphQLContext,
    path: config.endpoint,
    graphiql: enableUI,
    ide: enableUI,
    errorFormatter: (execution) => {
      let isBusinessException = true;
      execution.errors?.forEach((error) => {
        if (error.originalError instanceof BusinessException) {
          error.message = {
            code: error.originalError.code,
            data: error.originalError.data,
            message: error.originalError.message,
          } as unknown as string;
        } else {
          isBusinessException = false;
        }
        return error;
      });
      return {
        statusCode: isBusinessException ? 400 : 500,
        response: {
          data: execution.data,
          errors: execution.errors,
        },
      };
    },
  });

  app.log.info(`GraphQL endpoint registered at ${config.endpoint}`);
  if (enableUI) {
    app.log.info(`GraphiQL UI available at ${uiConfig.routePrefix}`);
  }
}
