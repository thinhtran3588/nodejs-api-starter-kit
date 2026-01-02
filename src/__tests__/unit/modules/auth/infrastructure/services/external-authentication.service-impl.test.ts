import admin from 'firebase-admin';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthorizationExceptionCode } from '@app/common/enums/authorization-exception-code';
import {
  BusinessException,
  ValidationException,
} from '@app/common/utils/exceptions';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { FirebaseAuthenticationService } from '@app/modules/auth/infrastructure/services/external-authentication.service-impl';

vi.mock('firebase-admin', () => ({
  default: {
    initializeApp: vi.fn(),
    credential: {
      cert: vi.fn(),
    },
    auth: vi.fn(),
  },
}));

global.fetch = vi.fn();

describe('FirebaseAuthenticationService', () => {
  let service: FirebaseAuthenticationService;
  let mockAuth: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuth = {
      getUserByEmail: vi.fn(),
      getUser: vi.fn(),
      createUser: vi.fn(),
      createCustomToken: vi.fn(),
      verifyIdToken: vi.fn(),
      updateUser: vi.fn(),
    };

    vi.mocked(admin.auth).mockReturnValue(mockAuth as any);

    service = new FirebaseAuthenticationService();
  });

  describe('initialize', () => {
    it('should initialize Firebase app with service account', () => {
      const mockServiceAccount = {
        projectId: 'test-project',
        clientEmail: 'test@example.com',
        privateKey: 'test-key',
      };

      process.env['FIREBASE_SERVICE_ACCOUNT_JSON'] =
        JSON.stringify(mockServiceAccount);

      service.initialize();

      expect(admin.initializeApp).toHaveBeenCalled();
      expect(admin.credential.cert).toHaveBeenCalledWith(mockServiceAccount);
    });

    it('should throw error when FIREBASE_SERVICE_ACCOUNT_JSON is missing', () => {
      delete process.env['FIREBASE_SERVICE_ACCOUNT_JSON'];

      expect(() => service.initialize()).toThrow(
        'FIREBASE_SERVICE_ACCOUNT_JSON environment variable is required'
      );
    });
  });

  describe('findUserByEmail', () => {
    it('should return user when found', async () => {
      const mockUser = {
        uid: 'firebase-user-123',
        email: 'test@example.com',
      };

      vi.mocked(mockAuth.getUserByEmail).mockResolvedValue(mockUser);

      const result = await service.findUserByEmail('test@example.com');

      expect(result).toBe(mockUser);
      expect(mockAuth.getUserByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should return undefined when user not found', async () => {
      const error = {
        code: 'auth/user-not-found',
      };

      vi.mocked(mockAuth.getUserByEmail).mockRejectedValue(error);

      const result = await service.findUserByEmail('nonexistent@example.com');

      expect(result).toBeUndefined();
    });

    it('should throw error for other Firebase errors', async () => {
      const error = {
        code: 'auth/other-error',
        message: 'Some other error',
      };

      vi.mocked(mockAuth.getUserByEmail).mockRejectedValue(error);

      await expect(service.findUserByEmail('test@example.com')).rejects.toEqual(
        error
      );
    });
  });

  describe('findUserById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        uid: 'firebase-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      vi.mocked(mockAuth.getUser).mockResolvedValue(mockUser);

      const result = await service.findUserById('firebase-user-123');

      expect(result).toBe(mockUser);
      expect(mockAuth.getUser).toHaveBeenCalledWith('firebase-user-123');
    });

    it('should return undefined when user not found', async () => {
      const error = {
        code: 'auth/user-not-found',
      };

      vi.mocked(mockAuth.getUser).mockRejectedValue(error);

      const result = await service.findUserById('nonexistent-uid');

      expect(result).toBeUndefined();
    });

    it('should throw error for other Firebase errors', async () => {
      const error = {
        code: 'auth/other-error',
        message: 'Some other error',
      };

      vi.mocked(mockAuth.getUser).mockRejectedValue(error);

      await expect(service.findUserById('firebase-user-123')).rejects.toEqual(
        error
      );
    });
  });

  describe('createUser', () => {
    it('should create user and return uid', async () => {
      const mockUser = {
        uid: 'firebase-user-123',
      };

      vi.mocked(mockAuth.createUser).mockResolvedValue(mockUser);

      const result = await service.createUser({
        email: 'test@example.com',
        password: 'ValidPass123!',
      });

      expect(result).toBe('firebase-user-123');
      expect(mockAuth.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'ValidPass123!',
        emailVerified: false,
      });
    });
  });

  describe('createSignInToken', () => {
    it('should create sign-in token', async () => {
      vi.mocked(mockAuth.createCustomToken).mockResolvedValue('custom-token');

      const result = await service.createSignInToken('firebase-user-123');

      expect(result).toBe('custom-token');
      expect(mockAuth.createCustomToken).toHaveBeenCalledWith(
        'firebase-user-123',
        undefined
      );
    });

    it('should create sign-in token with additional claims', async () => {
      vi.mocked(mockAuth.createCustomToken).mockResolvedValue('custom-token');

      const additionalClaims = { role: 'admin' };
      const result = await service.createSignInToken(
        'firebase-user-123',
        additionalClaims
      );

      expect(result).toBe('custom-token');
      expect(mockAuth.createCustomToken).toHaveBeenCalledWith(
        'firebase-user-123',
        additionalClaims
      );
    });
  });

  describe('verifyPassword', () => {
    beforeEach(() => {
      process.env['FIREBASE_API_KEY'] = 'test-api-key';
    });

    it('should return externalId and idToken for valid credentials', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          localId: 'firebase-user-123',
          idToken: 'firebase-id-token',
        }),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      const result = await service.verifyPassword(
        'test@example.com',
        'ValidPass123!'
      );

      expect(result).toEqual({
        externalId: 'firebase-user-123',
        idToken: 'firebase-id-token',
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=test-api-key',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'ValidPass123!',
            returnSecureToken: true,
          }),
        }
      );
    });

    it('should throw BusinessException for invalid credentials', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: {
            message: 'INVALID_LOGIN_CREDENTIALS',
          },
        }),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      try {
        await service.verifyPassword('test@example.com', 'WrongPass123!');
        expect.fail('Should have thrown BusinessException');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        if (error instanceof BusinessException) {
          expect(error.code).toBe(
            AuthExceptionCode.EXTERNAL_AUTHENTICATION_ERROR
          );
        }
      }
    });

    it('should throw BusinessException for EMAIL_NOT_FOUND', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: {
            message: 'EMAIL_NOT_FOUND',
          },
        }),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      try {
        await service.verifyPassword(
          'nonexistent@example.com',
          'ValidPass123!'
        );
        expect.fail('Should have thrown BusinessException');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        if (error instanceof BusinessException) {
          expect(error.code).toBe(
            AuthExceptionCode.EXTERNAL_AUTHENTICATION_ERROR
          );
        }
      }
    });

    it('should throw BusinessException for INVALID_PASSWORD', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: {
            message: 'INVALID_PASSWORD',
          },
        }),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      try {
        await service.verifyPassword('test@example.com', 'WrongPass123!');
        expect.fail('Should have thrown BusinessException');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        if (error instanceof BusinessException) {
          expect(error.code).toBe(
            AuthExceptionCode.EXTERNAL_AUTHENTICATION_ERROR
          );
        }
      }
    });

    it('should throw BusinessException for Firebase errors including disabled users', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: {
            message: 'USER_DISABLED',
          },
        }),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      try {
        await service.verifyPassword('test@example.com', 'ValidPass123!');
        expect.fail('Should have thrown BusinessException');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        if (error instanceof BusinessException) {
          expect(error.code).toBe(
            AuthExceptionCode.EXTERNAL_AUTHENTICATION_ERROR
          );
        }
      }
    });

    it('should throw BusinessException for other Firebase errors', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: {
            message: 'OTHER_ERROR',
          },
        }),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      try {
        await service.verifyPassword('test@example.com', 'ValidPass123!');
        expect.fail('Should have thrown BusinessException');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        if (error instanceof BusinessException) {
          expect(error.code).toBe(
            AuthExceptionCode.EXTERNAL_AUTHENTICATION_ERROR
          );
        }
      }
    });

    it('should throw BusinessException when error object exists', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: {
            message: 'Some error',
            code: 400,
          },
        }),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      try {
        await service.verifyPassword('test@example.com', 'ValidPass123!');
        expect.fail('Should have thrown BusinessException');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        if (error instanceof BusinessException) {
          expect(error.code).toBe(
            AuthExceptionCode.EXTERNAL_AUTHENTICATION_ERROR
          );
        }
      }
    });

    it('should throw BusinessException when response missing localId', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          idToken: 'firebase-id-token',
        }),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      try {
        await service.verifyPassword('test@example.com', 'ValidPass123!');
        expect.fail('Should have thrown BusinessException');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        if (error instanceof BusinessException) {
          expect(error.code).toBe(
            AuthExceptionCode.EXTERNAL_AUTHENTICATION_ERROR
          );
        }
      }
    });

    it('should throw BusinessException when response missing idToken', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          localId: 'firebase-user-123',
        }),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      try {
        await service.verifyPassword('test@example.com', 'ValidPass123!');
        expect.fail('Should have thrown BusinessException');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        if (error instanceof BusinessException) {
          expect(error.code).toBe(
            AuthExceptionCode.EXTERNAL_AUTHENTICATION_ERROR
          );
        }
      }
    });

    it('should throw BusinessException when response missing both localId and idToken', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      try {
        await service.verifyPassword('test@example.com', 'ValidPass123!');
        expect.fail('Should have thrown BusinessException');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        if (error instanceof BusinessException) {
          expect(error.code).toBe(
            AuthExceptionCode.EXTERNAL_AUTHENTICATION_ERROR
          );
        }
      }
    });

    it('should throw error when FIREBASE_API_KEY is missing', async () => {
      delete process.env['FIREBASE_API_KEY'];

      await expect(
        service.verifyPassword('test@example.com', 'ValidPass123!')
      ).rejects.toThrow(
        'FIREBASE_API_KEY environment variable is required for password verification'
      );
    });

    it('should propagate network errors', async () => {
      process.env['FIREBASE_API_KEY'] = 'test-api-key';
      const networkError = new Error('Network error');
      vi.mocked(global.fetch).mockRejectedValue(networkError);

      await expect(
        service.verifyPassword('test@example.com', 'ValidPass123!')
      ).rejects.toThrow(networkError);
    });
  });

  describe('verifyToken', () => {
    it('should return externalId for valid token', async () => {
      const decodedToken = {
        uid: 'firebase-user-123',
      };

      vi.mocked(mockAuth.verifyIdToken).mockResolvedValue(decodedToken);

      const result = await service.verifyToken('valid-id-token');

      expect(result).toEqual({
        externalId: 'firebase-user-123',
      });
      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('valid-id-token');
    });

    it('should throw ValidationException for invalid token', async () => {
      vi.mocked(mockAuth.verifyIdToken).mockRejectedValue(
        new Error('Invalid token')
      );

      await expect(service.verifyToken('invalid-token')).rejects.toThrow(
        ValidationException
      );
      await expect(service.verifyToken('invalid-token')).rejects.toThrow(
        AuthorizationExceptionCode.INVALID_TOKEN
      );
    });
  });

  describe('enableUser', () => {
    it('should enable user in Firebase', async () => {
      const mockUser = {
        uid: 'firebase-user-123',
      };

      vi.mocked(mockAuth.updateUser).mockResolvedValue(mockUser);

      await service.enableUser('firebase-user-123');

      expect(mockAuth.updateUser).toHaveBeenCalledWith('firebase-user-123', {
        disabled: false,
      });
    });

    it('should propagate error when Firebase update fails', async () => {
      const error = new Error('Firebase error');
      vi.mocked(mockAuth.updateUser).mockRejectedValue(error);

      await expect(service.enableUser('firebase-user-123')).rejects.toThrow(
        error
      );
    });
  });

  describe('disableUser', () => {
    it('should disable user in Firebase', async () => {
      const mockUser = {
        uid: 'firebase-user-123',
      };

      vi.mocked(mockAuth.updateUser).mockResolvedValue(mockUser);

      await service.disableUser('firebase-user-123');

      expect(mockAuth.updateUser).toHaveBeenCalledWith('firebase-user-123', {
        disabled: true,
      });
    });

    it('should propagate error when Firebase update fails', async () => {
      const error = new Error('Firebase error');
      vi.mocked(mockAuth.updateUser).mockRejectedValue(error);

      await expect(service.disableUser('firebase-user-123')).rejects.toThrow(
        error
      );
    });
  });
});
