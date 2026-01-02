import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { ValidationException } from '@app/common/utils/exceptions';
import { User } from '@app/modules/auth/domain/aggregates/user';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { SignInType } from '@app/modules/auth/domain/enums/sign-in-type';
import { UserStatus } from '@app/modules/auth/domain/enums/user-status';
import type { UserRepository } from '@app/modules/auth/domain/interfaces/repositories/user.repository';
import { Email } from '@app/modules/auth/domain/value-objects/email';
import { Username } from '@app/modules/auth/domain/value-objects/username';
import { UserValidatorServiceImpl } from '@app/modules/auth/infrastructure/services/user-validator.service-impl';

describe('UserValidatorServiceImpl', () => {
  let service: UserValidatorServiceImpl;
  let mockUserRepository: UserRepository;

  const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
  const userEmail = Email.create('test@example.com');
  const username = Username.create('testuser123');
  const externalId = 'firebase-user-123';

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserRepository = {
      emailExists: vi.fn(),
      usernameExists: vi.fn(),
      findById: vi.fn(),
    } as unknown as UserRepository;

    service = new UserValidatorServiceImpl(mockUserRepository);
  });

  describe('validateEmailUniqueness', () => {
    it('should not throw when email does not exist', async () => {
      vi.mocked(mockUserRepository.emailExists).mockResolvedValue(false);

      await expect(
        service.validateEmailUniqueness(userEmail)
      ).resolves.not.toThrow();

      expect(mockUserRepository.emailExists).toHaveBeenCalledWith(userEmail);
    });

    it('should throw ValidationException when email already exists', async () => {
      vi.mocked(mockUserRepository.emailExists).mockResolvedValue(true);

      await expect(service.validateEmailUniqueness(userEmail)).rejects.toThrow(
        ValidationException
      );
      await expect(service.validateEmailUniqueness(userEmail)).rejects.toThrow(
        AuthExceptionCode.EMAIL_ALREADY_TAKEN
      );

      expect(mockUserRepository.emailExists).toHaveBeenCalledWith(userEmail);
    });
  });

  describe('validateUsernameUniqueness', () => {
    it('should not throw when username does not exist', async () => {
      vi.mocked(mockUserRepository.usernameExists).mockResolvedValue(false);

      await expect(
        service.validateUsernameUniqueness(username)
      ).resolves.not.toThrow();

      expect(mockUserRepository.usernameExists).toHaveBeenCalledWith(
        username,
        undefined
      );
    });

    it('should throw ValidationException when username already exists', async () => {
      vi.mocked(mockUserRepository.usernameExists).mockResolvedValue(true);

      await expect(
        service.validateUsernameUniqueness(username)
      ).rejects.toThrow(ValidationException);
      await expect(
        service.validateUsernameUniqueness(username)
      ).rejects.toThrow(AuthExceptionCode.USERNAME_ALREADY_TAKEN);

      expect(mockUserRepository.usernameExists).toHaveBeenCalledWith(
        username,
        undefined
      );
    });

    it('should exclude user ID when excludeUserId is provided', async () => {
      const excludeUserId = Uuid.create('550e8400-e29b-41d4-a716-446655440001');
      vi.mocked(mockUserRepository.usernameExists).mockResolvedValue(false);

      await expect(
        service.validateUsernameUniqueness(username, excludeUserId)
      ).resolves.not.toThrow();

      expect(mockUserRepository.usernameExists).toHaveBeenCalledWith(
        username,
        excludeUserId
      );
    });
  });

  describe('validateUserExistsById', () => {
    it('should return user when user exists', async () => {
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

      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      const result = await service.validateUserExistsById(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(result).toBe(user);
    });

    it('should throw ValidationException when user does not exist', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(undefined);

      await expect(service.validateUserExistsById(userId)).rejects.toThrow(
        ValidationException
      );
      await expect(service.validateUserExistsById(userId)).rejects.toThrow(
        AuthExceptionCode.USER_NOT_FOUND
      );

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('validateUserActiveById', () => {
    it('should return user when user is active', async () => {
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

      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      const result = await service.validateUserActiveById(userId);

      expect(result).toBe(user);
    });

    it('should throw ValidationException when user is disabled', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        username,
        status: UserStatus.DISABLED,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      await expect(service.validateUserActiveById(userId)).rejects.toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException when user is deleted', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        username,
        status: UserStatus.DELETED,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      await expect(service.validateUserActiveById(userId)).rejects.toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException when user does not exist', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(undefined);

      await expect(service.validateUserActiveById(userId)).rejects.toThrow(
        ValidationException
      );
      await expect(service.validateUserActiveById(userId)).rejects.toThrow(
        AuthExceptionCode.USER_NOT_FOUND
      );
    });
  });

  describe('validateUserNotDeletedById', () => {
    it('should return user when user is active', async () => {
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

      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      const result = await service.validateUserNotDeletedById(userId);

      expect(result).toBe(user);
    });

    it('should return user when user is disabled', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        username,
        status: UserStatus.DISABLED,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      const result = await service.validateUserNotDeletedById(userId);

      expect(result).toBe(user);
    });

    it('should throw ValidationException when user is deleted', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        username,
        status: UserStatus.DELETED,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      await expect(service.validateUserNotDeletedById(userId)).rejects.toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException when user does not exist', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(undefined);

      await expect(service.validateUserNotDeletedById(userId)).rejects.toThrow(
        ValidationException
      );
      await expect(service.validateUserNotDeletedById(userId)).rejects.toThrow(
        AuthExceptionCode.USER_NOT_FOUND
      );
    });
  });
});
