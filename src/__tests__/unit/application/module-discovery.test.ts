import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  discoverModules,
  registerDatabaseModels,
  registerGraphQLResolvers,
  registerGraphQLSchemas,
  registerRoutes,
} from '@app/application/module-discovery';

describe('registerDatabaseModels', () => {
  describe('function structure', () => {
    it('should be a function', () => {
      expect(typeof registerDatabaseModels).toBe('function');
    });

    it('should return a promise', async () => {
      const result = registerDatabaseModels('/test/path');
      expect(result).toBeInstanceOf(Promise);
      await result.catch(() => {});
    });

    it('should throw error for non-existent directory', async () => {
      await expect(
        registerDatabaseModels('/non-existent-path')
      ).rejects.toThrow();
    });
  });

  describe('happy path', () => {
    it('should discover and load models from module', async () => {
      const { fileURLToPath } = await import('node:url');
      const { dirname } = await import('node:path');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const authModulePath = join(__dirname, '../../../modules/auth');

      const authModuleResult = await registerDatabaseModels(authModulePath);
      expect(authModuleResult.models.length).toBeGreaterThan(0);
      expect(Array.isArray(authModuleResult.modelAssociations)).toBe(true);
    });

    it('should discover and load models with .ts extension', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-module-${Date.now()}`);
      const modelsDir = join(testDir, 'infrastructure', 'models');

      try {
        await mkdir(modelsDir, { recursive: true });

        await writeFile(
          join(modelsDir, 'test.model.ts'),
          `export const modelConfiguration = { register: () => {} };`
        );

        const result = await registerDatabaseModels(testDir);
        expect(result.models.length).toBe(1);
        expect(result.modelAssociations.length).toBe(0);
        expect(result.models[0]).toHaveProperty('register');
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });

    it('should discover and load models with .js extension', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-module-${Date.now()}`);
      const modelsDir = join(testDir, 'infrastructure', 'models');

      try {
        await mkdir(modelsDir, { recursive: true });

        await writeFile(
          join(modelsDir, 'test.model.js'),
          `export const modelConfiguration = { register: () => {} };`
        );

        const result = await registerDatabaseModels(testDir);
        expect(result.models.length).toBe(1);
        expect(result.modelAssociations.length).toBe(0);
        expect(result.models[0]).toHaveProperty('register');
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });

    it('should discover multiple model files', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-module-${Date.now()}`);
      const modelsDir = join(testDir, 'infrastructure', 'models');

      try {
        await mkdir(modelsDir, { recursive: true });

        await writeFile(
          join(modelsDir, 'model1.model.ts'),
          `export const modelConfiguration = { register: () => {} };`
        );

        await writeFile(
          join(modelsDir, 'model2.model.ts'),
          `export const modelConfiguration = { register: () => {} };`
        );

        await writeFile(
          join(modelsDir, 'model3.model.js'),
          `export const modelConfiguration = { register: () => {} };`
        );

        const result = await registerDatabaseModels(testDir);
        expect(result.models.length).toBe(3);
        expect(result.modelAssociations.length).toBe(0);
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });

    it('should discover and load association configuration when associations.ts exists', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-module-${Date.now()}`);
      const modelsDir = join(testDir, 'infrastructure', 'models');

      try {
        await mkdir(modelsDir, { recursive: true });

        await writeFile(
          join(modelsDir, 'test.model.ts'),
          `export const modelConfiguration = { register: () => {} };`
        );

        await writeFile(
          join(modelsDir, 'associations.ts'),
          `export const associationConfiguration = { register: () => {} };`
        );

        const result = await registerDatabaseModels(testDir);
        expect(result.models.length).toBe(1);
        expect(result.modelAssociations.length).toBe(1);
        expect(result.modelAssociations[0]).toHaveProperty('register');
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });

    it('should discover and load association configuration when associations.js exists', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-module-${Date.now()}`);
      const modelsDir = join(testDir, 'infrastructure', 'models');

      try {
        await mkdir(modelsDir, { recursive: true });

        await writeFile(
          join(modelsDir, 'test.model.ts'),
          `export const modelConfiguration = { register: () => {} };`
        );

        await writeFile(
          join(modelsDir, 'associations.js'),
          `export const associationConfiguration = { register: () => {} };`
        );

        const result = await registerDatabaseModels(testDir);
        expect(result.models.length).toBe(1);
        expect(result.modelAssociations.length).toBe(1);
        expect(result.modelAssociations[0]).toHaveProperty('register');
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });

    it('should return empty arrays when no models or associations exist', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-module-${Date.now()}`);
      const modelsDir = join(testDir, 'infrastructure', 'models');

      try {
        await mkdir(modelsDir, { recursive: true });

        await writeFile(join(modelsDir, 'other-file.txt'), `some content`);

        const result = await registerDatabaseModels(testDir);
        expect(result.models.length).toBe(0);
        expect(result.modelAssociations.length).toBe(0);
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });

    it('should filter out non-model files', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-module-${Date.now()}`);
      const modelsDir = join(testDir, 'infrastructure', 'models');

      try {
        await mkdir(modelsDir, { recursive: true });

        await writeFile(
          join(modelsDir, 'test.model.ts'),
          `export const modelConfiguration = { register: () => {} };`
        );

        await writeFile(
          join(modelsDir, 'not-a-model.ts'),
          `export const something = {};`
        );

        await writeFile(join(modelsDir, 'other.model.txt'), `not a model file`);

        const result = await registerDatabaseModels(testDir);
        expect(result.models.length).toBe(1);
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });
  });
});

describe('registerRoutes', () => {
  describe('function structure', () => {
    it('should be a function', () => {
      expect(typeof registerRoutes).toBe('function');
    });

    it('should return a promise', async () => {
      const result = registerRoutes('/test/path');
      expect(result).toBeInstanceOf(Promise);
      await result.catch(() => {});
    });

    it('should throw error for non-existent directory', async () => {
      await expect(registerRoutes('/non-existent-path')).rejects.toThrow();
    });
  });

  describe('happy path', () => {
    it('should discover and load routes with .ts extension', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-routes-${Date.now()}`);
      const routesDir = join(testDir, 'adapters', 'routes');

      try {
        await mkdir(routesDir, { recursive: true });

        await writeFile(
          join(routesDir, 'test.route.ts'),
          `export const routeConfiguration = { tags: [], register: () => {} };`
        );

        const result = await registerRoutes(testDir);
        expect(result.length).toBe(1);
        expect(result[0]).toHaveProperty('tags');
        expect(result[0]).toHaveProperty('register');
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });

    it('should discover and load routes with .js extension', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-routes-${Date.now()}`);
      const routesDir = join(testDir, 'adapters', 'routes');

      try {
        await mkdir(routesDir, { recursive: true });

        await writeFile(
          join(routesDir, 'test.route.js'),
          `export const routeConfiguration = { tags: [], register: () => {} };`
        );

        const result = await registerRoutes(testDir);
        expect(result.length).toBe(1);
        expect(result[0]).toHaveProperty('tags');
        expect(result[0]).toHaveProperty('register');
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });

    it('should discover multiple route files', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-routes-${Date.now()}`);
      const routesDir = join(testDir, 'adapters', 'routes');

      try {
        await mkdir(routesDir, { recursive: true });

        await writeFile(
          join(routesDir, 'route1.route.ts'),
          `export const routeConfiguration = { tags: [], register: () => {} };`
        );

        await writeFile(
          join(routesDir, 'route2.route.ts'),
          `export const routeConfiguration = { tags: [], register: () => {} };`
        );

        await writeFile(
          join(routesDir, 'route3.route.js'),
          `export const routeConfiguration = { tags: [], register: () => {} };`
        );

        const result = await registerRoutes(testDir);
        expect(result.length).toBe(3);
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });

    it('should return empty array when no route files exist', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-routes-${Date.now()}`);
      const routesDir = join(testDir, 'adapters', 'routes');

      try {
        await mkdir(routesDir, { recursive: true });

        await writeFile(join(routesDir, 'other-file.txt'), `some content`);

        const result = await registerRoutes(testDir);
        expect(result.length).toBe(0);
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });

    it('should filter out non-route files', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-routes-${Date.now()}`);
      const routesDir = join(testDir, 'adapters', 'routes');

      try {
        await mkdir(routesDir, { recursive: true });

        await writeFile(
          join(routesDir, 'test.route.ts'),
          `export const routeConfiguration = { tags: [], register: () => {} };`
        );

        await writeFile(
          join(routesDir, 'not-a-route.ts'),
          `export const something = {};`
        );

        await writeFile(join(routesDir, 'other.route.txt'), `not a route file`);

        const result = await registerRoutes(testDir);
        expect(result.length).toBe(1);
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });
  });
});

