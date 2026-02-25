import { validate, ValidationException, type Uuid } from '@app/common';
import { type User } from '@app/modules/auth/domain/aggregates/user';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import type { UserRepository } from '@app/modules/auth/domain/interfaces/repositories/user-repository';
import type { UserValidatorService } from '@app/modules/auth/domain/interfaces/services/user-validator-service';
import type { Email } from '@app/modules/auth/domain/value-objects/email';
import type { Username } from '@app/modules/auth/domain/value-objects/username';

/**
 * Infrastructure implementation of UserValidatorService
 * Handles validation logic that requires repository access
 */
export class UserValidatorServiceImpl implements UserValidatorService {
  private readonly userRepository: UserRepository;

  constructor({ userRepository }: { userRepository: UserRepository }) {
    this.userRepository = userRepository;
  }

  async validateEmailUniqueness(email: Email): Promise<void> {
    const emailExists = await this.userRepository.emailExists(email);
    validate(!emailExists, AuthExceptionCode.EMAIL_ALREADY_TAKEN);
  }

  async validateUsernameUniqueness(
    username: Username,
    excludeUserId?: Uuid
  ): Promise<void> {
    const usernameExists = await this.userRepository.usernameExists(
      username,
      excludeUserId
    );
    validate(!usernameExists, AuthExceptionCode.USERNAME_ALREADY_TAKEN);
  }

  async validateUserExistsById(userId: Uuid): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new ValidationException(AuthExceptionCode.USER_NOT_FOUND);
    }
    return user;
  }

  async validateUserActiveById(userId: Uuid): Promise<User> {
    const user = await this.validateUserExistsById(userId);
    user.ensureActive();
    return user;
  }

  async validateUserNotDeletedById(userId: Uuid): Promise<User> {
    const user = await this.validateUserExistsById(userId);
    user.ensureNotDeleted();
    return user;
  }
}
