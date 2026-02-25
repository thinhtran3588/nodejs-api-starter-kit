import { graphqlServer } from '@hono/graphql-server';
import { buildSchema } from 'graphql';
import type { App, ModuleConfiguration } from '@app/common';

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
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

    app.use(
      endpoint,
      graphqlServer({
        schema,
        rootResolver: () => resolvers,
        graphiql: process.env['GRAPHIQL_ENABLED'] === 'true',
      })
    );
  }
};
