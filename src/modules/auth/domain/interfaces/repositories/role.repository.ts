/**
 * Repository interface for role domain operations
 * Handles validation checks for role existence in write operations
 */
export interface RoleRepository {
  /**
   * Checks if a role exists by ID
   * Business rule: Used for validation before operations that require an existing role (e.g., adding role to user group)
   * @param id - Role ID
   * @returns true if role exists, false otherwise
   */
  roleExists(id: string): Promise<boolean>;
}
