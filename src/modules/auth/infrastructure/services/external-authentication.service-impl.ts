import admin, { type ServiceAccount } from 'firebase-admin';
import type { UserRecord } from 'firebase-admin/auth';
import { AuthorizationExceptionCode } from '@app/common/enums/authorization-exception-code';
import {
  BusinessException,
  ValidationException,
} from '@app/common/utils/exceptions';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import type { ExternalAuthenticationService } from '@app/modules/auth/domain/interfaces/services/external-authentication.service';

/**
 * Infrastructure implementation of ExternalAuthenticationService
 * Handles authentication with Firebase
 */
export class FirebaseAuthenticationService
  implements ExternalAuthenticationService
{
  initialize(): void {
    const serviceAccountJson = process.env['FIREBASE_SERVICE_ACCOUNT_JSON'];
    if (!serviceAccountJson) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_JSON environment variable is required'
      );
    }

    const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  /**
   * Find an existing Firebase user by email
   * @param email - User email address
   * @returns Firebase user record if found, undefined otherwise
   */
  async findUserByEmail(email: string): Promise<UserRecord | undefined> {
    try {
      const user = await admin.auth().getUserByEmail(email);
      return user;
    } catch (error: unknown) {
      // Firebase throws an error if user is not found
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'auth/user-not-found'
      ) {
        return undefined;
      }
      throw error;
    }
  }

  /**
   * Find an external user by ID
   * @param externalId - External user ID (Firebase UID)
   * @returns External user record if found, undefined otherwise
   */
  async findUserById(externalId: string): Promise<UserRecord | undefined> {
    try {
      const user = await admin.auth().getUser(externalId);
      return user;
    } catch (error: unknown) {
      // Firebase throws an error if user is not found
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'auth/user-not-found'
      ) {
        return undefined;
      }
      throw error;
    }
  }

  /**
   * Create a new external user with email and password
   * @param params - User creation parameters
   * @param params.email - User email address
   * @param params.password - User password (will be sent to external authentication provider only)
   * @returns external user ID
   */
  async createUser(params: {
    email: string;
    password: string;
  }): Promise<string> {
    const user = await admin.auth().createUser({
      email: params.email,
      password: params.password,
      emailVerified: false,
    });
    return user.uid;
  }

  /**
   * Generate a sign-in token for a Firebase user
   * This token can be used by the client to authenticate with Firebase
   * @param uid - Firebase user ID
   * @param additionalClaims - Optional additional claims to include in the token
   * @returns Sign-in authentication token (JWT)
   */
  async createSignInToken(
    uid: string,
    additionalClaims?: Record<string, unknown>
  ): Promise<string> {
    const token = await admin.auth().createCustomToken(uid, additionalClaims);
    return token;
  }

  /**
   * Verify user password using external authentication provider REST API
   * @param email - User email address
   * @param password - User password
   * @returns Object with external user ID and ID token if credentials are valid, undefined otherwise
   * @throws Error if Firebase API key is not configured
   * Read more: https://firebase.google.com/docs/reference/rest/auth
   */
  async verifyPassword(
    email: string,
    password: string
  ): Promise<{ externalId: string; idToken: string } | undefined> {
    const firebaseApiKey = process.env['FIREBASE_API_KEY'];
    if (!firebaseApiKey) {
      throw new Error(
        'FIREBASE_API_KEY environment variable is required for password verification'
      );
    }

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );

    const data = (await response.json()) as {
      localId?: string;
      idToken?: string;
      error?: {
        message: string;
        code: number;
      };
    };

    if (!response.ok || data.error) {
      throw new BusinessException(
        AuthExceptionCode.EXTERNAL_AUTHENTICATION_ERROR,
        undefined,
        'Failed to verify password with Firebase'
      );
    }

    if (!data.localId || !data.idToken) {
      throw new BusinessException(
        AuthExceptionCode.EXTERNAL_AUTHENTICATION_ERROR,
        undefined,
        'Firebase API response missing userId or idToken'
      );
    }

    return {
      externalId: data.localId,
      idToken: data.idToken,
    };
  }

  /**
   * Verify a Firebase ID token
   * @param idToken - The Firebase ID token to verify
   * @returns Decoded token with user information
   * @throws BusinessException with INVALID_TOKEN code if token is invalid, expired, or revoked
   */
  async verifyToken(idToken: string): Promise<{ externalId: string }> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return {
        externalId: decodedToken.uid,
      };
    } catch {
      throw new ValidationException(AuthorizationExceptionCode.INVALID_TOKEN);
    }
  }

  /**
   * Enable a user in Firebase
   * @param externalId - Firebase user ID
   * @throws BusinessException if the user cannot be enabled
   */
  async enableUser(externalId: string): Promise<void> {
    await admin.auth().updateUser(externalId, {
      disabled: false,
    });
  }

  /**
   * Disable a user in Firebase
   * @param externalId - Firebase user ID
   * @throws BusinessException if the user cannot be disabled
   */
  async disableUser(externalId: string): Promise<void> {
    await admin.auth().updateUser(externalId, {
      disabled: true,
    });
  }
}
