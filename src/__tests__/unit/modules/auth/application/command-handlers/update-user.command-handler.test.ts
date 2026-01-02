import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthorizationService } from '@app/common/application/services/authorization.service';
import type { EventDispatcher } from '@app/common/domain/interfaces/event-dispatcher';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { AuthorizationExceptionCode } from '@app/common/enums/authorization-exception-code';
import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import type { AppContext } from '@app/common/interfaces/context';
import {
  BusinessException,
  ValidationException,
} from '@app/common/utils/exceptions';
import { UpdateUserCommandHandler } from '@app/modules/auth/application/command-handlers/update-user.command-handler';
import type { UpdateUserCommand } from '@app/modules/auth/application/interfaces/commands/update-user.command';
import { User } from '@app/modules/auth/domain/aggregates/user';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';
import { SignInType } from '@app/modules/auth/domain/enums/sign-in-type';
import { UserStatus } from '@app/modules/auth/domain/enums/user-status';
import type { UserRepository } from '@app/modules/auth/domain/interfaces/repositories/user.repository';
import type { UserValidatorService } from '@app/modules/auth/domain/interfaces/services/user-validator.service';
import { Email } from '@app/modules/auth/domain/value-objects/email';

describe('UpdateUserCommandHandler', () => {
  let handler: UpdateUserCommandHandler;
  let mockAuthorizationService: AuthorizationService;
  let mockUserRepository: UserRepository;
  let mockUserValidatorService: UserValidatorService;
  let mockEventDispatcher: EventDispatcher;

  const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
  const userEmail = Email.create('test@example.com');
  const externalId = 'firebase-user-123';

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthorizationService = {
      requireRole: vi.fn(),
    } as unknown as AuthorizationService;

    mockUserRepository = {
      save: vi.fn(),
      usernameExists: vi.fn(),
    } as unknown as UserRepository;

    mockUserValidatorService = {
      validateUserNotDeletedById: vi.fn(),
    } as unknown as UserValidatorService;

    mockEventDispatcher = {
      dispatch: vi.fn().mockResolvedValue(undefined),
      registerHandler: vi.fn(),
    } as unknown as EventDispatcher;

    handler = new UpdateUserCommandHandler(
      mockAuthorizationService,
      mockUserRepository,
      mockUserValidatorService,
      mockEventDispatcher
    );
  });

  describe('execute - happy path', () => {
    it('should update user display name', async () => {
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
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: UpdateUserCommand = {
        id: userId.getValue(),
        displayName: 'New Name',
      };

      vi.mocked(
        mockUserValidatorService.validateUserNotDeletedById
      ).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined);

      const result = await handler.execute(command, context);

      expect(mockAuthorizationService.requireRole).toHaveBeenCalledWith(
        AuthRole.AUTH_MANAGER,
        context
      );
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
      expect(result).toBeUndefined();
    });

    it('should update user username', async () => {
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
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: UpdateUserCommand = {
        id: userId.getValue(),
        username: 'newusername',
      };

      vi.mocked(
        mockUserValidatorService.validateUserNotDeletedById
      ).mockResolvedValue(user);
      vi.mocked(mockUserRepository.usernameExists).mockResolvedValue(false);
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined);

      const result = await handler.execute(command, context);

      expect(mockUserRepository.usernameExists).toHaveBeenCalledWith(
        expect.any(Object),
        userId
      );
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
      expect(result).toBeUndefined();
    });

    it('should update both displayName and username', async () => {
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
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: UpdateUserCommand = {
        id: userId.getValue(),
        displayName: 'New Name',
        username: 'newusername',
      };

      vi.mocked(
        mockUserValidatorService.validateUserNotDeletedById
      ).mockResolvedValue(user);
      vi.mocked(mockUserRepository.usernameExists).mockResolvedValue(false);
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined);

      const result = await handler.execute(command, context);

      expect(mockUserRepository.usernameExists).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should successfully update user with any version', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.ACTIVE,
        version: 7,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const context: AppContext = {
        user: {
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: UpdateUserCommand = {
        id: userId.getValue(),
        displayName: 'New Name',
      };

      vi.mocked(
        mockUserValidatorService.validateUserNotDeletedById
      ).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined);

      const result = await handler.execute(command, context);

      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
      expect(result).toBeUndefined();
    });

    it('should update only displayName when username is undefined', async () => {
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
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: UpdateUserCommand = {
        id: userId.getValue(),
        displayName: 'New Name',
        username: undefined,
      };

      vi.mocked(
        mockUserValidatorService.validateUserNotDeletedById
      ).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined);

      const result = await handler.execute(command, context);

      expect(mockUserRepository.usernameExists).not.toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
      expect(result).toBeUndefined();
    });
  });

  describe('execute - validation errors', () => {
    it('should throw ValidationException when no updates provided', async () => {
      const context: AppContext = {
        user: {
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: UpdateUserCommand = {
        id: userId.getValue(),
      };

      await expect(handler.execute(command, context)).rejects.toThrow(
        ValidationException
      );
      await expect(handler.execute(command, context)).rejects.toMatchObject({
        code: ValidationErrorCode.NO_UPDATES,
      });

      expect(
        mockUserValidatorService.validateUserNotDeletedById
      ).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ValidationException when username already exists', async () => {
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
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: UpdateUserCommand = {
        id: userId.getValue(),
        username: 'existinguser',
      };

      vi.mocked(
        mockUserValidatorService.validateUserNotDeletedById
      ).mockResolvedValue(user);
      vi.mocked(mockUserRepository.usernameExists).mockResolvedValue(true);

      await expect(handler.execute(command, context)).rejects.toThrow(
        AuthExceptionCode.USERNAME_ALREADY_TAKEN
      );
    });
  });

  describe('execute - authorization errors', () => {
    it('should throw AuthorizationException when user does not have AUTH_MANAGER role', async () => {
      const context: AppContext = {
        user: {
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [],
        },
      };

      const command: UpdateUserCommand = {
        id: userId.getValue(),
        displayName: 'New Name',
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
