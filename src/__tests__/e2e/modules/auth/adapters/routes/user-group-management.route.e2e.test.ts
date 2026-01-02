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
import { ValidationException } from '@app/common/utils/exceptions';
import { routeConfiguration } from '@app/modules/auth/adapters/routes/user-group-management.route';
import { AddRoleToUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/add-role-to-user-group.command-handler';
import { CreateUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/create-user-group.command-handler';
import { DeleteUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/delete-user-group.command-handler';
import { RemoveRoleFromUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/remove-role-from-user-group.command-handler';
import { UpdateUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/update-user-group.command-handler';
import { FindUserGroupsQueryHandler } from '@app/modules/auth/application/query-handlers/find-user-groups.query-handler';
import { GetUserGroupQueryHandler } from '@app/modules/auth/application/query-handlers/get-user-group.query-handler';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';

describe('User Group Management Route E2E', () => {
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

  describe('POST /user-groups', () => {
    describe('happy path', () => {
      it('should create user group', async () => {
        vi.mocked(mockCreateUserGroupCommandHandler.execute).mockResolvedValue({
          id: userGroupId.getValue(),
        });

        const response = await app.inject({
          method: 'POST',
          url: '/user-groups',
          headers: {
            authorization: 'Bearer valid-token',
          },
          payload: {
            name: 'Test Group',
            description: 'Test Description',
          },
        });

        expect(response.statusCode).toBe(201);
        const body = response.json();
        expect(body.id).toBe(userGroupId.getValue());
        expect(mockCreateUserGroupCommandHandler.execute).toHaveBeenCalledWith(
          {
            name: 'Test Group',
            description: 'Test Description',
          },
          expect.any(Object)
        );
      });

      it('should create user group without description', async () => {
        vi.mocked(mockCreateUserGroupCommandHandler.execute).mockResolvedValue({
          id: userGroupId.getValue(),
        });

        const response = await app.inject({
          method: 'POST',
          url: '/user-groups',
          headers: {
            authorization: 'Bearer valid-token',
          },
          payload: {
            name: 'Test Group',
          },
        });

        expect(response.statusCode).toBe(201);
        const body = response.json();
        expect(body.id).toBe(userGroupId.getValue());
      });
    });
  });

  describe('GET /user-groups', () => {
    describe('happy path', () => {
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

        const response = await app.inject({
          method: 'GET',
          url: '/user-groups',
          headers: {
            authorization: 'Bearer valid-token',
          },
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body.data).toHaveLength(1);
        expect(body.data[0].id).toBe(userGroupId.getValue());
      });
    });
  });

  describe('GET /user-groups/:id', () => {
    describe('happy path', () => {
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

        const response = await app.inject({
          method: 'GET',
          url: `/user-groups/${userGroupId.getValue()}`,
          headers: {
            authorization: 'Bearer valid-token',
          },
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body.id).toBe(userGroupId.getValue());
        expect(body.name).toBe('Test Group');
      });
    });

    describe('error cases', () => {
      it('should return 404 when user group not found', async () => {
        vi.mocked(mockGetUserGroupQueryHandler.execute).mockRejectedValue(
          new ValidationException(AuthExceptionCode.USER_GROUP_NOT_FOUND)
        );

        const response = await app.inject({
          method: 'GET',
          url: `/user-groups/${userGroupId.getValue()}`,
          headers: {
            authorization: 'Bearer valid-token',
          },
        });

        expect(response.statusCode).toBe(404);
      });
    });
  });

  describe('PUT /user-groups/:id', () => {
    describe('happy path', () => {
      it('should update user group', async () => {
        vi.mocked(mockUpdateUserGroupCommandHandler.execute).mockResolvedValue(
          undefined
        );

        const response = await app.inject({
          method: 'PUT',
          url: `/user-groups/${userGroupId.getValue()}`,
          headers: {
            authorization: 'Bearer valid-token',
          },
          payload: {
            name: 'Updated Name',
            description: 'Updated Description',
          },
        });

        expect(response.statusCode).toBe(204);
        expect(mockUpdateUserGroupCommandHandler.execute).toHaveBeenCalledWith(
          {
            id: userGroupId.getValue(),
            name: 'Updated Name',
            description: 'Updated Description',
          },
          expect.any(Object)
        );
      });
    });
  });

  describe('DELETE /user-groups/:id', () => {
    describe('happy path', () => {
      it('should delete user group', async () => {
        vi.mocked(mockDeleteUserGroupCommandHandler.execute).mockResolvedValue(
          undefined
        );

        const response = await app.inject({
          method: 'DELETE',
          url: `/user-groups/${userGroupId.getValue()}`,
          headers: {
            authorization: 'Bearer valid-token',
          },
        });

        expect(response.statusCode).toBe(204);
        expect(mockDeleteUserGroupCommandHandler.execute).toHaveBeenCalledWith(
          {
            id: userGroupId.getValue(),
          },
          expect.any(Object)
        );
      });
    });
  });

  describe('POST /user-groups/:id/roles', () => {
    describe('happy path', () => {
      it('should add role to user group', async () => {
        vi.mocked(
          mockAddRoleToUserGroupCommandHandler.execute
        ).mockResolvedValue(undefined);

        const response = await app.inject({
          method: 'POST',
          url: `/user-groups/${userGroupId.getValue()}/roles`,
          headers: {
            authorization: 'Bearer valid-token',
          },
          payload: {
            roleId,
          },
        });

        expect(response.statusCode).toBe(204);
        expect(
          mockAddRoleToUserGroupCommandHandler.execute
        ).toHaveBeenCalledWith(
          {
            userGroupId: userGroupId.getValue(),
            roleId,
          },
          expect.any(Object)
        );
      });
    });
  });

  describe('DELETE /user-groups/:id/roles/:roleId', () => {
    describe('happy path', () => {
      it('should remove role from user group', async () => {
        vi.mocked(
          mockRemoveRoleFromUserGroupCommandHandler.execute
        ).mockResolvedValue(undefined);

        const response = await app.inject({
          method: 'DELETE',
          url: `/user-groups/${userGroupId.getValue()}/roles/${roleId}`,
          headers: {
            authorization: 'Bearer valid-token',
          },
        });

        expect(response.statusCode).toBe(204);
        expect(
          mockRemoveRoleFromUserGroupCommandHandler.execute
        ).toHaveBeenCalledWith(
          {
            userGroupId: userGroupId.getValue(),
            roleId,
          },
          expect.any(Object)
        );
      });
    });
  });
});
