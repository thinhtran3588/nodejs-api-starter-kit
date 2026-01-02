import type { Transaction } from 'sequelize';
import type { Repository } from '@app/common/domain/interfaces/repositories/repository';
import type { Uuid } from '@app/common/domain/value-objects/uuid';
import type { User } from '@app/modules/auth/domain/aggregates/user';
import type { Email } from '@app/modules/auth/domain/value-objects/email';
import type { Username } from '@app/modules/auth/domain/value-objects/username';

/**
 * Repository interface for user domain operations
 * Handles persistence and retrieval of user aggregates for write operations
 */
export interface UserRepository extends Repository<User> {
  /**
   * Finds a user aggregate by email
   * Used for authentication and validation in write operations
   * @param email - Email value object (must be validated)
   * @returns User aggregate if found, undefined otherwise
   */
  findByEmail(email: Email): Promise<User | undefined>;

  /**
   * Finds a user aggregate by external ID (Firebase UID)
   * Used for authentication token verification and external system integration
   * @param externalId - External user ID from authentication provider
   * @returns User aggregate if found, undefined otherwise
   */
  findByExternalId(externalId: string): Promise<User | undefined>;

  /**
   * Finds a user aggregate by username
   * Used for authentication and validation in write operations
   * @param username - Username value object (must be validated)
   * @returns User aggregate if found, undefined otherwise
   */
  findByUsername(username: Username): Promise<User | undefined>;

  /**
   * Checks if an email exists (checks both database and Firebase)
   * Business rule: Used to prevent duplicate registrations and ensure email uniqueness
   * @param email - Email value object (must be validated)
   * @returns true if email exists in database or Firebase, false otherwise
   */
  emailExists(email: Email): Promise<boolean>;

  /**
   * Checks if a username exists in the database
   * Business rule: Used to prevent duplicate usernames and ensure username uniqueness
   * @param username - Username value object (must be validated)
   * @param excludeUserId - Optional user ID to exclude from the check (useful during updates to allow keeping the same username)
   * @returns true if username exists (excluding the specified user if provided), false otherwise
   */
  usernameExists(username: Username, excludeUserId?: Uuid): Promise<boolean>;

  /**
   * Adds a user to a user group
   * Business rule: Establishes the many-to-many relationship between users and user groups
   * @param userId - User ID
   * @param userGroupId - User group ID
   * @param transaction - Optional transaction for atomic operations
   */
  addToGroup(
    userId: Uuid,
    userGroupId: Uuid,
    transaction?: Transaction
  ): Promise<void>;

  /**
   * Removes a user from a user group
   * Business rule: Removes the many-to-many relationship between users and user groups
   * @param userId - User ID
   * @param userGroupId - User group ID
   * @param transaction - Optional transaction for atomic operations
   */
  removeFromGroup(
    userId: Uuid,
    userGroupId: Uuid,
    transaction?: Transaction
  ): Promise<void>;
}
