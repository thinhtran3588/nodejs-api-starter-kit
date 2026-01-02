import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthorizationService } from '@app/common/application/services/authorization.service';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { AuthorizationExceptionCode } from '@app/common/enums/authorization-exception-code';
import type { AppContext } from '@app/common/interfaces/context';
import { BusinessException } from '@app/common/utils/exceptions';
import type { FindUserGroupsQuery } from '@app/modules/auth/application/interfaces/queries/find-user-groups.query';
import type { UserGroupReadModel } from '@app/modules/auth/application/interfaces/queries/user-group.read-model';
import type { UserGroupReadRepository } from '@app/modules/auth/application/interfaces/repositories/user-group.read-repository';
import { FindUserGroupsQueryHandler } from '@app/modules/auth/application/query-handlers/find-user-groups.query-handler';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';

describe('FindUserGroupsQueryHandler', () => {
  let handler: FindUserGroupsQueryHandler;
  let mockUserGroupRepository: UserGroupReadRepository;
  let mockAuthorizationService: AuthorizationService;

  const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserGroupRepository = {
      find: vi.fn(),
    } as unknown as UserGroupReadRepository;

    mockAuthorizationService = {
      requireOneOfRoles: vi.fn(),
    } as unknown as AuthorizationService;

    handler = new FindUserGroupsQueryHandler(
      mockUserGroupRepository,
      mockAuthorizationService
    );
  });

  describe('execute - happy path', () => {
    it('should return paginated user groups', async () => {
      const userGroupReadModel: UserGroupReadModel = {
        id: '550e8400-e29b-41d4-a716-446655440001',
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

      const query: FindUserGroupsQuery = {};

      vi.mocked(mockUserGroupRepository.find).mockResolvedValue({
        data: [userGroupReadModel],
        pagination: {
          count: 1,
          pageIndex: 0,
        },
      });

      const result = await handler.execute(query, context);

      expect(mockAuthorizationService.requireOneOfRoles).toHaveBeenCalledWith(
        [AuthRole.AUTH_MANAGER, AuthRole.AUTH_VIEWER],
        context
      );
      expect(result.data).toHaveLength(1);
      expect(result.pagination.count).toBe(1);
    });

    it('should return user groups with search term', async () => {
      const context: AppContext = {
        user: {
          userId,
          roles: [AuthRole.AUTH_VIEWER],
        },
      };

      const query: FindUserGroupsQuery = {
        searchTerm: 'test',
      };

      vi.mocked(mockUserGroupRepository.find).mockResolvedValue({
        data: [],
        pagination: {
          count: 0,
          pageIndex: 0,
        },
      });

      const result = await handler.execute(query, context);

      expect(result.pagination.count).toBe(0);
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

      const query: FindUserGroupsQuery = {};

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
