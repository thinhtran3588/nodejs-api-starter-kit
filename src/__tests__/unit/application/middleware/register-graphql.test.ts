import fastify, { type FastifyInstance } from 'fastify';
import mercurius from 'mercurius';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  graphiqlConfig,
  graphqlConfig,
} from '@app/application/config/graphql.config';
import { registerGraphQL } from '@app/application/middleware/register-graphql';
import type { GraphQLResolverConfiguration } from '@app/common/interfaces/configuration';
import { BusinessException } from '@app/common/utils/exceptions';

vi.mock('@app/application/config/graphql.config', () => ({
  graphqlConfig: vi.fn(),
  graphiqlConfig: vi.fn(),
}));

vi.mock('mercurius', () => ({
  default: vi.fn(),
}));

vi.mock('@app/application/graphql/context', () => ({
  createGraphQLContext: vi.fn(),
}));

vi.mock('@app/application/graphql/common.schema', () => ({
  commonSchema:
    'type Query { _empty: String } type Mutation { _empty: String }',
}));

describe('registerGraphQL', () => {
  let app: FastifyInstance;
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = { ...originalEnv };
    app = fastify();
    app.register = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(async () => {
    process.env = originalEnv;
    await app.close();
  });

  describe('happy path', () => {
    it('should always register GraphQL', async () => {
      vi.mocked(graphqlConfig).mockReturnValue({
        endpoint: '/graphql',
      });

      vi.mocked(graphiqlConfig).mockReturnValue({
        routePrefix: '/graphiql',
        endpoint: '/graphql',
      });

      await registerGraphQL(app, [], []);

      expect(graphqlConfig).toHaveBeenCalled();
      expect(graphiqlConfig).toHaveBeenCalled();
      expect(app.register).toHaveBeenCalledWith(mercurius, expect.any(Object));
    });

    it('should enable GraphiQL UI when GRAPHQL_UI_ENABLED is true', async () => {
      process.env['GRAPHQL_UI_ENABLED'] = 'true';

      vi.mocked(graphqlConfig).mockReturnValue({
        endpoint: '/graphql',
      });

      vi.mocked(graphiqlConfig).mockReturnValue({
        routePrefix: '/graphiql',
        endpoint: '/graphql',
      });

      await registerGraphQL(app, [], []);

      expect(app.register).toHaveBeenCalledWith(
        mercurius,
        expect.objectContaining({
          graphiql: true,
          ide: true,
        })
      );
    });
  });

  describe('edge cases', () => {
    it('should disable GraphiQL UI when GRAPHQL_UI_ENABLED is false', async () => {
      process.env['GRAPHQL_UI_ENABLED'] = 'false';

      vi.mocked(graphqlConfig).mockReturnValue({
        endpoint: '/graphql',
      });

      vi.mocked(graphiqlConfig).mockReturnValue({
        routePrefix: '/graphiql',
        endpoint: '/graphql',
      });

      await registerGraphQL(app, [], []);

      expect(app.register).toHaveBeenCalledWith(
        mercurius,
        expect.objectContaining({
          graphiql: false,
          ide: false,
        })
      );
    });

    it('should disable GraphiQL UI when GRAPHQL_UI_ENABLED is not set', async () => {
      delete process.env['GRAPHQL_UI_ENABLED'];

      vi.mocked(graphqlConfig).mockReturnValue({
        endpoint: '/graphql',
      });

      vi.mocked(graphiqlConfig).mockReturnValue({
        routePrefix: '/graphiql',
        endpoint: '/graphql',
      });

      await registerGraphQL(app, [], []);

      expect(app.register).toHaveBeenCalledWith(
        mercurius,
        expect.objectContaining({
          graphiql: false,
          ide: false,
        })
      );
    });
  });

  describe('schema and resolver handling', () => {
    it('should merge multiple schemas', async () => {
      vi.mocked(graphqlConfig).mockReturnValue({
        endpoint: '/graphql',
      });

      vi.mocked(graphiqlConfig).mockReturnValue({
        routePrefix: '/graphiql',
        endpoint: '/graphql',
      });

      const schemas = [
        { schema: 'type User { id: ID! }' },
        { schema: 'type Role { id: ID! }' },
      ];

      await registerGraphQL(app, schemas, []);

      const registerCall = vi.mocked(app.register).mock.calls[0];
      expect(registerCall).toBeDefined();
      const config = registerCall![1] as { schema: string };
      expect(config.schema).toContain('type User { id: ID! }');
      expect(config.schema).toContain('type Role { id: ID! }');
    });

    it('should merge resolvers with non-overlapping keys', async () => {
      vi.mocked(graphqlConfig).mockReturnValue({
        endpoint: '/graphql',
      });

      vi.mocked(graphiqlConfig).mockReturnValue({
        routePrefix: '/graphiql',
        endpoint: '/graphql',
      });

      const resolvers: GraphQLResolverConfiguration[] = [
        {
          resolvers: {
            Query: {
              user: vi.fn(),
            },
          },
        },
        {
          resolvers: {
            Mutation: {
              createUser: vi.fn(),
            },
          },
        },
      ];

      await registerGraphQL(app, [], resolvers);

      const registerCall = vi.mocked(app.register).mock.calls[0];
      expect(registerCall).toBeDefined();
      const config = registerCall![1] as { resolvers: Record<string, unknown> };
      expect(config.resolvers).toHaveProperty('Query');
      expect(config.resolvers).toHaveProperty('Mutation');
      expect(
        (config.resolvers['Query'] as Record<string, unknown>)['user']
      ).toBeDefined();
      expect(
        (config.resolvers['Mutation'] as Record<string, unknown>)['createUser']
      ).toBeDefined();
    });

    it('should merge resolvers with overlapping keys', async () => {
      vi.mocked(graphqlConfig).mockReturnValue({
        endpoint: '/graphql',
      });

      vi.mocked(graphiqlConfig).mockReturnValue({
        routePrefix: '/graphiql',
        endpoint: '/graphql',
      });

      const resolvers: GraphQLResolverConfiguration[] = [
        {
          resolvers: {
            Query: {
              user: vi.fn(),
              role: vi.fn(),
            },
          },
        },
        {
          resolvers: {
            Query: {
              users: vi.fn(),
            },
          },
        },
      ];

      await registerGraphQL(app, [], resolvers);

      const registerCall = vi.mocked(app.register).mock.calls[0];
      expect(registerCall).toBeDefined();
      const config = registerCall![1] as { resolvers: Record<string, unknown> };
      const queryResolvers = config.resolvers['Query'] as Record<
        string,
        unknown
      >;
      expect(queryResolvers['user']).toBeDefined();
      expect(queryResolvers['role']).toBeDefined();
      expect(queryResolvers['users']).toBeDefined();
    });
  });

  describe('errorFormatter', () => {
    let errorFormatter: (execution: {
      errors?: Array<{
        originalError?: Error;
        message: string;
      }>;
      data?: unknown;
    }) => {
      statusCode: number;
      response: {
        data: unknown;
        errors?: Array<unknown>;
      };
    };

    beforeEach(async () => {
      vi.mocked(graphqlConfig).mockReturnValue({
        endpoint: '/graphql',
      });

      vi.mocked(graphiqlConfig).mockReturnValue({
        routePrefix: '/graphiql',
        endpoint: '/graphql',
      });

      await registerGraphQL(app, [], []);

      const registerCall = vi.mocked(app.register).mock.calls[0];
      expect(registerCall).toBeDefined();
      const config = registerCall![1] as {
        errorFormatter: typeof errorFormatter;
      };
      errorFormatter = config.errorFormatter;
    });

    it('should return status 400 when all errors are BusinessException', () => {
      const businessError = new BusinessException('TEST_ERROR', {
        field: 'test',
      });
      const execution = {
        errors: [
          {
            originalError: businessError,
            message: 'Error message',
          },
        ],
        data: { user: { id: '123' } },
      };

      const result = errorFormatter(execution);

      expect(result.statusCode).toBe(400);
      expect(result.response.data).toBe(execution.data);
      expect(result.response.errors).toBe(execution.errors);
      expect(execution.errors[0]!.message).toEqual({
        code: 'TEST_ERROR',
        data: { field: 'test' },
        message: 'TEST_ERROR',
      });
    });

    it('should return status 500 when any error is not BusinessException', () => {
      const regularError = new Error('Regular error');
      const execution = {
        errors: [
          {
            originalError: regularError,
            message: 'Error message',
          },
        ],
        data: null,
      };

      const result = errorFormatter(execution);

      expect(result.statusCode).toBe(500);
      expect(result.response.data).toBe(execution.data);
      expect(result.response.errors).toBe(execution.errors);
    });

    it('should return status 500 when mixed errors include non-BusinessException', () => {
      const businessError = new BusinessException('TEST_ERROR');
      const regularError = new Error('Regular error');
      const execution = {
        errors: [
          {
            originalError: businessError,
            message: 'Business error',
          },
          {
            originalError: regularError,
            message: 'Regular error',
          },
        ],
        data: { user: null },
      };

      const result = errorFormatter(execution);

      expect(result.statusCode).toBe(500);
      expect(result.response.data).toBe(execution.data);
      expect(result.response.errors).toBe(execution.errors);
    });

    it('should return status 400 when errors array is empty', () => {
      const execution = {
        errors: [],
        data: { user: { id: '123' } },
      };

      const result = errorFormatter(execution);

      expect(result.statusCode).toBe(400);
      expect(result.response.data).toBe(execution.data);
      expect(result.response.errors).toBe(execution.errors);
    });

    it('should return status 400 when errors is undefined', () => {
      const execution = {
        data: { user: { id: '123' } },
      };

      const result = errorFormatter(execution);

      expect(result.statusCode).toBe(400);
      expect(result.response.data).toBe(execution.data);
      expect(result.response.errors).toBeUndefined();
    });

    it('should handle BusinessException without data', () => {
      const businessError = new BusinessException('TEST_ERROR');
      const execution = {
        errors: [
          {
            originalError: businessError,
            message: 'Error message',
          },
        ],
        data: null,
      };

      const result = errorFormatter(execution);

      expect(result.statusCode).toBe(400);
      expect(execution.errors[0]!.message).toEqual({
        code: 'TEST_ERROR',
        data: undefined,
        message: 'TEST_ERROR',
      });
    });
  });

  describe('logging', () => {
    it('should log GraphQL endpoint when UI is disabled', async () => {
      delete process.env['GRAPHQL_UI_ENABLED'];

      vi.mocked(graphqlConfig).mockReturnValue({
        endpoint: '/graphql',
      });

      vi.mocked(graphiqlConfig).mockReturnValue({
        routePrefix: '/graphiql',
        endpoint: '/graphql',
      });

      const logInfoSpy = vi.spyOn(app.log, 'info');

      await registerGraphQL(app, [], []);

      expect(logInfoSpy).toHaveBeenCalledWith(
        'GraphQL endpoint registered at /graphql'
      );
      expect(logInfoSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('GraphiQL UI')
      );
    });

    it('should log GraphQL endpoint and GraphiQL UI when UI is enabled', async () => {
      process.env['GRAPHQL_UI_ENABLED'] = 'true';

      vi.mocked(graphqlConfig).mockReturnValue({
        endpoint: '/graphql',
      });

      vi.mocked(graphiqlConfig).mockReturnValue({
        routePrefix: '/graphiql',
        endpoint: '/graphql',
      });

      const logInfoSpy = vi.spyOn(app.log, 'info');

      await registerGraphQL(app, [], []);

      expect(logInfoSpy).toHaveBeenCalledWith(
        'GraphQL endpoint registered at /graphql'
      );
      expect(logInfoSpy).toHaveBeenCalledWith(
        'GraphiQL UI available at /graphiql'
      );
    });
  });
});
