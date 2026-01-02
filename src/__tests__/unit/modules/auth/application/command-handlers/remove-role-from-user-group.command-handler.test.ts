import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthorizationService } from '@app/common/application/services/authorization.service';
import type { EventDispatcher } from '@app/common/domain/interfaces/event-dispatcher';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { AuthorizationExceptionCode } from '@app/common/enums/authorization-exception-code';
import type { AppContext } from '@app/common/interfaces/context';
import {
  BusinessException,
  ValidationException,
} from '@app/common/utils/exceptions';
import { RemoveRoleFromUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/remove-role-from-user-group.command-handler';
import type { RemoveRoleFromUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/remove-role-from-user-group.command';
import { UserGroup } from '@app/modules/auth/domain/aggregates/user-group';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';
import type { RoleRepository } from '@app/modules/auth/domain/interfaces/repositories/role.repository';
import type { UserGroupRepository } from '@app/modules/auth/domain/interfaces/repositories/user-group.repository';
import type { UserGroupValidatorService } from '@app/modules/auth/domain/interfaces/services/user-group-validator.service';

describe('RemoveRoleFromUserGroupCommandHandler', () => {
  let handler: RemoveRoleFromUserGroupCommandHandler;
  let mockAuthorizationService: AuthorizationService;
  let mockUserGroupValidatorService: UserGroupValidatorService;
  let mockRoleRepository: RoleRepository;
  let mockUserGroupRepository: UserGroupRepository;
  let mockEventDispatcher: EventDispatcher;

  const userGroupId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
  const roleId = Uuid.create('550e8400-e29b-41d4-a716-446655440003');
  const managerUserId = Uuid.create('550e8400-e29b-41d4-a716-446655440001');
  const createdBy = Uuid.create('550e8400-e29b-41d4-a716-446655440002');

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthorizationService = {
      requireRole: vi.fn(),
    } as unknown as AuthorizationService;

    mockUserGroupValidatorService = {
      validateUserGroupExistsById: vi.fn(),
    } as unknown as UserGroupValidatorService;

    mockRoleRepository = {
      roleExists: vi.fn(),
    } as unknown as RoleRepository;

    mockUserGroupRepository = {
      findById: vi.fn(),
      roleInGroup: vi.fn(),
      removeRole: vi.fn(),
      save: vi.fn(),
    } as unknown as UserGroupRepository;

    mockEventDispatcher = {
      dispatch: vi.fn().mockResolvedValue(undefined),
      registerHandler: vi.fn(),
    } as unknown as EventDispatcher;

    handler = new RemoveRoleFromUserGroupCommandHandler(
      mockAuthorizationService,
      mockUserGroupValidatorService,
      mockRoleRepository,
      mockUserGroupRepository,
      mockEventDispatcher
    );
  });

  describe('execute - happy path', () => {
    it('should remove role from user group', async () => {
      const userGroup = new UserGroup({
        id: userGroupId,
        name: 'Test Group',
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy,
      });

      const context: AppContext = {
        user: {
          userId: managerUserId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: RemoveRoleFromUserGroupCommand = {
        userGroupId: userGroupId.getValue(),
        roleId: roleId.getValue(),
      };

      vi.mocked(
        mockUserGroupValidatorService.validateUserGroupExistsById
      ).mockResolvedValue(userGroup);
      vi.mocked(mockRoleRepository.roleExists).mockResolvedValue(true);
      vi.mocked(mockUserGroupRepository.roleInGroup).mockResolvedValue(true);
      vi.mocked(mockUserGroupRepository.save).mockImplementation(
        async (_aggregate, callback) => {
          if (callback) {
            await callback({} as any);
          }
          return Promise.resolve(undefined);
        }
      );
      vi.mocked(mockUserGroupRepository.removeRole).mockResolvedValue();

      await handler.execute(command, context);

      expect(mockAuthorizationService.requireRole).toHaveBeenCalledWith(
        AuthRole.AUTH_MANAGER,
        context
      );
      expect(
        mockUserGroupValidatorService.validateUserGroupExistsById
      ).toHaveBeenCalledWith(userGroupId);
      expect(mockRoleRepository.roleExists).toHaveBeenCalledWith(
        roleId.getValue()
      );
      expect(mockUserGroupRepository.roleInGroup).toHaveBeenCalledWith(
        userGroupId,
        roleId
      );
      expect(mockUserGroupRepository.save).toHaveBeenCalledWith(
        userGroup,
        expect.any(Function)
      );
    });
  });

  describe('execute - validation errors', () => {
    it('should throw ValidationException when user group is not found', async () => {
      const context: AppContext = {
        user: {
          userId: managerUserId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: RemoveRoleFromUserGroupCommand = {
        userGroupId: userGroupId.getValue(),
        roleId: roleId.getValue(),
      };

      vi.mocked(
        mockUserGroupValidatorService.validateUserGroupExistsById
      ).mockImplementation(() => {
        throw new ValidationException(AuthExceptionCode.USER_GROUP_NOT_FOUND);
      });

      await expect(handler.execute(command, context)).rejects.toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException when role is not found', async () => {
      const userGroup = new UserGroup({
        id: userGroupId,
        name: 'Test Group',
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy,
      });

      const context: AppContext = {
        user: {
          userId: managerUserId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: RemoveRoleFromUserGroupCommand = {
        userGroupId: userGroupId.getValue(),
        roleId: roleId.getValue(),
      };

      vi.mocked(
        mockUserGroupValidatorService.validateUserGroupExistsById
      ).mockResolvedValue(userGroup);
      vi.mocked(mockRoleRepository.roleExists).mockResolvedValue(false);

      await expect(handler.execute(command, context)).rejects.toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException when role is not in group', async () => {
      const userGroup = new UserGroup({
        id: userGroupId,
        name: 'Test Group',
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy,
      });

      const context: AppContext = {
        user: {
          userId: managerUserId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: RemoveRoleFromUserGroupCommand = {
        userGroupId: userGroupId.getValue(),
        roleId: roleId.getValue(),
      };

      vi.mocked(
        mockUserGroupValidatorService.validateUserGroupExistsById
      ).mockResolvedValue(userGroup);
      vi.mocked(mockRoleRepository.roleExists).mockResolvedValue(true);
      vi.mocked(mockUserGroupRepository.roleInGroup).mockResolvedValue(false);

      await expect(handler.execute(command, context)).rejects.toThrow(
        ValidationException
      );
    });
  });

  describe('execute - authorization errors', () => {
    it('should throw error when user does not have AUTH_MANAGER role', async () => {
      const context: AppContext = {
        user: {
          userId: managerUserId,
          roles: [],
        },
      };

      const command: RemoveRoleFromUserGroupCommand = {
        userGroupId: userGroupId.getValue(),
        roleId: roleId.getValue(),
      };

      vi.mocked(mockAuthorizationService.requireRole).mockImplementation(() => {
        throw new BusinessException(AuthorizationExceptionCode.FORBIDDEN);
      });

      await expect(handler.execute(command, context)).rejects.toThrow(
        BusinessException
      );
    });
  });
});
