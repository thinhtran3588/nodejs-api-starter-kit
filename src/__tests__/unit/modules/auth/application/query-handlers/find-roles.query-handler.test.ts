import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthorizationService } from '@app/common/application/services/authorization.service';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { AuthorizationExceptionCode } from '@app/common/enums/authorization-exception-code';
import type { AppContext } from '@app/common/interfaces/context';
import {
  BusinessException,
  ValidationException,
} from '@app/common/utils/exceptions';
import type { FindRolesQuery } from '@app/modules/auth/application/interfaces/queries/find-roles.query';
import type { RoleReadModel } from '@app/modules/auth/application/interfaces/queries/role.read-model';
import type { RoleReadRepository } from '@app/modules/auth/application/interfaces/repositories/role.read-repository';
import { FindRolesQueryHandler } from '@app/modules/auth/application/query-handlers/find-roles.query-handler';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';

describe('FindRolesQueryHandler', () => {
  let handler: FindRolesQueryHandler;
  let mockRoleRepository: RoleReadRepository;
  let mockAuthorizationService: AuthorizationService;

  const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');

  beforeEach(() => {
    vi.clearAllMocks();

    mockRoleRepository = {
      find: vi.fn(),
    } as unknown as RoleReadRepository;

    mockAuthorizationService = {
      requireOneOfRoles: vi.fn(),
    } as unknown as AuthorizationService;

    handler = new FindRolesQueryHandler(
      mockRoleRepository,
      mockAuthorizationService
    );
  });

  describe('execute - happy path', () => {
    it('should return paginated roles', async () => {
      const roleReadModel: RoleReadModel = {
        id: 'role-123',
        code: 'ADMIN',
        name: 'Admin',
        description: 'Administrator role',
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

      const query: FindRolesQuery = {};

      vi.mocked(mockRoleRepository.find).mockResolvedValue({
        data: [roleReadModel],
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
      expect(mockRoleRepository.find).toHaveBeenCalledWith({
        searchTerm: undefined,
        userGroupId: undefined,
        pageIndex: 0,
        itemsPerPage: 50,
        fields: undefined,
      });
      expect(result.data).toHaveLength(1);
      expect(result.pagination.count).toBe(1);
    });

    it('should return roles with search term', async () => {
      const context: AppContext = {
        user: {
          userId,
          roles: [AuthRole.AUTH_VIEWER],
        },
      };

      const query: FindRolesQuery = {
        searchTerm: 'admin',
      };

      vi.mocked(mockRoleRepository.find).mockResolvedValue({
        data: [],
        pagination: {
          count: 0,
          pageIndex: 0,
        },
      });

      const result = await handler.execute(query, context);

      expect(mockRoleRepository.find).toHaveBeenCalledWith({
        searchTerm: 'admin',
        userGroupId: undefined,
        pageIndex: 0,
        itemsPerPage: 50,
        fields: undefined,
      });
      expect(result.pagination.count).toBe(0);
    });

    it('should pass userGroupId to repository', async () => {
      const roleReadModel: RoleReadModel = {
        id: 'role-123',
        code: 'ADMIN',
        name: 'Admin',
        description: 'Administrator role',
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

      const userGroupId = '550e8400-e29b-41d4-a716-446655440002';
      const query: FindRolesQuery = {
        userGroupId,
      };

      vi.mocked(mockRoleRepository.find).mockResolvedValue({
        data: [roleReadModel],
        pagination: {
          count: 1,
          pageIndex: 0,
        },
      });

      const result = await handler.execute(query, context);

      expect(mockRoleRepository.find).toHaveBeenCalledWith({
        searchTerm: undefined,
        userGroupId,
        pageIndex: 0,
        itemsPerPage: 50,
        fields: undefined,
      });
      expect(result.data).toHaveLength(1);
      expect(result.pagination.count).toBe(1);
    });
  });

  describe('execute - validation errors', () => {
    it('should throw ValidationException when userGroupId is invalid UUID', async () => {
      const context: AppContext = {
        user: {
          userId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const query: FindRolesQuery = {
        userGroupId: 'invalid-uuid',
      };

      await expect(handler.execute(query, context)).rejects.toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException when userGroupId is malformed UUID', async () => {
      const context: AppContext = {
        user: {
          userId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const query: FindRolesQuery = {
        userGroupId: '550e8400-e29b-41d4-a716',
      };

      await expect(handler.execute(query, context)).rejects.toThrow(
        ValidationException
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

      const query: FindRolesQuery = {};

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
