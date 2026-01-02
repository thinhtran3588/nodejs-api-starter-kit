import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthorizationService } from '@app/common/application/services/authorization.service';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { AuthorizationExceptionCode } from '@app/common/enums/authorization-exception-code';
import type { AppContext } from '@app/common/interfaces/context';
import {
  BusinessException,
  ValidationException,
} from '@app/common/utils/exceptions';
import type { GetUserGroupQuery } from '@app/modules/auth/application/interfaces/queries/get-user-group.query';
import type { UserGroupReadModel } from '@app/modules/auth/application/interfaces/queries/user-group.read-model';
import type { UserGroupReadRepository } from '@app/modules/auth/application/interfaces/repositories/user-group.read-repository';
import { GetUserGroupQueryHandler } from '@app/modules/auth/application/query-handlers/get-user-group.query-handler';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';

describe('GetUserGroupQueryHandler', () => {
  let handler: GetUserGroupQueryHandler;
  let mockUserGroupReadRepository: UserGroupReadRepository;
  let mockAuthorizationService: AuthorizationService;

  const userGroupId = '550e8400-e29b-41d4-a716-446655440000';
  const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440001');

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserGroupReadRepository = {
      findById: vi.fn(),
    } as unknown as UserGroupReadRepository;

    mockAuthorizationService = {
      requireOneOfRoles: vi.fn(),
    } as unknown as AuthorizationService;

    handler = new GetUserGroupQueryHandler(
      mockUserGroupReadRepository,
      mockAuthorizationService
    );
  });

  describe('execute - happy path', () => {
    it('should return user group for AUTH_MANAGER role', async () => {
      const userGroupReadModel: UserGroupReadModel = {
        id: userGroupId,
        name: 'Test Group',
        description: 'Test Description',
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      };

      const context: AppContext = {
        user: {
          userId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const query: GetUserGroupQuery = {
        id: userGroupId,
      };

      vi.mocked(mockUserGroupReadRepository.findById).mockResolvedValue(
        userGroupReadModel
      );

      const result = await handler.execute(query, context);

      expect(mockAuthorizationService.requireOneOfRoles).toHaveBeenCalledWith(
        [AuthRole.AUTH_MANAGER, AuthRole.AUTH_VIEWER],
        context
      );
      expect(mockUserGroupReadRepository.findById).toHaveBeenCalledWith(
        userGroupId
      );
      expect(result).toBe(userGroupReadModel);
    });

    it('should return user group for AUTH_VIEWER role', async () => {
      const userGroupReadModel: UserGroupReadModel = {
        id: userGroupId,
        name: 'Test Group',
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      };

      const context: AppContext = {
        user: {
          userId,
          roles: [AuthRole.AUTH_VIEWER],
        },
      };

      const query: GetUserGroupQuery = {
        id: userGroupId,
      };

      vi.mocked(mockUserGroupReadRepository.findById).mockResolvedValue(
        userGroupReadModel
      );

      const result = await handler.execute(query, context);

      expect(result).toBe(userGroupReadModel);
    });
  });

  describe('execute - validation errors', () => {
    it('should throw ValidationException when id is invalid UUID', async () => {
      const context: AppContext = {
        user: {
          userId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const query: GetUserGroupQuery = {
        id: 'invalid-uuid',
      };

      await expect(handler.execute(query, context)).rejects.toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException when id is malformed UUID', async () => {
      const context: AppContext = {
        user: {
          userId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const query: GetUserGroupQuery = {
        id: '550e8400-e29b-41d4-a716',
      };

      await expect(handler.execute(query, context)).rejects.toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException when user group is not found', async () => {
      const context: AppContext = {
        user: {
          userId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const query: GetUserGroupQuery = {
        id: userGroupId,
      };

      vi.mocked(mockUserGroupReadRepository.findById).mockResolvedValue(
        undefined
      );

      await expect(handler.execute(query, context)).rejects.toThrow(
        ValidationException
      );
      await expect(handler.execute(query, context)).rejects.toThrow(
        AuthExceptionCode.USER_GROUP_NOT_FOUND
      );
    });
  });

  describe('execute - authorization errors', () => {
    it('should throw error when user does not have required role', async () => {
      const context: AppContext = {
        user: {
          userId,
          roles: [],
        },
      };

      const query: GetUserGroupQuery = {
        id: userGroupId,
      };

      vi.mocked(mockAuthorizationService.requireOneOfRoles).mockImplementation(
        () => {
          throw new BusinessException(AuthorizationExceptionCode.FORBIDDEN);
        }
      );

      await expect(handler.execute(query, context)).rejects.toThrow(
        BusinessException
      );
    });
  });
});
