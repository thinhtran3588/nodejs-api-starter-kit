import type { Uuid } from '@app/common/domain/value-objects/uuid';
import type { User } from '@app/modules/auth/domain/aggregates/user';
import type { Email } from '@app/modules/auth/domain/value-objects/email';
import type { Username } from '@app/modules/auth/domain/value-objects/username';

/**
 * Service interface for user validation operations
 * Handles business rules and validation logic for user data that requires repository access
 */
export interface UserValidatorService {
  /**
   * Validates that an email is unique (not already taken)
   * Business rule: Email must be unique across all users
   * @param email - Email to validate
   * @throws ValidationException if email already exists
   */
  validateEmailUniqueness(email: Email): Promise<void>;

  /**
   * Validates that a username is unique (not already taken)
   * Business rule: Username must be unique across all users
   * @param username - Username to validate
   * @param userId - Optional user ID to exclude from check (for updates)
   * @throws ValidationException if username already exists
   */
  validateUsernameUniqueness(username: Username, userId?: Uuid): Promise<void>;

  /**
   * Validates that a user exists by ID
   * Business rule: User must exist in the system
   * @param userId - User ID to validate
   * @throws ValidationException if user does not exist
   */
  validateUserExistsById(userId: Uuid): Promise<User>;

  /**
   * Validates that a user exists and is active
   * Business rule: User must exist and be in active status
   * @param userId - User ID to validate
   * @returns User aggregate if valid
   * @throws ValidationException if user does not exist or is not active
   */
  validateUserActiveById(userId: Uuid): Promise<User>;

  /**
   * Validates that a user exists and is not deleted
   * Business rule: User must exist and not be deleted
   * @param userId - User ID to validate
   * @returns User aggregate if valid
   * @throws ValidationException if user does not exist or is deleted
   */
  validateUserNotDeletedById(userId: Uuid): Promise<User>;
}
