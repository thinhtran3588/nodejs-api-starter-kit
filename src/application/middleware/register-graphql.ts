import { graphqlServer } from '@hono/graphql-server';
import { buildSchema, GraphQLError } from 'graphql';
import {
  BusinessError,
  getStatusCodeFromErrorCode,
  ValidationError,
  type App,
  type Logger,
  type ModuleConfiguration,
} from '@app/common';

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};

const getLoggerFromContext = (context: unknown): Logger | undefined => {
  if (!isObjectRecord(context)) {
    return undefined;
  }

  const { var: varValue } = context;
  if (!isObjectRecord(varValue)) {
    return undefined;
  }

  const { container } = varValue;
  if (!isObjectRecord(container)) {
    return undefined;
  }

  const { cradle } = container;
  if (!isObjectRecord(cradle)) {
    return undefined;
  }

  const { logger } = cradle;
  if (!isObjectRecord(logger) || typeof logger['error'] !== 'function') {
    return undefined;
  }

  return logger as unknown as Logger;
};

type GraphQLResolver = (...args: unknown[]) => unknown;

export const wrapGraphQLResolvers = (resolvers: Record<string, unknown>) => {
  return Object.entries(resolvers).reduce<Record<string, unknown>>(
    (acc, [key, value]) => {
      if (typeof value !== 'function') {
        acc[key] = value;
        return acc;
      }

      const resolver = value as GraphQLResolver;
      acc[key] = async (...args: unknown[]) => {
        const logger = getLoggerFromContext(args[1]);

        try {
          return await resolver(...args);
        } catch (error) {
          if (error instanceof GraphQLError) {
            throw error;
          }

          if (
            error instanceof BusinessError ||
            error instanceof ValidationError
          ) {
            throw new GraphQLError(error.code, {
              originalError: error,
              extensions: {
                error: error.code,
                data: error.data,
                statusCode: getStatusCodeFromErrorCode(error.code),
              },
            });
          }

          if (logger) {
            logger.error({ error }, 'Unhandled GraphQL error');
          }

          throw new GraphQLError('INTERNAL_SERVER_ERROR', {
            originalError: error as Error,
            extensions: {
              error: 'INTERNAL_SERVER_ERROR',
              statusCode: 500,
            },
          });
        }
      };

      return acc;
    },
    {}
  );
};

export const registerGraphQL = (app: App, modules: ModuleConfiguration[]) => {
  if (process.env['GRAPHQL_ENABLED'] !== 'false') {
    const baseSchema = `
      type PaginationInfo {
        count: Int!
        pageIndex: Int!
      }

      type Query {
        _empty: String
      }

      type Mutation {
        _empty: String
      }
    `;

    const typeDefs = [
      baseSchema,
      ...modules.flatMap((m) => m.adapters.map((a) => a.graphql?.typeDefs)),
    ]
      .filter(Boolean)
      .join('\n');

    const resolvers = modules.reduce<Record<string, unknown>>((acc, m) => {
      const moduleResolvers = m.adapters.reduce<Record<string, unknown>>(
        (adapterAcc, a) => {
          return { ...adapterAcc, ...(a.graphql?.resolvers ?? {}) };
        },
        {}
      );

      Object.entries(moduleResolvers).forEach(([typeName, value]) => {
        const existing = acc[typeName];
        if (isObjectRecord(existing) && isObjectRecord(value)) {
          acc[typeName] = { ...existing, ...value };
          return;
        }

        acc[typeName] = value;
      });

      return acc;
    }, {});

    const schema = buildSchema(typeDefs);
    const endpoint = process.env['GRAPHQL_ENDPOINT'] ?? '/graphql';
    const wrappedResolvers = wrapGraphQLResolvers(resolvers);

    app.use(
      endpoint,
      graphqlServer({
        schema,
        rootResolver: () => wrappedResolvers,
        graphiql: process.env['GRAPHIQL_ENABLED'] === 'true',
      })
    );
  }
};
