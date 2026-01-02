import { asValue } from 'awilix';
import fastify, { type FastifyInstance } from 'fastify';
import { Sequelize } from 'sequelize';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockFastifyLogger } from '@app/__tests__/test-utils/test-helpers';
import { createDIContainer } from '@app/application/container';
import { attachAppContext } from '@app/application/middleware/attach-app-context';
import { errorHandler } from '@app/application/middleware/error.handler';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { AuthorizationExceptionCode } from '@app/common/enums/authorization-exception-code';
import { ErrorCodeRegistry } from '@app/common/utils/error-code-registry';
import {
  BusinessException,
  ValidationException,
} from '@app/common/utils/exceptions';
import { routeConfiguration } from '@app/modules/auth/adapters/routes/auth.route';
import { DeleteAccountCommandHandler } from '@app/modules/auth/application/command-handlers/delete-account.command-handler';
import { RegisterCommandHandler } from '@app/modules/auth/application/command-handlers/register.command-handler';
import { RequestAccessTokenCommandHandler } from '@app/modules/auth/application/command-handlers/request-access-token.command-handler';
import { SignInCommandHandler } from '@app/modules/auth/application/command-handlers/sign-in.command-handler';
import { UpdateProfileCommandHandler } from '@app/modules/auth/application/command-handlers/update-profile.command-handler';
import { GetProfileQueryHandler } from '@app/modules/auth/application/query-handlers/get-profile.query-handler';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { SignInType } from '@app/modules/auth/domain/enums/sign-in-type';

