/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import { z } from '@hono/zod-openapi';
import {
  createApiRoute,
  type AdapterConfiguration,
  type App,
  type Context,
} from '@app/common';
import type { AuthContainer } from '@app/modules/auth/interfaces';

const TAG = 'auth';

const UserProfileSchema = z
  .object({
    id: z.string(),
    email: z.string(),
    signInType: z.enum(['EMAIL', 'GOOGLE', 'APPLE']),
    externalId: z.string(),
    displayName: z.string().nullable().optional(),
    username: z.string().nullable().optional(),
    version: z.number(),
    createdAt: z.string().datetime(),
  })
  .openapi('UserProfile');

const errorResponse = z.object({
  error: z.string(),
  data: z.any().optional(),
});

function createErrorResponse(description: string) {
  return {
    content: {
      'application/json': {
        schema: errorResponse,
      },
    },
    description,
  };
}

export const authAdapter: AdapterConfiguration<AuthContainer> = {
  registerRoutes(app: App<AuthContainer>): void {
    app.openapi(
      createApiRoute({
        method: 'post',
        path: '/auth/register',
        tags: [TAG],
        summary: 'Register a new user',
        description:
          'Registers a new user with email, password, and displayName.',
        request: {
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  email: z.string().email(),
                  password: z.string(),
                  displayName: z.string().optional(),
                  username: z.string().optional(),
                }),
              },
            },
          },
        },
        responses: {
          201: {
            content: {
              'application/json': {
                schema: z.object({
                  id: z.string(),
                  idToken: z.string(),
                  signInToken: z.string(),
                }),
              },
            },
            description: 'Account created',
          },
          400: createErrorResponse('Bad request'),
          500: createErrorResponse('Internal server error'),
        },
      }),
      async (c) => {
        const { registerCommandHandler } = c.var.container.cradle;
        const result = await registerCommandHandler.execute(
          c.req.valid('json') as any,
          c as any
        );
        return c.json(result as any, 201);
      }
    );

    app.openapi(
      createApiRoute({
        method: 'post',
        path: '/auth/sign-in',
        tags: [TAG],
        summary: 'Sign in user',
        description: 'Authenticates a user and returns an access token.',
        request: {
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  emailOrUsername: z.string(),
                  password: z.string(),
                }),
              },
            },
          },
        },
        responses: {
          200: {
            content: {
              'application/json': {
                schema: z.object({
                  id: z.string(),
                  idToken: z.string(),
                  signInToken: z.string(),
                }),
              },
            },
            description: 'Sign in successful',
          },
          400: createErrorResponse('Bad request'),
          401: createErrorResponse('Unauthorized'),
          500: createErrorResponse('Internal server error'),
        },
      }),
      async (c) => {
        const { signInCommandHandler } = c.var.container.cradle;
        const result = await signInCommandHandler.execute(
          c.req.valid('json') as any,
          c as any
        );
        return c.json(result as any, 200);
      }
    );

    app.openapi(
      createApiRoute({
        method: 'get',
        path: '/auth/me',
        tags: [TAG],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            content: {
              'application/json': {
                schema: UserProfileSchema,
              },
            },
            description: 'User profile',
          },
          401: createErrorResponse('Unauthorized'),
          500: createErrorResponse('Internal server error'),
        },
      }),
      async (c) => {
        const { getProfileQueryHandler } = c.var.container.cradle;
        const result = await getProfileQueryHandler.execute({}, c as any);
        return c.json(result as any, 200);
      }
    );

    app.openapi(
      createApiRoute({
        method: 'put',
        path: '/auth/me',
        tags: [TAG],
        summary: 'Update current user profile',
        security: [{ bearerAuth: [] }],
        request: {
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  displayName: z.string().optional(),
                  username: z.string().optional(),
                }),
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Profile updated',
            content: {
              'application/json': {
                schema: z.object({ success: z.boolean() }),
              },
            },
          },
          400: createErrorResponse('Bad request'),
          401: createErrorResponse('Unauthorized'),
          500: createErrorResponse('Internal server error'),
        },
      }),
      async (c) => {
        const { updateProfileCommandHandler } = c.var.container.cradle;
        await updateProfileCommandHandler.execute(
          c.req.valid('json') as any,
          c as any
        );
        return c.json({ success: true } as any, 200);
      }
    );

    app.openapi(
      createApiRoute({
        method: 'delete',
        path: '/auth/me',
        tags: [TAG],
        summary: 'Delete current user account',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Account deleted',
            content: {
              'application/json': {
                schema: z.object({ success: z.boolean() }),
              },
            },
          },
          401: createErrorResponse('Unauthorized'),
          404: createErrorResponse('Not found'),
          500: createErrorResponse('Internal server error'),
        },
      }),
      async (c) => {
        const { deleteAccountCommandHandler } = c.var.container.cradle;
        await deleteAccountCommandHandler.execute({}, c as any);
        return c.json({ success: true } as any, 200);
      }
    );

    app.openapi(
      createApiRoute({
        method: 'post',
        path: '/auth/me/access-token',
        tags: [TAG],
        summary: 'Request access token',
        request: {
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  idToken: z.string(),
                }),
              },
            },
          },
        },
        responses: {
          200: {
            content: {
              'application/json': {
                schema: z.object({
                  token: z.string(),
                }),
              },
            },
            description: 'Access token generated',
          },
          400: createErrorResponse('Bad request'),
          401: createErrorResponse('Unauthorized'),
          404: createErrorResponse('Not found'),
          500: createErrorResponse('Internal server error'),
        },
      }),
      async (c) => {
        const { requestAccessTokenCommandHandler } = c.var.container.cradle;
        const result = await requestAccessTokenCommandHandler.execute(
          c.req.valid('json') as any,
          c as any
        );
        return c.json(result as any, 200);
      }
    );
  },
  graphql: {
    typeDefs: `
      type AuthResponse {
        id: String!
        idToken: String!
        signInToken: String!
      }

      type TokenResponse {
        token: String!
      }

      type UserProfile {
        id: String!
        email: String!
        signInType: String!
        externalId: String!
        displayName: String
        username: String
        version: Int!
        createdAt: String!
      }

      extend type Query {
        me: UserProfile
      }

      extend type Mutation {
        register(email: String!, password: String!, displayName: String, username: String): AuthResponse
        signIn(emailOrUsername: String!, password: String!): AuthResponse
        updateMe(displayName: String, username: String): Boolean
        deleteMe: Boolean
        requestAccessToken(idToken: String!): TokenResponse
      }
    `,
    resolvers: {
      me: async (_: any, c: Context<AuthContainer>) => {
        const { getProfileQueryHandler } = c.var.container.cradle;
        return getProfileQueryHandler.execute({}, c as any);
      },
      register: async (args: any, c: Context<AuthContainer>) => {
        const { registerCommandHandler } = c.var.container.cradle;
        return registerCommandHandler.execute(args, c as any);
      },
      signIn: async (args: any, c: Context<AuthContainer>) => {
        const { signInCommandHandler } = c.var.container.cradle;
        return signInCommandHandler.execute(args, c as any);
      },
      updateMe: async (args: any, c: Context<AuthContainer>) => {
        const { updateProfileCommandHandler } = c.var.container.cradle;
        await updateProfileCommandHandler.execute(args, c as any);
        return true;
      },
      deleteMe: async (_: any, c: Context<AuthContainer>) => {
        const { deleteAccountCommandHandler } = c.var.container.cradle;
        await deleteAccountCommandHandler.execute({}, c as any);
        return true;
      },
      requestAccessToken: async (args: any, c: Context<AuthContainer>) => {
        const { requestAccessTokenCommandHandler } = c.var.container.cradle;
        return requestAccessTokenCommandHandler.execute(args, c as any);
      },
    },
  },
};
