import type { UserRecord } from 'firebase-admin/auth';

/**
 * Service interface for external authentication operations
 * Handles authentication with external providers (e.g., Firebase)
 */
export interface ExternalAuthenticationService {
  /**
   * Initialize the external authentication service
   * Must be called before using other methods
   */
  initialize(): void;

  /**
   * Find an existing external user by email
   * @param email - User email address
   * @returns External user record if found, undefined otherwise
   */
  findUserByEmail(email: string): Promise<UserRecord | undefined>;

  /**
   * Find an external user by ID
   * @param externalId - External user ID (Firebase UID)
   * @returns External user record if found, undefined otherwise
   */
  findUserById(externalId: string): Promise<UserRecord | undefined>;

  /**
   * Create a new external user with email and password
   * @param params - User creation parameters
   * @param params.email - User email address
   * @param params.password - User password (will be sent to external authentication provider only)
   * @returns External user ID
   */
  createUser(params: { email: string; password: string }): Promise<string>;

  /**
   * Generate a sign-in token for an external user
   * This token can be used by the client to authenticate with the external provider
   * @param externalId - External user ID
   * @param additionalClaims - Optional additional claims to include in the token
   * @returns Sign-in authentication token (JWT)
   */
  createSignInToken(
    externalId: string,
    additionalClaims?: Record<string, unknown>
  ): Promise<string>;

  /**
   * Verify user password using external authentication provider
   * @param email - User email address
   * @param password - User password
   * @returns Object with external user ID and ID token if credentials are valid, undefined otherwise
   * @throws Error if external authentication provider API key is not configured
   */
  verifyPassword(
    email: string,
    password: string
  ): Promise<{ externalId: string; idToken: string } | undefined>;

  /**
   * Verify an external authentication provider ID token
   * @param idToken - The ID token to verify
   * @returns Decoded token with user information
   * @throws ValidationException with INVALID_TOKEN code if token is invalid, expired, or revoked
   */
  verifyToken(idToken: string): Promise<{ externalId: string }>;

  /**
   * Enable a user in the external authentication provider
   * @param externalId - External user ID
   * @throws BusinessException if the user cannot be enabled
   */
  enableUser(externalId: string): Promise<void>;

  /**
   * Disable a user in the external authentication provider
   * @param externalId - External user ID
   * @throws BusinessException if the user cannot be disabled
   */
  disableUser(externalId: string): Promise<void>;
}
