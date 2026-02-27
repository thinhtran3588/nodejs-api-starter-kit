import { z } from '@hono/zod-openapi';
import {
  createApiRoute,
  createBodySchema,
  includeJsonSchema,
  includeRouteSchemas,
  resolveServices,
  SuccessResponseSchema,
  toApplicationContext,
  type AdapterConfiguration,
  type App,
  type Context,
} from '@app/common';
import { SignInType } from '@app/modules/auth/domain';
import type {
  AuthContainer,
  RegisterCommand,
  RequestAccessTokenCommand,
  SignInCommand,
  UpdateProfileCommand,
} from '@app/modules/auth/interfaces';

const TAG = 'auth';
const SIGN_IN_TYPE_VALUES = [
  SignInType.EMAIL,
  SignInType.GOOGLE,
  SignInType.APPLE,
] as const;
const AuthResponseSchema = z.object({
  id: z.uuid(),
  idToken: z.string(),
  signInToken: z.string(),
});
const AccessTokenResponseSchema = z.object({
  token: z.string(),
});

const UserProfileSchema = z
  .object({
    id: z.uuid(),
    email: z.email(),
    signInType: z.enum(SIGN_IN_TYPE_VALUES),
    externalId: z.string(),
    displayName: z.string().nullable().optional(),
    username: z.string().nullable().optional(),
    version: z.number(),
    createdAt: z.iso.datetime(),
  })
  .openapi('UserProfile');

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
          body: createBodySchema(
            z.object({
              email: z.email(),
              password: z.string(),
              displayName: z.string().optional(),
              username: z.string().optional(),
            })
          ),
        },
        responses: {
          ...includeJsonSchema(201, 'Account created', AuthResponseSchema),
          ...includeRouteSchemas([400, 401, 403, 500]),
        },
      }),
      async (c) => {
        const { registerCommandHandler } = resolveServices(c);
        const data = c.req.valid('json');
        const result = await registerCommandHandler.execute(
          data,
          toApplicationContext(c)
        );
        return c.json(result, 201);
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
          body: createBodySchema(
            z.object({
              emailOrUsername: z.string(),
              password: z.string(),
            })
          ),
        },
        responses: {
          ...includeJsonSchema(200, 'Sign in successful', AuthResponseSchema),
          ...includeRouteSchemas([400, 401, 403, 500]),
        },
      }),
      async (c) => {
        const { signInCommandHandler } = resolveServices(c);
        const data = c.req.valid('json');
        const result = await signInCommandHandler.execute(
          data,
          toApplicationContext(c)
        );
        return c.json(result, 200);
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
          ...includeJsonSchema(200, 'User profile', UserProfileSchema),
          ...includeRouteSchemas([401, 403, 500]),
        },
      }),
      async (c) => {
        const { getProfileQueryHandler } = resolveServices(c);
        const result = await getProfileQueryHandler.execute(
          {},
          toApplicationContext(c)
        );
        return c.json(result, 200);
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
          body: createBodySchema(
            z.object({
              displayName: z.string().optional(),
              username: z.string().optional(),
            })
          ),
        },
        responses: {
          ...includeJsonSchema(200, 'Profile updated', SuccessResponseSchema),
          ...includeRouteSchemas([400, 401, 403, 500]),
        },
      }),
      async (c) => {
        const { updateProfileCommandHandler } = resolveServices(c);
        const data = c.req.valid('json');
        await updateProfileCommandHandler.execute(
          data,
          toApplicationContext(c)
        );
        return c.json({ success: true }, 200);
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
          ...includeJsonSchema(200, 'Account deleted', SuccessResponseSchema),
          ...includeRouteSchemas([401, 403, 404, 500]),
        },
      }),
      async (c) => {
        const { deleteAccountCommandHandler } = resolveServices(c);
        await deleteAccountCommandHandler.execute({}, toApplicationContext(c));
        return c.json({ success: true }, 200);
      }
    );

    app.openapi(
      createApiRoute({
        method: 'post',
        path: '/auth/me/access-token',
        tags: [TAG],
        summary: 'Request access token',
        request: {
          body: createBodySchema(
            z.object({
              idToken: z.string(),
            })
          ),
        },
        responses: {
          ...includeJsonSchema(
            200,
            'Access token generated',
            AccessTokenResponseSchema
          ),
          ...includeRouteSchemas([400, 401, 403, 404, 500]),
        },
      }),
      async (c) => {
        const { requestAccessTokenCommandHandler } = resolveServices(c);
        const data = c.req.valid('json');
        const result = await requestAccessTokenCommandHandler.execute(
          data,
          toApplicationContext(c)
        );
        return c.json(result, 200);
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
      me: async (_parent: unknown, c: Context<AuthContainer>) => {
        const { getProfileQueryHandler } = resolveServices(c);
        return getProfileQueryHandler.execute({}, toApplicationContext(c));
      },
      register: async (command: RegisterCommand, c: Context<AuthContainer>) => {
        const { registerCommandHandler } = resolveServices(c);
        return registerCommandHandler.execute(command, toApplicationContext(c));
      },
      signIn: async (command: SignInCommand, c: Context<AuthContainer>) => {
        const { signInCommandHandler } = resolveServices(c);
        return signInCommandHandler.execute(command, toApplicationContext(c));
      },
      updateMe: async (
        command: UpdateProfileCommand,
        c: Context<AuthContainer>
      ) => {
        const { updateProfileCommandHandler } = resolveServices(c);
        await updateProfileCommandHandler.execute(
          command,
          toApplicationContext(c)
        );
        return true;
      },
      deleteMe: async (_parent: unknown, c: Context<AuthContainer>) => {
        const { deleteAccountCommandHandler } = resolveServices(c);
        await deleteAccountCommandHandler.execute({}, toApplicationContext(c));
        return true;
      },
      requestAccessToken: async (
        command: RequestAccessTokenCommand,
        c: Context<AuthContainer>
      ) => {
        const { requestAccessTokenCommandHandler } = resolveServices(c);
        return requestAccessTokenCommandHandler.execute(
          command,
          toApplicationContext(c)
        );
      },
    },
  },
};
