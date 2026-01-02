import type { Transaction } from 'sequelize';
import type { Repository } from '@app/common/domain/interfaces/repositories/repository';
import type { Uuid } from '@app/common/domain/value-objects/uuid';
import type { UserGroup } from '@app/modules/auth/domain/aggregates/user-group';

/**
 * Repository interface for user group domain operations
 * Handles persistence, retrieval, and relationship management of user group aggregates
 */
export interface UserGroupRepository extends Repository<UserGroup> {
  /**
   * Checks if a user group exists by ID
   * Business rule: Used for validation before operations that require an existing user group
   * @param id - User group ID
   * @returns true if user group exists, false otherwise
   */
  userGroupExists(id: Uuid): Promise<boolean>;

  /**
   * Checks if a user group name exists in the database
   * Business rule: Used to prevent duplicate user group names and ensure name uniqueness
   * @param name - User group name (must be validated)
   * @param excludeUserGroupId - Optional user group ID to exclude from the check (useful during updates to allow keeping the same name)
   * @returns true if name exists (excluding the specified user group if provided), false otherwise
   */
  nameExists(name: string, excludeUserGroupId?: Uuid): Promise<boolean>;

  /**
   * Checks if a user is in a user group
   * Business rule: Used for validation to prevent duplicate memberships or verify existing relationships
   * @param userGroupId - User group ID
   * @param userId - User ID
   * @returns true if user is in the group, false otherwise
   */
  userInGroup(userGroupId: Uuid, userId: Uuid): Promise<boolean>;

  /**
   * Adds a role to a user group
   * Business rule: Establishes the many-to-many relationship between roles and user groups
   * @param userGroupId - User group ID
   * @param roleId - Role ID
   * @param transaction - Optional transaction for atomic operations
   */
  addRole(
    userGroupId: Uuid,
    roleId: Uuid,
    transaction?: Transaction
  ): Promise<void>;

  /**
   * Removes a role from a user group
   * Business rule: Removes the many-to-many relationship between roles and user groups
   * @param userGroupId - User group ID
   * @param roleId - Role ID
   * @param transaction - Optional transaction for atomic operations
   */
  removeRole(
    userGroupId: Uuid,
    roleId: Uuid,
    transaction?: Transaction
  ): Promise<void>;

  /**
   * Checks if a role is in a user group
   * Business rule: Used for validation to prevent duplicate role assignments or verify existing relationships
   * @param userGroupId - User group ID
   * @param roleId - Role ID
   * @returns true if role is in the group, false otherwise
   */
  roleInGroup(userGroupId: Uuid, roleId: Uuid): Promise<boolean>;

  /**
   * Gets all role codes for a user through their user groups
   * Business rule: Used for authorization and token generation - aggregates all role codes from all user groups the user belongs to
   * @param userId - User ID
   * @returns Array of unique role codes
   */
  getUserRoleCodes(userId: Uuid): Promise<string[]>;
}
