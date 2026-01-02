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
import { AddUserToUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/add-user-to-user-group.command-handler';
import { DeleteUserCommandHandler } from '@app/modules/auth/application/command-handlers/delete-user.command-handler';
import { RemoveUserFromUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/remove-user-from-user-group.command-handler';
import { ToggleUserStatusCommandHandler } from '@app/modules/auth/application/command-handlers/toggle-user-status.command-handler';
import { UpdateUserCommandHandler } from '@app/modules/auth/application/command-handlers/update-user.command-handler';
import { FindUsersQueryHandler } from '@app/modules/auth/application/query-handlers/find-users.query-handler';
import { GetUserQueryHandler } from '@app/modules/auth/application/query-handlers/get-user.query-handler';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';
import { SignInType } from '@app/modules/auth/domain/enums/sign-in-type';
import { UserStatus } from '@app/modules/auth/domain/enums/user-status';

describe('GraphQL User Management E2E', () => {
  let app: FastifyInstance;
  let mockFindUsersQueryHandler: FindUsersQueryHandler;
  let mockGetUserQueryHandler: GetUserQueryHandler;
  let mockUpdateUserCommandHandler: UpdateUserCommandHandler;
  let mockToggleUserStatusCommandHandler: ToggleUserStatusCommandHandler;
  let mockDeleteUserCommandHandler: DeleteUserCommandHandler;
  let mockAddUserToUserGroupCommandHandler: AddUserToUserGroupCommandHandler;
  let mockRemoveUserFromUserGroupCommandHandler: RemoveUserFromUserGroupCommandHandler;

  const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
  const userGroupId = Uuid.create('550e8400-e29b-41d4-a716-446655440001');
  const managerUserId = Uuid.create('550e8400-e29b-41d4-a716-446655440002');

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env['GRAPHQL_UI_ENABLED'] = 'true';
    process.env['GRAPHQL_ENDPOINT'] = '/graphql';

    mockFindUsersQueryHandler = {
      execute: vi.fn(),
    } as unknown as FindUsersQueryHandler;

    mockGetUserQueryHandler = {
      execute: vi.fn(),
    } as unknown as GetUserQueryHandler;

    mockUpdateUserCommandHandler = {
      execute: vi.fn(),
    } as unknown as UpdateUserCommandHandler;

    mockToggleUserStatusCommandHandler = {
      execute: vi.fn(),
    } as unknown as ToggleUserStatusCommandHandler;

    mockDeleteUserCommandHandler = {
      execute: vi.fn(),
    } as unknown as DeleteUserCommandHandler;

    mockAddUserToUserGroupCommandHandler = {
      execute: vi.fn(),
    } as unknown as AddUserToUserGroupCommandHandler;

    mockRemoveUserFromUserGroupCommandHandler = {
      execute: vi.fn(),
    } as unknown as RemoveUserFromUserGroupCommandHandler;

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
      findUsersQueryHandler: asValue(mockFindUsersQueryHandler),
      getUserQueryHandler: asValue(mockGetUserQueryHandler),
      updateUserCommandHandler: asValue(mockUpdateUserCommandHandler),
      toggleUserStatusCommandHandler: asValue(
        mockToggleUserStatusCommandHandler
      ),
      deleteUserCommandHandler: asValue(mockDeleteUserCommandHandler),
      addUserToUserGroupCommandHandler: asValue(
        mockAddUserToUserGroupCommandHandler
      ),
      removeUserFromUserGroupCommandHandler: asValue(
        mockRemoveUserFromUserGroupCommandHandler
      ),
      jwtService: asValue(mockJwtService),
    });

    app = fastify({
      logger: false,
    });

    const errorCodeRegistry = new ErrorCodeRegistry();
    errorCodeRegistry.register({
      [AuthExceptionCode.USER_NOT_FOUND]: 404,
      [AuthExceptionCode.USERNAME_ALREADY_TAKEN]: 400,
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

  describe('Query.users', () => {
    it('should return paginated users', async () => {
      vi.mocked(mockFindUsersQueryHandler.execute).mockResolvedValue({
        data: [
          {
            id: userId.getValue(),
            email: 'test@example.com',
            signInType: SignInType.EMAIL,
            externalId: 'firebase-user-123',
            displayName: 'Test User',
            username: 'testuser',
            status: UserStatus.ACTIVE,
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
          users {
            data {
              id
              email
              displayName
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
      expect(body.data.users.data).toHaveLength(1);
      expect(body.data.users.data[0].id).toBe(userId.getValue());
      expect(body.data.users.pagination.count).toBe(1);
    });

    it('should return users with search input', async () => {
      vi.mocked(mockFindUsersQueryHandler.execute).mockResolvedValue({
        data: [],
        pagination: {
          count: 0,
          pageIndex: 0,
        },
      });

      const query = `
        query {
          users(input: {
            searchTerm: "test"
            pageIndex: 0
            itemsPerPage: 10
          }) {
            data {
              id
              email
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
      expect(body.data.users.data).toHaveLength(0);
    });
  });

  describe('Query.user', () => {
    it('should return user by id', async () => {
      vi.mocked(mockGetUserQueryHandler.execute).mockResolvedValue({
        id: userId.getValue(),
        email: 'test@example.com',
        signInType: SignInType.EMAIL,
        externalId: 'firebase-user-123',
        displayName: 'Test User',
        username: 'testuser',
        status: UserStatus.ACTIVE,
        version: 0,
        createdAt: new Date('2024-01-01'),
        createdBy: undefined,
        lastModifiedAt: new Date('2024-01-01'),
        lastModifiedBy: undefined,
      });

      const query = `
        query {
          user(id: "${userId.getValue()}") {
            id
            email
            displayName
            status
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
      expect(body.data.user.id).toBe(userId.getValue());
      expect(body.data.user.email).toBe('test@example.com');
    });
  });

  describe('Mutation.users.updateUser', () => {
    it('should update user', async () => {
      vi.mocked(mockUpdateUserCommandHandler.execute).mockResolvedValue(
        undefined
      );

      const mutation = `
        mutation {
          users {
            updateUser(id: "${userId.getValue()}", input: {
              displayName: "Updated Name"
              username: "newusername"
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
      expect(body.data).toBeDefined();
      expect(body.data.users.updateUser).toBe(true);
      expect(mockUpdateUserCommandHandler.execute).toHaveBeenCalled();
    });
  });

  describe('Mutation.users.toggleUserStatus', () => {
    it('should enable user', async () => {
      vi.mocked(mockToggleUserStatusCommandHandler.execute).mockResolvedValue(
        undefined
      );

      const mutation = `
        mutation {
          users {
            toggleUserStatus(id: "${userId.getValue()}", input: {
              enabled: true
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
      expect(body.data.users.toggleUserStatus).toBe(true);
    });

    it('should disable user', async () => {
      vi.mocked(mockToggleUserStatusCommandHandler.execute).mockResolvedValue(
        undefined
      );

      const mutation = `
        mutation {
          users {
            toggleUserStatus(id: "${userId.getValue()}", input: {
              enabled: false
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
      expect(body.data.users.toggleUserStatus).toBe(true);
    });
  });

  describe('Mutation.users.deleteUser', () => {
    it('should delete user', async () => {
      vi.mocked(mockDeleteUserCommandHandler.execute).mockResolvedValue(
        undefined
      );

      const mutation = `
        mutation {
          users {
            deleteUser(id: "${userId.getValue()}")
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
      expect(body.data.users.deleteUser).toBe(true);
      expect(mockDeleteUserCommandHandler.execute).toHaveBeenCalled();
    });
  });

  describe('Mutation.users.addUserToUserGroup', () => {
    it('should add user to user group', async () => {
      vi.mocked(mockAddUserToUserGroupCommandHandler.execute).mockResolvedValue(
        undefined
      );

      const mutation = `
        mutation {
          users {
            addUserToUserGroup(id: "${userId.getValue()}", input: {
              userGroupId: "${userGroupId.getValue()}"
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
      expect(body.data.users.addUserToUserGroup).toBe(true);
      expect(mockAddUserToUserGroupCommandHandler.execute).toHaveBeenCalled();
    });
  });

  describe('Mutation.users.removeUserFromUserGroup', () => {
    it('should remove user from user group', async () => {
      vi.mocked(
        mockRemoveUserFromUserGroupCommandHandler.execute
      ).mockResolvedValue(undefined);

      const mutation = `
        mutation {
          users {
            removeUserFromUserGroup(id: "${userId.getValue()}", input: {
              userGroupId: "${userGroupId.getValue()}"
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
      expect(body.data.users.removeUserFromUserGroup).toBe(true);
      expect(
        mockRemoveUserFromUserGroupCommandHandler.execute
      ).toHaveBeenCalled();
    });
  });
});
