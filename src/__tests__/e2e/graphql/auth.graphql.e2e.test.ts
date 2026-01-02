import { asValue } from 'awilix';
import fastify, { type FastifyInstance } from 'fastify';
import { Sequelize } from 'sequelize';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockFastifyLogger } from '@app/__tests__/test-utils/test-helpers';
import { createDIContainer } from '@app/application/container';
import { attachAppContext } from '@app/application/middleware/attach-app-context';
import { errorHandler } from '@app/application/middleware/error.handler';
import { registerGraphQL } from '@app/application/middleware/register-graphql';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { ErrorCodeRegistry } from '@app/common/utils/error-code-registry';
import { authResolvers } from '@app/modules/auth/adapters/graphql/auth.resolvers';
import { authSchema } from '@app/modules/auth/adapters/graphql/auth.schema';
import { roleManagementResolvers } from '@app/modules/auth/adapters/graphql/role-management.resolvers';
import { roleManagementSchema } from '@app/modules/auth/adapters/graphql/role-management.schema';
import { userGroupManagementResolvers } from '@app/modules/auth/adapters/graphql/user-group-management.resolvers';
import { userGroupManagementSchema } from '@app/modules/auth/adapters/graphql/user-group-management.schema';
import { userManagementResolvers } from '@app/modules/auth/adapters/graphql/user-management.resolvers';
import { userManagementSchema } from '@app/modules/auth/adapters/graphql/user-management.schema';
import { DeleteAccountCommandHandler } from '@app/modules/auth/application/command-handlers/delete-account.command-handler';
import { RegisterCommandHandler } from '@app/modules/auth/application/command-handlers/register.command-handler';
import { RequestAccessTokenCommandHandler } from '@app/modules/auth/application/command-handlers/request-access-token.command-handler';
import { SignInCommandHandler } from '@app/modules/auth/application/command-handlers/sign-in.command-handler';
import { UpdateProfileCommandHandler } from '@app/modules/auth/application/command-handlers/update-profile.command-handler';
import { GetProfileQueryHandler } from '@app/modules/auth/application/query-handlers/get-profile.query-handler';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { SignInType } from '@app/modules/auth/domain/enums/sign-in-type';

