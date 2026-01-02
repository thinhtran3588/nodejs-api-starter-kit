import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthorizationService } from '@app/common/application/services/authorization.service';
import type { EventDispatcher } from '@app/common/domain/interfaces/event-dispatcher';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { AuthorizationExceptionCode } from '@app/common/enums/authorization-exception-code';
import type { AppContext } from '@app/common/interfaces/context';
import { BusinessException } from '@app/common/utils/exceptions';
import { DeleteUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/delete-user-group.command-handler';
import type { DeleteUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/delete-user-group.command';
import { UserGroup } from '@app/modules/auth/domain/aggregates/user-group';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';
import type { UserGroupRepository } from '@app/modules/auth/domain/interfaces/repositories/user-group.repository';
import type { UserGroupValidatorService } from '@app/modules/auth/domain/interfaces/services/user-group-validator.service';

describe('DeleteUserGroupCommandHandler', () => {
  let handler: DeleteUserGroupCommandHandler;
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
      delete: vi.fn().mockResolvedValue(undefined),
    } as unknown as UserGroupRepository;

    mockEventDispatcher = {
      dispatch: vi.fn().mockResolvedValue(undefined),
    } as unknown as EventDispatcher;

    handler = new DeleteUserGroupCommandHandler(
      mockAuthorizationService,
      mockUserGroupValidatorService,
      mockUserGroupRepository,
      mockEventDispatcher
    );
  });

  describe('execute - happy path', () => {
    it('should delete user group and dispatch events', async () => {
      const context: AppContext = {
        user: {
          userId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: DeleteUserGroupCommand = {
        id: userGroupId.getValue(),
      };

      const userGroup = UserGroup.create({
        id: userGroupId,
        name: 'Test Group',
        createdBy: userId,
      });

      vi.mocked(
        mockUserGroupValidatorService.validateUserGroupExistsById
      ).mockResolvedValue(userGroup);
      vi.mocked(mockUserGroupRepository.delete).mockResolvedValue(undefined);

      await handler.execute(command, context);

      expect(mockAuthorizationService.requireRole).toHaveBeenCalledWith(
        AuthRole.AUTH_MANAGER,
        context
      );
      expect(
        mockUserGroupValidatorService.validateUserGroupExistsById
      ).toHaveBeenCalledWith(userGroupId);
      expect(mockUserGroupRepository.delete).toHaveBeenCalledWith(userGroup);
      expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(
        userGroup.getEvents()
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

      const command: DeleteUserGroupCommand = {
        id: userGroupId.getValue(),
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
