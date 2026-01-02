import type { UserRecord } from 'firebase-admin/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventDispatcher } from '@app/common/domain/interfaces/event-dispatcher';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import { JwtService } from '@app/common/infrastructure/services/jwt.service';
import { ValidationException } from '@app/common/utils/exceptions';
import { RequestAccessTokenCommandHandler } from '@app/modules/auth/application/command-handlers/request-access-token.command-handler';
import type { RequestAccessTokenCommand } from '@app/modules/auth/application/interfaces/commands/request-access-token.command';
import { User } from '@app/modules/auth/domain/aggregates/user';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { SignInType } from '@app/modules/auth/domain/enums/sign-in-type';
import { UserStatus } from '@app/modules/auth/domain/enums/user-status';
import type { UserGroupRepository } from '@app/modules/auth/domain/interfaces/repositories/user-group.repository';
import type { UserRepository } from '@app/modules/auth/domain/interfaces/repositories/user.repository';
import type { ExternalAuthenticationService } from '@app/modules/auth/domain/interfaces/services/external-authentication.service';
import type { UserIdGeneratorService } from '@app/modules/auth/domain/interfaces/services/user-id-generator.service';
import type { UserValidatorService } from '@app/modules/auth/domain/interfaces/services/user-validator.service';
import { Email } from '@app/modules/auth/domain/value-objects/email';

