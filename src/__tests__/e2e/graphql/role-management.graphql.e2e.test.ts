import { asValue } from 'awilix';
import fastify, { type FastifyInstance } from 'fastify';
import { Sequelize } from 'sequelize';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockFastifyLogger } from '@app/__tests__/test-utils/test-helpers';
import { createDIContainer } from '@app/application/container';
import { attachAppContext } from '@app/application/middleware/attach-app-context';
import { errorHandler } from '@app/application/middleware/error.handler';
import { registerGraphQL } from '@app/application/middleware/register-graphql';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { ErrorCodeRegistry } from '@app/common/utils/error-code-registry';
import { authResolvers } from '@app/modules/auth/adapters/graphql/auth.resolvers';
import { authSchema } from '@app/modules/auth/adapters/graphql/auth.schema';
import { roleManagementResolvers } from '@app/modules/auth/adapters/graphql/role-management.resolvers';
import { roleManagementSchema } from '@app/modules/auth/adapters/graphql/role-management.schema';
import { userGroupManagementResolvers } from '@app/modules/auth/adapters/graphql/user-group-management.resolvers';
import { userGroupManagementSchema } from '@app/modules/auth/adapters/graphql/user-group-management.schema';
import { userManagementResolvers } from '@app/modules/auth/adapters/graphql/user-management.resolvers';
import { userManagementSchema } from '@app/modules/auth/adapters/graphql/user-management.schema';
import { FindRolesQueryHandler } from '@app/modules/auth/application/query-handlers/find-roles.query-handler';
import { GetRoleQueryHandler } from '@app/modules/auth/application/query-handlers/get-role.query-handler';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';

describe('GraphQL Role Management E2E', () => {
  let app: FastifyInstance;
  let mockFindRolesQueryHandler: FindRolesQueryHandler;
  let mockGetRoleQueryHandler: GetRoleQueryHandler;

  const roleId = 'role-123';
  const managerUserId = Uuid.create('550e8400-e29b-41d4-a716-446655440002');

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env['GRAPHQL_UI_ENABLED'] = 'true';
    process.env['GRAPHQL_ENDPOINT'] = '/graphql';

    mockFindRolesQueryHandler = {
      execute: vi.fn(),
    } as unknown as FindRolesQueryHandler;

    mockGetRoleQueryHandler = {
      execute: vi.fn(),
    } as unknown as GetRoleQueryHandler;

    const mockDatabase = new Sequelize({
      dialect: 'postgres',
      logging: false,
    });

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
    });

    app.decorate('diContainer', container);
    app.addHook('onRequest', attachAppContext);
    app.setErrorHandler((error, request, reply) =>
      errorHandler(error as Error, request, reply, errorCodeRegistry, app.log)
    );

    await registerGraphQL(
      app,
      [
        { schema: authSchema },
        { schema: userManagementSchema },
        { schema: userGroupManagementSchema },
        { schema: roleManagementSchema },
      ],
      [
        { resolvers: authResolvers },
        { resolvers: userManagementResolvers },
        { resolvers: userGroupManagementResolvers },
        { resolvers: roleManagementResolvers },
      ]
    );
    await app.ready();
  });

  afterEach(async () => {
    delete process.env['GRAPHQL_UI_ENABLED'];
    delete process.env['GRAPHQL_ENDPOINT'];
    await app.close();
  });

  describe('Query.roles', () => {
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

      const query = `
        query {
          roles {
            data {
              id
              code
              name
              description
            }
            pagination {
              count
              pageIndex
            }
          }
        }
      `;

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          authorization: 'Bearer valid-token',
        },
        payload: {
          query,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toBeDefined();
      expect(body.data.roles.data).toHaveLength(1);
      expect(body.data.roles.data[0].id).toBe(roleId);
      expect(body.data.roles.data[0].code).toBe('ADMIN');
      expect(body.data.roles.pagination.count).toBe(1);
    });

    it('should return roles with search input', async () => {
      vi.mocked(mockFindRolesQueryHandler.execute).mockResolvedValue({
        data: [],
        pagination: {
          count: 0,
          pageIndex: 0,
        },
      });

      const query = `
        query {
          roles(input: {
            searchTerm: "admin"
            pageIndex: 0
            itemsPerPage: 10
          }) {
            data {
              id
              code
              name
            }
            pagination {
              count
              pageIndex
            }
          }
        }
      `;

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          authorization: 'Bearer valid-token',
        },
        payload: {
          query,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.roles.data).toHaveLength(0);
    });

    it('should return roles filtered by userGroupId', async () => {
      vi.mocked(mockFindRolesQueryHandler.execute).mockResolvedValue({
        data: [],
        pagination: {
          count: 0,
          pageIndex: 0,
        },
      });

      const query = `
        query {
          roles(input: {
            userGroupId: "550e8400-e29b-41d4-a716-446655440000"
          }) {
            data {
              id
              code
            }
            pagination {
              count
            }
          }
        }
      `;

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          authorization: 'Bearer valid-token',
        },
        payload: {
          query,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.roles.data).toHaveLength(0);
    });
  });

  describe('Query.role', () => {
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

      const query = `
        query {
          role(id: "${roleId}") {
            id
            code
            name
            description
          }
        }
      `;

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          authorization: 'Bearer valid-token',
        },
        payload: {
          query,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toBeDefined();
      expect(body.data.role.id).toBe(roleId);
      expect(body.data.role.code).toBe('ADMIN');
      expect(body.data.role.name).toBe('Administrator');
    });
  });
});
