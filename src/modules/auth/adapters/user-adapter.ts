import { z } from '@hono/zod-openapi';
import type { GraphQLResolveInfo } from 'graphql';
import {
  createApiRoute,
  createBodySchema,
  createFindQueryResultSchema,
  createFindQuerySchema,
  createIdSchema,
  extractGraphQLFields,
  includeJsonSchema,
  includeRouteSchemas,
  resolveServices,
  SuccessResponseSchema,
  toApplicationContext,
  type AdapterConfiguration,
  type App,
  type Context,
} from '@app/common';
import { SignInType, UserStatus } from '@app/modules/auth/domain';
import {
  USER_READ_MODEL_FIELDS,
  USER_READ_MODEL_SORT_FIELDS,
  type AuthContainer,
  type DeleteUserCommand,
  type FindUsersQuery,
  type GetUserQuery,
  type ToggleUserStatusCommand,
  type UpdateUserCommand,
} from '@app/modules/auth/interfaces';

const TAG = 'users';
const SIGN_IN_TYPE_VALUES = [
  SignInType.EMAIL,
  SignInType.GOOGLE,
  SignInType.APPLE,
] as const;
const USER_STATUS_VALUES = [
  UserStatus.ACTIVE,
  UserStatus.DISABLED,
  UserStatus.DELETED,
] as const;

const UserSchema = z.object({
  id: z.uuid(),
  email: z.email().openapi({ example: 'john@example.com' }),
  signInType: z.enum(SIGN_IN_TYPE_VALUES),
  externalId: z.string(),
  username: z.string().optional(),
  displayName: z.string().optional(),
  status: z.enum(USER_STATUS_VALUES),
  version: z.number(),
  createdAt: z.iso.datetime(),
  lastModifiedAt: z.iso.datetime().optional(),
  createdBy: z.string().optional(),
  lastModifiedBy: z.string().optional(),
});

interface UserGroupMembershipArgs {
  id: string;
  userGroupId: string;
}