describe('Auth Route E2E', () => {
  let app: FastifyInstance;
  let mockRegisterCommandHandler: RegisterCommandHandler;
  let mockSignInCommandHandler: SignInCommandHandler;
  let mockGetProfileQueryHandler: GetProfileQueryHandler;
  let mockUpdateProfileCommandHandler: UpdateProfileCommandHandler;
  let mockDeleteAccountCommandHandler: DeleteAccountCommandHandler;
  let mockRequestAccessTokenCommandHandler: RequestAccessTokenCommandHandler;

  const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
  const idToken = 'firebase-id-token';
  const signInToken = 'firebase-sign-in-token';
  const accessToken = 'jwt-access-token';

  beforeEach(async () => {
    vi.clearAllMocks();

    mockRegisterCommandHandler = {
      execute: vi.fn(),
    } as unknown as RegisterCommandHandler;

    mockSignInCommandHandler = {
      execute: vi.fn(),
    } as unknown as SignInCommandHandler;

    mockGetProfileQueryHandler = {
      execute: vi.fn(),
    } as unknown as GetProfileQueryHandler;

    mockUpdateProfileCommandHandler = {
      execute: vi.fn(),
    } as unknown as UpdateProfileCommandHandler;

    mockDeleteAccountCommandHandler = {
      execute: vi.fn(),
    } as unknown as DeleteAccountCommandHandler;

    mockRequestAccessTokenCommandHandler = {
      execute: vi.fn(),
    } as unknown as RequestAccessTokenCommandHandler;

    const mockWriteDatabase = new Sequelize({
      dialect: 'postgres',
      logging: false,
    });
    const mockReadDatabase = new Sequelize({
      dialect: 'postgres',
      logging: false,
    });

    const mockJwtService = {
      verifyToken: vi.fn((token: string) => {
        if (token === 'valid-token') {
          return {
            userId: userId.getValue(),
            roles: ['USER'],
          };
        }
        throw new Error('Invalid token');
      }),
      initialize: vi.fn(),
    };

    const container = createDIContainer(
      mockWriteDatabase,
      mockReadDatabase,
      createMockFastifyLogger()
    );
    (container as any).register({
      registerCommandHandler: asValue(mockRegisterCommandHandler),
      signInCommandHandler: asValue(mockSignInCommandHandler),
      getProfileQueryHandler: asValue(mockGetProfileQueryHandler),
      updateProfileCommandHandler: asValue(mockUpdateProfileCommandHandler),
      deleteAccountCommandHandler: asValue(mockDeleteAccountCommandHandler),
      requestAccessTokenCommandHandler: asValue(
        mockRequestAccessTokenCommandHandler
      ),
      jwtService: asValue(mockJwtService),
    });

    app = fastify({
      logger: false,
    });

    const errorCodeRegistry = new ErrorCodeRegistry();
    errorCodeRegistry.register({
      [AuthExceptionCode.EMAIL_ALREADY_TAKEN]: 400,
      [AuthExceptionCode.USERNAME_ALREADY_TAKEN]: 400,
      [AuthExceptionCode.INVALID_CREDENTIALS]: 401,
      [AuthExceptionCode.USER_NOT_FOUND]: 404,
      [AuthExceptionCode.USER_DELETED]: 404,
      [AuthorizationExceptionCode.UNAUTHORIZED]: 401,
    });

    app.decorate('diContainer', container);
    app.addHook('onRequest', attachAppContext);
    app.setErrorHandler((error, request, reply) =>
      errorHandler(error as Error, request, reply, errorCodeRegistry, app.log)
    );

    routeConfiguration.register(app);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    describe('happy path', () => {
      it('should register a new user with email and password', async () => {
        vi.mocked(mockRegisterCommandHandler.execute).mockResolvedValue({
          id: userId.getValue(),
          idToken,
          signInToken,
        });

        const response = await app.inject({
          method: 'POST',
          url: '/auth/register',
          payload: {
            email: 'test@example.com',
            password: 'ValidPass123!',
            displayName: 'Test User',
          },
        });

        expect(response.statusCode).toBe(201);
        const body = response.json();
        expect(body.id).toBe(userId.getValue());
        expect(body.idToken).toBe(idToken);
        expect(body.signInToken).toBe(signInToken);
        expect(mockRegisterCommandHandler.execute).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'ValidPass123!',
          displayName: 'Test User',
        });
      });

      it('should register a user with username', async () => {
        vi.mocked(mockRegisterCommandHandler.execute).mockResolvedValue({
          id: userId.getValue(),
          idToken,
          signInToken,
        });

        const response = await app.inject({
          method: 'POST',
          url: '/auth/register',
          payload: {
            email: 'test@example.com',
            password: 'ValidPass123!',
            username: 'testuser123',
          },
        });

        expect(response.statusCode).toBe(201);
        const body = response.json();
        expect(body.id).toBe(userId.getValue());
        expect(mockRegisterCommandHandler.execute).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'ValidPass123!',
          username: 'testuser123',
        });
      });

      it('should register a user with minimal required fields', async () => {
        vi.mocked(mockRegisterCommandHandler.execute).mockResolvedValue({
          id: userId.getValue(),
          idToken,
          signInToken,
        });

        const response = await app.inject({
          method: 'POST',
          url: '/auth/register',
          payload: {
            email: 'minimal@example.com',
            password: 'ValidPass123!',
          },
        });

        expect(response.statusCode).toBe(201);
        const body = response.json();
        expect(body.id).toBe(userId.getValue());
        expect(mockRegisterCommandHandler.execute).toHaveBeenCalledWith({
          email: 'minimal@example.com',
          password: 'ValidPass123!',
        });
      });
    });

    describe('validation errors', () => {
      it('should return 400 for invalid email format', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/auth/register',
          payload: {
            email: 'invalid-email',
            password: 'ValidPass123!',
          },
        });

        expect(response.statusCode).toBe(400);
      });

      it('should return 400 for missing email', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/auth/register',
          payload: {
            password: 'ValidPass123!',
          },
        });

        expect(response.statusCode).toBe(400);
      });

      it('should return 400 for missing password', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/auth/register',
          payload: {
            email: 'test@example.com',
          },
        });

        expect(response.statusCode).toBe(400);
      });

      it('should return 400 when email already exists', async () => {
        vi.mocked(mockRegisterCommandHandler.execute).mockRejectedValue(
          new ValidationException(AuthExceptionCode.EMAIL_ALREADY_TAKEN)
        );

        const response = await app.inject({
          method: 'POST',
          url: '/auth/register',
          payload: {
            email: 'existing@example.com',
            password: 'ValidPass123!',
          },
        });

        expect(response.statusCode).toBe(400);
        const body = response.json();
        expect(body.error).toBeDefined();
      });

      it('should return 400 when username already exists', async () => {
        vi.mocked(mockRegisterCommandHandler.execute).mockRejectedValue(
          new ValidationException(AuthExceptionCode.USERNAME_ALREADY_TAKEN)
        );

        const response = await app.inject({
          method: 'POST',
          url: '/auth/register',
          payload: {
            email: 'test@example.com',
            password: 'ValidPass123!',
            username: 'existinguser',
          },
        });

        expect(response.statusCode).toBe(400);
        const body = response.json();
        expect(body.error).toBeDefined();
      });
    });
  });

  describe('POST /auth/sign-in', () => {
    describe('happy path', () => {
      it('should sign in user with email', async () => {
        vi.mocked(mockSignInCommandHandler.execute).mockResolvedValue({
          id: userId.getValue(),
          idToken,
          signInToken,
        });

        const response = await app.inject({
          method: 'POST',
          url: '/auth/sign-in',
          payload: {
            emailOrUsername: 'test@example.com',
            password: 'ValidPass123!',
          },
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body.id).toBe(userId.getValue());
        expect(body.idToken).toBe(idToken);
        expect(body.signInToken).toBe(signInToken);
        expect(mockSignInCommandHandler.execute).toHaveBeenCalledWith({
          emailOrUsername: 'test@example.com',
          password: 'ValidPass123!',
        });
      });

      it('should sign in user with username', async () => {
        vi.mocked(mockSignInCommandHandler.execute).mockResolvedValue({
          id: userId.getValue(),
          idToken,
          signInToken,
        });

        const response = await app.inject({
          method: 'POST',
          url: '/auth/sign-in',
          payload: {
            emailOrUsername: 'testuser123',
            password: 'ValidPass123!',
          },
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body.id).toBe(userId.getValue());
        expect(mockSignInCommandHandler.execute).toHaveBeenCalledWith({
          emailOrUsername: 'testuser123',
          password: 'ValidPass123!',
        });
      });
    });

    describe('validation errors', () => {
      it('should return 400 for missing emailOrUsername', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/auth/sign-in',
          payload: {
            password: 'ValidPass123!',
          },
        });

        expect(response.statusCode).toBe(400);
      });

      it('should return 400 for missing password', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/auth/sign-in',
          payload: {
            emailOrUsername: 'test@example.com',
          },
        });

        expect(response.statusCode).toBe(400);
      });

      it('should return 401 for invalid credentials', async () => {
        vi.mocked(mockSignInCommandHandler.execute).mockRejectedValue(
          new ValidationException(AuthExceptionCode.INVALID_CREDENTIALS)
        );

        const response = await app.inject({
          method: 'POST',
          url: '/auth/sign-in',
          payload: {
            emailOrUsername: 'test@example.com',
            password: 'WrongPassword123!',
          },
        });

        expect(response.statusCode).toBe(401);
        const body = response.json();
        expect(body.error).toBeDefined();
      });
    });
  });

  describe('GET /auth/me', () => {
    describe('happy path', () => {
      it('should return user profile when authenticated', async () => {
        vi.mocked(mockGetProfileQueryHandler.execute).mockResolvedValue({
          id: userId.getValue(),
          email: 'test@example.com',
          signInType: SignInType.EMAIL,
          externalId: 'firebase-user-123',
          displayName: 'Test User',
          username: 'testuser123',
          version: 0,
          createdAt: new Date('2024-01-01'),
        });

        const response = await app.inject({
          method: 'GET',
          url: '/auth/me',
          headers: {
            authorization: 'Bearer valid-token',
          },
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body.id).toBe(userId.getValue());
        expect(body.email).toBe('test@example.com');
        expect(body.displayName).toBe('Test User');
        expect(mockGetProfileQueryHandler.execute).toHaveBeenCalled();
      });

      it('should return user profile without username', async () => {
        vi.mocked(mockGetProfileQueryHandler.execute).mockResolvedValue({
          id: userId.getValue(),
          email: 'test@example.com',
          signInType: SignInType.EMAIL,
          externalId: 'firebase-user-123',
          displayName: 'Test User',
          username: undefined,
          version: 0,
          createdAt: new Date('2024-01-01'),
        });

        const response = await app.inject({
          method: 'GET',
          url: '/auth/me',
          headers: {
            authorization: 'Bearer valid-token',
          },
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body.id).toBe(userId.getValue());
        expect(body.username).toBeUndefined();
      });
    });

    describe('authentication errors', () => {
      it('should return 401 when not authenticated', async () => {
        vi.mocked(mockGetProfileQueryHandler.execute).mockRejectedValue(
          new BusinessException(
            AuthorizationExceptionCode.UNAUTHORIZED,
            undefined,
            'Authentication required'
          )
        );

        const response = await app.inject({
          method: 'GET',
          url: '/auth/me',
        });

        expect(response.statusCode).toBe(401);
      });

      it('should return 401 for invalid token', async () => {
        vi.mocked(mockGetProfileQueryHandler.execute).mockRejectedValue(
          new BusinessException(
            AuthorizationExceptionCode.UNAUTHORIZED,
            undefined,
            'Authentication required'
          )
        );

        const response = await app.inject({
          method: 'GET',
          url: '/auth/me',
          headers: {
            authorization: 'Bearer invalid-token',
          },
        });

        expect(response.statusCode).toBe(401);
      });
    });
  });

  describe('PUT /auth/me', () => {
    describe('happy path', () => {
      it('should update user profile with displayName', async () => {
        vi.mocked(mockUpdateProfileCommandHandler.execute).mockResolvedValue(
          undefined
        );

        const response = await app.inject({
          method: 'PUT',
          url: '/auth/me',
          headers: {
            authorization: 'Bearer valid-token',
          },
          payload: {
            displayName: 'Updated Name',
          },
        });

        expect(response.statusCode).toBe(204);
        expect(mockUpdateProfileCommandHandler.execute).toHaveBeenCalledWith(
          {
            displayName: 'Updated Name',
          },
          expect.any(Object)
        );
      });

      it('should update user profile with username', async () => {
        vi.mocked(mockUpdateProfileCommandHandler.execute).mockResolvedValue(
          undefined
        );

        const response = await app.inject({
          method: 'PUT',
          url: '/auth/me',
          headers: {
            authorization: 'Bearer valid-token',
          },
          payload: {
            username: 'newusername',
          },
        });

        expect(response.statusCode).toBe(204);
        expect(mockUpdateProfileCommandHandler.execute).toHaveBeenCalledWith(
          {
            username: 'newusername',
          },
          expect.any(Object)
        );
      });

      it('should update user profile with both displayName and username', async () => {
        vi.mocked(mockUpdateProfileCommandHandler.execute).mockResolvedValue(
          undefined
        );

        const response = await app.inject({
          method: 'PUT',
          url: '/auth/me',
          headers: {
            authorization: 'Bearer valid-token',
          },
          payload: {
            displayName: 'Updated Name',
            username: 'newusername',
          },
        });

        expect(response.statusCode).toBe(204);
        expect(mockUpdateProfileCommandHandler.execute).toHaveBeenCalledWith(
          {
            displayName: 'Updated Name',
            username: 'newusername',
          },
          expect.any(Object)
        );
      });
    });

    describe('validation errors', () => {
      it('should return 400 when username already exists', async () => {
        vi.mocked(mockUpdateProfileCommandHandler.execute).mockRejectedValue(
          new ValidationException(AuthExceptionCode.USERNAME_ALREADY_TAKEN)
        );

        const response = await app.inject({
          method: 'PUT',
          url: '/auth/me',
          headers: {
            authorization: 'Bearer valid-token',
          },
          payload: {
            username: 'existinguser',
          },
        });

        expect(response.statusCode).toBe(400);
        const body = response.json();
        expect(body.error).toBeDefined();
      });
    });

    describe('authentication errors', () => {
      it('should return 401 when not authenticated', async () => {
        vi.mocked(mockUpdateProfileCommandHandler.execute).mockRejectedValue(
          new BusinessException(
            AuthorizationExceptionCode.UNAUTHORIZED,
            undefined,
            'Authentication required'
          )
        );

        const response = await app.inject({
          method: 'PUT',
          url: '/auth/me',
          payload: {
            displayName: 'Updated Name',
          },
        });

        expect(response.statusCode).toBe(401);
      });
    });
  });

  describe('DELETE /auth/me', () => {
    describe('happy path', () => {
      it('should delete user account', async () => {
        vi.mocked(mockDeleteAccountCommandHandler.execute).mockResolvedValue(
          undefined
        );

        const response = await app.inject({
          method: 'DELETE',
          url: '/auth/me',
          headers: {
            authorization: 'Bearer valid-token',
          },
        });

        expect(response.statusCode).toBe(204);
        expect(mockDeleteAccountCommandHandler.execute).toHaveBeenCalledWith(
          {},
          expect.any(Object)
        );
      });
    });

    describe('authentication errors', () => {
      it('should return 401 when not authenticated', async () => {
        vi.mocked(mockDeleteAccountCommandHandler.execute).mockRejectedValue(
          new BusinessException(
            AuthorizationExceptionCode.UNAUTHORIZED,
            undefined,
            'Authentication required'
          )
        );

        const response = await app.inject({
          method: 'DELETE',
          url: '/auth/me',
        });

        expect(response.statusCode).toBe(401);
      });
    });
  });

  describe('POST /auth/me/access-token', () => {
    describe('happy path', () => {
      it('should return access token for valid idToken', async () => {
        vi.mocked(
          mockRequestAccessTokenCommandHandler.execute
        ).mockResolvedValue({
          token: accessToken,
        });

        const response = await app.inject({
          method: 'POST',
          url: '/auth/me/access-token',
          payload: {
            idToken: 'valid-firebase-id-token',
          },
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body.token).toBe(accessToken);
        expect(
          mockRequestAccessTokenCommandHandler.execute
        ).toHaveBeenCalledWith({
          idToken: 'valid-firebase-id-token',
        });
      });
    });

    describe('validation errors', () => {
      it('should return 400 for missing idToken', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/auth/me/access-token',
          payload: {},
        });

        expect(response.statusCode).toBe(400);
      });

      it('should return 401 for invalid idToken', async () => {
        vi.mocked(
          mockRequestAccessTokenCommandHandler.execute
        ).mockRejectedValue(
          new ValidationException(AuthExceptionCode.INVALID_CREDENTIALS)
        );

        const response = await app.inject({
          method: 'POST',
          url: '/auth/me/access-token',
          payload: {
            idToken: 'invalid-token',
          },
        });

        expect(response.statusCode).toBe(401);
        const body = response.json();
        expect(body.error).toBeDefined();
      });

      it('should return 404 when user not found', async () => {
        vi.mocked(
          mockRequestAccessTokenCommandHandler.execute
        ).mockRejectedValue(
          new ValidationException(AuthExceptionCode.USER_NOT_FOUND)
        );

        const response = await app.inject({
          method: 'POST',
          url: '/auth/me/access-token',
          payload: {
            idToken: 'valid-but-user-not-found-token',
          },
        });

        expect(response.statusCode).toBe(404);
        const body = response.json();
        expect(body.error).toBeDefined();
      });
    });
  });
});