describe('RequestAccessTokenCommandHandler', () => {
  let handler: RequestAccessTokenCommandHandler;
  let mockUserGroupRepository: UserGroupRepository;
  let mockJwtService: JwtService;
  let mockExternalAuthService: ExternalAuthenticationService;
  let mockUserRepository: UserRepository;
  let mockUserIdGeneratorService: UserIdGeneratorService;
  let mockUserValidatorService: UserValidatorService;
  let mockEventDispatcher: EventDispatcher;

  const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
  const userEmail = Email.create('test@example.com');
  const externalId = 'firebase-user-123';
  const idToken = 'firebase-id-token';
  const accessToken = 'jwt-access-token';

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserGroupRepository = {
      getUserRoleCodes: vi.fn(),
    } as unknown as UserGroupRepository;

    mockJwtService = {
      signToken: vi.fn(),
    } as unknown as JwtService;

    mockExternalAuthService = {
      verifyToken: vi.fn(),
      findUserById: vi.fn(),
    } as unknown as ExternalAuthenticationService;

    mockUserRepository = {
      findByExternalId: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
    } as unknown as UserRepository;

    mockUserIdGeneratorService = {
      generateUserId: vi.fn(),
    } as unknown as UserIdGeneratorService;

    mockUserValidatorService = {
      validateEmailUniqueness: vi.fn(),
    } as unknown as UserValidatorService;

    mockEventDispatcher = {
      dispatch: vi.fn().mockResolvedValue(undefined),
      registerHandler: vi.fn(),
    } as unknown as EventDispatcher;

    handler = new RequestAccessTokenCommandHandler(
      mockUserGroupRepository,
      mockJwtService,
      mockExternalAuthService,
      mockUserRepository,
      mockUserIdGeneratorService,
      mockUserValidatorService,
      mockEventDispatcher
    );
  });

  describe('execute - happy path', () => {
    it('should return access token', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const roles = ['AUTH_MANAGER'];

      const command: RequestAccessTokenCommand = {
        idToken,
      };

      vi.mocked(mockExternalAuthService.verifyToken).mockResolvedValue({
        externalId,
      });
      vi.mocked(mockUserRepository.findByExternalId).mockResolvedValue(user);
      vi.mocked(mockUserGroupRepository.getUserRoleCodes).mockResolvedValue(
        roles
      );
      vi.mocked(mockJwtService.signToken).mockReturnValue(accessToken);

      const result = await handler.execute(command);

      expect(mockExternalAuthService.verifyToken).toHaveBeenCalledWith(idToken);
      expect(mockUserRepository.findByExternalId).toHaveBeenCalledWith(
        externalId
      );
      expect(mockUserGroupRepository.getUserRoleCodes).toHaveBeenCalledWith(
        userId
      );
      expect(mockJwtService.signToken).toHaveBeenCalledWith({
        userId: userId.getValue(),
        roles,
      });
      expect(result.token).toBe(accessToken);
    });
  });

  describe('execute - auto-create user from Firebase', () => {
    it('should create user from Firebase and return access token', async () => {
      const firebaseUser: UserRecord = {
        uid: externalId,
        email: 'test@example.com',
        displayName: 'Test User',
        providerData: [
          {
            providerId: 'password',
            uid: externalId,
            email: 'test@example.com',
            displayName: 'Test User',
            photoURL: undefined,
            phoneNumber: undefined,
          },
        ],
      } as unknown as UserRecord;

      const newUserId = Uuid.create('660e8400-e29b-41d4-a716-446655440000');
      const roles = ['AUTH_VIEWER'];

      const command: RequestAccessTokenCommand = {
        idToken,
      };

      vi.mocked(mockExternalAuthService.verifyToken).mockResolvedValue({
        externalId,
      });
      vi.mocked(mockUserRepository.findByExternalId).mockResolvedValue(
        undefined
      );
      vi.mocked(mockExternalAuthService.findUserById).mockResolvedValue(
        firebaseUser
      );
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(undefined);
      vi.mocked(
        mockUserValidatorService.validateEmailUniqueness
      ).mockResolvedValue();
      vi.mocked(mockUserIdGeneratorService.generateUserId).mockReturnValue(
        newUserId
      );
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined);
      vi.mocked(mockUserGroupRepository.getUserRoleCodes).mockResolvedValue(
        roles
      );
      vi.mocked(mockJwtService.signToken).mockReturnValue(accessToken);

      const result = await handler.execute(command);

      expect(mockExternalAuthService.findUserById).toHaveBeenCalledWith(
        externalId
      );
      expect(mockUserRepository.findByEmail).toHaveBeenCalled();
      expect(
        mockUserValidatorService.validateEmailUniqueness
      ).toHaveBeenCalled();
      expect(mockUserIdGeneratorService.generateUserId).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result.token).toBe(accessToken);
    });

    it('should throw USER_NOT_FOUND when Firebase user does not exist', async () => {
      const command: RequestAccessTokenCommand = {
        idToken,
      };

      vi.mocked(mockExternalAuthService.verifyToken).mockResolvedValue({
        externalId,
      });
      vi.mocked(mockUserRepository.findByExternalId).mockResolvedValue(
        undefined
      );
      vi.mocked(mockExternalAuthService.findUserById).mockResolvedValue(
        undefined
      );

      await expect(handler.execute(command)).rejects.toThrow(
        ValidationException
      );
      await expect(handler.execute(command)).rejects.toMatchObject({
        code: AuthExceptionCode.USER_NOT_FOUND,
      });
    });

    it('should throw FIELD_IS_REQUIRED when Firebase user has no email', async () => {
      const firebaseUser: UserRecord = {
        uid: externalId,
        email: undefined,
        displayName: 'Test User',
        providerData: [],
      } as unknown as UserRecord;

      const command: RequestAccessTokenCommand = {
        idToken,
      };

      vi.mocked(mockExternalAuthService.verifyToken).mockResolvedValue({
        externalId,
      });
      vi.mocked(mockUserRepository.findByExternalId).mockResolvedValue(
        undefined
      );
      vi.mocked(mockExternalAuthService.findUserById).mockResolvedValue(
        firebaseUser
      );

      await expect(handler.execute(command)).rejects.toThrow(
        ValidationException
      );
      await expect(handler.execute(command)).rejects.toMatchObject({
        code: ValidationErrorCode.FIELD_IS_REQUIRED,
      });
    });

    it('should throw EMAIL_ALREADY_TAKEN when email exists with different externalId', async () => {
      const firebaseUser: UserRecord = {
        uid: externalId,
        email: 'test@example.com',
        displayName: 'Test User',
        providerData: [
          {
            providerId: 'password',
            uid: externalId,
            email: 'test@example.com',
            displayName: 'Test User',
            photoURL: undefined,
            phoneNumber: undefined,
          },
        ],
      } as unknown as UserRecord;

      const existingUser = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId: 'different-external-id',
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const command: RequestAccessTokenCommand = {
        idToken,
      };

      vi.mocked(mockExternalAuthService.verifyToken).mockResolvedValue({
        externalId,
      });
      vi.mocked(mockUserRepository.findByExternalId).mockResolvedValue(
        undefined
      );
      vi.mocked(mockExternalAuthService.findUserById).mockResolvedValue(
        firebaseUser
      );
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(existingUser);

      await expect(handler.execute(command)).rejects.toThrow(
        ValidationException
      );
      await expect(handler.execute(command)).rejects.toMatchObject({
        code: AuthExceptionCode.EMAIL_ALREADY_TAKEN,
      });
    });

    it('should throw error when externalId already exists (race condition)', async () => {
      const firebaseUser: UserRecord = {
        uid: externalId,
        email: 'test@example.com',
        displayName: 'Test User',
        providerData: [
          {
            providerId: 'password',
            uid: externalId,
            email: 'test@example.com',
            displayName: 'Test User',
            photoURL: undefined,
            phoneNumber: undefined,
          },
        ],
      } as unknown as UserRecord;

      const newUserId = Uuid.create('660e8400-e29b-41d4-a716-446655440000');

      const command: RequestAccessTokenCommand = {
        idToken,
      };

      const constraintError = {
        name: 'SequelizeUniqueConstraintError',
        errors: [
          {
            path: 'externalId',
            type: 'unique violation',
          },
        ],
      };

      vi.mocked(mockExternalAuthService.verifyToken).mockResolvedValue({
        externalId,
      });
      vi.mocked(mockUserRepository.findByExternalId).mockResolvedValue(
        undefined
      );
      vi.mocked(mockExternalAuthService.findUserById).mockResolvedValue(
        firebaseUser
      );
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(undefined);
      vi.mocked(
        mockUserValidatorService.validateEmailUniqueness
      ).mockResolvedValue();
      vi.mocked(mockUserIdGeneratorService.generateUserId).mockReturnValue(
        newUserId
      );
      vi.mocked(mockUserRepository.save).mockRejectedValue(constraintError);

      await expect(handler.execute(command)).rejects.toEqual(constraintError);
    });

    it('should map Google provider to GOOGLE SignInType', async () => {
      const firebaseUser: UserRecord = {
        uid: externalId,
        email: 'test@example.com',
        displayName: 'Test User',
        providerData: [
          {
            providerId: 'google.com',
            uid: externalId,
            email: 'test@example.com',
            displayName: 'Test User',
            photoURL: undefined,
            phoneNumber: undefined,
          },
        ],
      } as unknown as UserRecord;

      const newUserId = Uuid.create('660e8400-e29b-41d4-a716-446655440000');
      const roles = ['AUTH_VIEWER'];

      const command: RequestAccessTokenCommand = {
        idToken,
      };

      vi.mocked(mockExternalAuthService.verifyToken).mockResolvedValue({
        externalId,
      });
      vi.mocked(mockUserRepository.findByExternalId).mockResolvedValue(
        undefined
      );
      vi.mocked(mockExternalAuthService.findUserById).mockResolvedValue(
        firebaseUser
      );
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(undefined);
      vi.mocked(
        mockUserValidatorService.validateEmailUniqueness
      ).mockResolvedValue();
      vi.mocked(mockUserIdGeneratorService.generateUserId).mockReturnValue(
        newUserId
      );
      vi.mocked(mockUserRepository.save).mockImplementation(async (user) => {
        expect(user.signInType).toBe(SignInType.GOOGLE);
        return undefined;
      });
      vi.mocked(mockUserGroupRepository.getUserRoleCodes).mockResolvedValue(
        roles
      );
      vi.mocked(mockJwtService.signToken).mockReturnValue(accessToken);

      await handler.execute(command);

      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should map Apple provider to APPLE SignInType', async () => {
      const firebaseUser: UserRecord = {
        uid: externalId,
        email: 'test@example.com',
        displayName: 'Test User',
        providerData: [
          {
            providerId: 'apple.com',
            uid: externalId,
            email: 'test@example.com',
            displayName: 'Test User',
            photoURL: undefined,
            phoneNumber: undefined,
          },
        ],
      } as unknown as UserRecord;

      const newUserId = Uuid.create('660e8400-e29b-41d4-a716-446655440000');
      const roles = ['AUTH_VIEWER'];

      const command: RequestAccessTokenCommand = {
        idToken,
      };

      vi.mocked(mockExternalAuthService.verifyToken).mockResolvedValue({
        externalId,
      });
      vi.mocked(mockUserRepository.findByExternalId).mockResolvedValue(
        undefined
      );
      vi.mocked(mockExternalAuthService.findUserById).mockResolvedValue(
        firebaseUser
      );
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(undefined);
      vi.mocked(
        mockUserValidatorService.validateEmailUniqueness
      ).mockResolvedValue();
      vi.mocked(mockUserIdGeneratorService.generateUserId).mockReturnValue(
        newUserId
      );
      vi.mocked(mockUserRepository.save).mockImplementation(async (user) => {
        expect(user.signInType).toBe(SignInType.APPLE);
        return undefined;
      });
      vi.mocked(mockUserGroupRepository.getUserRoleCodes).mockResolvedValue(
        roles
      );
      vi.mocked(mockJwtService.signToken).mockReturnValue(accessToken);

      await handler.execute(command);

      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw FIELD_IS_INVALID for unsupported provider', async () => {
      const firebaseUser: UserRecord = {
        uid: externalId,
        email: 'test@example.com',
        displayName: 'Test User',
        providerData: [
          {
            providerId: 'facebook.com',
            uid: externalId,
            email: 'test@example.com',
            displayName: 'Test User',
            photoURL: undefined,
            phoneNumber: undefined,
          },
        ],
      } as unknown as UserRecord;

      const command: RequestAccessTokenCommand = {
        idToken,
      };

      vi.mocked(mockExternalAuthService.verifyToken).mockResolvedValue({
        externalId,
      });
      vi.mocked(mockUserRepository.findByExternalId).mockResolvedValue(
        undefined
      );
      vi.mocked(mockExternalAuthService.findUserById).mockResolvedValue(
        firebaseUser
      );
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(undefined);
      vi.mocked(
        mockUserValidatorService.validateEmailUniqueness
      ).mockResolvedValue();

      await expect(handler.execute(command)).rejects.toThrow(
        ValidationException
      );
      await expect(handler.execute(command)).rejects.toMatchObject({
        code: ValidationErrorCode.FIELD_IS_INVALID,
      });
    });

    it('should map email provider to EMAIL SignInType', async () => {
      const firebaseUser: UserRecord = {
        uid: externalId,
        email: 'test@example.com',
        displayName: 'Test User',
        providerData: [
          {
            providerId: 'email',
            uid: externalId,
            email: 'test@example.com',
            displayName: 'Test User',
            photoURL: undefined,
            phoneNumber: undefined,
          },
        ],
      } as unknown as UserRecord;

      const newUserId = Uuid.create('660e8400-e29b-41d4-a716-446655440000');
      const roles = ['AUTH_VIEWER'];

      const command: RequestAccessTokenCommand = {
        idToken,
      };

      vi.mocked(mockExternalAuthService.verifyToken).mockResolvedValue({
        externalId,
      });
      vi.mocked(mockUserRepository.findByExternalId).mockResolvedValue(
        undefined
      );
      vi.mocked(mockExternalAuthService.findUserById).mockResolvedValue(
        firebaseUser
      );
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(undefined);
      vi.mocked(
        mockUserValidatorService.validateEmailUniqueness
      ).mockResolvedValue();
      vi.mocked(mockUserIdGeneratorService.generateUserId).mockReturnValue(
        newUserId
      );
      vi.mocked(mockUserRepository.save).mockImplementation(async (user) => {
        expect(user.signInType).toBe(SignInType.EMAIL);
        return undefined;
      });
      vi.mocked(mockUserGroupRepository.getUserRoleCodes).mockResolvedValue(
        roles
      );
      vi.mocked(mockJwtService.signToken).mockReturnValue(accessToken);

      await handler.execute(command);

      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should default to password provider when providerData is empty', async () => {
      const firebaseUser: UserRecord = {
        uid: externalId,
        email: 'test@example.com',
        displayName: 'Test User',
        providerData: [],
      } as unknown as UserRecord;

      const newUserId = Uuid.create('660e8400-e29b-41d4-a716-446655440000');
      const roles = ['AUTH_VIEWER'];

      const command: RequestAccessTokenCommand = {
        idToken,
      };

      vi.mocked(mockExternalAuthService.verifyToken).mockResolvedValue({
        externalId,
      });
      vi.mocked(mockUserRepository.findByExternalId).mockResolvedValue(
        undefined
      );
      vi.mocked(mockExternalAuthService.findUserById).mockResolvedValue(
        firebaseUser
      );
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(undefined);
      vi.mocked(
        mockUserValidatorService.validateEmailUniqueness
      ).mockResolvedValue();
      vi.mocked(mockUserIdGeneratorService.generateUserId).mockReturnValue(
        newUserId
      );
      vi.mocked(mockUserRepository.save).mockImplementation(async (user) => {
        expect(user.signInType).toBe(SignInType.EMAIL);
        return undefined;
      });
      vi.mocked(mockUserGroupRepository.getUserRoleCodes).mockResolvedValue(
        roles
      );
      vi.mocked(mockJwtService.signToken).mockReturnValue(accessToken);

      await handler.execute(command);

      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should create user without displayName when displayName is undefined', async () => {
      const firebaseUser: UserRecord = {
        uid: externalId,
        email: 'test@example.com',
        displayName: undefined,
        providerData: [
          {
            providerId: 'password',
            uid: externalId,
            email: 'test@example.com',
            displayName: undefined,
            photoURL: undefined,
            phoneNumber: undefined,
          },
        ],
      } as unknown as UserRecord;

      const newUserId = Uuid.create('660e8400-e29b-41d4-a716-446655440000');
      const roles = ['AUTH_VIEWER'];

      const command: RequestAccessTokenCommand = {
        idToken,
      };

      vi.mocked(mockExternalAuthService.verifyToken).mockResolvedValue({
        externalId,
      });
      vi.mocked(mockUserRepository.findByExternalId).mockResolvedValue(
        undefined
      );
      vi.mocked(mockExternalAuthService.findUserById).mockResolvedValue(
        firebaseUser
      );
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(undefined);
      vi.mocked(
        mockUserValidatorService.validateEmailUniqueness
      ).mockResolvedValue();
      vi.mocked(mockUserIdGeneratorService.generateUserId).mockReturnValue(
        newUserId
      );
      vi.mocked(mockUserRepository.save).mockImplementation(async (user) => {
        expect(user.displayName).toBeUndefined();
        return undefined;
      });
      vi.mocked(mockUserGroupRepository.getUserRoleCodes).mockResolvedValue(
        roles
      );
      vi.mocked(mockJwtService.signToken).mockReturnValue(accessToken);

      await handler.execute(command);

      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should pass when email exists with same externalId', async () => {
      const firebaseUser: UserRecord = {
        uid: externalId,
        email: 'test@example.com',
        displayName: 'Test User',
        providerData: [
          {
            providerId: 'password',
            uid: externalId,
            email: 'test@example.com',
            displayName: 'Test User',
            photoURL: undefined,
            phoneNumber: undefined,
          },
        ],
      } as unknown as UserRecord;

      const existingUser = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const newUserId = Uuid.create('660e8400-e29b-41d4-a716-446655440000');
      const roles = ['AUTH_VIEWER'];

      const command: RequestAccessTokenCommand = {
        idToken,
      };

      vi.mocked(mockExternalAuthService.verifyToken).mockResolvedValue({
        externalId,
      });
      vi.mocked(mockUserRepository.findByExternalId).mockResolvedValue(
        undefined
      );
      vi.mocked(mockExternalAuthService.findUserById).mockResolvedValue(
        firebaseUser
      );
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(existingUser);
      vi.mocked(
        mockUserValidatorService.validateEmailUniqueness
      ).mockResolvedValue();
      vi.mocked(mockUserIdGeneratorService.generateUserId).mockReturnValue(
        newUserId
      );
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined);
      vi.mocked(mockUserGroupRepository.getUserRoleCodes).mockResolvedValue(
        roles
      );
      vi.mocked(mockJwtService.signToken).mockReturnValue(accessToken);

      const result = await handler.execute(command);

      expect(result.token).toBe(accessToken);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw ValidationException when validateEmailUniqueness fails', async () => {
      const firebaseUser: UserRecord = {
        uid: externalId,
        email: 'test@example.com',
        displayName: 'Test User',
        providerData: [
          {
            providerId: 'password',
            uid: externalId,
            email: 'test@example.com',
            displayName: 'Test User',
            photoURL: undefined,
            phoneNumber: undefined,
          },
        ],
      } as unknown as UserRecord;

      const command: RequestAccessTokenCommand = {
        idToken,
      };

      vi.mocked(mockExternalAuthService.verifyToken).mockResolvedValue({
        externalId,
      });
      vi.mocked(mockUserRepository.findByExternalId).mockResolvedValue(
        undefined
      );
      vi.mocked(mockExternalAuthService.findUserById).mockResolvedValue(
        firebaseUser
      );
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(undefined);
      vi.mocked(
        mockUserValidatorService.validateEmailUniqueness
      ).mockRejectedValue(
        new ValidationException(AuthExceptionCode.EMAIL_ALREADY_TAKEN)
      );

      await expect(handler.execute(command)).rejects.toThrow(
        ValidationException
      );
      await expect(handler.execute(command)).rejects.toMatchObject({
        code: AuthExceptionCode.EMAIL_ALREADY_TAKEN,
      });
    });
  });

  describe('execute - validation errors', () => {
    it('should throw error when user is disabled', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.DISABLED,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const command: RequestAccessTokenCommand = {
        idToken,
      };

      vi.mocked(mockExternalAuthService.verifyToken).mockResolvedValue({
        externalId,
      });
      vi.mocked(mockUserRepository.findByExternalId).mockResolvedValue(user);

      await expect(handler.execute(command)).rejects.toThrow();
    });

    it('should throw error when user is deleted', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.DELETED,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const command: RequestAccessTokenCommand = {
        idToken,
      };

      vi.mocked(mockExternalAuthService.verifyToken).mockResolvedValue({
        externalId,
      });
      vi.mocked(mockUserRepository.findByExternalId).mockResolvedValue(user);

      await expect(handler.execute(command)).rejects.toThrow();
    });
  });

  describe('execute - error handling', () => {
    it('should propagate error from verifyToken', async () => {
      const command: RequestAccessTokenCommand = {
        idToken,
      };

      const error = new ValidationException(
        AuthExceptionCode.INVALID_CREDENTIALS
      );
      vi.mocked(mockExternalAuthService.verifyToken).mockRejectedValue(error);

      await expect(handler.execute(command)).rejects.toThrow(error);
    });

    it('should propagate error from findUserById', async () => {
      const command: RequestAccessTokenCommand = {
        idToken,
      };

      const error = new Error('Firebase error');
      vi.mocked(mockExternalAuthService.verifyToken).mockResolvedValue({
        externalId,
      });
      vi.mocked(mockUserRepository.findByExternalId).mockResolvedValue(
        undefined
      );
      vi.mocked(mockExternalAuthService.findUserById).mockRejectedValue(error);

      await expect(handler.execute(command)).rejects.toThrow(error);
    });

    it('should propagate error from findByEmail', async () => {
      const firebaseUser: UserRecord = {
        uid: externalId,
        email: 'test@example.com',
        displayName: 'Test User',
        providerData: [
          {
            providerId: 'password',
            uid: externalId,
            email: 'test@example.com',
            displayName: 'Test User',
            photoURL: undefined,
            phoneNumber: undefined,
          },
        ],
      } as unknown as UserRecord;

      const command: RequestAccessTokenCommand = {
        idToken,
      };

      const error = new Error('Database error');
      vi.mocked(mockExternalAuthService.verifyToken).mockResolvedValue({
        externalId,
      });
      vi.mocked(mockUserRepository.findByExternalId).mockResolvedValue(
        undefined
      );
      vi.mocked(mockExternalAuthService.findUserById).mockResolvedValue(
        firebaseUser
      );
      vi.mocked(mockUserRepository.findByEmail).mockRejectedValue(error);

      await expect(handler.execute(command)).rejects.toThrow(error);
    });

    it('should propagate error from generateUserId', async () => {
      const firebaseUser: UserRecord = {
        uid: externalId,
        email: 'test@example.com',
        displayName: 'Test User',
        providerData: [
          {
            providerId: 'password',
            uid: externalId,
            email: 'test@example.com',
            displayName: 'Test User',
            photoURL: undefined,
            phoneNumber: undefined,
          },
        ],
      } as unknown as UserRecord;

      const command: RequestAccessTokenCommand = {
        idToken,
      };

      const error = new Error('ID generation error');
      vi.mocked(mockExternalAuthService.verifyToken).mockResolvedValue({
        externalId,
      });
      vi.mocked(mockUserRepository.findByExternalId).mockResolvedValue(
        undefined
      );
      vi.mocked(mockExternalAuthService.findUserById).mockResolvedValue(
        firebaseUser
      );
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(undefined);
      vi.mocked(
        mockUserValidatorService.validateEmailUniqueness
      ).mockResolvedValue();
      vi.mocked(mockUserIdGeneratorService.generateUserId).mockImplementation(
        () => {
          throw error;
        }
      );

      await expect(handler.execute(command)).rejects.toThrow(error);
    });

    it('should propagate error from getUserRoleCodes', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const command: RequestAccessTokenCommand = {
        idToken,
      };

      const error = new Error('Database error');
      vi.mocked(mockExternalAuthService.verifyToken).mockResolvedValue({
        externalId,
      });
      vi.mocked(mockUserRepository.findByExternalId).mockResolvedValue(user);
      vi.mocked(mockUserGroupRepository.getUserRoleCodes).mockRejectedValue(
        error
      );

      await expect(handler.execute(command)).rejects.toThrow(error);
    });

    it('should propagate error from signToken', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const roles = ['AUTH_MANAGER'];

      const command: RequestAccessTokenCommand = {
        idToken,
      };

      const error = new Error('JWT signing error');
      vi.mocked(mockExternalAuthService.verifyToken).mockResolvedValue({
        externalId,
      });
      vi.mocked(mockUserRepository.findByExternalId).mockResolvedValue(user);
      vi.mocked(mockUserGroupRepository.getUserRoleCodes).mockResolvedValue(
        roles
      );
      vi.mocked(mockJwtService.signToken).mockImplementation(() => {
        throw error;
      });

      await expect(handler.execute(command)).rejects.toThrow(error);
    });
  });
});