describe('GraphQL Auth E2E', () => {
  let app: FastifyInstance;
  let mockGetProfileQueryHandler: GetProfileQueryHandler;
  let mockRegisterCommandHandler: RegisterCommandHandler;
  let mockSignInCommandHandler: SignInCommandHandler;
  let mockUpdateProfileCommandHandler: UpdateProfileCommandHandler;
  let mockDeleteAccountCommandHandler: DeleteAccountCommandHandler;
  let mockRequestAccessTokenCommandHandler: RequestAccessTokenCommandHandler;

  const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env['GRAPHQL_UI_ENABLED'] = 'true';
    process.env['GRAPHQL_ENDPOINT'] = '/graphql';

    mockGetProfileQueryHandler = {
      execute: vi.fn(),
    } as unknown as GetProfileQueryHandler;

    mockRegisterCommandHandler = {
      execute: vi.fn(),
    } as unknown as RegisterCommandHandler;

    mockSignInCommandHandler = {
      execute: vi.fn(),
    } as unknown as SignInCommandHandler;

    mockUpdateProfileCommandHandler = {
      execute: vi.fn(),
    } as unknown as UpdateProfileCommandHandler;

    mockDeleteAccountCommandHandler = {
      execute: vi.fn(),
    } as unknown as DeleteAccountCommandHandler;

    mockRequestAccessTokenCommandHandler = {
      execute: vi.fn(),
    } as unknown as RequestAccessTokenCommandHandler;

    const mockDatabase = new Sequelize({
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

    const mockReadDatabase = new Sequelize({
      dialect: 'postgres',
      logging: false,
    });

    const container = createDIContainer(
      mockDatabase,
      mockReadDatabase,
      createMockFastifyLogger()
    );
    (container as any).register({
      getProfileQueryHandler: asValue(mockGetProfileQueryHandler),
      registerCommandHandler: asValue(mockRegisterCommandHandler),
      signInCommandHandler: asValue(mockSignInCommandHandler),
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
    });

    app.decorate('diContainer', container);
    app.addHook('onRequest', attachAppContext);
    app.setErrorHandler((error, request, reply) =>
      errorHandler(error as Error, request, reply, errorCodeRegistry, app.log)
    );

    await registerGraphQL(
      app,
      [
        { schema: authSchema },
        { schema: userManagementSchema },
        { schema: userGroupManagementSchema },
        { schema: roleManagementSchema },
      ],
      [
        { resolvers: authResolvers },
        { resolvers: userManagementResolvers },
        { resolvers: userGroupManagementResolvers },
        { resolvers: roleManagementResolvers },
      ]
    );
    await app.ready();
  });

  afterEach(async () => {
    delete process.env['GRAPHQL_UI_ENABLED'];
    delete process.env['GRAPHQL_ENDPOINT'];
    await app.close();
  });

  describe('Query.me', () => {
    it('should return user profile when authenticated', async () => {
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

      const query = `
        query {
          me {
            id
            email
            displayName
          }
        }
      `;

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          authorization: 'Bearer valid-token',
        },
        payload: {
          query,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toBeDefined();
      expect(body.data.me.id).toBe(userId.getValue());
      expect(body.data.me.email).toBe('test@example.com');
    });
  });

  describe('Mutation.auth.register', () => {
    it('should register a new user', async () => {
      vi.mocked(mockRegisterCommandHandler.execute).mockResolvedValue({
        id: userId.getValue(),
        idToken: 'id-token',
        signInToken: 'sign-in-token',
      });

      const mutation = `
        mutation {
          auth {
            register(input: {
              email: "newuser@example.com"
              password: "ValidPass123!"
              displayName: "New User"
            }) {
              id
              idToken
              signInToken
            }
          }
        }
      `;

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: mutation,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toBeDefined();
      expect(body.data.auth.register.id).toBe(userId.getValue());
      expect(body.data.auth.register.idToken).toBe('id-token');
      expect(body.data.auth.register.signInToken).toBe('sign-in-token');
      expect(mockRegisterCommandHandler.execute).toHaveBeenCalled();
    });

    it('should register a user with username', async () => {
      vi.mocked(mockRegisterCommandHandler.execute).mockResolvedValue({
        id: userId.getValue(),
        idToken: 'id-token',
        signInToken: 'sign-in-token',
      });

      const mutation = `
        mutation {
          auth {
            register(input: {
              email: "user@example.com"
              password: "ValidPass123!"
              username: "testuser123"
            }) {
              id
              idToken
              signInToken
            }
          }
        }
      `;

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: mutation,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toBeDefined();
      expect(body.data.auth.register.id).toBe(userId.getValue());
    });
  });

  describe('Mutation.auth.signIn', () => {
    it('should sign in user with email', async () => {
      vi.mocked(mockSignInCommandHandler.execute).mockResolvedValue({
        id: userId.getValue(),
        idToken: 'id-token',
        signInToken: 'sign-in-token',
      });

      const mutation = `
        mutation {
          auth {
            signIn(input: {
              emailOrUsername: "test@example.com"
              password: "ValidPass123!"
            }) {
              id
              idToken
              signInToken
            }
          }
        }
      `;

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: mutation,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toBeDefined();
      expect(body.data.auth.signIn.id).toBe(userId.getValue());
      expect(body.data.auth.signIn.idToken).toBe('id-token');
      expect(mockSignInCommandHandler.execute).toHaveBeenCalled();
    });

    it('should sign in user with username', async () => {
      vi.mocked(mockSignInCommandHandler.execute).mockResolvedValue({
        id: userId.getValue(),
        idToken: 'id-token',
        signInToken: 'sign-in-token',
      });

      const mutation = `
        mutation {
          auth {
            signIn(input: {
              emailOrUsername: "testuser123"
              password: "ValidPass123!"
            }) {
              id
              idToken
              signInToken
            }
          }
        }
      `;

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: mutation,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toBeDefined();
      expect(body.data.auth.signIn.id).toBe(userId.getValue());
    });
  });

  describe('Mutation.auth.updateProfile', () => {
    it('should update user profile', async () => {
      vi.mocked(mockUpdateProfileCommandHandler.execute).mockResolvedValue(
        undefined
      );

      const mutation = `
        mutation {
          auth {
            updateProfile(input: {
              displayName: "Updated Name"
              username: "newusername"
            })
          }
        }
      `;

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          authorization: 'Bearer valid-token',
        },
        payload: {
          query: mutation,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toBeDefined();
      expect(body.data.auth.updateProfile).toBe(true);
      expect(mockUpdateProfileCommandHandler.execute).toHaveBeenCalled();
    });

    it('should update profile with displayName only', async () => {
      vi.mocked(mockUpdateProfileCommandHandler.execute).mockResolvedValue(
        undefined
      );

      const mutation = `
        mutation {
          auth {
            updateProfile(input: {
              displayName: "New Display Name"
            })
          }
        }
      `;

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          authorization: 'Bearer valid-token',
        },
        payload: {
          query: mutation,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.auth.updateProfile).toBe(true);
    });
  });

  describe('Mutation.auth.deleteAccount', () => {
    it('should delete user account', async () => {
      vi.mocked(mockDeleteAccountCommandHandler.execute).mockResolvedValue(
        undefined
      );

      const mutation = `
        mutation {
          auth {
            deleteAccount
          }
        }
      `;

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          authorization: 'Bearer valid-token',
        },
        payload: {
          query: mutation,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toBeDefined();
      expect(body.data.auth.deleteAccount).toBe(true);
      expect(mockDeleteAccountCommandHandler.execute).toHaveBeenCalled();
    });
  });

  describe('Mutation.auth.requestAccessToken', () => {
    it('should return access token for valid idToken', async () => {
      vi.mocked(mockRequestAccessTokenCommandHandler.execute).mockResolvedValue(
        {
          token: 'jwt-access-token',
        }
      );

      const mutation = `
        mutation {
          auth {
            requestAccessToken(idToken: "valid-firebase-id-token") {
              token
            }
          }
        }
      `;

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: mutation,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toBeDefined();
      expect(body.data.auth.requestAccessToken.token).toBe('jwt-access-token');
      expect(mockRequestAccessTokenCommandHandler.execute).toHaveBeenCalled();
    });
  });
});
