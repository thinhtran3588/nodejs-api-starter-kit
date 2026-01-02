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
import { UpdateProfileCommandHandler } from '@app/modules/auth/application/command-handlers/update-profile.command-handler';
import type { UpdateProfileCommand } from '@app/modules/auth/application/interfaces/commands/update-profile.command';
import { User } from '@app/modules/auth/domain/aggregates/user';
import { SignInType } from '@app/modules/auth/domain/enums/sign-in-type';
import { UserStatus } from '@app/modules/auth/domain/enums/user-status';
import type { UserRepository } from '@app/modules/auth/domain/interfaces/repositories/user.repository';
import type { UserValidatorService } from '@app/modules/auth/domain/interfaces/services/user-validator.service';
import { Email } from '@app/modules/auth/domain/value-objects/email';

describe('UpdateProfileCommandHandler', () => {
  let handler: UpdateProfileCommandHandler;
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
      requireAuthenticated: vi.fn(),
    } as unknown as AuthorizationService;

    mockUserRepository = {
      save: vi.fn(),
      usernameExists: vi.fn(),
    } as unknown as UserRepository;

    mockUserValidatorService = {
      validateUserActiveById: vi.fn(),
    } as unknown as UserValidatorService;

    mockEventDispatcher = {
      dispatch: vi.fn().mockResolvedValue(undefined),
      registerHandler: vi.fn(),
    } as unknown as EventDispatcher;

    handler = new UpdateProfileCommandHandler(
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
          userId,
          roles: [],
        },
      };

      const command: UpdateProfileCommand = {
        displayName: 'New Name',
      };

      vi.mocked(
        mockUserValidatorService.validateUserActiveById
      ).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined);

      const result = await handler.execute(command, context);

      expect(
        mockAuthorizationService.requireAuthenticated
      ).toHaveBeenCalledWith(context);
      expect(user.displayName).toBe('New Name');
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
          userId,
          roles: [],
        },
      };

      const command: UpdateProfileCommand = {
        username: 'newusername',
      };

      vi.mocked(
        mockUserValidatorService.validateUserActiveById
      ).mockResolvedValue(user);
      vi.mocked(mockUserRepository.usernameExists).mockResolvedValue(false);
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined);

      const result = await handler.execute(command, context);

      expect(result).toBeUndefined();
    });
  });

  describe('execute - validation errors', () => {
    it('should throw ValidationException when no updates provided', async () => {
      const context: AppContext = {
        user: {
          userId,
          roles: [],
        },
      };

      const command: UpdateProfileCommand = {};

      await expect(handler.execute(command, context)).rejects.toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException when username is already taken', async () => {
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
          userId,
          roles: [],
        },
      };

      const command: UpdateProfileCommand = {
        username: 'takenusername',
      };

      vi.mocked(
        mockUserValidatorService.validateUserActiveById
      ).mockResolvedValue(user);
      vi.mocked(mockUserRepository.usernameExists).mockResolvedValue(true);

      await expect(handler.execute(command, context)).rejects.toThrow(
        ValidationException
      );
    });
  });

  describe('execute - authorization errors', () => {
    it('should throw error when user is not authenticated', async () => {
      const context: AppContext = {
        user: undefined,
      };

      const command: UpdateProfileCommand = {
        displayName: 'New Name',
      };

      vi.mocked(
        mockAuthorizationService.requireAuthenticated
      ).mockImplementation(() => {
        throw new BusinessException(AuthorizationExceptionCode.UNAUTHORIZED);
      });

      await expect(handler.execute(command, context)).rejects.toThrow(
        BusinessException
      );
    });
  });
});
