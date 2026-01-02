import { asValue } from 'awilix';
import fastify, { type FastifyInstance } from 'fastify';
import { Sequelize } from 'sequelize';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockFastifyLogger } from '@app/__tests__/test-utils/test-helpers';
import { createDIContainer } from '@app/application/container';
import { attachAppContext } from '@app/application/middleware/attach-app-context';
import { errorHandler } from '@app/application/middleware/error.handler';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { AuthorizationExceptionCode } from '@app/common/enums/authorization-exception-code';
import { ErrorCodeRegistry } from '@app/common/utils/error-code-registry';
import {
  BusinessException,
  ValidationException,
} from '@app/common/utils/exceptions';
import { routeConfiguration } from '@app/modules/auth/adapters/routes/role-management.route';
import { FindRolesQueryHandler } from '@app/modules/auth/application/query-handlers/find-roles.query-handler';
import { GetRoleQueryHandler } from '@app/modules/auth/application/query-handlers/get-role.query-handler';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';

describe('Role Management Route E2E', () => {
  let app: FastifyInstance;
  let mockFindRolesQueryHandler: FindRolesQueryHandler;
  let mockGetRoleQueryHandler: GetRoleQueryHandler;

  const roleId = 'role-123';
  const managerUserId = Uuid.create('550e8400-e29b-41d4-a716-446655440002');

  beforeEach(async () => {
    vi.clearAllMocks();

    mockFindRolesQueryHandler = {
      execute: vi.fn(),
    } as unknown as FindRolesQueryHandler;

    mockGetRoleQueryHandler = {
      execute: vi.fn(),
    } as unknown as GetRoleQueryHandler;

    const mockJwtService = {
      verifyToken: vi.fn((token: string) => {
        if (token === 'valid-token') {
          return {
            userId: managerUserId.getValue(),
            roles: [AuthRole.AUTH_MANAGER],
          };
        }
        throw new Error('Invalid token');
      }),
      initialize: vi.fn(),
    };

    const mockWriteDatabase = new Sequelize({
      dialect: 'postgres',
      logging: false,
    });
    const mockReadDatabase = new Sequelize({
      dialect: 'postgres',
      logging: false,
    });

    const container = createDIContainer(
      mockWriteDatabase,
      mockReadDatabase,
      createMockFastifyLogger()
    );
    (container as any).register({
      findRolesQueryHandler: asValue(mockFindRolesQueryHandler),
      getRoleQueryHandler: asValue(mockGetRoleQueryHandler),
      jwtService: asValue(mockJwtService),
    });

    app = fastify({
      logger: false,
    });

    const errorCodeRegistry = new ErrorCodeRegistry();
    errorCodeRegistry.register({
      [AuthExceptionCode.ROLE_NOT_FOUND]: 404,
      [AuthorizationExceptionCode.UNAUTHORIZED]: 401,
      [AuthorizationExceptionCode.FORBIDDEN]: 403,
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

  describe('GET /roles', () => {
    describe('happy path', () => {
      it('should return paginated roles', async () => {
        vi.mocked(mockFindRolesQueryHandler.execute).mockResolvedValue({
          data: [
            {
              id: roleId,
              code: 'ADMIN',
              name: 'Administrator',
              description: 'Admin role',
              version: 0,
              createdAt: new Date('2024-01-01'),
              createdBy: undefined,
              lastModifiedAt: new Date('2024-01-01'),
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
        expect(body.data[0].id).toBe(roleId);
        expect(body.pagination.count).toBe(1);
      });

      it('should return roles with search term', async () => {
        vi.mocked(mockFindRolesQueryHandler.execute).mockResolvedValue({
          data: [],
          pagination: {
            count: 0,
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
        const body = response.json();
        expect(body.data).toHaveLength(0);
      });

      it('should return roles with pagination', async () => {
        vi.mocked(mockFindRolesQueryHandler.execute).mockResolvedValue({
          data: [],
          pagination: {
            count: 0,
            pageIndex: 1,
          },
        });

        const response = await app.inject({
          method: 'GET',
          url: '/roles?pageIndex=1&itemsPerPage=10',
          headers: {
            authorization: 'Bearer valid-token',
          },
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body.pagination.pageIndex).toBe(1);
      });
    });

    describe('authentication errors', () => {
      it('should return 401 when not authenticated', async () => {
        vi.mocked(mockFindRolesQueryHandler.execute).mockRejectedValue(
          new BusinessException(
            AuthorizationExceptionCode.UNAUTHORIZED,
            undefined,
            'Authentication required'
          )
        );

        const response = await app.inject({
          method: 'GET',
          url: '/roles',
        });

        expect(response.statusCode).toBe(401);
      });
    });
  });

  describe('GET /roles/:id', () => {
    describe('happy path', () => {
      it('should return role by id', async () => {
        vi.mocked(mockGetRoleQueryHandler.execute).mockResolvedValue({
          id: roleId,
          code: 'ADMIN',
          name: 'Administrator',
          description: 'Admin role',
          version: 0,
          createdAt: new Date('2024-01-01'),
          createdBy: undefined,
          lastModifiedAt: new Date('2024-01-01'),
          lastModifiedBy: undefined,
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
        expect(body.code).toBe('ADMIN');
        expect(body.name).toBe('Administrator');
      });
    });

    describe('error cases', () => {
      it('should return 404 when role not found', async () => {
        vi.mocked(mockGetRoleQueryHandler.execute).mockRejectedValue(
          new ValidationException(AuthExceptionCode.ROLE_NOT_FOUND)
        );

        const response = await app.inject({
          method: 'GET',
          url: `/roles/${roleId}`,
          headers: {
            authorization: 'Bearer valid-token',
          },
        });

        expect(response.statusCode).toBe(404);
      });
    });
  });
});
