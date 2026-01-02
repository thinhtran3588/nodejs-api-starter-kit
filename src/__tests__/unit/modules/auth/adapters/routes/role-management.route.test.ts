import { asValue } from 'awilix';
import fastify, { type FastifyInstance } from 'fastify';
import { Sequelize } from 'sequelize';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockFastifyLogger } from '@app/__tests__/test-utils/test-helpers';
import { createDIContainer } from '@app/application/container';
import { attachAppContext } from '@app/application/middleware/attach-app-context';
import { errorHandler } from '@app/application/middleware/error.handler';
import { ErrorCodeRegistry } from '@app/common/utils/error-code-registry';
import { routeConfiguration } from '@app/modules/auth/adapters/routes/role-management.route';
import { FindRolesQueryHandler } from '@app/modules/auth/application/query-handlers/find-roles.query-handler';
import { GetRoleQueryHandler } from '@app/modules/auth/application/query-handlers/get-role.query-handler';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';

describe('role-management.route', () => {
  let app: FastifyInstance;
  let mockFindRolesQueryHandler: FindRolesQueryHandler;
  let mockGetRoleQueryHandler: GetRoleQueryHandler;
  let mockJwtService: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockFindRolesQueryHandler = {
      execute: vi.fn(),
    } as unknown as FindRolesQueryHandler;

    mockGetRoleQueryHandler = {
      execute: vi.fn(),
    } as unknown as GetRoleQueryHandler;

    mockJwtService = {
      verifyToken: vi.fn().mockReturnValue({
        userId: 'manager-user-id',
        roles: [AuthRole.AUTH_MANAGER],
      }),
    };

    const mockDatabase = new Sequelize({
      dialect: 'postgres',
      logging: false,
    });

    const mockReadDatabase = new Sequelize({
      dialect: 'postgres',
      logging: false,
    });

    const container = createDIContainer(
      mockDatabase,
      mockReadDatabase,
      createMockFastifyLogger()
    );
    (container as any).register({
      jwtService: asValue(mockJwtService),
      findRolesQueryHandler: asValue(mockFindRolesQueryHandler),
      getRoleQueryHandler: asValue(mockGetRoleQueryHandler),
    });

    const errorCodeRegistry = new ErrorCodeRegistry();

    app = fastify({
      logger: false,
    });

    app.decorate('diContainer', container);
    app.addHook('onRequest', attachAppContext);
    app.setErrorHandler((error, request, reply) =>
      errorHandler(error as Error, request, reply, errorCodeRegistry, app.log)
    );

    routeConfiguration.register(app);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('routeConfiguration', () => {
    it('should have correct tags', () => {
      expect(routeConfiguration.tags).toEqual([
        {
          name: 'role',
          description: 'Role management endpoints',
        },
      ]);
    });

    it('should have register function', () => {
      expect(typeof routeConfiguration.register).toBe('function');
    });
  });

  describe('GET /roles - happy path', () => {
    it('should return paginated roles', async () => {
      vi.mocked(mockFindRolesQueryHandler.execute).mockResolvedValue({
        data: [
          {
            id: 'role-123',
            code: 'ADMIN',
            name: 'Admin',
            description: 'Administrator role',
            version: 1,
            createdAt: new Date('2024-01-01'),
            lastModifiedAt: new Date('2024-01-01'),
            createdBy: undefined,
            lastModifiedBy: undefined,
          },
        ],
        pagination: {
          count: 1,
          pageIndex: 0,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/roles',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toHaveLength(1);
      expect(body.pagination.count).toBe(1);
      expect(body.pagination.pageIndex).toBe(0);
      expect(body.data[0].id).toBe('role-123');
      expect(body.data[0].name).toBe('Admin');
    });

    it('should return roles with search term', async () => {
      vi.mocked(mockFindRolesQueryHandler.execute).mockResolvedValue({
        data: [
          {
            id: 'role-123',
            code: 'ADMIN',
            name: 'Admin',
            description: 'Administrator role',
            version: 1,
            createdAt: new Date('2024-01-01'),
            lastModifiedAt: new Date('2024-01-01'),
            createdBy: undefined,
            lastModifiedBy: undefined,
          },
        ],
        pagination: {
          count: 1,
          pageIndex: 0,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/roles?searchTerm=admin',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mockFindRolesQueryHandler.execute).toHaveBeenCalledWith(
        { searchTerm: 'admin' },
        expect.any(Object)
      );
    });
  });

  describe('GET /roles/:id - happy path', () => {
    it('should return role by ID', async () => {
      const roleId = 'role-123';
      vi.mocked(mockGetRoleQueryHandler.execute).mockResolvedValue({
        id: roleId,
        code: 'ADMIN',
        name: 'Admin',
        description: 'Administrator role',
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy: 'user-123',
        lastModifiedBy: 'user-123',
      });

      const response = await app.inject({
        method: 'GET',
        url: `/roles/${roleId}`,
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBe(roleId);
      expect(body.name).toBe('Admin');
      expect(body.description).toBe('Administrator role');
      expect(body.version).toBe(1);
      expect(mockGetRoleQueryHandler.execute).toHaveBeenCalledWith(
        { id: roleId },
        expect.any(Object)
      );
    });
  });
});
