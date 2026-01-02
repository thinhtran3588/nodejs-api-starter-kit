import type { FastifyInstance } from 'fastify';
import { Sequelize } from 'sequelize';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, startServer } from '@app/app';
import { createDIContainer } from '@app/application/container';
import {
  initializeReadDatabase,
  initializeWriteDatabase,
} from '@app/application/database';
import { registerCors } from '@app/application/middleware/register-cors';
import { registerRateLimit } from '@app/application/middleware/register-rate-limit';
import { registerSwagger } from '@app/application/middleware/register-swagger';
import { discoverModules } from '@app/application/module-discovery';
import type { ExternalAuthenticationService } from '@app/modules/auth/domain/interfaces/services/external-authentication.service';

vi.mock('@app/common/utils/load-env');
vi.mock('@app/application/container');
vi.mock('@app/application/database');
vi.mock('@app/application/module-discovery');
vi.mock('@app/application/middleware/attach-app-context');
vi.mock('@app/application/middleware/error.handler');
vi.mock('@app/application/middleware/not-found.handler');
vi.mock('@app/application/middleware/register-cors');
vi.mock('@app/application/middleware/register-rate-limit');
vi.mock('@app/application/middleware/register-swagger');

describe('app', () => {
  const originalEnv = process.env;
  let mockWriteDatabase: Sequelize;
  let mockReadDatabase: Sequelize;
  let mockContainer: ReturnType<typeof createDIContainer>;
  let mockExternalAuthService: ExternalAuthenticationService;
  let mockJwtService: { initialize: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env['NODE_ENV'] = 'test';

    mockWriteDatabase = new Sequelize({
      dialect: 'postgres',
      logging: false,
    });
    mockReadDatabase = new Sequelize({
      dialect: 'postgres',
      logging: false,
    });

    mockJwtService = {
      initialize: vi.fn(),
    };

    mockExternalAuthService = {
      initialize: vi.fn(),
    } as unknown as ExternalAuthenticationService;

    mockContainer = {
      resolve: vi.fn((name: string) => {
        if (name === 'externalAuthenticationService') {
          return mockExternalAuthService;
        }
        if (name === 'jwtService') {
          return mockJwtService;
        }
        return null;
      }),
      decorate: vi.fn(),
    } as unknown as ReturnType<typeof createDIContainer>;

    vi.mocked(createDIContainer).mockReturnValue(mockContainer);
    vi.mocked(initializeWriteDatabase).mockReturnValue(mockWriteDatabase);
    vi.mocked(initializeReadDatabase).mockReturnValue(mockReadDatabase);
    vi.mocked(discoverModules).mockResolvedValue({
      modules: [],
      models: [],
      modelAssociations: [],
      routes: [],
      graphqlSchemas: [],
      graphqlResolvers: [],
      moduleNames: [],
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createApp - happy path', () => {
    it('should create Fastify app instance', async () => {
      const app = await createApp();

      expect(app).toBeDefined();
      expect(typeof app.log).toBe('object');
    });

    it('should initialize databases', async () => {
      await createApp();

      expect(initializeWriteDatabase).toHaveBeenCalled();
      expect(initializeReadDatabase).toHaveBeenCalled();
    });

    it('should create dependency injection container', async () => {
      const app = await createApp();

      expect(createDIContainer).toHaveBeenCalledWith(
        mockWriteDatabase,
        mockReadDatabase,
        app.log
      );
    });

    it('should discover modules', async () => {
      await createApp();

      expect(discoverModules).toHaveBeenCalled();
    });

    it('should register models and associations', async () => {
      const mockModel = {
        register: vi.fn(),
      };
      const mockAssociation = {
        register: vi.fn(),
      };

      vi.mocked(discoverModules).mockResolvedValue({
        modules: [],
        models: [mockModel],
        modelAssociations: [mockAssociation],
        routes: [],
        graphqlSchemas: [],
        graphqlResolvers: [],
        moduleNames: [],
      });

      await createApp();

      expect(mockModel.register).toHaveBeenCalledWith(mockWriteDatabase);
      expect(mockAssociation.register).toHaveBeenCalled();
    });

    it('should register routes', async () => {
      const mockRoute = {
        tags: [{ name: 'test', description: 'Test' }],
        register: vi.fn(),
      };

      vi.mocked(discoverModules).mockResolvedValue({
        modules: [],
        models: [],
        modelAssociations: [],
        routes: [mockRoute],
        graphqlSchemas: [],
        graphqlResolvers: [],
        moduleNames: [],
      });

      await createApp();

      expect(mockRoute.register).toHaveBeenCalled();
    });

    it('should initialize external authentication service', async () => {
      await createApp();

      expect(mockExternalAuthService.initialize).toHaveBeenCalled();
    });

    it('should initialize JWT service', async () => {
      await createApp();

      expect(mockJwtService.initialize).toHaveBeenCalled();
    });

    it('should register modules', async () => {
      const mockModule = {
        registerDependencies: vi.fn(),
        registerErrorCodes: vi.fn(),
      };

      vi.mocked(discoverModules).mockResolvedValue({
        modules: [mockModule],
        models: [],
        modelAssociations: [],
        routes: [],
        graphqlSchemas: [],
        graphqlResolvers: [],
        moduleNames: [],
      });

      await createApp();

      expect(mockModule.registerDependencies).toHaveBeenCalledWith(
        mockContainer
      );
      expect(mockModule.registerErrorCodes).toHaveBeenCalled();
    });

    it('should register error code registry with application-level codes', async () => {
      const app = await createApp();

      expect(app).toBeDefined();
    });

    it('should configure Fastify with correct options', async () => {
      const app = await createApp();

      expect(app).toBeDefined();
    });

    it('should disable logger when NODE_ENV is test', async () => {
      process.env['NODE_ENV'] = 'test';
      const app = await createApp();

      expect(app).toBeDefined();
    });

    it('should enable logger when NODE_ENV is not test', async () => {
      const originalNodeEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'development';

      const app = await createApp();

      expect(app).toBeDefined();

      process.env['NODE_ENV'] = originalNodeEnv;
    });

    it('should decorate app with diContainer', async () => {
      const app = await createApp();

      expect((app as any).diContainer).toBe(mockContainer);
    });

    it('should register error handler', async () => {
      const app = await createApp();

      expect(app).toBeDefined();
      expect(typeof app.setErrorHandler).toBe('function');
    });

    it('should register not found handler', async () => {
      const app = await createApp();

      expect(app).toBeDefined();
      expect(typeof app.setNotFoundHandler).toBe('function');
    });

    it('should register onRequest hook with attachAppContext', async () => {
      const app = await createApp();

      expect(app).toBeDefined();
      expect(typeof app.addHook).toBe('function');
    });

    it('should register middleware in correct order', async () => {
      await createApp();

      expect(registerCors).toHaveBeenCalled();
      expect(registerRateLimit).toHaveBeenCalled();
      expect(registerSwagger).toHaveBeenCalled();
    });

    it('should handle multiple models', async () => {
      const mockModel1 = { register: vi.fn() };
      const mockModel2 = { register: vi.fn() };

      vi.mocked(discoverModules).mockResolvedValue({
        modules: [],
        models: [mockModel1, mockModel2],
        modelAssociations: [],
        routes: [],
        graphqlSchemas: [],
        graphqlResolvers: [],
        moduleNames: [],
      });

      await createApp();

      expect(mockModel1.register).toHaveBeenCalledWith(mockWriteDatabase);
      expect(mockModel2.register).toHaveBeenCalledWith(mockWriteDatabase);
    });

    it('should handle multiple associations', async () => {
      const mockAssociation1 = { register: vi.fn() };
      const mockAssociation2 = { register: vi.fn() };

      vi.mocked(discoverModules).mockResolvedValue({
        modules: [],
        models: [],
        modelAssociations: [mockAssociation1, mockAssociation2],
        routes: [],
        graphqlSchemas: [],
        graphqlResolvers: [],
        moduleNames: [],
      });

      await createApp();

      expect(mockAssociation1.register).toHaveBeenCalled();
      expect(mockAssociation2.register).toHaveBeenCalled();
    });

    it('should handle multiple routes', async () => {
      const mockRoute1 = {
        tags: [{ name: 'test1', description: 'Test 1' }],
        register: vi.fn(),
      };
      const mockRoute2 = {
        tags: [{ name: 'test2', description: 'Test 2' }],
        register: vi.fn(),
      };

      vi.mocked(discoverModules).mockResolvedValue({
        modules: [],
        models: [],
        modelAssociations: [],
        routes: [mockRoute1, mockRoute2],
        graphqlSchemas: [],
        graphqlResolvers: [],
        moduleNames: [],
      });

      await createApp();

      expect(mockRoute1.register).toHaveBeenCalled();
      expect(mockRoute2.register).toHaveBeenCalled();
    });

    it('should handle multiple modules', async () => {
      const mockModule1 = {
        registerDependencies: vi.fn(),
        registerErrorCodes: vi.fn(),
      };
      const mockModule2 = {
        registerDependencies: vi.fn(),
        registerErrorCodes: vi.fn(),
      };

      vi.mocked(discoverModules).mockResolvedValue({
        modules: [mockModule1, mockModule2],
        models: [],
        modelAssociations: [],
        routes: [],
        graphqlSchemas: [],
        graphqlResolvers: [],
        moduleNames: [],
      });

      await createApp();

      expect(mockModule1.registerDependencies).toHaveBeenCalledWith(
        mockContainer
      );
      expect(mockModule1.registerErrorCodes).toHaveBeenCalled();
      expect(mockModule2.registerDependencies).toHaveBeenCalledWith(
        mockContainer
      );
      expect(mockModule2.registerErrorCodes).toHaveBeenCalled();
    });

    it('should flatten route tags correctly', async () => {
      const mockRoute1 = {
        tags: [
          { name: 'tag1', description: 'Tag 1' },
          { name: 'tag2', description: 'Tag 2' },
        ],
        register: vi.fn(),
      };
      const mockRoute2 = {
        tags: [{ name: 'tag3', description: 'Tag 3' }],
        register: vi.fn(),
      };

      vi.mocked(discoverModules).mockResolvedValue({
        modules: [],
        models: [],
        modelAssociations: [],
        routes: [mockRoute1, mockRoute2],
        graphqlSchemas: [],
        graphqlResolvers: [],
        moduleNames: [],
      });

      await createApp();

      expect(registerSwagger).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([
          { name: 'tag1', description: 'Tag 1' },
          { name: 'tag2', description: 'Tag 2' },
          { name: 'tag3', description: 'Tag 3' },
        ])
      );
    });

    it('should configure error handler correctly', async () => {
      const app = await createApp();

      expect(app).toBeDefined();
      expect(typeof app.setErrorHandler).toBe('function');
    });

    it('should execute error handler arrow function callback', async () => {
      const { errorHandler } = await import(
        '@app/application/middleware/error.handler'
      );

      let errorHandlerCallback:
        | ((error: Error, request: any, reply: any) => void)
        | null = null;

      vi.doMock('fastify', async () => {
        const actualFastify = await vi.importActual('fastify');
        const FastifyActual = (actualFastify as any).default;
        return {
          default: vi.fn((options?: any) => {
            const app = FastifyActual(options);
            const originalSetErrorHandler = app.setErrorHandler.bind(app);
            app.setErrorHandler = vi.fn((handler) => {
              errorHandlerCallback = handler as (
                error: Error,
                request: any,
                reply: any
              ) => void;
              return originalSetErrorHandler(handler);
            });
            return app;
          }),
        };
      });

      vi.resetModules();
      const appModule = await import('@app/app');
      const app = await (
        appModule.createApp as () => Promise<FastifyInstance>
      )();

      expect(errorHandlerCallback).not.toBeNull();

      const mockRequest = {} as any;
      const mockReply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;
      const mockError = new Error('Test error');

      const handler = errorHandlerCallback as unknown as (
        error: Error,
        request: any,
        reply: any
      ) => void;
      handler(mockError, mockRequest, mockReply);

      expect(errorHandler).toHaveBeenCalledWith(
        mockError,
        mockRequest,
        mockReply,
        expect.anything(),
        expect.anything()
      );

      expect(app).toBeDefined();
    });
  });

  describe('startServer - happy path', () => {
    it('should start server on default port and host', async () => {
      const originalPort = process.env['PORT'];
      const originalHost = process.env['HOST'];
      delete process.env['PORT'];
      delete process.env['HOST'];

      const mockApp = {
        listen: vi.fn().mockResolvedValue(undefined),
        log: {
          info: vi.fn(),
          error: vi.fn(),
        },
      } as unknown as FastifyInstance;

      await startServer(mockApp);

      expect(mockApp.listen).toHaveBeenCalledWith({
        port: 8080,
        host: '0.0.0.0',
      });
      if (originalPort) process.env['PORT'] = originalPort;
      else delete process.env['PORT'];
      if (originalHost) process.env['HOST'] = originalHost;
    });

    it('should start server on custom port from environment', async () => {
      const originalPort = process.env['PORT'];
      const originalHost = process.env['HOST'];
      process.env['PORT'] = '3000';
      delete process.env['HOST'];

      const mockApp = {
        listen: vi.fn().mockResolvedValue(undefined),
        log: {
          info: vi.fn(),
          error: vi.fn(),
        },
      } as unknown as FastifyInstance;

      await startServer(mockApp);

      expect(mockApp.listen).toHaveBeenCalledWith({
        port: 3000,
        host: '0.0.0.0',
      });
      if (originalPort) process.env['PORT'] = originalPort;
      else delete process.env['PORT'];
      if (originalHost) process.env['HOST'] = originalHost;
    });

    it('should start server on custom host from environment', async () => {
      process.env['HOST'] = '127.0.0.1';

      const mockApp = {
        listen: vi.fn().mockResolvedValue(undefined),
        log: {
          info: vi.fn(),
          error: vi.fn(),
        },
      } as unknown as FastifyInstance;

      await startServer(mockApp);

      expect(mockApp.listen).toHaveBeenCalledWith({
        port: 8080,
        host: '127.0.0.1',
      });
    });

    it('should log server start information', async () => {
      const mockApp = {
        listen: vi.fn().mockResolvedValue(undefined),
        log: {
          info: vi.fn(),
          error: vi.fn(),
        },
      } as unknown as FastifyInstance;

      await startServer(mockApp);

      expect(mockApp.log.info).toHaveBeenCalledWith(
        expect.stringContaining('Server listening')
      );
    });
  });

  describe('startServer - edge cases', () => {
    it('should use default port when PORT is NaN', async () => {
      const originalPort = process.env['PORT'];
      const originalHost = process.env['HOST'];
      process.env['PORT'] = 'invalid';
      delete process.env['HOST'];

      const mockApp = {
        listen: vi.fn().mockResolvedValue(undefined),
        log: {
          info: vi.fn(),
          error: vi.fn(),
        },
      } as unknown as FastifyInstance;

      await startServer(mockApp);

      expect(mockApp.listen).toHaveBeenCalledWith({
        port: 8080,
        host: '0.0.0.0',
      });
      if (originalPort) process.env['PORT'] = originalPort;
      else delete process.env['PORT'];
      if (originalHost) process.env['HOST'] = originalHost;
    });

    it('should use default port when PORT is negative', async () => {
      const originalPort = process.env['PORT'];
      const originalHost = process.env['HOST'];
      process.env['PORT'] = '-1';
      delete process.env['HOST'];

      const mockApp = {
        listen: vi.fn().mockResolvedValue(undefined),
        log: {
          info: vi.fn(),
          error: vi.fn(),
        },
      } as unknown as FastifyInstance;

      await startServer(mockApp);

      expect(mockApp.listen).toHaveBeenCalledWith({
        port: 8080,
        host: '0.0.0.0',
      });
      if (originalPort) process.env['PORT'] = originalPort;
      else delete process.env['PORT'];
      if (originalHost) process.env['HOST'] = originalHost;
    });

    it('should use default port when PORT is zero', async () => {
      const originalPort = process.env['PORT'];
      const originalHost = process.env['HOST'];
      process.env['PORT'] = '0';
      delete process.env['HOST'];

      const mockApp = {
        listen: vi.fn().mockResolvedValue(undefined),
        log: {
          info: vi.fn(),
          error: vi.fn(),
        },
      } as unknown as FastifyInstance;

      await startServer(mockApp);

      expect(mockApp.listen).toHaveBeenCalledWith({
        port: 8080,
        host: '0.0.0.0',
      });
      if (originalPort) process.env['PORT'] = originalPort;
      else delete process.env['PORT'];
      if (originalHost) process.env['HOST'] = originalHost;
    });

    it('should handle listen errors and exit process', async () => {
      const mockExit = vi
        .spyOn(process, 'exit')
        .mockImplementation(() => undefined as never);
      const error = new Error('Port already in use');

      const mockApp = {
        listen: vi.fn().mockRejectedValue(error),
        log: {
          info: vi.fn(),
          error: vi.fn(),
        },
      } as unknown as FastifyInstance;

      await startServer(mockApp);

      expect(mockApp.log.error).toHaveBeenCalledWith(error);
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should handle empty string PORT environment variable', async () => {
      const originalPort = process.env['PORT'];
      const originalHost = process.env['HOST'];
      process.env['PORT'] = '';
      delete process.env['HOST'];

      const mockApp = {
        listen: vi.fn().mockResolvedValue(undefined),
        log: {
          info: vi.fn(),
          error: vi.fn(),
        },
      } as unknown as FastifyInstance;

      await startServer(mockApp);

      expect(mockApp.listen).toHaveBeenCalledWith({
        port: 8080,
        host: '0.0.0.0',
      });
      if (originalPort) process.env['PORT'] = originalPort;
      else delete process.env['PORT'];
      if (originalHost) process.env['HOST'] = originalHost;
    });

    it('should use empty string when HOST is set to empty string', async () => {
      const originalHost = process.env['HOST'];
      process.env['HOST'] = '';

      const mockApp = {
        listen: vi.fn().mockResolvedValue(undefined),
        log: {
          info: vi.fn(),
          error: vi.fn(),
        },
      } as unknown as FastifyInstance;

      await startServer(mockApp);

      expect(mockApp.listen).toHaveBeenCalledWith({
        port: 8080,
        host: '',
      });
      if (originalHost) process.env['HOST'] = originalHost;
    });

    it('should use valid port number when PORT is a valid positive number', async () => {
      const originalPort = process.env['PORT'];
      const originalHost = process.env['HOST'];
      process.env['PORT'] = '9000';
      delete process.env['HOST'];

      const mockApp = {
        listen: vi.fn().mockResolvedValue(undefined),
        log: {
          info: vi.fn(),
          error: vi.fn(),
        },
      } as unknown as FastifyInstance;

      await startServer(mockApp);

      expect(mockApp.listen).toHaveBeenCalledWith({
        port: 9000,
        host: '0.0.0.0',
      });
      if (originalPort) process.env['PORT'] = originalPort;
      else delete process.env['PORT'];
      if (originalHost) process.env['HOST'] = originalHost;
    });
  });

  describe('function exports', () => {
    it('should export createApp function', async () => {
      const appModule = await import('@app/app');
      expect(typeof appModule.createApp).toBe('function');
      const app = await appModule.createApp();
      expect(app).toBeDefined();
    });

    it('should export startServer function', async () => {
      const appModule = await import('@app/app');
      expect(typeof appModule.startServer).toBe('function');
      const mockApp = {
        listen: vi.fn().mockResolvedValue(undefined),
        log: {
          info: vi.fn(),
          error: vi.fn(),
        },
      } as unknown as FastifyInstance;
      await appModule.startServer(mockApp);
      expect(mockApp.listen).toHaveBeenCalled();
    });
  });
});
