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
import { RemoveUserFromUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/remove-user-from-user-group.command-handler';
import type { RemoveUserFromUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/remove-user-from-user-group.command';
import { User } from '@app/modules/auth/domain/aggregates/user';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';
import { SignInType } from '@app/modules/auth/domain/enums/sign-in-type';
import { UserStatus } from '@app/modules/auth/domain/enums/user-status';
import type { UserGroupRepository } from '@app/modules/auth/domain/interfaces/repositories/user-group.repository';
import type { UserRepository } from '@app/modules/auth/domain/interfaces/repositories/user.repository';
import type { UserGroupValidatorService } from '@app/modules/auth/domain/interfaces/services/user-group-validator.service';
import type { UserValidatorService } from '@app/modules/auth/domain/interfaces/services/user-validator.service';
import { Email } from '@app/modules/auth/domain/value-objects/email';

describe('RemoveUserFromUserGroupCommandHandler', () => {
  let handler: RemoveUserFromUserGroupCommandHandler;
  let mockAuthorizationService: AuthorizationService;
  let mockUserGroupValidatorService: UserGroupValidatorService;
  let mockUserRepository: UserRepository;
  let mockUserValidatorService: UserValidatorService;
  let mockUserGroupRepository: UserGroupRepository;
  let mockEventDispatcher: EventDispatcher;

  const userGroupId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
  const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440001');
  const managerUserId = Uuid.create('550e8400-e29b-41d4-a716-446655440002');
  const userEmail = Email.create('test@example.com');
  const externalId = 'firebase-user-123';

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthorizationService = {
      requireRole: vi.fn(),
    } as unknown as AuthorizationService;

    mockUserGroupValidatorService = {
      validateUserGroupExistsById: vi.fn(),
    } as unknown as UserGroupValidatorService;

    mockUserRepository = {
      findById: vi.fn(),
      save: vi.fn(),
      removeFromGroup: vi.fn(),
    } as unknown as UserRepository;

    mockUserValidatorService = {
      validateUserExistsById: vi.fn(),
    } as unknown as UserValidatorService;

    mockUserGroupRepository = {
      userInGroup: vi.fn(),
    } as unknown as UserGroupRepository;

    mockEventDispatcher = {
      dispatch: vi.fn().mockResolvedValue(undefined),
      registerHandler: vi.fn(),
    } as unknown as EventDispatcher;

    handler = new RemoveUserFromUserGroupCommandHandler(
      mockAuthorizationService,
      mockUserGroupValidatorService,
      mockUserRepository,
      mockUserValidatorService,
      mockUserGroupRepository,
      mockEventDispatcher
    );
  });

  describe('execute - happy path', () => {
    it('should remove user from user group', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.ACTIVE,
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const context: AppContext = {
        user: {
          userId: managerUserId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: RemoveUserFromUserGroupCommand = {
        userGroupId: userGroupId.getValue(),
        userId: userId.getValue(),
      };

      vi.mocked(
        mockUserGroupValidatorService.validateUserGroupExistsById
      ).mockResolvedValue({} as any);
      vi.mocked(
        mockUserValidatorService.validateUserExistsById
      ).mockResolvedValue(user);
      vi.mocked(mockUserGroupRepository.userInGroup).mockResolvedValue(true);
      vi.mocked(mockUserRepository.save).mockImplementation(
        async (_aggregate, callback) => {
          if (callback) {
            await callback({} as any);
          }
          return Promise.resolve(undefined);
        }
      );
      vi.mocked(mockUserRepository.removeFromGroup).mockResolvedValue();

      await handler.execute(command, context);

      expect(mockAuthorizationService.requireRole).toHaveBeenCalledWith(
        AuthRole.AUTH_MANAGER,
        context
      );
      expect(
        mockUserGroupValidatorService.validateUserGroupExistsById
      ).toHaveBeenCalledWith(userGroupId);
      expect(
        mockUserValidatorService.validateUserExistsById
      ).toHaveBeenCalledWith(userId);
      expect(mockUserGroupRepository.userInGroup).toHaveBeenCalledWith(
        userGroupId,
        userId
      );
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        user,
        expect.any(Function)
      );
      expect(mockUserRepository.removeFromGroup).toHaveBeenCalledWith(
        userId,
        userGroupId,
        expect.any(Object)
      );
    });
  });

  describe('execute - validation errors', () => {
    it('should throw ValidationException when user is not found', async () => {
      const context: AppContext = {
        user: {
          userId: managerUserId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: RemoveUserFromUserGroupCommand = {
        userGroupId: userGroupId.getValue(),
        userId: userId.getValue(),
      };

      vi.mocked(
        mockUserGroupValidatorService.validateUserGroupExistsById
      ).mockResolvedValue({} as any);
      vi.mocked(
        mockUserValidatorService.validateUserExistsById
      ).mockImplementation(() => {
        throw new ValidationException(AuthExceptionCode.USER_NOT_FOUND);
      });

      await expect(handler.execute(command, context)).rejects.toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException when user is not in group', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.ACTIVE,
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const context: AppContext = {
        user: {
          userId: managerUserId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: RemoveUserFromUserGroupCommand = {
        userGroupId: userGroupId.getValue(),
        userId: userId.getValue(),
      };

      vi.mocked(
        mockUserGroupValidatorService.validateUserGroupExistsById
      ).mockResolvedValue({} as any);
      vi.mocked(
        mockUserValidatorService.validateUserExistsById
      ).mockResolvedValue(user);
      vi.mocked(mockUserGroupRepository.userInGroup).mockResolvedValue(false);

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

      const command: RemoveUserFromUserGroupCommand = {
        userGroupId: userGroupId.getValue(),
        userId: userId.getValue(),
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
