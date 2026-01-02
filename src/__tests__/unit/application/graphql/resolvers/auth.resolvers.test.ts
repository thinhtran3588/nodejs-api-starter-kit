import type { GraphQLResolveInfo } from 'graphql';
import type { MercuriusContext } from 'mercurius';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { authResolvers } from '@app/modules/auth/adapters/graphql/auth.resolvers';
import { roleManagementResolvers } from '@app/modules/auth/adapters/graphql/role-management.resolvers';
import { userGroupManagementResolvers } from '@app/modules/auth/adapters/graphql/user-group-management.resolvers';
import { userManagementResolvers } from '@app/modules/auth/adapters/graphql/user-management.resolvers';
import { AddRoleToUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/add-role-to-user-group.command-handler';
import { AddUserToUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/add-user-to-user-group.command-handler';
import { CreateUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/create-user-group.command-handler';
import { DeleteAccountCommandHandler } from '@app/modules/auth/application/command-handlers/delete-account.command-handler';
import { DeleteUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/delete-user-group.command-handler';
import { DeleteUserCommandHandler } from '@app/modules/auth/application/command-handlers/delete-user.command-handler';
import { RegisterCommandHandler } from '@app/modules/auth/application/command-handlers/register.command-handler';
import { RemoveRoleFromUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/remove-role-from-user-group.command-handler';
import { RemoveUserFromUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/remove-user-from-user-group.command-handler';
import { RequestAccessTokenCommandHandler } from '@app/modules/auth/application/command-handlers/request-access-token.command-handler';
import { SignInCommandHandler } from '@app/modules/auth/application/command-handlers/sign-in.command-handler';
import { ToggleUserStatusCommandHandler } from '@app/modules/auth/application/command-handlers/toggle-user-status.command-handler';
import { UpdateProfileCommandHandler } from '@app/modules/auth/application/command-handlers/update-profile.command-handler';
import { UpdateUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/update-user-group.command-handler';
import { UpdateUserCommandHandler } from '@app/modules/auth/application/command-handlers/update-user.command-handler';
import type { AddRoleToUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/add-role-to-user-group.command';
import type { CreateUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/create-user-group.command';
import type { RegisterCommand } from '@app/modules/auth/application/interfaces/commands/register.command';
import type { RemoveRoleFromUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/remove-role-from-user-group.command';
import type { RequestAccessTokenCommand } from '@app/modules/auth/application/interfaces/commands/request-access-token.command';
import type { SignInCommand } from '@app/modules/auth/application/interfaces/commands/sign-in.command';
import type { ToggleUserStatusCommand } from '@app/modules/auth/application/interfaces/commands/toggle-user-status.command';
import type { UpdateProfileCommand } from '@app/modules/auth/application/interfaces/commands/update-profile.command';
import type { UpdateUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/update-user-group.command';
import type { UpdateUserCommand } from '@app/modules/auth/application/interfaces/commands/update-user.command';
import { FindRolesQueryHandler } from '@app/modules/auth/application/query-handlers/find-roles.query-handler';
import { FindUserGroupsQueryHandler } from '@app/modules/auth/application/query-handlers/find-user-groups.query-handler';
import { FindUsersQueryHandler } from '@app/modules/auth/application/query-handlers/find-users.query-handler';
import { GetProfileQueryHandler } from '@app/modules/auth/application/query-handlers/get-profile.query-handler';
import { GetRoleQueryHandler } from '@app/modules/auth/application/query-handlers/get-role.query-handler';
import { GetUserGroupQueryHandler } from '@app/modules/auth/application/query-handlers/get-user-group.query-handler';
import { GetUserQueryHandler } from '@app/modules/auth/application/query-handlers/get-user.query-handler';
import { SignInType } from '@app/modules/auth/domain/enums/sign-in-type';
import { UserStatus } from '@app/modules/auth/domain/enums/user-status';

function mergeResolvers(
  resolvers: Record<string, unknown>[]
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  for (const resolver of resolvers) {
    for (const [key, value] of Object.entries(resolver)) {
      if (merged[key]) {
        merged[key] = {
          ...(merged[key] as Record<string, unknown>),
          ...(value as Record<string, unknown>),
        };
      } else {
        merged[key] = value;
      }
    }
  }
  return merged;
}

const allResolvers = mergeResolvers([
  authResolvers,
  userManagementResolvers,
  userGroupManagementResolvers,
  roleManagementResolvers,
]) as typeof authResolvers &
  typeof userManagementResolvers &
  typeof userGroupManagementResolvers &
  typeof roleManagementResolvers;

describe('authResolvers', () => {
  let mockRegisterCommandHandler: RegisterCommandHandler;
  let mockSignInCommandHandler: SignInCommandHandler;
  let mockGetProfileQueryHandler: GetProfileQueryHandler;
  let mockUpdateProfileCommandHandler: UpdateProfileCommandHandler;
  let mockDeleteAccountCommandHandler: DeleteAccountCommandHandler;
  let mockRequestAccessTokenCommandHandler: RequestAccessTokenCommandHandler;
  let mockFindUsersQueryHandler: FindUsersQueryHandler;
  let mockGetUserQueryHandler: GetUserQueryHandler;
  let mockUpdateUserCommandHandler: UpdateUserCommandHandler;
  let mockToggleUserStatusCommandHandler: ToggleUserStatusCommandHandler;
  let mockDeleteUserCommandHandler: DeleteUserCommandHandler;
  let mockCreateUserGroupCommandHandler: CreateUserGroupCommandHandler;
  let mockFindUserGroupsQueryHandler: FindUserGroupsQueryHandler;
  let mockGetUserGroupQueryHandler: GetUserGroupQueryHandler;
  let mockUpdateUserGroupCommandHandler: UpdateUserGroupCommandHandler;
  let mockDeleteUserGroupCommandHandler: DeleteUserGroupCommandHandler;
  let mockAddUserToUserGroupCommandHandler: AddUserToUserGroupCommandHandler;
  let mockRemoveUserFromUserGroupCommandHandler: RemoveUserFromUserGroupCommandHandler;
  let mockAddRoleToUserGroupCommandHandler: AddRoleToUserGroupCommandHandler;
  let mockRemoveRoleFromUserGroupCommandHandler: RemoveRoleFromUserGroupCommandHandler;
  let mockFindRolesQueryHandler: FindRolesQueryHandler;
  let mockGetRoleQueryHandler: GetRoleQueryHandler;
  let mockContext: MercuriusContext;

  const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
  const userGroupId = Uuid.create('660e8400-e29b-41d4-a716-446655440000');
  const roleId = Uuid.create('770e8400-e29b-41d4-a716-446655440000');

  beforeEach(() => {
    mockRegisterCommandHandler = {
      execute: vi.fn(),
    } as unknown as RegisterCommandHandler;

    mockSignInCommandHandler = {
      execute: vi.fn(),
    } as unknown as SignInCommandHandler;

    mockGetProfileQueryHandler = {
      execute: vi.fn(),
    } as unknown as GetProfileQueryHandler;

    mockUpdateProfileCommandHandler = {
      execute: vi.fn(),
    } as unknown as UpdateProfileCommandHandler;

    mockDeleteAccountCommandHandler = {
      execute: vi.fn(),
    } as unknown as DeleteAccountCommandHandler;

    mockRequestAccessTokenCommandHandler = {
      execute: vi.fn(),
    } as unknown as RequestAccessTokenCommandHandler;

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

    mockAddUserToUserGroupCommandHandler = {
      execute: vi.fn(),
    } as unknown as AddUserToUserGroupCommandHandler;

    mockRemoveUserFromUserGroupCommandHandler = {
      execute: vi.fn(),
    } as unknown as RemoveUserFromUserGroupCommandHandler;

    mockAddRoleToUserGroupCommandHandler = {
      execute: vi.fn(),
    } as unknown as AddRoleToUserGroupCommandHandler;

    mockRemoveRoleFromUserGroupCommandHandler = {
      execute: vi.fn(),
    } as unknown as RemoveRoleFromUserGroupCommandHandler;

    mockFindRolesQueryHandler = {
      execute: vi.fn(),
    } as unknown as FindRolesQueryHandler;

    mockGetRoleQueryHandler = {
      execute: vi.fn(),
    } as unknown as GetRoleQueryHandler;

    mockContext = {
      appContext: {
        user: {
          userId,
          roles: ['USER'],
        },
      },
      request: {
        server: {
          diContainer: {
            resolve: vi.fn((name: string) => {
              if (name === 'registerCommandHandler')
                return mockRegisterCommandHandler;
              if (name === 'signInCommandHandler')
                return mockSignInCommandHandler;
              if (name === 'getProfileQueryHandler')
                return mockGetProfileQueryHandler;
              if (name === 'updateProfileCommandHandler')
                return mockUpdateProfileCommandHandler;
              if (name === 'deleteAccountCommandHandler')
                return mockDeleteAccountCommandHandler;
              if (name === 'requestAccessTokenCommandHandler')
                return mockRequestAccessTokenCommandHandler;
              if (name === 'findUsersQueryHandler')
                return mockFindUsersQueryHandler;
              if (name === 'getUserQueryHandler')
                return mockGetUserQueryHandler;
              if (name === 'updateUserCommandHandler')
                return mockUpdateUserCommandHandler;
              if (name === 'toggleUserStatusCommandHandler')
                return mockToggleUserStatusCommandHandler;
              if (name === 'deleteUserCommandHandler')
                return mockDeleteUserCommandHandler;
              if (name === 'createUserGroupCommandHandler')
                return mockCreateUserGroupCommandHandler;
              if (name === 'findUserGroupsQueryHandler')
                return mockFindUserGroupsQueryHandler;
              if (name === 'getUserGroupQueryHandler')
                return mockGetUserGroupQueryHandler;
              if (name === 'updateUserGroupCommandHandler')
                return mockUpdateUserGroupCommandHandler;
              if (name === 'deleteUserGroupCommandHandler')
                return mockDeleteUserGroupCommandHandler;
              if (name === 'addUserToUserGroupCommandHandler')
                return mockAddUserToUserGroupCommandHandler;
              if (name === 'removeUserFromUserGroupCommandHandler')
                return mockRemoveUserFromUserGroupCommandHandler;
              if (name === 'addRoleToUserGroupCommandHandler')
                return mockAddRoleToUserGroupCommandHandler;
              if (name === 'removeRoleFromUserGroupCommandHandler')
                return mockRemoveRoleFromUserGroupCommandHandler;
              if (name === 'findRolesQueryHandler')
                return mockFindRolesQueryHandler;
              if (name === 'getRoleQueryHandler')
                return mockGetRoleQueryHandler;
              return null;
            }),
          },
        },
      },
      reply: {},
    } as unknown as MercuriusContext;
  });

  describe('Query.me', () => {
    it('should call getProfileQueryHandler.execute with empty query and appContext', async () => {
      const mockUser = {
        id: userId.getValue(),
        email: 'test@example.com',
        signInType: SignInType.EMAIL,
        externalId: 'firebase-user-123',
        displayName: 'Test User',
        version: 0,
        createdAt: new Date('2024-01-01'),
      };

      vi.mocked(mockGetProfileQueryHandler.execute).mockResolvedValue(mockUser);

      const result = await allResolvers.Query.me(null, {}, mockContext);

      expect(mockGetProfileQueryHandler.execute).toHaveBeenCalledWith(
        {},
        mockContext.appContext
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('Mutation.auth', () => {
    it('should return an empty object', () => {
      const result = allResolvers.Mutation.auth();
      expect(result).toEqual({});
    });
  });

  describe('AuthMutation.register', () => {
    it('should call registerCommandHandler.execute with input', async () => {
      const input: RegisterCommand = {
        email: 'test@example.com',
        password: 'ValidPass123!',
        displayName: 'Test User',
      };

      const mockResponse = {
        id: userId.getValue(),
        idToken: 'id-token',
        signInToken: 'sign-in-token',
      };

      vi.mocked(mockRegisterCommandHandler.execute).mockResolvedValue(
        mockResponse
      );

      const result = await allResolvers.AuthMutation.register(
        null,
        { input },
        mockContext
      );

      expect(mockRegisterCommandHandler.execute).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('AuthMutation.signIn', () => {
    it('should call signInCommandHandler.execute with input', async () => {
      const input: SignInCommand = {
        emailOrUsername: 'test@example.com',
        password: 'ValidPass123!',
      };

      const mockResponse = {
        id: userId.getValue(),
        idToken: 'id-token',
        signInToken: 'sign-in-token',
      };

      vi.mocked(mockSignInCommandHandler.execute).mockResolvedValue(
        mockResponse
      );

      const result = await allResolvers.AuthMutation.signIn(
        null,
        { input },
        mockContext
      );

      expect(mockSignInCommandHandler.execute).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('AuthMutation.updateProfile', () => {
    it('should call updateProfileCommandHandler.execute with input and appContext', async () => {
      const input: UpdateProfileCommand = {
        displayName: 'Updated Name',
      };

      vi.mocked(mockUpdateProfileCommandHandler.execute).mockResolvedValue(
        undefined
      );

      const result = await allResolvers.AuthMutation.updateProfile(
        null,
        { input },
        mockContext
      );

      expect(mockUpdateProfileCommandHandler.execute).toHaveBeenCalledWith(
        input,
        mockContext.appContext
      );
      expect(result).toBe(true);
    });
  });

  describe('AuthMutation.deleteAccount', () => {
    it('should call deleteAccountCommandHandler.execute with empty command and appContext', async () => {
      vi.mocked(mockDeleteAccountCommandHandler.execute).mockResolvedValue(
        undefined
      );

      const result = await allResolvers.AuthMutation.deleteAccount(
        null,
        {},
        mockContext
      );

      expect(mockDeleteAccountCommandHandler.execute).toHaveBeenCalledWith(
        {},
        mockContext.appContext
      );
      expect(result).toBe(true);
    });
  });

  describe('AuthMutation.requestAccessToken', () => {
    it('should call requestAccessTokenCommandHandler.execute with command', async () => {
      const idToken = 'firebase-id-token';
      const mockResponse = {
        token: 'jwt-access-token',
      };

      vi.mocked(mockRequestAccessTokenCommandHandler.execute).mockResolvedValue(
        mockResponse
      );

      const result = await allResolvers.AuthMutation.requestAccessToken(
        null,
        { idToken },
        mockContext
      );

      const expectedCommand: RequestAccessTokenCommand = { idToken };
      expect(mockRequestAccessTokenCommandHandler.execute).toHaveBeenCalledWith(
        expectedCommand
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Query.users', () => {
    it('should call findUsersQueryHandler.execute and return paginated result', async () => {
      const input = { pageIndex: 0, itemsPerPage: 10 };
      const mockResult = {
        data: [
          {
            id: userId.getValue(),
            email: 'user@example.com',
            signInType: SignInType.EMAIL,
            externalId: 'firebase-user-1',
            status: UserStatus.ACTIVE,
            version: 0,
            createdAt: new Date('2024-01-01'),
          },
        ],
        pagination: {
          count: 1,
          pageIndex: 0,
        },
      };

      vi.mocked(mockFindUsersQueryHandler.execute).mockResolvedValue(
        mockResult
      );

      const mockInfo = {
        fieldNodes: [],
      } as unknown as GraphQLResolveInfo;

      const result = await allResolvers.Query.users(
        null,
        { input },
        mockContext,
        mockInfo
      );

      expect(mockFindUsersQueryHandler.execute).toHaveBeenCalledWith(
        input,
        mockContext.appContext
      );
      expect(result.data).toEqual(mockResult.data);
      expect(result.pagination.pageIndex).toBe(0);
      expect(result.pagination.count).toBe(1);
    });

    it('should use default empty object when input is not provided', async () => {
      const mockResult = {
        data: [],
        pagination: {
          count: 0,
          pageIndex: 0,
        },
      };

      vi.mocked(mockFindUsersQueryHandler.execute).mockResolvedValue(
        mockResult
      );

      const mockInfo = {
        fieldNodes: [],
      } as unknown as GraphQLResolveInfo;

      const result = await allResolvers.Query.users(
        null,
        {},
        mockContext,
        mockInfo
      );

      expect(mockFindUsersQueryHandler.execute).toHaveBeenCalledWith(
        {},
        mockContext.appContext
      );
      expect(result.pagination.count).toBe(0);
      expect(result.pagination.pageIndex).toBe(0);
    });

    it('should use default empty object when input is explicitly undefined', async () => {
      const mockResult = {
        data: [],
        pagination: {
          count: 0,
          pageIndex: 0,
        },
      };

      vi.mocked(mockFindUsersQueryHandler.execute).mockResolvedValue(
        mockResult
      );

      const mockInfo = {
        fieldNodes: [],
      } as unknown as GraphQLResolveInfo;

      const result = await allResolvers.Query.users(
        null,
        { input: undefined },
        mockContext,
        mockInfo
      );

      expect(mockFindUsersQueryHandler.execute).toHaveBeenCalledWith(
        {},
        mockContext.appContext
      );
      expect(result.pagination.count).toBe(0);
      expect(result.pagination.pageIndex).toBe(0);
    });

    it('should extract and pass fields from GraphQL query to findUsersQueryHandler', async () => {
      const { Kind } = await import('graphql');
      const mockResult = {
        data: [],
        pagination: {
          count: 0,
          pageIndex: 0,
        },
      };

      vi.mocked(mockFindUsersQueryHandler.execute).mockResolvedValue(
        mockResult
      );

      const mockInfo = {
        fieldNodes: [
          {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: 'users' },
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections: [
                {
                  kind: Kind.FIELD,
                  name: { kind: Kind.NAME, value: 'data' },
                  selectionSet: {
                    kind: Kind.SELECTION_SET,
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'id' },
                      },
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'email' },
                      },
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'displayName' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      } as unknown as GraphQLResolveInfo;

      const result = await allResolvers.Query.users(
        null,
        {},
        mockContext,
        mockInfo
      );

      expect(mockFindUsersQueryHandler.execute).toHaveBeenCalledWith(
        { fields: ['id', 'email', 'displayName'] },
        mockContext.appContext
      );
      expect(result.pagination.count).toBe(0);
      expect(result.pagination.pageIndex).toBe(0);
    });

    it('should combine extracted fields with existing input parameters', async () => {
      const { Kind } = await import('graphql');
      const input = {
        pageIndex: 1,
        itemsPerPage: 20,
        searchTerm: 'test',
      };
      const mockResult = {
        data: [],
        pagination: {
          count: 0,
          pageIndex: 1,
        },
      };

      vi.mocked(mockFindUsersQueryHandler.execute).mockResolvedValue(
        mockResult
      );

      const mockInfo = {
        fieldNodes: [
          {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: 'users' },
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections: [
                {
                  kind: Kind.FIELD,
                  name: { kind: Kind.NAME, value: 'data' },
                  selectionSet: {
                    kind: Kind.SELECTION_SET,
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'id' },
                      },
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'email' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      } as unknown as GraphQLResolveInfo;

      const result = await allResolvers.Query.users(
        null,
        { input },
        mockContext,
        mockInfo
      );

      expect(mockFindUsersQueryHandler.execute).toHaveBeenCalledWith(
        {
          pageIndex: 1,
          itemsPerPage: 20,
          searchTerm: 'test',
          fields: ['id', 'email'],
        },
        mockContext.appContext
      );
      expect(result.pagination.pageIndex).toBe(1);
    });

    it('should pass undefined fields when no fields are selected in GraphQL query', async () => {
      const { Kind } = await import('graphql');
      const input = { pageIndex: 0 };
      const mockResult = {
        data: [],
        pagination: {
          count: 0,
          pageIndex: 0,
        },
      };

      vi.mocked(mockFindUsersQueryHandler.execute).mockResolvedValue(
        mockResult
      );

      const mockInfo = {
        fieldNodes: [
          {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: 'users' },
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections: [
                {
                  kind: Kind.FIELD,
                  name: { kind: Kind.NAME, value: 'pagination' },
                },
              ],
            },
          },
        ],
      } as unknown as GraphQLResolveInfo;

      const result = await allResolvers.Query.users(
        null,
        { input },
        mockContext,
        mockInfo
      );

      expect(mockFindUsersQueryHandler.execute).toHaveBeenCalledWith(
        { pageIndex: 0, fields: undefined },
        mockContext.appContext
      );
      expect(result.pagination.pageIndex).toBe(0);
    });
  });

  describe('Query.user', () => {
    it('should call getUserQueryHandler.execute with id query', async () => {
      const mockUser = {
        id: userId.getValue(),
        email: 'user@example.com',
        signInType: SignInType.EMAIL,
        status: UserStatus.ACTIVE,
        version: 0,
        createdAt: new Date('2024-01-01'),
      };

      vi.mocked(mockGetUserQueryHandler.execute).mockResolvedValue(
        mockUser as any
      );

      const result = await allResolvers.Query.user(
        null,
        { id: userId.getValue() },
        mockContext
      );

      expect(mockGetUserQueryHandler.execute).toHaveBeenCalledWith(
        { id: userId.getValue() },
        mockContext.appContext
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('Query.userGroups', () => {
    it('should call userGroupManagementController.findUserGroups and return paginated result', async () => {
      const input = { pageIndex: 0 };
      const mockResult = {
        data: [
          {
            id: userGroupId.getValue(),
            name: 'Test Group',
            version: 0,
            createdAt: new Date('2024-01-01'),
          },
        ],
        pagination: {
          count: 1,
          pageIndex: 0,
        },
      };

      vi.mocked(mockFindUserGroupsQueryHandler.execute).mockResolvedValue(
        mockResult as any
      );

      const mockInfo = {
        fieldNodes: [],
      } as unknown as GraphQLResolveInfo;

      const result = await allResolvers.Query.userGroups(
        null,
        { input },
        mockContext,
        mockInfo
      );

      expect(mockFindUserGroupsQueryHandler.execute).toHaveBeenCalledWith(
        input,
        mockContext.appContext
      );
      expect(result.data).toEqual(mockResult.data);
      expect(result.pagination.count).toBe(1);
      expect(result.pagination.pageIndex).toBe(0);
    });

    it('should use default empty object when input is not provided', async () => {
      const mockResult = {
        data: [],
        pagination: {
          count: 0,
          pageIndex: 0,
        },
      };

      vi.mocked(mockFindUserGroupsQueryHandler.execute).mockResolvedValue(
        mockResult as any
      );

      const mockInfo = {
        fieldNodes: [],
      } as unknown as GraphQLResolveInfo;

      const result = await allResolvers.Query.userGroups(
        null,
        {},
        mockContext,
        mockInfo
      );

      expect(mockFindUserGroupsQueryHandler.execute).toHaveBeenCalledWith(
        {},
        mockContext.appContext
      );
      expect(result.pagination.count).toBe(0);
      expect(result.pagination.pageIndex).toBe(0);
    });

    it('should use default empty object when input is explicitly undefined', async () => {
      const mockResult = {
        data: [],
        pagination: {
          count: 0,
          pageIndex: 0,
        },
      };

      vi.mocked(mockFindUserGroupsQueryHandler.execute).mockResolvedValue(
        mockResult as any
      );

      const mockInfo = {
        fieldNodes: [],
      } as unknown as GraphQLResolveInfo;

      const result = await allResolvers.Query.userGroups(
        null,
        { input: undefined },
        mockContext,
        mockInfo
      );

      expect(mockFindUserGroupsQueryHandler.execute).toHaveBeenCalledWith(
        {},
        mockContext.appContext
      );
      expect(result.pagination.count).toBe(0);
      expect(result.pagination.pageIndex).toBe(0);
    });

    it('should extract and pass fields from GraphQL query to findUserGroupsQueryHandler', async () => {
      const { Kind } = await import('graphql');
      const mockResult = {
        data: [],
        pagination: {
          count: 0,
          pageIndex: 0,
        },
      };

      vi.mocked(mockFindUserGroupsQueryHandler.execute).mockResolvedValue(
        mockResult as any
      );

      const mockInfo = {
        fieldNodes: [
          {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: 'userGroups' },
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections: [
                {
                  kind: Kind.FIELD,
                  name: { kind: Kind.NAME, value: 'data' },
                  selectionSet: {
                    kind: Kind.SELECTION_SET,
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'id' },
                      },
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'name' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      } as unknown as GraphQLResolveInfo;

      const result = await allResolvers.Query.userGroups(
        null,
        {},
        mockContext,
        mockInfo
      );

      expect(mockFindUserGroupsQueryHandler.execute).toHaveBeenCalledWith(
        { fields: ['id', 'name'] },
        mockContext.appContext
      );
      expect(result.pagination.count).toBe(0);
      expect(result.pagination.pageIndex).toBe(0);
    });

    it('should combine extracted fields with existing input parameters for userGroups', async () => {
      const { Kind } = await import('graphql');
      const input = {
        pageIndex: 2,
        itemsPerPage: 15,
        searchTerm: 'admin',
      };
      const mockResult = {
        data: [],
        pagination: {
          count: 0,
          pageIndex: 2,
        },
      };

      vi.mocked(mockFindUserGroupsQueryHandler.execute).mockResolvedValue(
        mockResult as any
      );

      const mockInfo = {
        fieldNodes: [
          {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: 'userGroups' },
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections: [
                {
                  kind: Kind.FIELD,
                  name: { kind: Kind.NAME, value: 'data' },
                  selectionSet: {
                    kind: Kind.SELECTION_SET,
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'id' },
                      },
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'name' },
                      },
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'description' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      } as unknown as GraphQLResolveInfo;

      const result = await allResolvers.Query.userGroups(
        null,
        { input },
        mockContext,
        mockInfo
      );

      expect(mockFindUserGroupsQueryHandler.execute).toHaveBeenCalledWith(
        {
          pageIndex: 2,
          itemsPerPage: 15,
          searchTerm: 'admin',
          fields: ['id', 'name', 'description'],
        },
        mockContext.appContext
      );
      expect(result.pagination.pageIndex).toBe(2);
    });
  });

  describe('Query.userGroup', () => {
    it('should call userGroupManagementController.getUserGroup with id', async () => {
      const mockUserGroup = {
        id: userGroupId.getValue(),
        name: 'Test Group',
        version: 0,
        createdAt: new Date('2024-01-01'),
      };

      vi.mocked(mockGetUserGroupQueryHandler.execute).mockResolvedValue(
        mockUserGroup as any
      );

      const result = await allResolvers.Query.userGroup(
        null,
        { id: userGroupId.getValue() },
        mockContext
      );

      expect(mockGetUserGroupQueryHandler.execute).toHaveBeenCalledWith(
        { id: userGroupId.getValue() },
        mockContext.appContext
      );
      expect(result).toEqual(mockUserGroup);
    });
  });

  describe('Query.roles', () => {
    it('should call roleManagementController.findRoles and return paginated result', async () => {
      const input = { pageIndex: 0 };
      const mockResult = {
        data: [
          {
            id: roleId.getValue(),
            code: 'ADMIN',
            name: 'Administrator',
            description: 'Admin role',
            version: 0,
            createdAt: new Date('2024-01-01'),
          },
        ],
        pagination: {
          count: 1,
          pageIndex: 0,
        },
      };

      vi.mocked(mockFindRolesQueryHandler.execute).mockResolvedValue(
        mockResult as any
      );

      const mockInfo = {
        fieldNodes: [],
      } as unknown as GraphQLResolveInfo;

      const result = await allResolvers.Query.roles(
        null,
        { input },
        mockContext,
        mockInfo
      );

      expect(mockFindRolesQueryHandler.execute).toHaveBeenCalledWith(
        input,
        mockContext.appContext
      );
      expect(result.data).toEqual(mockResult.data);
      expect(result.pagination.count).toBe(1);
      expect(result.pagination.pageIndex).toBe(0);
    });

    it('should use default empty object when input is not provided', async () => {
      const mockResult = {
        data: [],
        pagination: {
          count: 0,
          pageIndex: 0,
        },
      };

      vi.mocked(mockFindRolesQueryHandler.execute).mockResolvedValue(
        mockResult as any
      );

      const mockInfo = {
        fieldNodes: [],
      } as unknown as GraphQLResolveInfo;

      const result = await allResolvers.Query.roles(
        null,
        {},
        mockContext,
        mockInfo
      );

      expect(mockFindRolesQueryHandler.execute).toHaveBeenCalledWith(
        {},
        mockContext.appContext
      );
      expect(result.pagination.count).toBe(0);
      expect(result.pagination.pageIndex).toBe(0);
    });

    it('should use default empty object when input is explicitly undefined', async () => {
      const mockResult = {
        data: [],
        pagination: {
          count: 0,
          pageIndex: 0,
        },
      };

      vi.mocked(mockFindRolesQueryHandler.execute).mockResolvedValue(
        mockResult as any
      );

      const mockInfo = {
        fieldNodes: [],
      } as unknown as GraphQLResolveInfo;

      const result = await allResolvers.Query.roles(
        null,
        { input: undefined },
        mockContext,
        mockInfo
      );

      expect(mockFindRolesQueryHandler.execute).toHaveBeenCalledWith(
        {},
        mockContext.appContext
      );
      expect(result.pagination.count).toBe(0);
      expect(result.pagination.pageIndex).toBe(0);
    });

    it('should extract and pass fields from GraphQL query to findRolesQueryHandler', async () => {
      const { Kind } = await import('graphql');
      const mockResult = {
        data: [],
        pagination: {
          count: 0,
          pageIndex: 0,
        },
      };

      vi.mocked(mockFindRolesQueryHandler.execute).mockResolvedValue(
        mockResult as any
      );

      const mockInfo = {
        fieldNodes: [
          {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: 'roles' },
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections: [
                {
                  kind: Kind.FIELD,
                  name: { kind: Kind.NAME, value: 'data' },
                  selectionSet: {
                    kind: Kind.SELECTION_SET,
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'id' },
                      },
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'code' },
                      },
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'name' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      } as unknown as GraphQLResolveInfo;

      const result = await allResolvers.Query.roles(
        null,
        {},
        mockContext,
        mockInfo
      );

      expect(mockFindRolesQueryHandler.execute).toHaveBeenCalledWith(
        { fields: ['id', 'code', 'name'] },
        mockContext.appContext
      );
      expect(result.pagination.count).toBe(0);
      expect(result.pagination.pageIndex).toBe(0);
    });

    it('should combine extracted fields with existing input parameters for roles', async () => {
      const { Kind } = await import('graphql');
      const input = {
        pageIndex: 0,
        itemsPerPage: 50,
        searchTerm: 'admin',
        userGroupId: userGroupId.getValue(),
      };
      const mockResult = {
        data: [],
        pagination: {
          count: 0,
          pageIndex: 0,
        },
      };

      vi.mocked(mockFindRolesQueryHandler.execute).mockResolvedValue(
        mockResult as any
      );

      const mockInfo = {
        fieldNodes: [
          {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: 'roles' },
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections: [
                {
                  kind: Kind.FIELD,
                  name: { kind: Kind.NAME, value: 'data' },
                  selectionSet: {
                    kind: Kind.SELECTION_SET,
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'id' },
                      },
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'code' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      } as unknown as GraphQLResolveInfo;

      const result = await allResolvers.Query.roles(
        null,
        { input },
        mockContext,
        mockInfo
      );

      expect(mockFindRolesQueryHandler.execute).toHaveBeenCalledWith(
        {
          pageIndex: 0,
          itemsPerPage: 50,
          searchTerm: 'admin',
          userGroupId: userGroupId.getValue(),
          fields: ['id', 'code'],
        },
        mockContext.appContext
      );
      expect(result.pagination.pageIndex).toBe(0);
    });
  });

  describe('Query.role', () => {
    it('should call roleManagementController.getRole with id', async () => {
      const mockRole = {
        id: roleId.getValue(),
        code: 'ADMIN',
        name: 'Administrator',
        description: 'Admin role',
        version: 0,
        createdAt: new Date('2024-01-01'),
      };

      vi.mocked(mockGetRoleQueryHandler.execute).mockResolvedValue(
        mockRole as any
      );

      const result = await allResolvers.Query.role(
        null,
        { id: roleId.getValue() },
        mockContext
      );

      expect(mockGetRoleQueryHandler.execute).toHaveBeenCalledWith(
        { id: roleId.getValue() },
        mockContext.appContext
      );
      expect(result).toEqual(mockRole);
    });
  });

  describe('Mutation.users', () => {
    it('should return an empty object', () => {
      const result = allResolvers.Mutation.users();
      expect(result).toEqual({});
    });
  });

  describe('UserManagementMutation.updateUser', () => {
    it('should call updateUserCommandHandler.execute with command', async () => {
      const input: Omit<UpdateUserCommand, 'id'> = {
        displayName: 'Updated Name',
      };

      vi.mocked(mockUpdateUserCommandHandler.execute).mockResolvedValue(
        undefined
      );

      const result = await allResolvers.UserManagementMutation.updateUser(
        null,
        { id: userId.getValue(), input },
        mockContext
      );

      expect(result).toBe(true);
      expect(mockUpdateUserCommandHandler.execute).toHaveBeenCalledWith(
        { id: userId.getValue(), ...input },
        mockContext.appContext
      );
    });
  });

  describe('UserManagementMutation.toggleUserStatus', () => {
    it('should call toggleUserStatusCommandHandler.execute with command', async () => {
      const input: Omit<ToggleUserStatusCommand, 'id'> = { enabled: false };

      vi.mocked(mockToggleUserStatusCommandHandler.execute).mockResolvedValue(
        undefined
      );

      const result = await allResolvers.UserManagementMutation.toggleUserStatus(
        null,
        { id: userId.getValue(), input },
        mockContext
      );

      expect(result).toBe(true);
      expect(mockToggleUserStatusCommandHandler.execute).toHaveBeenCalledWith(
        { id: userId.getValue(), ...input },
        mockContext.appContext
      );
    });
  });

  describe('UserManagementMutation.deleteUser', () => {
    it('should call deleteUserCommandHandler.execute with command and return true', async () => {
      vi.mocked(mockDeleteUserCommandHandler.execute).mockResolvedValue(
        undefined
      );

      const result = await allResolvers.UserManagementMutation.deleteUser(
        null,
        { id: userId.getValue() },
        mockContext
      );

      expect(mockDeleteUserCommandHandler.execute).toHaveBeenCalledWith(
        { id: userId.getValue() },
        mockContext.appContext
      );
      expect(result).toBe(true);
    });
  });

  describe('Mutation.userGroups', () => {
    it('should return an empty object', () => {
      const result = (allResolvers as any).Mutation.userGroups();
      expect(result).toEqual({});
    });
  });

  describe('UserGroupManagementMutation.createUserGroup', () => {
    it('should call userGroupManagementController.createUserGroup with input', async () => {
      const input: CreateUserGroupCommand = {
        name: 'New Group',
        description: 'Description',
      };
      const mockCreateResult = {
        id: userGroupId.getValue(),
      };

      vi.mocked(mockCreateUserGroupCommandHandler.execute).mockResolvedValue(
        mockCreateResult as any
      );

      const result = await (
        allResolvers as any
      ).UserGroupManagementMutation.createUserGroup(
        null,
        { input },
        mockContext
      );

      expect(mockCreateUserGroupCommandHandler.execute).toHaveBeenCalledWith(
        input,
        mockContext.appContext
      );
      expect(result).toEqual(mockCreateResult);
    });
  });

  describe('UserGroupManagementMutation.updateUserGroup', () => {
    it('should call userGroupManagementController.updateUserGroup with id and input', async () => {
      const input: Omit<UpdateUserGroupCommand, 'id'> = {
        name: 'Updated Group',
      };

      vi.mocked(mockUpdateUserGroupCommandHandler.execute).mockResolvedValue(
        undefined as any
      );

      const result = await (
        allResolvers as any
      ).UserGroupManagementMutation.updateUserGroup(
        null,
        { id: userGroupId.getValue(), input },
        mockContext
      );

      expect(result).toBe(true);
      expect(mockUpdateUserGroupCommandHandler.execute).toHaveBeenCalledWith(
        { id: userGroupId.getValue(), ...input },
        mockContext.appContext
      );
    });
  });

  describe('UserGroupManagementMutation.deleteUserGroup', () => {
    it('should call userGroupManagementController.deleteUserGroup with id and return true', async () => {
      vi.mocked(mockDeleteUserGroupCommandHandler.execute).mockResolvedValue(
        undefined
      );

      const result = await (
        allResolvers as any
      ).UserGroupManagementMutation.deleteUserGroup(
        null,
        { id: userGroupId.getValue() },
        mockContext
      );

      expect(mockDeleteUserGroupCommandHandler.execute).toHaveBeenCalledWith(
        { id: userGroupId.getValue() },
        mockContext.appContext
      );
      expect(result).toBe(true);
    });
  });

  describe('UserManagementMutation.addUserToUserGroup', () => {
    it('should call addUserToUserGroupCommandHandler and return true', async () => {
      const input = {
        userGroupId: userGroupId.getValue(),
      };

      vi.mocked(mockAddUserToUserGroupCommandHandler.execute).mockResolvedValue(
        undefined
      );

      const result = await (
        allResolvers as any
      ).UserManagementMutation.addUserToUserGroup(
        null,
        { id: userId.getValue(), input },
        mockContext
      );

      expect(mockAddUserToUserGroupCommandHandler.execute).toHaveBeenCalledWith(
        { userId: userId.getValue(), userGroupId: input.userGroupId },
        mockContext.appContext
      );
      expect(result).toBe(true);
    });
  });

  describe('UserManagementMutation.removeUserFromUserGroup', () => {
    it('should call removeUserFromUserGroupCommandHandler and return true', async () => {
      const input = {
        userGroupId: userGroupId.getValue(),
      };

      vi.mocked(
        mockRemoveUserFromUserGroupCommandHandler.execute
      ).mockResolvedValue(undefined);

      const result = await (
        allResolvers as any
      ).UserManagementMutation.removeUserFromUserGroup(
        null,
        { id: userId.getValue(), input },
        mockContext
      );

      expect(
        mockRemoveUserFromUserGroupCommandHandler.execute
      ).toHaveBeenCalledWith(
        { userId: userId.getValue(), userGroupId: input.userGroupId },
        mockContext.appContext
      );
      expect(result).toBe(true);
    });
  });

  describe('UserGroupManagementMutation.addRoleToUserGroup', () => {
    it('should call userGroupManagementController.addRoleToUserGroup and return true', async () => {
      const input: Omit<AddRoleToUserGroupCommand, 'userGroupId'> = {
        roleId: roleId.getValue(),
      };

      vi.mocked(mockAddRoleToUserGroupCommandHandler.execute).mockResolvedValue(
        undefined
      );

      const result = await (
        allResolvers as any
      ).UserGroupManagementMutation.addRoleToUserGroup(
        null,
        { userGroupId: userGroupId.getValue(), input },
        mockContext
      );

      expect(mockAddRoleToUserGroupCommandHandler.execute).toHaveBeenCalledWith(
        { userGroupId: userGroupId.getValue(), ...input },
        mockContext.appContext
      );
      expect(result).toBe(true);
    });
  });

  describe('UserGroupManagementMutation.removeRoleFromUserGroup', () => {
    it('should call userGroupManagementController.removeRoleFromUserGroup and return true', async () => {
      const input: Omit<RemoveRoleFromUserGroupCommand, 'userGroupId'> = {
        roleId: roleId.getValue(),
      };

      vi.mocked(
        mockRemoveRoleFromUserGroupCommandHandler.execute
      ).mockResolvedValue(undefined);

      const result = await (
        allResolvers as any
      ).UserGroupManagementMutation.removeRoleFromUserGroup(
        null,
        { userGroupId: userGroupId.getValue(), input },
        mockContext
      );

      expect(
        mockRemoveRoleFromUserGroupCommandHandler.execute
      ).toHaveBeenCalledWith(
        { userGroupId: userGroupId.getValue(), ...input },
        mockContext.appContext
      );
      expect(result).toBe(true);
    });
  });
});
