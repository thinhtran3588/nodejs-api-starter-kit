import { createPublicKey } from 'crypto';
import jwt from 'jsonwebtoken';

export interface AccessTokenPayload {
  userId: string;
  roles: string[];
}

/**
 * JWT service for creating and verifying access tokens
 */
export class JwtService {
  private privateKey: string | undefined;
  private publicKey: string | undefined;
  private issuer: string | undefined;
  private expiresIn: string | undefined;

  /**
   * Initialize private key from environment variables
   * Checks JWT_PRIVATE_KEY first, then falls back to FIREBASE_SERVICE_ACCOUNT_JSON
   * Should be called during application startup
   * @throws Error if neither environment variable is set or private key is invalid
   */
  initialize(): void {
    if (this.privateKey) {
      return;
    }
    this.expiresIn =
      process.env['JWT_ACCESS_TOKEN_EXPIRES_IN'] &&
      process.env['JWT_ACCESS_TOKEN_EXPIRES_IN'] !== ''
        ? process.env['JWT_ACCESS_TOKEN_EXPIRES_IN']
        : '15m';
    this.issuer =
      process.env['JWT_ISSUER'] && process.env['JWT_ISSUER'] !== ''
        ? process.env['JWT_ISSUER']
        : 'issuer';

    const jwtPublicKey = process.env['JWT_PUBLIC_KEY'];
    this.publicKey ??= jwtPublicKey;

    const jwtPrivateKey = process.env['JWT_PRIVATE_KEY'];
    if (jwtPrivateKey) {
      this.privateKey = jwtPrivateKey;
      this.publicKey ??= this.derivePublicKey(jwtPrivateKey);
      return;
    }

    const serviceAccountJson = process.env['FIREBASE_SERVICE_ACCOUNT_JSON'];
    if (!serviceAccountJson) {
      throw new Error(
        'Either JWT_PRIVATE_KEY or FIREBASE_SERVICE_ACCOUNT_JSON environment variable is required'
      );
    }

    const serviceAccount = JSON.parse(serviceAccountJson) as {
      private_key: string;
    };
    if (!serviceAccount['private_key']) {
      throw new Error('Private key not found in service account');
    }

    this.privateKey = serviceAccount['private_key'];
    this.publicKey ??= this.derivePublicKey(this.privateKey);
  }

  /**
   * Derives the public key from a private key
   * @param privateKey - The private key in PEM format
   * @returns The public key in PEM format
   * @throws Error if the private key is invalid
   */
  private derivePublicKey(privateKey: string): string {
    try {
      const keyObject = createPublicKey({
        key: privateKey,
        format: 'pem',
      });
      return keyObject.export({
        type: 'spki',
        format: 'pem',
      }) as string;
    } catch (error) {
      throw new Error(
        `Failed to derive public key from private key: ${(error as Error).message}`
      );
    }
  }

  /**
   * Create a JWT access token
   * @param payload - Token payload containing userId and roles
   * @param expiresIn - Token expiration time (defaults to JWT_ACCESS_TOKEN_EXPIRES_IN env var or 1h)
   * @returns Signed JWT token
   * @throws Error if service has not been initialized
   */
  signToken(
    payload: AccessTokenPayload,
    expiresIn: string | undefined = undefined
  ): string {
    if (!this.privateKey || !this.issuer) {
      throw new Error(
        'JWT service not initialized. Call initialize() during application startup.'
      );
    }

    return jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
      issuer: this.issuer,
      expiresIn: expiresIn ?? this.expiresIn,
    } as jwt.SignOptions);
  }

  /**
   * Verify a JWT access token
   * @param token - The JWT token to verify
   * @returns Decoded token payload if valid
   * @throws Error if service has not been initialized or token is invalid
   */
  verifyToken(token: string): AccessTokenPayload {
    if (!this.publicKey || !this.issuer) {
      throw new Error(
        'JWT service not initialized. Call initialize() during application startup.'
      );
    }

    try {
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: this.issuer,
      }) as jwt.JwtPayload & AccessTokenPayload;

      if (!decoded.userId) {
        throw new Error('Token payload missing userId');
      }

      return {
        userId: decoded.userId,
        roles: decoded.roles ?? [],
      };
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        error.name === 'JsonWebTokenError'
      ) {
        throw new Error(
          `Invalid token: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        error.name === 'TokenExpiredError'
      ) {
        throw new Error(
          `Token expired: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        error.name === 'NotBeforeError'
      ) {
        throw new Error(
          `Token not active: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
      throw error;
    }
  }
}
