import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventDispatcher } from '@app/common/domain/interfaces/event-dispatcher';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import {
  BusinessException,
  ValidationException,
} from '@app/common/utils/exceptions';
import { RegisterCommandHandler } from '@app/modules/auth/application/command-handlers/register.command-handler';
import type { RegisterCommand } from '@app/modules/auth/application/interfaces/commands/register.command';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import type { UserRepository } from '@app/modules/auth/domain/interfaces/repositories/user.repository';
import type { ExternalAuthenticationService } from '@app/modules/auth/domain/interfaces/services/external-authentication.service';
import type { UserIdGeneratorService } from '@app/modules/auth/domain/interfaces/services/user-id-generator.service';
import type { UserValidatorService } from '@app/modules/auth/domain/interfaces/services/user-validator.service';
import { Email } from '@app/modules/auth/domain/value-objects/email';
import { Username } from '@app/modules/auth/domain/value-objects/username';

describe('RegisterCommandHandler', () => {
  let handler: RegisterCommandHandler;
  let mockUserRepository: UserRepository;
  let mockExternalAuthService: ExternalAuthenticationService;
  let mockUserIdGeneratorService: UserIdGeneratorService;
  let mockUserValidatorService: UserValidatorService;
  let mockEventDispatcher: EventDispatcher;

  const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
  const externalId = 'firebase-user-123';
  const idToken = 'firebase-id-token';
  const signInToken = 'firebase-sign-in-token';

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserRepository = {
      save: vi.fn(),
    } as unknown as UserRepository;

    mockExternalAuthService = {
      createUser: vi.fn(),
      verifyPassword: vi.fn(),
      createSignInToken: vi.fn(),
    } as unknown as ExternalAuthenticationService;

    mockUserIdGeneratorService = {
      generateUserId: vi.fn(),
    } as unknown as UserIdGeneratorService;

    mockUserValidatorService = {
      validateEmailUniqueness: vi.fn(),
      validateUsernameUniqueness: vi.fn(),
    } as unknown as UserValidatorService;

    mockEventDispatcher = {
      dispatch: vi.fn().mockResolvedValue(undefined),
      registerHandler: vi.fn(),
    } as unknown as EventDispatcher;

    handler = new RegisterCommandHandler(
      mockUserRepository,
      mockExternalAuthService,
      mockUserIdGeneratorService,
      mockUserValidatorService,
      mockEventDispatcher
    );
  });

  describe('execute - happy path', () => {
    it('should register a user with email and password', async () => {
      vi.mocked(mockUserIdGeneratorService.generateUserId).mockReturnValue(
        userId
      );
      vi.mocked(mockExternalAuthService.createUser).mockResolvedValue(
        externalId
      );
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined);
      vi.mocked(mockExternalAuthService.verifyPassword).mockResolvedValue({
        externalId,
        idToken,
      });
      vi.mocked(mockExternalAuthService.createSignInToken).mockResolvedValue(
        signInToken
      );

      const command: RegisterCommand = {
        email: 'test@example.com',

        password: 'ValidPass123!',
      };

      const result = await handler.execute(command);

      expect(
        mockUserValidatorService.validateEmailUniqueness
      ).toHaveBeenCalledWith(expect.any(Email));
      expect(mockExternalAuthService.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'ValidPass123!',
      });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockExternalAuthService.verifyPassword).toHaveBeenCalledWith(
        'test@example.com',
        'ValidPass123!'
      );
      expect(mockExternalAuthService.createSignInToken).toHaveBeenCalledWith(
        externalId
      );
      expect(result.id).toBe(userId.getValue());
      expect(result.idToken).toBe(idToken);
      expect(result.signInToken).toBe(signInToken);
    });

    it('should register a user with username', async () => {
      vi.mocked(mockUserIdGeneratorService.generateUserId).mockReturnValue(
        userId
      );
      vi.mocked(mockExternalAuthService.createUser).mockResolvedValue(
        externalId
      );
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined);
      vi.mocked(mockExternalAuthService.verifyPassword).mockResolvedValue({
        externalId,
        idToken,
      });
      vi.mocked(mockExternalAuthService.createSignInToken).mockResolvedValue(
        signInToken
      );

      const command: RegisterCommand = {
        email: 'test@example.com',

        password: 'ValidPass123!',

        username: 'testuser123',
      };

      const result = await handler.execute(command);

      expect(
        mockUserValidatorService.validateUsernameUniqueness
      ).toHaveBeenCalledWith(expect.any(Username));
      expect(result.id).toBe(userId.getValue());
    });

    it('should register a user with displayName', async () => {
      vi.mocked(mockUserIdGeneratorService.generateUserId).mockReturnValue(
        userId
      );
      vi.mocked(mockExternalAuthService.createUser).mockResolvedValue(
        externalId
      );
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined);
      vi.mocked(mockExternalAuthService.verifyPassword).mockResolvedValue({
        externalId,
        idToken,
      });
      vi.mocked(mockExternalAuthService.createSignInToken).mockResolvedValue(
        signInToken
      );

      const command: RegisterCommand = {
        email: 'test@example.com',
        password: 'ValidPass123!',
        displayName: 'Test User',
      };

      const result = await handler.execute(command);

      expect(result.id).toBe(userId.getValue());
    });
  });

  describe('execute - validation errors', () => {
    it('should throw ValidationException when email is already taken', async () => {
      vi.mocked(
        mockUserValidatorService.validateEmailUniqueness
      ).mockRejectedValue(
        new ValidationException(AuthExceptionCode.EMAIL_ALREADY_TAKEN)
      );

      const command: RegisterCommand = {
        email: 'test@example.com',

        password: 'ValidPass123!',
      };

      await expect(handler.execute(command)).rejects.toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException when username is already taken', async () => {
      vi.mocked(
        mockUserValidatorService.validateEmailUniqueness
      ).mockResolvedValue();
      vi.mocked(
        mockUserValidatorService.validateUsernameUniqueness
      ).mockRejectedValue(
        new ValidationException(AuthExceptionCode.USERNAME_ALREADY_TAKEN)
      );

      const command: RegisterCommand = {
        email: 'test@example.com',

        password: 'ValidPass123!',

        username: 'testuser123',
      };

      await expect(handler.execute(command)).rejects.toThrow(
        ValidationException
      );
    });

    it('should throw BusinessException when password verification fails', async () => {
      vi.mocked(
        mockUserValidatorService.validateEmailUniqueness
      ).mockResolvedValue();
      vi.mocked(mockUserIdGeneratorService.generateUserId).mockReturnValue(
        userId
      );
      vi.mocked(mockExternalAuthService.createUser).mockResolvedValue(
        externalId
      );
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined);
      vi.mocked(mockExternalAuthService.verifyPassword).mockResolvedValue(
        undefined
      );

      const command: RegisterCommand = {
        email: 'test@example.com',

        password: 'ValidPass123!',
      };

      await expect(handler.execute(command)).rejects.toThrow(BusinessException);
    });
  });
});