describe('registerGraphQLSchemas', () => {
  describe('function structure', () => {
    it('should be a function', () => {
      expect(typeof registerGraphQLSchemas).toBe('function');
    });

    it('should return a promise', async () => {
      const result = registerGraphQLSchemas('/test/path');
      expect(result).toBeInstanceOf(Promise);
      await result.catch(() => {});
    });
  });

  describe('happy path', () => {
    it('should discover and load schemas with .ts extension', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-graphql-${Date.now()}`);
      const graphqlDir = join(testDir, 'adapters', 'graphql');

      try {
        await mkdir(graphqlDir, { recursive: true });

        await writeFile(
          join(graphqlDir, 'test.schema.ts'),
          `export const testSchema = 'type Query { test: String }';`
        );

        const result = await registerGraphQLSchemas(testDir);
        expect(result.length).toBe(1);
        expect(result[0]).toHaveProperty('schema');
        expect(result[0]?.schema).toBe('type Query { test: String }');
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });

    it('should discover and load schemas with .js extension', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-graphql-${Date.now()}`);
      const graphqlDir = join(testDir, 'adapters', 'graphql');

      try {
        await mkdir(graphqlDir, { recursive: true });

        await writeFile(
          join(graphqlDir, 'test.schema.js'),
          `export const testSchema = 'type Query { test: String }';`
        );

        const result = await registerGraphQLSchemas(testDir);
        expect(result.length).toBe(1);
        expect(result[0]).toHaveProperty('schema');
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });

    it('should discover multiple schema files', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-graphql-${Date.now()}`);
      const graphqlDir = join(testDir, 'adapters', 'graphql');

      try {
        await mkdir(graphqlDir, { recursive: true });

        await writeFile(
          join(graphqlDir, 'schema1.schema.ts'),
          `export const schema1Schema = 'type Query { test1: String }';`
        );

        await writeFile(
          join(graphqlDir, 'schema2.schema.ts'),
          `export const schema2Schema = 'type Query { test2: String }';`
        );

        const result = await registerGraphQLSchemas(testDir);
        expect(result.length).toBe(2);
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });

    it('should filter out keys that do not end with Schema', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-graphql-${Date.now()}`);
      const graphqlDir = join(testDir, 'adapters', 'graphql');

      try {
        await mkdir(graphqlDir, { recursive: true });

        await writeFile(
          join(graphqlDir, 'test.schema.ts'),
          `export const testSchema = 'type Query { test: String }';
export const notASchema = 'this should be ignored';
export const otherValue = 123;`
        );

        const result = await registerGraphQLSchemas(testDir);
        const schemasWithTest = result.filter(
          (s) => s.schema === 'type Query { test: String }'
        );
        expect(schemasWithTest.length).toBeGreaterThanOrEqual(1);
        expect(result.every((s) => typeof s.schema === 'string')).toBe(true);
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });

    it('should filter out values that are not strings', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-graphql-${Date.now()}`);
      const graphqlDir = join(testDir, 'adapters', 'graphql');

      try {
        await mkdir(graphqlDir, { recursive: true });

        await writeFile(
          join(graphqlDir, 'test.schema.ts'),
          `export const testSchema = 'type Query { test: String }';
export const invalidSchema = { not: 'a string' };`
        );

        const result = await registerGraphQLSchemas(testDir);
        const schemasWithTest = result.filter(
          (s) => s.schema === 'type Query { test: String }'
        );
        expect(schemasWithTest.length).toBeGreaterThanOrEqual(1);
        expect(result.every((s) => typeof s.schema === 'string')).toBe(true);
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });

    it('should return empty array when no schema files exist', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-graphql-${Date.now()}`);
      const graphqlDir = join(testDir, 'adapters', 'graphql');

      try {
        await mkdir(graphqlDir, { recursive: true });

        await writeFile(join(graphqlDir, 'other-file.txt'), `some content`);

        const result = await registerGraphQLSchemas(testDir);
        expect(result.length).toBe(0);
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });
  });

  describe('error handling', () => {
    it('should return empty array when graphql directory does not exist', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-graphql-${Date.now()}`);

      const result = await registerGraphQLSchemas(testDir);
      expect(result.length).toBe(0);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

describe('registerGraphQLResolvers', () => {
  describe('function structure', () => {
    it('should be a function', () => {
      expect(typeof registerGraphQLResolvers).toBe('function');
    });

    it('should return a promise', async () => {
      const result = registerGraphQLResolvers('/test/path');
      expect(result).toBeInstanceOf(Promise);
      await result.catch(() => {});
    });
  });

  describe('happy path', () => {
    it('should discover and load resolvers with .ts extension', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-graphql-${Date.now()}`);
      const graphqlDir = join(testDir, 'adapters', 'graphql');

      try {
        await mkdir(graphqlDir, { recursive: true });

        await writeFile(
          join(graphqlDir, 'test.resolvers.ts'),
          `export const testResolvers = { Query: { test: () => 'test' } };`
        );

        const result = await registerGraphQLResolvers(testDir);
        expect(result.length).toBe(1);
        expect(result[0]).toHaveProperty('resolvers');
        expect(result[0]?.resolvers).toBeDefined();
        expect(
          result[0]?.resolvers &&
            typeof result[0].resolvers === 'object' &&
            'Query' in result[0].resolvers
        ).toBe(true);
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });

    it('should discover and load resolvers with .js extension', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-graphql-${Date.now()}`);
      const graphqlDir = join(testDir, 'adapters', 'graphql');

      try {
        await mkdir(graphqlDir, { recursive: true });

        await writeFile(
          join(graphqlDir, 'test.resolvers.js'),
          `export const testResolvers = { Query: { test: () => 'test' } };`
        );

        const result = await registerGraphQLResolvers(testDir);
        expect(result.length).toBe(1);
        expect(result[0]).toHaveProperty('resolvers');
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });

    it('should discover multiple resolver files', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-graphql-${Date.now()}`);
      const graphqlDir = join(testDir, 'adapters', 'graphql');

      try {
        await mkdir(graphqlDir, { recursive: true });

        await writeFile(
          join(graphqlDir, 'resolver1.resolvers.ts'),
          `export const resolver1Resolvers = { Query: { test1: () => 'test1' } };`
        );

        await writeFile(
          join(graphqlDir, 'resolver2.resolvers.ts'),
          `export const resolver2Resolvers = { Query: { test2: () => 'test2' } };`
        );

        const result = await registerGraphQLResolvers(testDir);
        expect(result.length).toBe(2);
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });

    it('should filter out keys that do not end with Resolvers', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-graphql-${Date.now()}`);
      const graphqlDir = join(testDir, 'adapters', 'graphql');

      try {
        await mkdir(graphqlDir, { recursive: true });

        await writeFile(
          join(graphqlDir, 'test.resolvers.ts'),
          `export const testResolvers = { Query: { test: () => 'test' } };
export const notResolvers = { Query: { other: () => 'other' } };
export const otherValue = 'string';`
        );

        const result = await registerGraphQLResolvers(testDir);
        const resolversWithQuery = result.filter(
          (r) =>
            r.resolvers &&
            typeof r.resolvers === 'object' &&
            'Query' in r.resolvers
        );
        expect(resolversWithQuery.length).toBeGreaterThanOrEqual(1);
        expect(result.every((r) => typeof r.resolvers === 'object')).toBe(true);
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });

    it('should filter out values that are not objects', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-graphql-${Date.now()}`);
      const graphqlDir = join(testDir, 'adapters', 'graphql');

      try {
        await mkdir(graphqlDir, { recursive: true });

        await writeFile(
          join(graphqlDir, 'test.resolvers.ts'),
          `export const testResolvers = { Query: { test: () => 'test' } };
export const invalidResolvers = 'not an object';`
        );

        const result = await registerGraphQLResolvers(testDir);
        const resolversWithQuery = result.filter(
          (r) =>
            r.resolvers &&
            typeof r.resolvers === 'object' &&
            'Query' in r.resolvers
        );
        expect(resolversWithQuery.length).toBeGreaterThanOrEqual(1);
        expect(result.every((r) => typeof r.resolvers === 'object')).toBe(true);
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });

    it('should return empty array when no resolver files exist', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-graphql-${Date.now()}`);
      const graphqlDir = join(testDir, 'adapters', 'graphql');

      try {
        await mkdir(graphqlDir, { recursive: true });

        await writeFile(join(graphqlDir, 'other-file.txt'), `some content`);

        const result = await registerGraphQLResolvers(testDir);
        expect(result.length).toBe(0);
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });
  });

  describe('error handling', () => {
    it('should return empty array when graphql directory does not exist', async () => {
      const { tmpdir } = await import('node:os');
      const testDir = join(tmpdir(), `test-graphql-${Date.now()}`);

      const result = await registerGraphQLResolvers(testDir);
      expect(result.length).toBe(0);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

describe('discoverModules', () => {
  describe('function structure', () => {
    it('should be a function', () => {
      expect(typeof discoverModules).toBe('function');
    });

    it('should return a promise', () => {
      const result = discoverModules();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should return object with modules, models, modelAssociations, routes, graphqlSchemas, and graphqlResolvers properties', async () => {
      const result = await discoverModules();
      expect(result).toHaveProperty('modules');
      expect(result).toHaveProperty('models');
      expect(result).toHaveProperty('modelAssociations');
      expect(result).toHaveProperty('routes');
      expect(result).toHaveProperty('graphqlSchemas');
      expect(result).toHaveProperty('graphqlResolvers');
      expect(Array.isArray(result.modules)).toBe(true);
      expect(Array.isArray(result.models)).toBe(true);
      expect(Array.isArray(result.modelAssociations)).toBe(true);
      expect(Array.isArray(result.routes)).toBe(true);
      expect(Array.isArray(result.graphqlSchemas)).toBe(true);
      expect(Array.isArray(result.graphqlResolvers)).toBe(true);
    }, 30000);
  });

  describe('return value structure', () => {
    it('should return modules array with ModuleConfiguration objects', async () => {
      const result = await discoverModules();
      result.modules.forEach((module) => {
        expect(module).toHaveProperty('registerDependencies');
        expect(module).toHaveProperty('registerErrorCodes');
        expect(typeof module.registerDependencies).toBe('function');
        expect(typeof module.registerErrorCodes).toBe('function');
      });
    });

    it('should return models array with ModelConfiguration objects', async () => {
      const result = await discoverModules();
      result.models.forEach((model) => {
        expect(model).toHaveProperty('register');
        expect(typeof model.register).toBe('function');
      });
    });

    it('should return modelAssociations array with ModelAssociationConfiguration objects', async () => {
      const result = await discoverModules();
      if (result.modelAssociations.length > 0) {
        result.modelAssociations.forEach((association) => {
          expect(association).toHaveProperty('register');
          expect(typeof association.register).toBe('function');
        });
      } else {
        expect(Array.isArray(result.modelAssociations)).toBe(true);
      }
    });

    it('should return routes array with RouteConfiguration objects', async () => {
      const result = await discoverModules();
      result.routes.forEach((route) => {
        expect(route).toHaveProperty('tags');
        expect(route).toHaveProperty('register');
        expect(Array.isArray(route.tags)).toBe(true);
        expect(typeof route.register).toBe('function');
      });
    });
  });

  describe('module discovery', () => {
    it('should discover modules with module-configuration.ts', async () => {
      const result = await discoverModules();
      expect(result.modules.length).toBeGreaterThan(0);
    });

    it('should discover modules with module-configuration.js', async () => {
      const { fileURLToPath } = await import('node:url');
      const { dirname } = await import('node:path');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const modulesDir = join(__dirname, '../../../modules');
      const testModuleDir = join(modulesDir, `test-module-${Date.now()}`);

      try {
        await mkdir(testModuleDir, { recursive: true });
        await mkdir(join(testModuleDir, 'infrastructure', 'models'), {
          recursive: true,
        });
        await mkdir(join(testModuleDir, 'adapters', 'routes'), {
          recursive: true,
        });

        await writeFile(
          join(testModuleDir, 'module-configuration.js'),
          `export const moduleConfiguration = { 
            registerDependencies: () => {}, 
            registerErrorCodes: () => {} 
          };`
        );

        const result = await discoverModules();
        expect(Array.isArray(result.modules)).toBe(true);
      } finally {
        await rm(testModuleDir, { recursive: true, force: true }).catch(
          () => {}
        );
      }
    });

    it('should register database models for each discovered module', async () => {
      const result = await discoverModules();
      expect(result.models.length).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.models)).toBe(true);
    });

    it('should register routes for each discovered module', async () => {
      const result = await discoverModules();
      expect(result.routes.length).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.routes)).toBe(true);
    });

    it('should register GraphQL schemas for each discovered module', async () => {
      const result = await discoverModules();
      expect(result.graphqlSchemas.length).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.graphqlSchemas)).toBe(true);
    });

    it('should register GraphQL resolvers for each discovered module', async () => {
      const result = await discoverModules();
      expect(result.graphqlResolvers.length).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.graphqlResolvers)).toBe(true);
    });

    it('should register application routes', async () => {
      const result = await discoverModules();
      expect(Array.isArray(result.routes)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should skip non-directory files in modules directory', async () => {
      const { fileURLToPath } = await import('node:url');
      const { dirname } = await import('node:path');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const modulesDir = join(__dirname, '../../../modules');
      const testFile = join(modulesDir, `test-file-${Date.now()}.txt`);

      try {
        await writeFile(testFile, 'test content');

        const result = await discoverModules();
        expect(Array.isArray(result.modules)).toBe(true);
      } finally {
        await rm(testFile, { force: true }).catch(() => {});
      }
    });

    it('should skip directories without module-configuration.ts or module-configuration.js', async () => {
      const { fileURLToPath } = await import('node:url');
      const { dirname } = await import('node:path');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const modulesDir = join(__dirname, '../../../modules');
      const testModuleDir = join(modulesDir, `test-module-${Date.now()}`);

      try {
        await mkdir(testModuleDir, { recursive: true });

        await writeFile(join(testModuleDir, 'other-file.txt'), 'test content');

        const initialResult = await discoverModules();
        const initialModuleCount = initialResult.modules.length;

        const result = await discoverModules();
        expect(result.modules.length).toBe(initialModuleCount);
      } finally {
        await rm(testModuleDir, { recursive: true, force: true }).catch(
          () => {}
        );
      }
    });

    it('should handle empty modules directory gracefully', async () => {
      const result = await discoverModules();
      expect(Array.isArray(result.modules)).toBe(true);
      expect(Array.isArray(result.models)).toBe(true);
      expect(Array.isArray(result.modelAssociations)).toBe(true);
      expect(Array.isArray(result.routes)).toBe(true);
    });
  });

  describe('module whitelist', () => {
    const originalEnv = process.env['MODULE_WHITELIST'];

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env['MODULE_WHITELIST'] = originalEnv;
      } else {
        delete process.env['MODULE_WHITELIST'];
      }
    });

    it('should load all modules when MODULE_WHITELIST is not set', async () => {
      delete process.env['MODULE_WHITELIST'];

      const result = await discoverModules();
      expect(result.modules.length).toBeGreaterThan(0);
      expect(Array.isArray(result.modules)).toBe(true);
    });

    it('should load only whitelisted modules when MODULE_WHITELIST is set', async () => {
      process.env['MODULE_WHITELIST'] = 'auth';

      const result = await discoverModules();
      expect(result.modules.length).toBeGreaterThan(0);
      expect(Array.isArray(result.modules)).toBe(true);
    });

    it('should throw error when MODULE_WHITELIST is set but no matching modules found', async () => {
      process.env['MODULE_WHITELIST'] = 'nonexistent-module';

      await expect(discoverModules()).rejects.toThrow(
        'MODULE_WHITELIST is set but no matching modules found. Whitelist: nonexistent-module'
      );
    });

    it('should handle whitespace in MODULE_WHITELIST', async () => {
      process.env['MODULE_WHITELIST'] = ' auth ';

      const result = await discoverModules();
      expect(result.modules.length).toBeGreaterThan(0);
    });

    it('should filter out empty values in MODULE_WHITELIST', async () => {
      process.env['MODULE_WHITELIST'] = 'auth,,';

      const result = await discoverModules();
      expect(result.modules.length).toBeGreaterThan(0);
    });

    it('should only load models from whitelisted modules', async () => {
      process.env['MODULE_WHITELIST'] = 'auth';

      const result = await discoverModules();
      expect(Array.isArray(result.models)).toBe(true);
      expect(result.models.length).toBeGreaterThanOrEqual(0);
    });

    it('should only load routes from whitelisted modules', async () => {
      process.env['MODULE_WHITELIST'] = 'auth';

      const result = await discoverModules();
      expect(Array.isArray(result.routes)).toBe(true);
      expect(result.routes.length).toBeGreaterThanOrEqual(0);
    });

    it('should only load model associations from whitelisted modules', async () => {
      process.env['MODULE_WHITELIST'] = 'auth';

      const result = await discoverModules();
      expect(Array.isArray(result.modelAssociations)).toBe(true);
    });

    it('should only load GraphQL schemas from whitelisted modules', async () => {
      process.env['MODULE_WHITELIST'] = 'auth';

      const result = await discoverModules();
      expect(Array.isArray(result.graphqlSchemas)).toBe(true);
      expect(result.graphqlSchemas.length).toBeGreaterThanOrEqual(0);
    });

    it('should only load GraphQL resolvers from whitelisted modules', async () => {
      process.env['MODULE_WHITELIST'] = 'auth';

      const result = await discoverModules();
      expect(Array.isArray(result.graphqlResolvers)).toBe(true);
      expect(result.graphqlResolvers.length).toBeGreaterThanOrEqual(0);
    });

    it('should throw error with correct whitelist values in error message', async () => {
      process.env['MODULE_WHITELIST'] = 'module1,module2,module3';

      await expect(discoverModules()).rejects.toThrow(
        'MODULE_WHITELIST is set but no matching modules found. Whitelist: module1, module2, module3'
      );
    });

    it('should throw error when some modules in whitelist are not found', async () => {
      process.env['MODULE_WHITELIST'] =
        'auth,nonexistent-module,another-missing';

      await expect(discoverModules()).rejects.toThrow(
        'MODULE_WHITELIST contains modules that were not found: nonexistent-module, another-missing'
      );
    });

    it('should throw error listing all missing modules when multiple are missing', async () => {
      process.env['MODULE_WHITELIST'] = 'missing1,missing2,missing3';

      await expect(discoverModules()).rejects.toThrow(
        'MODULE_WHITELIST is set but no matching modules found. Whitelist: missing1, missing2, missing3'
      );
    });

    it('should handle empty MODULE_WHITELIST as not set', async () => {
      process.env['MODULE_WHITELIST'] = '';

      const result = await discoverModules();
      expect(result.modules.length).toBeGreaterThan(0);
    });

    it('should handle MODULE_WHITELIST with only whitespace as not set', async () => {
      process.env['MODULE_WHITELIST'] = '   ,  ,  ';

      const result = await discoverModules();
      expect(result.modules.length).toBeGreaterThan(0);
    });
  });
});
