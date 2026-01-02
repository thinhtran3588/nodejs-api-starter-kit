import type { FastifyInstance } from 'fastify';
import type { RouteConfiguration } from '@app/common/interfaces/configuration';
import { success204ResponseSchema } from '@app/common/schemas/error-response.schemas';
import { includeRouteSchemas } from '@app/common/utils/include-route-schemas';
import { DeleteAccountCommandHandler } from '@app/modules/auth/application/command-handlers/delete-account.command-handler';
import { RegisterCommandHandler } from '@app/modules/auth/application/command-handlers/register.command-handler';
import { RequestAccessTokenCommandHandler } from '@app/modules/auth/application/command-handlers/request-access-token.command-handler';
import { SignInCommandHandler } from '@app/modules/auth/application/command-handlers/sign-in.command-handler';
import { UpdateProfileCommandHandler } from '@app/modules/auth/application/command-handlers/update-profile.command-handler';
import type { RegisterCommand } from '@app/modules/auth/application/interfaces/commands/register.command';
import type { RequestAccessTokenCommand } from '@app/modules/auth/application/interfaces/commands/request-access-token.command';
import type { SignInCommand } from '@app/modules/auth/application/interfaces/commands/sign-in.command';
import type { UpdateProfileCommand } from '@app/modules/auth/application/interfaces/commands/update-profile.command';
import { GetProfileQueryHandler } from '@app/modules/auth/application/query-handlers/get-profile.query-handler';

const TAG = 'auth';

const userProfileResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string' },
    signInType: {
      type: 'string',
      enum: ['EMAIL', 'GOOGLE', 'APPLE'],
    },
    externalId: { type: 'string' },
    displayName: { type: 'string', nullable: true },
    username: { type: 'string', nullable: true },
    version: { type: 'number' },
    createdAt: { type: 'string', format: 'date-time' },
  },
} as const;

