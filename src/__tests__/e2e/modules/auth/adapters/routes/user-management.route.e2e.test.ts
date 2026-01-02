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
import { routeConfiguration } from '@app/modules/auth/adapters/routes/user-management.route';
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

describe('User Management Route E2E', () => {
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

  describe('GET /users', () => {
    describe('happy path', () => {
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

        const response = await app.inject({
          method: 'GET',
          url: '/users',
          headers: {
            authorization: 'Bearer valid-token',
          },
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body.data).toHaveLength(1);
        expect(body.data[0].id).toBe(userId.getValue());
        expect(body.pagination.count).toBe(1);
      });

      it('should return users with search term', async () => {
        vi.mocked(mockFindUsersQueryHandler.execute).mockResolvedValue({
          data: [],
          pagination: {
            count: 0,
            pageIndex: 0,
          },
        });

        const response = await app.inject({
          method: 'GET',
          url: '/users?searchTerm=test',
          headers: {
            authorization: 'Bearer valid-token',
          },
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body.data).toHaveLength(0);
      });

      it('should return users with pagination', async () => {
        vi.mocked(mockFindUsersQueryHandler.execute).mockResolvedValue({
          data: [],
          pagination: {
            count: 0,
            pageIndex: 1,
          },
        });

        const response = await app.inject({
          method: 'GET',
          url: '/users?pageIndex=1&itemsPerPage=10',
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
        vi.mocked(mockFindUsersQueryHandler.execute).mockRejectedValue(
          new BusinessException(
            AuthorizationExceptionCode.UNAUTHORIZED,
            undefined,
            'Authentication required'
          )
        );

        const response = await app.inject({
          method: 'GET',
          url: '/users',
        });

        expect(response.statusCode).toBe(401);
      });
    });
  });

  describe('GET /users/:id', () => {
    describe('happy path', () => {
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

        const response = await app.inject({
          method: 'GET',
          url: `/users/${userId.getValue()}`,
          headers: {
            authorization: 'Bearer valid-token',
          },
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body.id).toBe(userId.getValue());
        expect(body.email).toBe('test@example.com');
      });
    });

    describe('error cases', () => {
      it('should return 404 when user not found', async () => {
        vi.mocked(mockGetUserQueryHandler.execute).mockRejectedValue(
          new ValidationException(AuthExceptionCode.USER_NOT_FOUND)
        );

        const response = await app.inject({
          method: 'GET',
          url: `/users/${userId.getValue()}`,
          headers: {
            authorization: 'Bearer valid-token',
          },
        });

        expect(response.statusCode).toBe(404);
      });
    });
  });

  describe('PUT /users/:id', () => {
    describe('happy path', () => {
      it('should update user', async () => {
        vi.mocked(mockUpdateUserCommandHandler.execute).mockResolvedValue(
          undefined
        );

        const response = await app.inject({
          method: 'PUT',
          url: `/users/${userId.getValue()}`,
          headers: {
            authorization: 'Bearer valid-token',
          },
          payload: {
            displayName: 'Updated Name',
          },
        });

        expect(response.statusCode).toBe(204);
        expect(mockUpdateUserCommandHandler.execute).toHaveBeenCalledWith(
          {
            id: userId.getValue(),
            displayName: 'Updated Name',
          },
          expect.any(Object)
        );
      });
    });

    describe('error cases', () => {
      it('should return 400 when username already exists', async () => {
        vi.mocked(mockUpdateUserCommandHandler.execute).mockRejectedValue(
          new ValidationException(AuthExceptionCode.USERNAME_ALREADY_TAKEN)
        );

        const response = await app.inject({
          method: 'PUT',
          url: `/users/${userId.getValue()}`,
          headers: {
            authorization: 'Bearer valid-token',
          },
          payload: {
            username: 'existinguser',
          },
        });

        expect(response.statusCode).toBe(400);
      });
    });
  });

  describe('PATCH /users/:id/status', () => {
    describe('happy path', () => {
      it('should enable user', async () => {
        vi.mocked(mockToggleUserStatusCommandHandler.execute).mockResolvedValue(
          undefined
        );

        const response = await app.inject({
          method: 'PATCH',
          url: `/users/${userId.getValue()}/status`,
          headers: {
            authorization: 'Bearer valid-token',
          },
          payload: {
            enabled: true,
          },
        });

        expect(response.statusCode).toBe(204);
        expect(mockToggleUserStatusCommandHandler.execute).toHaveBeenCalledWith(
          {
            id: userId.getValue(),
            enabled: true,
          },
          expect.any(Object)
        );
      });

      it('should disable user', async () => {
        vi.mocked(mockToggleUserStatusCommandHandler.execute).mockResolvedValue(
          undefined
        );

        const response = await app.inject({
          method: 'PATCH',
          url: `/users/${userId.getValue()}/status`,
          headers: {
            authorization: 'Bearer valid-token',
          },
          payload: {
            enabled: false,
          },
        });

        expect(response.statusCode).toBe(204);
      });
    });
  });

  describe('DELETE /users/:id', () => {
    describe('happy path', () => {
      it('should delete user', async () => {
        vi.mocked(mockDeleteUserCommandHandler.execute).mockResolvedValue(
          undefined
        );

        const response = await app.inject({
          method: 'DELETE',
          url: `/users/${userId.getValue()}`,
          headers: {
            authorization: 'Bearer valid-token',
          },
        });

        expect(response.statusCode).toBe(204);
        expect(mockDeleteUserCommandHandler.execute).toHaveBeenCalledWith(
          {
            id: userId.getValue(),
          },
          expect.any(Object)
        );
      });
    });
  });

  describe('POST /users/:id/user-groups/:userGroupId', () => {
    describe('happy path', () => {
      it('should add user to user group', async () => {
        vi.mocked(
          mockAddUserToUserGroupCommandHandler.execute
        ).mockResolvedValue(undefined);

        const response = await app.inject({
          method: 'POST',
          url: `/users/${userId.getValue()}/user-groups/${userGroupId.getValue()}`,
          headers: {
            authorization: 'Bearer valid-token',
          },
        });

        expect(response.statusCode).toBe(204);
        expect(
          mockAddUserToUserGroupCommandHandler.execute
        ).toHaveBeenCalledWith(
          {
            userId: userId.getValue(),
            userGroupId: userGroupId.getValue(),
          },
          expect.any(Object)
        );
      });
    });
  });

  describe('DELETE /users/:id/user-groups/:userGroupId', () => {
    describe('happy path', () => {
      it('should remove user from user group', async () => {
        vi.mocked(
          mockRemoveUserFromUserGroupCommandHandler.execute
        ).mockResolvedValue(undefined);

        const response = await app.inject({
          method: 'DELETE',
          url: `/users/${userId.getValue()}/user-groups/${userGroupId.getValue()}`,
          headers: {
            authorization: 'Bearer valid-token',
          },
        });

        expect(response.statusCode).toBe(204);
        expect(
          mockRemoveUserFromUserGroupCommandHandler.execute
        ).toHaveBeenCalledWith(
          {
            userId: userId.getValue(),
            userGroupId: userGroupId.getValue(),
          },
          expect.any(Object)
        );
      });
    });
  });
});
