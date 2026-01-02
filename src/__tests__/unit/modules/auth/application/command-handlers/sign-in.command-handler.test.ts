import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { ValidationException } from '@app/common/utils/exceptions';
import { SignInCommandHandler } from '@app/modules/auth/application/command-handlers/sign-in.command-handler';
import type { SignInCommand } from '@app/modules/auth/application/interfaces/commands/sign-in.command';
import { User } from '@app/modules/auth/domain/aggregates/user';
import { SignInType } from '@app/modules/auth/domain/enums/sign-in-type';
import { UserStatus } from '@app/modules/auth/domain/enums/user-status';
import type { UserRepository } from '@app/modules/auth/domain/interfaces/repositories/user.repository';
import type { ExternalAuthenticationService } from '@app/modules/auth/domain/interfaces/services/external-authentication.service';
import { Email } from '@app/modules/auth/domain/value-objects/email';
import { Username } from '@app/modules/auth/domain/value-objects/username';

describe('SignInCommandHandler', () => {
  let handler: SignInCommandHandler;
  let mockUserRepository: UserRepository;
  let mockExternalAuthService: ExternalAuthenticationService;

  const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
  const userEmail = Email.create('test@example.com');
  const username = Username.create('testuser123');
  const externalId = 'firebase-user-123';
  const idToken = 'firebase-id-token';
  const signInToken = 'firebase-sign-in-token';

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserRepository = {
      findByEmail: vi.fn(),
      findByUsername: vi.fn(),
    } as unknown as UserRepository;

    mockExternalAuthService = {
      verifyPassword: vi.fn(),
      createSignInToken: vi.fn(),
    } as unknown as ExternalAuthenticationService;

    handler = new SignInCommandHandler(
      mockUserRepository,
      mockExternalAuthService
    );
  });

  describe('execute - happy path', () => {
    it('should sign in user with email', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);
      vi.mocked(mockExternalAuthService.verifyPassword).mockResolvedValue({
        externalId,
        idToken,
      });
      vi.mocked(mockExternalAuthService.createSignInToken).mockResolvedValue(
        signInToken
      );

      const command: SignInCommand = {
        emailOrUsername: 'test@example.com',
        password: 'ValidPass123!',
      };

      const result = await handler.execute(command);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        expect.any(Email)
      );
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

    it('should sign in user with username', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        username,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(undefined);
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(user);
      vi.mocked(mockExternalAuthService.verifyPassword).mockResolvedValue({
        externalId,
        idToken,
      });
      vi.mocked(mockExternalAuthService.createSignInToken).mockResolvedValue(
        signInToken
      );

      const command: SignInCommand = {
        emailOrUsername: 'testuser123',
        password: 'ValidPass123!',
      };

      const result = await handler.execute(command);

      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
        expect.any(Username)
      );
      expect(result.id).toBe(userId.getValue());
    });
  });

  describe('execute - validation errors', () => {
    it('should throw ValidationException when user is not found', async () => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(undefined);
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(undefined);

      const command: SignInCommand = {
        emailOrUsername: 'test@example.com',
        password: 'ValidPass123!',
      };

      await expect(handler.execute(command)).rejects.toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException when password is invalid', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);
      vi.mocked(mockExternalAuthService.verifyPassword).mockResolvedValue(
        undefined
      );

      const command: SignInCommand = {
        emailOrUsername: 'test@example.com',
        password: 'WrongPass123!',
      };

      await expect(handler.execute(command)).rejects.toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException when user is disabled', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.DISABLED,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);

      const command: SignInCommand = {
        emailOrUsername: 'test@example.com',
        password: 'ValidPass123!',
      };

      await expect(handler.execute(command)).rejects.toThrow();
    });
  });
});