export const userAdapter: AdapterConfiguration<AuthContainer> = {
  registerRoutes(app: App<AuthContainer>): void {
    app.openapi(
      createApiRoute({
        method: 'get',
        path: '/users',
        summary: 'Find users by search term with pagination',
        description:
          'Searches for users by email, username, or display name with pagination support.',
        security: [{ bearerAuth: [] }],
        tags: [TAG],
        request: {
          query: createFindQuerySchema(
            USER_READ_MODEL_FIELDS,
            USER_READ_MODEL_SORT_FIELDS,
            {
              userGroupId: z.uuid().optional(),
            }
          ),
        },
        responses: {
          ...includeJsonSchema(
            200,
            'List of users',
            createFindQueryResultSchema(UserSchema)
          ),
          ...includeRouteSchemas([401, 403, 500]),
        },
      }),
      async (c) => {
        const { findUsersQueryHandler } = resolveServices(c);
        const query = c.req.valid('query');

        const result = await findUsersQueryHandler.execute(
          query,
          toApplicationContext(c)
        );
        return c.json(result, 200);
      }
    );

    app.openapi(
      createApiRoute({
        method: 'get',
        path: '/users/{id}',
        summary: 'Get user by ID',
        security: [{ bearerAuth: [] }],
        tags: [TAG],
        request: {
          params: createIdSchema(),
        },
        responses: {
          ...includeJsonSchema(200, 'User details', UserSchema),
          ...includeRouteSchemas([401, 403, 404, 500]),
        },
      }),
      async (c) => {
        const { getUserQueryHandler } = resolveServices(c);
        const params = c.req.valid('param');
        const result = await getUserQueryHandler.execute(
          params,
          toApplicationContext(c)
        );
        return c.json(result, 200);
      }
    );

    app.openapi(
      createApiRoute({
        method: 'patch',
        path: '/users/{id}',
        summary: 'Update user',
        security: [{ bearerAuth: [] }],
        tags: [TAG],
        request: {
          params: createIdSchema(),
          body: createBodySchema(
            z.object({
              displayName: z.string().optional(),
              username: z.string().optional(),
            })
          ),
        },
        responses: {
          ...includeJsonSchema(200, 'User updated', SuccessResponseSchema),
          ...includeRouteSchemas([401, 403, 404, 500]),
        },
      }),
      async (c) => {
        const { updateUserCommandHandler } = resolveServices(c);
        const params = c.req.valid('param');
        const data = c.req.valid('json');
        await updateUserCommandHandler.execute(
          { ...params, ...data },
          toApplicationContext(c)
        );
        return c.json({ success: true }, 200);
      }
    );

    app.openapi(
      createApiRoute({
        method: 'delete',
        path: '/users/{id}',
        summary: 'Delete user',
        security: [{ bearerAuth: [] }],
        tags: [TAG],
        request: {
          params: createIdSchema(),
        },
        responses: {
          ...includeJsonSchema(200, 'User deleted', SuccessResponseSchema),
          ...includeRouteSchemas([401, 403, 404, 500]),
        },
      }),
      async (c) => {
        const { deleteUserCommandHandler } = resolveServices(c);
        const params = c.req.valid('param');
        await deleteUserCommandHandler.execute(params, toApplicationContext(c));
        return c.json({ success: true }, 200);
      }
    );
    app.openapi(
      createApiRoute({
        method: 'post',
        path: '/users/{id}/toggle-status',
        summary: 'Toggle user status',
        security: [{ bearerAuth: [] }],
        tags: [TAG],
        request: {
          params: createIdSchema(),
          body: createBodySchema(z.object({ enabled: z.boolean() })),
        },
        responses: {
          ...includeJsonSchema(200, 'Status toggled', SuccessResponseSchema),
          ...includeRouteSchemas([401, 403, 404, 500]),
        },
      }),
      async (c) => {
        const { toggleUserStatusCommandHandler } = resolveServices(c);
        const params = c.req.valid('param');
        const data = c.req.valid('json');
        await toggleUserStatusCommandHandler.execute(
          { ...params, ...data },
          toApplicationContext(c)
        );
        return c.json({ success: true }, 200);
      }
    );

    app.openapi(
      createApiRoute({
        method: 'post',
        path: '/users/{id}/user-groups',
        summary: 'Add user to group',
        description: 'Adds the specified user to a user group.',
        security: [{ bearerAuth: [] }],
        tags: [TAG],
        request: {
          params: createIdSchema(),
          body: createBodySchema(
            z.object({
              userGroupId: z.uuid(),
            })
          ),
        },
        responses: {
          ...includeJsonSchema(
            200,
            'User added to group',
            SuccessResponseSchema
          ),
          ...includeRouteSchemas([400, 401, 403, 404, 500]),
        },
      }),
      async (c) => {
        const { addUserToUserGroupCommandHandler } = resolveServices(c);
        const pathParams = c.req.valid('param');
        const params = { userId: pathParams.id };
        const data = c.req.valid('json');
        await addUserToUserGroupCommandHandler.execute(
          { ...params, ...data },
          toApplicationContext(c)
        );
        return c.json({ success: true }, 200);
      }
    );

    app.openapi(
      createApiRoute({
        method: 'delete',
        path: '/users/{id}/user-groups/{userGroupId}',
        summary: 'Remove user from group',
        description: 'Removes the specified user from a user group.',
        security: [{ bearerAuth: [] }],
        tags: [TAG],
        request: {
          params: z.object({
            id: z.uuid(),
            userGroupId: z.uuid(),
          }),
        },
        responses: {
          ...includeJsonSchema(
            200,
            'User removed from group',
            SuccessResponseSchema
          ),
          ...includeRouteSchemas([400, 401, 403, 404, 500]),
        },
      }),
      async (c) => {
        const { removeUserFromUserGroupCommandHandler } = resolveServices(c);
        const params = c.req.valid('param');
        await removeUserFromUserGroupCommandHandler.execute(
          { userId: params.id, userGroupId: params.userGroupId },
          toApplicationContext(c)
        );
        return c.json({ success: true }, 200);
      }
    );
  },
  graphql: {
    typeDefs: `
      type User {
        id: String!
        email: String!
        username: String
        displayName: String
        status: String!
        version: Int!
        createdAt: String!
        lastModifiedAt: String
        createdBy: String
        lastModifiedBy: String
      }

      type UsersResult {
        data: [User!]!
        pagination: PaginationInfo!
      }

      extend type Query {
        users(
          searchTerm: String
          userGroupId: String
          pageIndex: Int
          itemsPerPage: Int
          sortField: String
          sortOrder: String
        ): UsersResult
        user(id: String!): User
      }

      extend type Mutation {
        updateUser(id: String!, displayName: String, username: String): Boolean
        deleteUser(id: String!): Boolean
        toggleUserStatus(id: String!, enabled: Boolean!): Boolean
        addUserToUserGroup(id: String!, userGroupId: String!): Boolean
        removeUserFromUserGroup(id: String!, userGroupId: String!): Boolean
      }
    `,
    resolvers: {
      users: async (
        query: FindUsersQuery,
        c: Context<AuthContainer>,
        info: GraphQLResolveInfo
      ) => {
        const { findUsersQueryHandler } = resolveServices(c);
        return findUsersQueryHandler.execute(
          {
            ...query,
            fields: extractGraphQLFields(info, 'data'),
          },
          toApplicationContext(c)
        );
      },
      user: async (query: GetUserQuery, c: Context<AuthContainer>) => {
        const { getUserQueryHandler } = resolveServices(c);
        return getUserQueryHandler.execute(query, toApplicationContext(c));
      },
      updateUser: async (
        command: UpdateUserCommand,
        c: Context<AuthContainer>
      ) => {
        const { updateUserCommandHandler } = resolveServices(c);
        await updateUserCommandHandler.execute(
          command,
          toApplicationContext(c)
        );
        return true;
      },
      deleteUser: async (
        command: DeleteUserCommand,
        c: Context<AuthContainer>
      ) => {
        const { deleteUserCommandHandler } = resolveServices(c);
        await deleteUserCommandHandler.execute(
          command,
          toApplicationContext(c)
        );
        return true;
      },
      toggleUserStatus: async (
        command: ToggleUserStatusCommand,
        c: Context<AuthContainer>
      ) => {
        const { toggleUserStatusCommandHandler } = resolveServices(c);
        await toggleUserStatusCommandHandler.execute(
          command,
          toApplicationContext(c)
        );
        return true;
      },
      addUserToUserGroup: async (
        args: UserGroupMembershipArgs,
        c: Context<AuthContainer>
      ) => {
        const { addUserToUserGroupCommandHandler } = resolveServices(c);
        await addUserToUserGroupCommandHandler.execute(
          { userId: args.id, userGroupId: args.userGroupId },
          toApplicationContext(c)
        );
        return true;
      },
      removeUserFromUserGroup: async (
        args: UserGroupMembershipArgs,
        c: Context<AuthContainer>
      ) => {
        const { removeUserFromUserGroupCommandHandler } = resolveServices(c);
        const params = { userId: args.id, userGroupId: args.userGroupId };
        await removeUserFromUserGroupCommandHandler.execute(
          params,
          toApplicationContext(c)
        );
        return true;
      },
    },
  },
};
