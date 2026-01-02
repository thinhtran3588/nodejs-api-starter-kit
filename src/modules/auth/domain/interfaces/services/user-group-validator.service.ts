import type { Uuid } from '@app/common/domain/value-objects/uuid';
import type { UserGroup } from '@app/modules/auth/domain/aggregates/user-group';

/**
 * Service interface for user group validation operations
 * Handles business rules and validation logic for user group data that requires repository access
 */
export interface UserGroupValidatorService {
  /**
   * Validates that a user group exists by ID
   * Business rule: User group must exist in the system
   * @param userGroupId - User group ID to validate
   * @returns User group aggregate if valid
   * @throws ValidationException if user group does not exist
   */
  validateUserGroupExistsById(userGroupId: Uuid): Promise<UserGroup>;
}
