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
import { UpdateUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/update-user-group.command-handler';
import type { UpdateUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/update-user-group.command';
import { UserGroup } from '@app/modules/auth/domain/aggregates/user-group';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';
import type { UserGroupRepository } from '@app/modules/auth/domain/interfaces/repositories/user-group.repository';
import type { UserGroupValidatorService } from '@app/modules/auth/domain/interfaces/services/user-group-validator.service';

describe('UpdateUserGroupCommandHandler', () => {
  let handler: UpdateUserGroupCommandHandler;
  let mockAuthorizationService: AuthorizationService;
  let mockUserGroupValidatorService: UserGroupValidatorService;
  let mockUserGroupRepository: UserGroupRepository;
  let mockEventDispatcher: EventDispatcher;

  const userGroupId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
  const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440001');

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthorizationService = {
      requireRole: vi.fn(),
    } as unknown as AuthorizationService;

    mockUserGroupValidatorService = {
      validateUserGroupExistsById: vi.fn(),
    } as unknown as UserGroupValidatorService;

    mockUserGroupRepository = {
      save: vi.fn(),
      nameExists: vi.fn(),
    } as unknown as UserGroupRepository;

    mockEventDispatcher = {
      dispatch: vi.fn().mockResolvedValue(undefined),
      registerHandler: vi.fn(),
    } as unknown as EventDispatcher;

    handler = new UpdateUserGroupCommandHandler(
      mockAuthorizationService,
      mockUserGroupValidatorService,
      mockUserGroupRepository,
      mockEventDispatcher
    );
  });

  describe('execute - happy path', () => {
    it('should update user group name', async () => {
      const userGroup = new UserGroup({
        id: userGroupId,
        name: 'Old Name',
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const context: AppContext = {
        user: {
          userId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: UpdateUserGroupCommand = {
        id: userGroupId.getValue(),
        name: 'New Name',
      };

      vi.mocked(
        mockUserGroupValidatorService.validateUserGroupExistsById
      ).mockResolvedValue(userGroup);
      vi.mocked(mockUserGroupRepository.nameExists).mockResolvedValue(false);
      vi.mocked(mockUserGroupRepository.save).mockResolvedValue(undefined);

      const result = await handler.execute(command, context);

      expect(mockAuthorizationService.requireRole).toHaveBeenCalledWith(
        AuthRole.AUTH_MANAGER,
        context
      );
      expect(result).toBeUndefined();
    });

    it('should update user group description', async () => {
      const userGroup = new UserGroup({
        id: userGroupId,
        name: 'Test Group',
        description: 'Old Description',
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const context: AppContext = {
        user: {
          userId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: UpdateUserGroupCommand = {
        id: userGroupId.getValue(),
        description: 'New Description',
      };

      vi.mocked(
        mockUserGroupValidatorService.validateUserGroupExistsById
      ).mockResolvedValue(userGroup);
      vi.mocked(mockUserGroupRepository.save).mockResolvedValue(undefined);

      const result = await handler.execute(command, context);

      expect(result).toBeUndefined();
    });
  });

  describe('execute - validation errors', () => {
    it('should throw ValidationException when no updates provided', async () => {
      const context: AppContext = {
        user: {
          userId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: UpdateUserGroupCommand = {
        id: userGroupId.getValue(),
      };

      await expect(handler.execute(command, context)).rejects.toThrow(
        ValidationException
      );
    });
  });

  describe('execute - authorization errors', () => {
    it('should throw error when user does not have AUTH_MANAGER role', async () => {
      const context: AppContext = {
        user: {
          userId,
          roles: [],
        },
      };

      const command: UpdateUserGroupCommand = {
        id: userGroupId.getValue(),
        name: 'New Name',
      };

      vi.mocked(mockAuthorizationService.requireRole).mockImplementation(() => {
        throw new BusinessException(AuthorizationExceptionCode.FORBIDDEN);
      });

      await expect(handler.execute(command, context)).rejects.toThrow(
        BusinessException
      );
    });
  });

  describe('execute - name uniqueness validation', () => {
    it('should throw ValidationException when new name already exists', async () => {
      const userGroup = new UserGroup({
        id: userGroupId,
        name: 'Old Name',
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const context: AppContext = {
        user: {
          userId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: UpdateUserGroupCommand = {
        id: userGroupId.getValue(),
        name: 'Existing Name',
      };

      vi.mocked(
        mockUserGroupValidatorService.validateUserGroupExistsById
      ).mockResolvedValue(userGroup);
      vi.mocked(mockUserGroupRepository.nameExists).mockResolvedValue(true);

      await expect(handler.execute(command, context)).rejects.toThrow(
        ValidationException
      );
      expect(mockUserGroupRepository.nameExists).toHaveBeenCalledWith(
        'Existing Name',
        userGroupId
      );
      expect(mockUserGroupRepository.save).not.toHaveBeenCalled();
    });

    it('should allow updating to same name (excluded from check)', async () => {
      const userGroup = new UserGroup({
        id: userGroupId,
        name: 'Same Name',
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const context: AppContext = {
        user: {
          userId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: UpdateUserGroupCommand = {
        id: userGroupId.getValue(),
        name: 'Same Name',
      };

      vi.mocked(
        mockUserGroupValidatorService.validateUserGroupExistsById
      ).mockResolvedValue(userGroup);
      vi.mocked(mockUserGroupRepository.nameExists).mockResolvedValue(false);
      vi.mocked(mockUserGroupRepository.save).mockResolvedValue(undefined);

      await handler.execute(command, context);

      expect(mockUserGroupRepository.nameExists).toHaveBeenCalledWith(
        'Same Name',
        userGroupId
      );
      expect(mockUserGroupRepository.save).toHaveBeenCalled();
    });
  });
});