function register(app: FastifyInstance): void {
  const { diContainer } = app;
  const registerCommandHandler = diContainer.resolve<RegisterCommandHandler>(
    'registerCommandHandler'
  );
  const signInCommandHandler = diContainer.resolve<SignInCommandHandler>(
    'signInCommandHandler'
  );
  const getProfileQueryHandler = diContainer.resolve<GetProfileQueryHandler>(
    'getProfileQueryHandler'
  );
  const updateProfileCommandHandler =
    diContainer.resolve<UpdateProfileCommandHandler>(
      'updateProfileCommandHandler'
    );
  const deleteAccountCommandHandler =
    diContainer.resolve<DeleteAccountCommandHandler>(
      'deleteAccountCommandHandler'
    );
  const requestAccessTokenCommandHandler =
    diContainer.resolve<RequestAccessTokenCommandHandler>(
      'requestAccessTokenCommandHandler'
    );

  // Register a new user (public)
  app.post(
    '/auth/register',
    {
      schema: {
        summary: 'Register a new user',
        description:
          'Registers a new user with email, password, and displayName. Username is optional. Email must be unique. Password is sent to External only and never stored in our database.',
        tags: [TAG],
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address (must be unique)',
            },
            password: {
              type: 'string',
              format: 'password',
              description:
                'User password (8-20 characters, must contain uppercase, lowercase, digit, and special character [!@#$%^&*(),.?":{}|<>], sent to External only)',
            },
            displayName: {
              type: 'string',
              description: 'User display name (optional)',
            },
            username: {
              type: 'string',
              description:
                'User username (optional, must be unique if provided, 8-20 characters, alphanumeric with underscores)',
            },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'User ID',
              },
              idToken: {
                type: 'string',
                description: 'External ID token',
              },
              signInToken: {
                type: 'string',
                description: 'Sign-in authentication token',
              },
            },
          },
          ...includeRouteSchemas([400, 500]),
        },
      },
    },
    async (request, reply) => {
      const result = await registerCommandHandler.execute(
        request.body as RegisterCommand
      );
      await reply.code(201).send(result);
    }
  );

  // Sign in user and get access token (public)
  app.post(
    '/auth/sign-in',
    {
      schema: {
        summary: 'Sign in user',
        description:
          'Authenticates a user with email or username and password, and returns an access token. The emailOrUsername field accepts either a valid email address or a username (8-20 characters, alphanumeric with underscores).',
        tags: [TAG],
        body: {
          type: 'object',
          required: ['emailOrUsername', 'password'],
          properties: {
            emailOrUsername: {
              type: 'string',
              description:
                'User email address or username (8-20 characters, alphanumeric with underscores)',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'User ID',
              },
              idToken: {
                type: 'string',
                description: 'External ID token',
              },
              signInToken: {
                type: 'string',
                description: 'Sign-in authentication token',
              },
            },
          },
          ...includeRouteSchemas([400, 401, 500]),
        },
      },
    },
    async (request, reply) => {
      const result = await signInCommandHandler.execute(
        request.body as SignInCommand
      );
      await reply.code(200).send(result);
    }
  );

  // Get current user profile (authenticated)
  app.get(
    '/auth/me',
    {
      schema: {
        summary: 'Get current user profile',
        description: "Retrieves the authenticated user's profile information",
        tags: [TAG],
        security: [{ bearerAuth: [] }],
        response: {
          200: userProfileResponseSchema,
          ...includeRouteSchemas([401, 500]),
        },
      },
    },
    async (request, reply) => {
      const result = await getProfileQueryHandler.execute(
        {},
        request.appContext
      );
      await reply.code(200).send(result);
    }
  );

  // Update current user profile (authenticated)
  app.put(
    '/auth/me',
    {
      schema: {
        summary: 'Update current user profile',
        description:
          "Updates the authenticated user's profile. Only displayName and username can be updated.",
        tags: [TAG],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            displayName: {
              type: 'string',
              description: 'New display name (optional)',
            },
            username: {
              type: 'string',
              description:
                'New username (optional, must be unique if provided, 8-20 characters, alphanumeric with underscores)',
            },
          },
        },
        response: {
          204: { type: 'null' },
          ...includeRouteSchemas([400, 401, 500]),
        },
      },
    },
    async (request, reply) => {
      await updateProfileCommandHandler.execute(
        request.body as UpdateProfileCommand,
        request.appContext
      );
      await reply.code(204).send();
    }
  );

  // Delete current user account (authenticated)
  app.delete(
    '/auth/me',
    {
      schema: {
        summary: 'Delete current user account',
        description: "Deletes the authenticated user's account",
        tags: [TAG],
        security: [{ bearerAuth: [] }],
        response: {
          ...success204ResponseSchema,
          ...includeRouteSchemas([401, 404, 500]),
        },
      },
    },
    async (request, reply) => {
      await deleteAccountCommandHandler.execute({}, request.appContext);
      await reply.code(204).send();
    }
  );

  // Request access token (public - requires External ID token)
  app.post(
    '/auth/me/access-token',
    {
      schema: {
        summary: 'Request access token',
        description:
          'Verifies an External ID token and generates a JWT access token for the user with their roles from user groups',
        tags: [TAG],
        body: {
          type: 'object',
          required: ['idToken'],
          properties: {
            idToken: {
              type: 'string',
              description: 'Firebase ID token',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                description: 'JWT access token',
              },
            },
          },
          ...includeRouteSchemas([400, 401, 404, 500]),
        },
      },
    },
    async (request, reply) => {
      const result = await requestAccessTokenCommandHandler.execute(
        request.body as RequestAccessTokenCommand
      );
      await reply.code(200).send(result);
    }
  );
}

export const routeConfiguration: RouteConfiguration = {
  tags: [
    {
      name: TAG,
      description: 'Authentication and user profile endpoints',
    },
  ],
  register,
};
