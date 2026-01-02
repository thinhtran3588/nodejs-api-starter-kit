import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  graphiqlConfig,
  graphqlConfig,
} from '@app/application/config/graphql.config';

describe('graphqlConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('happy path', () => {
    it('should return graphql configuration with endpoint', () => {
      const config = graphqlConfig();

      expect(config).toHaveProperty('endpoint');
      expect(config.endpoint).toBe('/graphql');
    });

    it('should use default endpoint when GRAPHQL_ENDPOINT is not set', () => {
      delete process.env['GRAPHQL_ENDPOINT'];

      const config = graphqlConfig();

      expect(config.endpoint).toBe('/graphql');
    });

    it('should use custom endpoint when GRAPHQL_ENDPOINT is set', () => {
      process.env['GRAPHQL_ENDPOINT'] = '/api/graphql';

      const config = graphqlConfig();

      expect(config.endpoint).toBe('/api/graphql');
    });
  });
});

describe('graphiqlConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('happy path', () => {
    it('should return graphiql UI configuration with default values', () => {
      delete process.env['GRAPHQL_UI_ROUTE_PREFIX'];
      delete process.env['GRAPHQL_ENDPOINT'];

      const config = graphiqlConfig();

      expect(config.routePrefix).toBe('/graphiql');
      expect(config.endpoint).toBe('/graphql');
    });

    it('should return graphiql UI configuration with custom route prefix', () => {
      process.env['GRAPHQL_UI_ROUTE_PREFIX'] = '/graphql-ui';

      const config = graphiqlConfig();

      expect(config.routePrefix).toBe('/graphql-ui');
    });

    it('should return graphiql UI configuration with custom endpoint', () => {
      process.env['GRAPHQL_ENDPOINT'] = '/api/graphql';

      const config = graphiqlConfig();

      expect(config.endpoint).toBe('/api/graphql');
    });
  });
});
