import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthorizationService } from '@app/common/application/services/authorization.service';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { AuthorizationExceptionCode } from '@app/common/enums/authorization-exception-code';
import type { AppContext } from '@app/common/interfaces/context';
import {
  BusinessException,
  ValidationException,
} from '@app/common/utils/exceptions';
import type { GetRoleQuery } from '@app/modules/auth/application/interfaces/queries/get-role.query';
import type { RoleReadModel } from '@app/modules/auth/application/interfaces/queries/role.read-model';
import type { RoleReadRepository } from '@app/modules/auth/application/interfaces/repositories/role.read-repository';
import { GetRoleQueryHandler } from '@app/modules/auth/application/query-handlers/get-role.query-handler';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';

describe('GetRoleQueryHandler', () => {
  let handler: GetRoleQueryHandler;
  let mockRoleReadRepository: RoleReadRepository;
  let mockAuthorizationService: AuthorizationService;

  const roleId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    vi.clearAllMocks();

    mockRoleReadRepository = {
      findById: vi.fn(),
    } as unknown as RoleReadRepository;

    mockAuthorizationService = {
      requireOneOfRoles: vi.fn(),
    } as unknown as AuthorizationService;

    handler = new GetRoleQueryHandler(
      mockRoleReadRepository,
      mockAuthorizationService
    );
  });

  describe('execute - happy path', () => {
    it('should return role for AUTH_MANAGER role', async () => {
      const roleReadModel: RoleReadModel = {
        id: roleId,
        code: 'ADMIN',
        name: 'Admin',
        description: 'Administrator role',
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy: 'user-123',
        lastModifiedBy: 'user-123',
      };

      const context: AppContext = {
        user: {
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const query: GetRoleQuery = {
        id: roleId,
      };

      vi.mocked(mockRoleReadRepository.findById).mockResolvedValue(
        roleReadModel
      );

      const result = await handler.execute(query, context);

      expect(mockAuthorizationService.requireOneOfRoles).toHaveBeenCalledWith(
        [AuthRole.AUTH_MANAGER, AuthRole.AUTH_VIEWER],
        context
      );
      expect(mockRoleReadRepository.findById).toHaveBeenCalledWith(roleId);
      expect(result).toBe(roleReadModel);
    });

    it('should return role for AUTH_VIEWER role', async () => {
      const roleReadModel: RoleReadModel = {
        id: roleId,
        code: 'USER',
        name: 'User',
        description: 'Regular user role',
        version: 2,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
        createdBy: 'user-123',
        lastModifiedBy: 'user-456',
      };

      const context: AppContext = {
        user: {
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [AuthRole.AUTH_VIEWER],
        },
      };

      const query: GetRoleQuery = {
        id: roleId,
      };

      vi.mocked(mockRoleReadRepository.findById).mockResolvedValue(
        roleReadModel
      );

      const result = await handler.execute(query, context);

      expect(result).toBe(roleReadModel);
    });
  });

  describe('execute - authorization errors', () => {
    it('should throw AuthorizationException when user does not have required role', async () => {
      const context: AppContext = {
        user: {
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [],
        },
      };

      const query: GetRoleQuery = {
        id: roleId,
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

  describe('execute - validation errors', () => {
    it('should throw ValidationException when role is not found', async () => {
      const context: AppContext = {
        user: {
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const query: GetRoleQuery = {
        id: roleId,
      };

      vi.mocked(mockRoleReadRepository.findById).mockResolvedValue(undefined);

      await expect(handler.execute(query, context)).rejects.toThrow(
        ValidationException
      );
      await expect(handler.execute(query, context)).rejects.toThrow(
        AuthExceptionCode.ROLE_NOT_FOUND
      );
    });
  });
});
