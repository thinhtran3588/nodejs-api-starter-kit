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
import { AddRoleToUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/add-role-to-user-group.command-handler';
import { CreateUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/create-user-group.command-handler';
import { DeleteUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/delete-user-group.command-handler';
import { RemoveRoleFromUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/remove-role-from-user-group.command-handler';
import { UpdateUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/update-user-group.command-handler';
import { FindUserGroupsQueryHandler } from '@app/modules/auth/application/query-handlers/find-user-groups.query-handler';
import { GetUserGroupQueryHandler } from '@app/modules/auth/application/query-handlers/get-user-group.query-handler';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';

describe('GraphQL User Group Management E2E', () => {
  let app: FastifyInstance;
  let mockCreateUserGroupCommandHandler: CreateUserGroupCommandHandler;
  let mockFindUserGroupsQueryHandler: FindUserGroupsQueryHandler;
  let mockGetUserGroupQueryHandler: GetUserGroupQueryHandler;
  let mockUpdateUserGroupCommandHandler: UpdateUserGroupCommandHandler;
  let mockDeleteUserGroupCommandHandler: DeleteUserGroupCommandHandler;
  let mockAddRoleToUserGroupCommandHandler: AddRoleToUserGroupCommandHandler;
  let mockRemoveRoleFromUserGroupCommandHandler: RemoveRoleFromUserGroupCommandHandler;

  const userGroupId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
  const roleId = 'role-123';
  const managerUserId = Uuid.create('550e8400-e29b-41d4-a716-446655440002');

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env['GRAPHQL_UI_ENABLED'] = 'true';
    process.env['GRAPHQL_ENDPOINT'] = '/graphql';

    mockCreateUserGroupCommandHandler = {
      execute: vi.fn(),
    } as unknown as CreateUserGroupCommandHandler;

    mockFindUserGroupsQueryHandler = {
      execute: vi.fn(),
    } as unknown as FindUserGroupsQueryHandler;

    mockGetUserGroupQueryHandler = {
      execute: vi.fn(),
    } as unknown as GetUserGroupQueryHandler;

    mockUpdateUserGroupCommandHandler = {
      execute: vi.fn(),
    } as unknown as UpdateUserGroupCommandHandler;

    mockDeleteUserGroupCommandHandler = {
      execute: vi.fn(),
    } as unknown as DeleteUserGroupCommandHandler;

    mockAddRoleToUserGroupCommandHandler = {
      execute: vi.fn(),
    } as unknown as AddRoleToUserGroupCommandHandler;

    mockRemoveRoleFromUserGroupCommandHandler = {
      execute: vi.fn(),
    } as unknown as RemoveRoleFromUserGroupCommandHandler;

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
      createUserGroupCommandHandler: asValue(mockCreateUserGroupCommandHandler),
      findUserGroupsQueryHandler: asValue(mockFindUserGroupsQueryHandler),
      getUserGroupQueryHandler: asValue(mockGetUserGroupQueryHandler),
      updateUserGroupCommandHandler: asValue(mockUpdateUserGroupCommandHandler),
      deleteUserGroupCommandHandler: asValue(mockDeleteUserGroupCommandHandler),
      addRoleToUserGroupCommandHandler: asValue(
        mockAddRoleToUserGroupCommandHandler
      ),
      removeRoleFromUserGroupCommandHandler: asValue(
        mockRemoveRoleFromUserGroupCommandHandler
      ),
      jwtService: asValue(mockJwtService),
    });

    app = fastify({
      logger: false,
    });

    const errorCodeRegistry = new ErrorCodeRegistry();
    errorCodeRegistry.register({
      [AuthExceptionCode.USER_GROUP_NOT_FOUND]: 404,
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

  describe('Query.userGroups', () => {
    it('should return paginated user groups', async () => {
      vi.mocked(mockFindUserGroupsQueryHandler.execute).mockResolvedValue({
        data: [
          {
            id: userGroupId.getValue(),
            name: 'Test Group',
            description: 'Test Description',
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
          userGroups {
            data {
              id
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
      expect(body.data.userGroups.data).toHaveLength(1);
      expect(body.data.userGroups.data[0].id).toBe(userGroupId.getValue());
    });

    it('should return user groups with search input', async () => {
      vi.mocked(mockFindUserGroupsQueryHandler.execute).mockResolvedValue({
        data: [],
        pagination: {
          count: 0,
          pageIndex: 0,
        },
      });

      const query = `
        query {
          userGroups(input: {
            searchTerm: "test"
            pageIndex: 0
            itemsPerPage: 10
          }) {
            data {
              id
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
      expect(body.data.userGroups.data).toHaveLength(0);
    });
  });

  describe('Query.userGroup', () => {
    it('should return user group by id', async () => {
      vi.mocked(mockGetUserGroupQueryHandler.execute).mockResolvedValue({
        id: userGroupId.getValue(),
        name: 'Test Group',
        description: 'Test Description',
        version: 0,
        createdAt: new Date('2024-01-01'),
        createdBy: undefined,
        lastModifiedAt: new Date('2024-01-01'),
        lastModifiedBy: undefined,
      });

      const query = `
        query {
          userGroup(id: "${userGroupId.getValue()}") {
            id
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
      expect(body.data.userGroup.id).toBe(userGroupId.getValue());
      expect(body.data.userGroup.name).toBe('Test Group');
    });
  });

  describe('Mutation.userGroups.createUserGroup', () => {
    it('should create user group', async () => {
      vi.mocked(mockCreateUserGroupCommandHandler.execute).mockResolvedValue({
        id: userGroupId.getValue(),
      });

      const mutation = `
        mutation {
          userGroups {
            createUserGroup(input: {
              name: "Test Group"
              description: "Test Description"
            }) {
              id
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
          query: mutation,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toBeDefined();
      expect(body.data.userGroups.createUserGroup.id).toBe(
        userGroupId.getValue()
      );
      expect(mockCreateUserGroupCommandHandler.execute).toHaveBeenCalled();
    });

    it('should create user group without description', async () => {
      vi.mocked(mockCreateUserGroupCommandHandler.execute).mockResolvedValue({
        id: userGroupId.getValue(),
      });

      const mutation = `
        mutation {
          userGroups {
            createUserGroup(input: {
              name: "Test Group"
            }) {
              id
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
          query: mutation,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.userGroups.createUserGroup.id).toBe(
        userGroupId.getValue()
      );
    });
  });

  describe('Mutation.userGroups.updateUserGroup', () => {
    it('should update user group', async () => {
      vi.mocked(mockUpdateUserGroupCommandHandler.execute).mockResolvedValue(
        undefined
      );

      const mutation = `
        mutation {
          userGroups {
            updateUserGroup(id: "${userGroupId.getValue()}", input: {
              name: "Updated Name"
              description: "Updated Description"
            })
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
          query: mutation,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.userGroups.updateUserGroup).toBe(true);
      expect(mockUpdateUserGroupCommandHandler.execute).toHaveBeenCalled();
    });
  });

  describe('Mutation.userGroups.deleteUserGroup', () => {
    it('should delete user group', async () => {
      vi.mocked(mockDeleteUserGroupCommandHandler.execute).mockResolvedValue(
        undefined
      );

      const mutation = `
        mutation {
          userGroups {
            deleteUserGroup(id: "${userGroupId.getValue()}")
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
          query: mutation,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.userGroups.deleteUserGroup).toBe(true);
      expect(mockDeleteUserGroupCommandHandler.execute).toHaveBeenCalled();
    });
  });

  describe('Mutation.userGroups.addRoleToUserGroup', () => {
    it('should add role to user group', async () => {
      vi.mocked(mockAddRoleToUserGroupCommandHandler.execute).mockResolvedValue(
        undefined
      );

      const mutation = `
        mutation {
          userGroups {
            addRoleToUserGroup(userGroupId: "${userGroupId.getValue()}", input: {
              roleId: "${roleId}"
            })
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
          query: mutation,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.userGroups.addRoleToUserGroup).toBe(true);
      expect(mockAddRoleToUserGroupCommandHandler.execute).toHaveBeenCalled();
    });
  });

  describe('Mutation.userGroups.removeRoleFromUserGroup', () => {
    it('should remove role from user group', async () => {
      vi.mocked(
        mockRemoveRoleFromUserGroupCommandHandler.execute
      ).mockResolvedValue(undefined);

      const mutation = `
        mutation {
          userGroups {
            removeRoleFromUserGroup(userGroupId: "${userGroupId.getValue()}", input: {
              roleId: "${roleId}"
            })
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
          query: mutation,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.userGroups.removeRoleFromUserGroup).toBe(true);
      expect(
        mockRemoveRoleFromUserGroupCommandHandler.execute
      ).toHaveBeenCalled();
    });
  });
});
