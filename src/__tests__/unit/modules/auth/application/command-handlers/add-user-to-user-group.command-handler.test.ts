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
import { AddUserToUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/add-user-to-user-group.command-handler';
import type { AddUserToUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/add-user-to-user-group.command';
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

describe('AddUserToUserGroupCommandHandler', () => {
  let handler: AddUserToUserGroupCommandHandler;
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
      addToGroup: vi.fn(),
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

    handler = new AddUserToUserGroupCommandHandler(
      mockAuthorizationService,
      mockUserGroupValidatorService,
      mockUserRepository,
      mockUserValidatorService,
      mockUserGroupRepository,
      mockEventDispatcher
    );
  });

  describe('execute - happy path', () => {
    it('should add user to user group', async () => {
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

      const command: AddUserToUserGroupCommand = {
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
      vi.mocked(mockUserRepository.save).mockImplementation(
        async (_aggregate, callback) => {
          if (callback) {
            await callback({} as any);
          }
          return Promise.resolve(undefined);
        }
      );
      vi.mocked(mockUserRepository.addToGroup).mockResolvedValue();

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
      expect(mockUserRepository.addToGroup).toHaveBeenCalledWith(
        userId,
        userGroupId,
        expect.any(Object)
      );
      expect(mockEventDispatcher.dispatch).toHaveBeenCalled();
      const dispatchedEvents = vi.mocked(mockEventDispatcher.dispatch).mock
        .calls[0]![0];
      expect(dispatchedEvents).toBeDefined();
      expect(dispatchedEvents.length).toBeGreaterThan(0);
    });
  });

  describe('execute - validation errors', () => {
    it('should throw ValidationException when userGroupId is invalid UUID', async () => {
      const context: AppContext = {
        user: {
          userId: managerUserId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: AddUserToUserGroupCommand = {
        userGroupId: 'invalid-uuid',
        userId: userId.getValue(),
      };

      await expect(handler.execute(command, context)).rejects.toThrow(
        ValidationException
      );
      expect(
        mockUserGroupValidatorService.validateUserGroupExistsById
      ).not.toHaveBeenCalled();
      expect(
        mockUserValidatorService.validateUserExistsById
      ).not.toHaveBeenCalled();
    });

    it('should throw ValidationException when userId is invalid UUID', async () => {
      const context: AppContext = {
        user: {
          userId: managerUserId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: AddUserToUserGroupCommand = {
        userGroupId: userGroupId.getValue(),
        userId: 'invalid-uuid',
      };

      vi.mocked(
        mockUserGroupValidatorService.validateUserGroupExistsById
      ).mockResolvedValue({} as any);

      await expect(handler.execute(command, context)).rejects.toThrow(
        ValidationException
      );
      expect(
        mockUserGroupValidatorService.validateUserGroupExistsById
      ).toHaveBeenCalledWith(userGroupId);
      expect(
        mockUserValidatorService.validateUserExistsById
      ).not.toHaveBeenCalled();
    });

    it('should throw ValidationException when userGroupId is undefined', async () => {
      const context: AppContext = {
        user: {
          userId: managerUserId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: AddUserToUserGroupCommand = {
        userGroupId: undefined as unknown as string,
        userId: userId.getValue(),
      };

      await expect(handler.execute(command, context)).rejects.toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException when userId is undefined', async () => {
      const context: AppContext = {
        user: {
          userId: managerUserId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: AddUserToUserGroupCommand = {
        userGroupId: userGroupId.getValue(),
        userId: undefined as unknown as string,
      };

      vi.mocked(
        mockUserGroupValidatorService.validateUserGroupExistsById
      ).mockResolvedValue({} as any);

      await expect(handler.execute(command, context)).rejects.toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException when user group is not found', async () => {
      const context: AppContext = {
        user: {
          userId: managerUserId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: AddUserToUserGroupCommand = {
        userGroupId: userGroupId.getValue(),
        userId: userId.getValue(),
      };

      vi.mocked(
        mockUserGroupValidatorService.validateUserGroupExistsById
      ).mockImplementation(() => {
        throw new ValidationException(AuthExceptionCode.USER_GROUP_NOT_FOUND);
      });

      await expect(handler.execute(command, context)).rejects.toThrow(
        ValidationException
      );
      expect(
        mockUserGroupValidatorService.validateUserGroupExistsById
      ).toHaveBeenCalledWith(userGroupId);
      expect(
        mockUserValidatorService.validateUserExistsById
      ).not.toHaveBeenCalled();
    });

    it('should throw ValidationException when user is not found', async () => {
      const context: AppContext = {
        user: {
          userId: managerUserId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: AddUserToUserGroupCommand = {
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

    it('should throw ValidationException when user is already in group', async () => {
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

      const command: AddUserToUserGroupCommand = {
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

      await expect(handler.execute(command, context)).rejects.toThrow(
        ValidationException
      );
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(mockEventDispatcher.dispatch).not.toHaveBeenCalled();
    });
  });

  describe('execute - error handling', () => {
    it('should propagate error when userRepository.save fails', async () => {
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

      const command: AddUserToUserGroupCommand = {
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
      const saveError = new Error('Save failed');
      vi.mocked(mockUserRepository.save).mockRejectedValue(saveError);

      await expect(handler.execute(command, context)).rejects.toThrow(
        'Save failed'
      );
      expect(mockEventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should propagate error when userRepository.addToGroup fails', async () => {
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

      const command: AddUserToUserGroupCommand = {
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
      const addToGroupError = new Error('Database error');
      vi.mocked(mockUserRepository.save).mockImplementation(
        async (_aggregate, callback) => {
          if (callback) {
            vi.mocked(mockUserRepository.addToGroup).mockRejectedValue(
              addToGroupError
            );
            await callback({} as any);
          }
          return Promise.resolve(undefined);
        }
      );

      await expect(handler.execute(command, context)).rejects.toThrow(
        'Database error'
      );
    });

    it('should propagate error when eventDispatcher.dispatch fails', async () => {
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

      const command: AddUserToUserGroupCommand = {
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
      vi.mocked(mockUserRepository.save).mockImplementation(
        async (_aggregate, callback) => {
          if (callback) {
            await callback({} as any);
          }
          return Promise.resolve(undefined);
        }
      );
      vi.mocked(mockUserRepository.addToGroup).mockResolvedValue();
      const dispatchError = new Error('Event dispatch error');
      vi.mocked(mockEventDispatcher.dispatch).mockRejectedValue(dispatchError);

      await expect(handler.execute(command, context)).rejects.toThrow(
        'Event dispatch error'
      );
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockUserRepository.addToGroup).toHaveBeenCalled();
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

      const command: AddUserToUserGroupCommand = {
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
