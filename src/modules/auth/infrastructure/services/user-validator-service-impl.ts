import { validate, ValidationException, type Uuid } from '@app/common';
import {
  AuthExceptionCode,
  type Email,
  type User,
  type Username,
  type UserRepository,
  type UserValidatorService,
} from '@app/modules/auth/domain';

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
