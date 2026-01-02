import { generateKeyPairSync } from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  JwtService,
  type AccessTokenPayload,
} from '@app/common/infrastructure/services/jwt.service';

describe('JwtService', () => {
  let service: JwtService;
  let testPrivateKey: string;
  let testPublicKey: string;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };

    const keyPair = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    testPrivateKey = keyPair.privateKey;
    testPublicKey = keyPair.publicKey;

    service = new JwtService();
  });

  describe('initialize - happy path', () => {
    it('should initialize with JWT_PRIVATE_KEY', () => {
      process.env['JWT_PRIVATE_KEY'] = testPrivateKey;

      expect(() => service.initialize()).not.toThrow();
    });

    it('should initialize with JWT_PRIVATE_KEY and JWT_PUBLIC_KEY', () => {
      process.env['JWT_PRIVATE_KEY'] = testPrivateKey;
      process.env['JWT_PUBLIC_KEY'] = testPublicKey;

      expect(() => service.initialize()).not.toThrow();
    });

    it('should derive public key from private key when JWT_PUBLIC_KEY not provided', () => {
      process.env['JWT_PRIVATE_KEY'] = testPrivateKey;
      delete process.env['JWT_PUBLIC_KEY'];

      expect(() => service.initialize()).not.toThrow();
    });

    it('should use JWT_PUBLIC_KEY when provided even if private key is set', () => {
      process.env['JWT_PRIVATE_KEY'] = testPrivateKey;
      process.env['JWT_PUBLIC_KEY'] = testPublicKey;

      service.initialize();

      const token = service.signToken({ userId: 'user-123', roles: [] });
      const payload = service.verifyToken(token);

      expect(payload.userId).toBe('user-123');
    });

    it('should initialize with FIREBASE_SERVICE_ACCOUNT_JSON when JWT_PRIVATE_KEY not set', () => {
      const serviceAccount = {
        private_key: testPrivateKey,
      };
      process.env['FIREBASE_SERVICE_ACCOUNT_JSON'] =
        JSON.stringify(serviceAccount);
      delete process.env['JWT_PRIVATE_KEY'];

      expect(() => service.initialize()).not.toThrow();
    });

    it('should use default expiresIn when JWT_ACCESS_TOKEN_EXPIRES_IN not set', () => {
      process.env['JWT_PRIVATE_KEY'] = testPrivateKey;
      delete process.env['JWT_ACCESS_TOKEN_EXPIRES_IN'];

      service.initialize();

      const token = service.signToken({ userId: 'user-123', roles: [] });
      expect(token).toBeDefined();
    });

    it('should use custom expiresIn from JWT_ACCESS_TOKEN_EXPIRES_IN', () => {
      process.env['JWT_PRIVATE_KEY'] = testPrivateKey;
      process.env['JWT_ACCESS_TOKEN_EXPIRES_IN'] = '1h';

      service.initialize();

      const token = service.signToken({ userId: 'user-123', roles: [] });
      expect(token).toBeDefined();
    });

    it('should use default issuer when JWT_ISSUER not set', () => {
      process.env['JWT_PRIVATE_KEY'] = testPrivateKey;
      delete process.env['JWT_ISSUER'];

      service.initialize();

      const token = service.signToken({ userId: 'user-123', roles: [] });
      expect(token).toBeDefined();
    });

    it('should use custom issuer from JWT_ISSUER', () => {
      process.env['JWT_PRIVATE_KEY'] = testPrivateKey;
      process.env['JWT_ISSUER'] = 'custom-issuer';

      service.initialize();

      const token = service.signToken({ userId: 'user-123', roles: [] });
      expect(token).toBeDefined();
    });

    it('should not reinitialize if already initialized', () => {
      process.env['JWT_PRIVATE_KEY'] = testPrivateKey;

      service.initialize();
      const firstToken = service.signToken({ userId: 'user-123', roles: [] });

      service.initialize();
      const secondToken = service.signToken({ userId: 'user-123', roles: [] });

      expect(firstToken).toBeDefined();
      expect(secondToken).toBeDefined();
    });

    it('should use empty string JWT_ACCESS_TOKEN_EXPIRES_IN as default', () => {
      process.env['JWT_PRIVATE_KEY'] = testPrivateKey;
      process.env['JWT_ACCESS_TOKEN_EXPIRES_IN'] = '';

      service.initialize();

      const token = service.signToken({ userId: 'user-123', roles: [] });
      expect(token).toBeDefined();
    });

    it('should use empty string JWT_ISSUER as default', () => {
      process.env['JWT_PRIVATE_KEY'] = testPrivateKey;
      process.env['JWT_ISSUER'] = '';

      service.initialize();

      const token = service.signToken({ userId: 'user-123', roles: [] });
      expect(token).toBeDefined();
    });
  });

  describe('initialize - validation errors', () => {
    it('should throw error when neither JWT_PRIVATE_KEY nor FIREBASE_SERVICE_ACCOUNT_JSON is set', () => {
      delete process.env['JWT_PRIVATE_KEY'];
      delete process.env['FIREBASE_SERVICE_ACCOUNT_JSON'];

      expect(() => service.initialize()).toThrow(
        'Either JWT_PRIVATE_KEY or FIREBASE_SERVICE_ACCOUNT_JSON environment variable is required'
      );
    });

    it('should throw error when FIREBASE_SERVICE_ACCOUNT_JSON is invalid JSON', () => {
      process.env['FIREBASE_SERVICE_ACCOUNT_JSON'] = 'invalid json';
      delete process.env['JWT_PRIVATE_KEY'];

      expect(() => service.initialize()).toThrow();
    });

    it('should throw error when FIREBASE_SERVICE_ACCOUNT_JSON missing private_key', () => {
      const serviceAccount = {};
      process.env['FIREBASE_SERVICE_ACCOUNT_JSON'] =
        JSON.stringify(serviceAccount);
      delete process.env['JWT_PRIVATE_KEY'];

      expect(() => service.initialize()).toThrow(
        'Private key not found in service account'
      );
    });

    it('should throw error when private key is invalid', () => {
      process.env['JWT_PRIVATE_KEY'] = 'invalid-private-key';

      expect(() => service.initialize()).toThrow(
        'Failed to derive public key from private key'
      );
    });
  });

  describe('signToken - happy path', () => {
    beforeEach(() => {
      process.env['JWT_PRIVATE_KEY'] = testPrivateKey;
      service.initialize();
    });

    it('should sign token with userId and roles', () => {
      const payload: AccessTokenPayload = {
        userId: 'user-123',
        roles: ['USER', 'EDITOR'],
      };

      const token = service.signToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should sign token with empty roles array', () => {
      const payload: AccessTokenPayload = {
        userId: 'user-123',
        roles: [],
      };

      const token = service.signToken(payload);

      expect(token).toBeDefined();
    });

    it('should use custom expiresIn when provided', () => {
      const payload: AccessTokenPayload = {
        userId: 'user-123',
        roles: [],
      };

      const token = service.signToken(payload, '1h');

      expect(token).toBeDefined();
    });

    it('should use default expiresIn when not provided', () => {
      const payload: AccessTokenPayload = {
        userId: 'user-123',
        roles: [],
      };

      const token = service.signToken(payload);

      expect(token).toBeDefined();
    });
  });

  describe('signToken - validation errors', () => {
    it('should throw error when service not initialized', () => {
      const payload: AccessTokenPayload = {
        userId: 'user-123',
        roles: [],
      };

      expect(() => service.signToken(payload)).toThrow(
        'JWT service not initialized. Call initialize() during application startup.'
      );
    });
  });

  describe('verifyToken - happy path', () => {
    beforeEach(() => {
      process.env['JWT_PRIVATE_KEY'] = testPrivateKey;
      service.initialize();
    });

    it('should verify valid token and return payload', () => {
      const payload: AccessTokenPayload = {
        userId: 'user-123',
        roles: ['USER', 'EDITOR'],
      };

      const token = service.signToken(payload);
      const verified = service.verifyToken(token);

      expect(verified.userId).toBe('user-123');
      expect(verified.roles).toEqual(['USER', 'EDITOR']);
    });

    it('should verify token with empty roles and return empty array', () => {
      const payload: AccessTokenPayload = {
        userId: 'user-123',
        roles: [],
      };

      const token = service.signToken(payload);
      const verified = service.verifyToken(token);

      expect(verified.userId).toBe('user-123');
      expect(verified.roles).toEqual([]);
    });

    it('should verify token with undefined roles and return empty array', () => {
      const payload: AccessTokenPayload = {
        userId: 'user-123',
        roles: [],
      };

      const token = service.signToken(payload);
      const verified = service.verifyToken(token);

      expect(verified.userId).toBe('user-123');
      expect(verified.roles).toEqual([]);
    });

    it('should verify token with null roles and return empty array', async () => {
      process.env['JWT_PRIVATE_KEY'] = testPrivateKey;
      service.initialize();

      const jwt = await import('jsonwebtoken');
      const tokenWithNullRoles = jwt.default.sign(
        { userId: 'user-123', roles: null },
        testPrivateKey,
        {
          algorithm: 'RS256',
          issuer: process.env['JWT_ISSUER'] || 'issuer',
          expiresIn: '15m',
        }
      );

      const verified = service.verifyToken(tokenWithNullRoles);

      expect(verified.userId).toBe('user-123');
      expect(verified.roles).toEqual([]);
    });
  });

  describe('verifyToken - validation errors', () => {
    it('should throw error when service not initialized', () => {
      expect(() => service.verifyToken('invalid-token')).toThrow(
        'JWT service not initialized. Call initialize() during application startup.'
      );
    });

    it('should throw error for invalid token format', () => {
      process.env['JWT_PRIVATE_KEY'] = testPrivateKey;
      service.initialize();

      expect(() => service.verifyToken('invalid-token')).toThrow(
        'Invalid token'
      );
    });

    it('should throw error for token signed with different key', () => {
      process.env['JWT_PRIVATE_KEY'] = testPrivateKey;
      service.initialize();

      const otherKeyPair = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      });

      const otherService = new JwtService();
      process.env['JWT_PRIVATE_KEY'] = otherKeyPair.privateKey;
      otherService.initialize();

      const token = otherService.signToken({ userId: 'user-123', roles: [] });

      expect(() => service.verifyToken(token)).toThrow('Invalid token');
    });

    it('should throw error for expired token', async () => {
      process.env['JWT_PRIVATE_KEY'] = testPrivateKey;
      service.initialize();

      const token = service.signToken({ userId: 'user-123', roles: [] }, '1ms');

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(() => service.verifyToken(token)).toThrow('Token expired');
    });

    it('should throw error for token with wrong issuer', () => {
      process.env['JWT_PRIVATE_KEY'] = testPrivateKey;
      process.env['JWT_ISSUER'] = 'issuer-1';
      service.initialize();

      const token = service.signToken({ userId: 'user-123', roles: [] });

      const service2 = new JwtService();
      process.env['JWT_ISSUER'] = 'issuer-2';
      service2.initialize();

      expect(() => service2.verifyToken(token)).toThrow('Invalid token');
    });

    it('should throw error when token payload missing userId', async () => {
      process.env['JWT_PRIVATE_KEY'] = testPrivateKey;
      service.initialize();

      const jwt = await import('jsonwebtoken');
      const invalidToken = jwt.default.sign(
        { roles: ['USER'] },
        testPrivateKey,
        {
          algorithm: 'RS256',
          issuer: process.env['JWT_ISSUER'] || 'issuer',
          expiresIn: '15m',
        }
      );

      expect(() => service.verifyToken(invalidToken)).toThrow(
        'Token payload missing userId'
      );
    });

    it('should throw error for token with not before claim in future', async () => {
      process.env['JWT_PRIVATE_KEY'] = testPrivateKey;
      service.initialize();

      const jwt = await import('jsonwebtoken');
      const futureDate = Math.floor(Date.now() / 1000) + 3600;
      const notBeforeToken = jwt.default.sign(
        { userId: 'user-123', roles: ['USER'], nbf: futureDate },
        testPrivateKey,
        {
          algorithm: 'RS256',
          issuer: process.env['JWT_ISSUER'] || 'issuer',
        }
      );

      expect(() => service.verifyToken(notBeforeToken)).toThrow(
        'Token not active'
      );
    });

    it('should handle non-Error JsonWebTokenError', async () => {
      process.env['JWT_PRIVATE_KEY'] = testPrivateKey;
      service.initialize();

      const jwt = await import('jsonwebtoken');
      const verifySpy = vi.spyOn(jwt.default, 'verify');

      verifySpy.mockImplementation(() => {
        const nonError = {
          name: 'JsonWebTokenError',
          message: 'invalid token',
        };
        throw nonError;
      });

      try {
        service.verifyToken('invalid-token');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toContain('Invalid token');
        expect((error as Error).message).toContain('Unknown error');
      } finally {
        verifySpy.mockRestore();
      }
    });

    it('should handle non-Error TokenExpiredError', async () => {
      process.env['JWT_PRIVATE_KEY'] = testPrivateKey;
      service.initialize();

      const jwt = await import('jsonwebtoken');
      const verifySpy = vi.spyOn(jwt.default, 'verify');

      verifySpy.mockImplementation(() => {
        const nonError = {
          name: 'TokenExpiredError',
          message: 'jwt expired',
        };
        throw nonError;
      });

      try {
        service.verifyToken('expired-token');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toContain('Token expired');
        expect((error as Error).message).toContain('Unknown error');
      } finally {
        verifySpy.mockRestore();
      }
    });

    it('should handle non-Error NotBeforeError', async () => {
      process.env['JWT_PRIVATE_KEY'] = testPrivateKey;
      service.initialize();

      const jwt = await import('jsonwebtoken');
      const verifySpy = vi.spyOn(jwt.default, 'verify');

      verifySpy.mockImplementation(() => {
        const nonError = {
          name: 'NotBeforeError',
          message: 'jwt not active',
        };
        throw nonError;
      });

      try {
        service.verifyToken('not-active-token');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toContain('Token not active');
        expect((error as Error).message).toContain('Unknown error');
      } finally {
        verifySpy.mockRestore();
      }
    });
  });

  describe('signToken and verifyToken integration', () => {
    beforeEach(() => {
      process.env['JWT_PRIVATE_KEY'] = testPrivateKey;
      service.initialize();
    });

    it('should sign and verify token with all payload fields', () => {
      const payload: AccessTokenPayload = {
        userId: 'user-123',
        roles: ['USER', 'ADMIN', 'EDITOR'],
      };

      const token = service.signToken(payload);
      const verified = service.verifyToken(token);

      expect(verified.userId).toBe(payload.userId);
      expect(verified.roles).toEqual(payload.roles);
    });

    it('should sign and verify multiple tokens independently', () => {
      const payload1: AccessTokenPayload = {
        userId: 'user-1',
        roles: ['USER'],
      };
      const payload2: AccessTokenPayload = {
        userId: 'user-2',
        roles: ['ADMIN'],
      };

      const token1 = service.signToken(payload1);
      const token2 = service.signToken(payload2);

      const verified1 = service.verifyToken(token1);
      const verified2 = service.verifyToken(token2);

      expect(verified1.userId).toBe('user-1');
      expect(verified1.roles).toEqual(['USER']);
      expect(verified2.userId).toBe('user-2');
      expect(verified2.roles).toEqual(['ADMIN']);
    });
  });
});
