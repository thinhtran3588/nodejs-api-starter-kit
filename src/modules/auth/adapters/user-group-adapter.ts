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
import {
  USER_GROUP_READ_MODEL_FIELDS,
  USER_GROUP_READ_MODEL_SORT_FIELDS,
  type AuthContainer,
  type CreateUserGroupCommand,
  type FindUserGroupsQuery,
  type UpdateUserGroupCommand,
} from '@app/modules/auth/interfaces';

const TAG = 'user-group';
const UserGroupSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    description: z.string().nullable().optional(),
    version: z.number(),
    createdAt: z.iso.datetime(),
    createdBy: z.string().nullable().optional(),
    lastModifiedAt: z.iso.datetime().optional(),
    lastModifiedBy: z.string().nullable().optional(),
  })
  .openapi('UserGroup');

interface UserGroupIdArgs {
  id: string;
}

interface UserGroupRoleArgs {
  id: string;
  roleId: string;
}

export const userGroupAdapter: AdapterConfiguration<AuthContainer> = {
  registerRoutes(app: App<AuthContainer>): void {
    app.openapi(
      createApiRoute({
        method: 'post',
        path: '/user-groups',
        tags: [TAG],
        summary: 'Create a new user group',
        description:
          'Creates a new user group with the provided name and optional description.',
        security: [{ bearerAuth: [] }],
        request: {
          body: createBodySchema(
            z.object({
              name: z.string().max(255),
              description: z.string().max(2000).optional(),
            })
          ),
        },
        responses: {
          ...includeJsonSchema(201, 'Created', z.object({ id: z.uuid() })),
          ...includeRouteSchemas([400, 401, 403, 500]),
        },
      }),
      async (c) => {
        const { createUserGroupCommandHandler } = resolveServices(c);
        const data = c.req.valid('json');
        const result = await createUserGroupCommandHandler.execute(
          data,
          toApplicationContext(c)
        );
        return c.json(result, 201);
      }
    );

    app.openapi(
      createApiRoute({
        method: 'get',
        path: '/user-groups',
        tags: [TAG],
        summary: 'Find user groups by search term with pagination',
        description:
          'Searches for user groups by name or description with pagination support.',
        security: [{ bearerAuth: [] }],
        request: {
          query: createFindQuerySchema(
            USER_GROUP_READ_MODEL_FIELDS,
            USER_GROUP_READ_MODEL_SORT_FIELDS
          ),
        },
        responses: {
          ...includeJsonSchema(
            200,
            'List of user groups',
            createFindQueryResultSchema(UserGroupSchema)
          ),
          ...includeRouteSchemas([401, 403, 500]),
        },
      }),
      async (c) => {
        const { findUserGroupsQueryHandler } = resolveServices(c);
        const query = c.req.valid('query');

        const result = await findUserGroupsQueryHandler.execute(
          query,
          toApplicationContext(c)
        );
        return c.json(result, 200);
      }
    );

    app.openapi(
      createApiRoute({
        method: 'get',
        path: '/user-groups/{id}',
        tags: [TAG],
        summary: 'Get user group by ID',
        description:
          'Retrieves a specific user group by its unique identifier.',
        security: [{ bearerAuth: [] }],
        request: {
          params: createIdSchema(),
        },
        responses: {
          ...includeJsonSchema(200, 'User group details', UserGroupSchema),
          ...includeRouteSchemas([401, 403, 404, 500]),
        },
      }),
      async (c) => {
        const { getUserGroupQueryHandler } = resolveServices(c);
        const params = c.req.valid('param');
        const result = await getUserGroupQueryHandler.execute(
          params,
          toApplicationContext(c)
        );
        return c.json(result, 200);
      }
    );

    app.openapi(
      createApiRoute({
        method: 'put',
        path: '/user-groups/{id}',
        tags: [TAG],
        summary: 'Update user group',
        description:
          'Updates an existing user group. Both name and description can be updated.',
        security: [{ bearerAuth: [] }],
        request: {
          params: createIdSchema(),
          body: createBodySchema(
            z.object({
              name: z.string().max(255).optional(),
              description: z.string().max(2000).optional(),
            })
          ),
        },
        responses: {
          ...includeJsonSchema(
            200,
            'Updated successfully',
            SuccessResponseSchema
          ),
          ...includeRouteSchemas([400, 401, 403, 404, 500]),
        },
      }),
      async (c) => {
        const { updateUserGroupCommandHandler } = resolveServices(c);
        const params = c.req.valid('param');
        const data = c.req.valid('json');
        await updateUserGroupCommandHandler.execute(
          { ...params, ...data },
          toApplicationContext(c)
        );
        return c.json({ success: true }, 200);
      }
    );

    app.openapi(
      createApiRoute({
        method: 'delete',
        path: '/user-groups/{id}',
        tags: [TAG],
        summary: 'Delete user group',
        description:
          'Deletes a user group by its unique identifier. This operation is permanent.',
        security: [{ bearerAuth: [] }],
        request: {
          params: createIdSchema(),
        },
        responses: {
          ...includeJsonSchema(
            200,
            'Deleted successfully',
            SuccessResponseSchema
          ),
          ...includeRouteSchemas([401, 403, 404, 500]),
        },
      }),
      async (c) => {
        const { deleteUserGroupCommandHandler } = resolveServices(c);
        const params = c.req.valid('param');
        await deleteUserGroupCommandHandler.execute(
          params,
          toApplicationContext(c)
        );
        return c.json({ success: true }, 200);
      }
    );

    app.openapi(
      createApiRoute({
        method: 'post',
        path: '/user-groups/{id}/roles',
        tags: [TAG],
        summary: 'Add a role to a user group',
        description: 'Adds a single role to the specified user group.',
        security: [{ bearerAuth: [] }],
        request: {
          params: createIdSchema(),
          body: createBodySchema(
            z.object({
              roleId: z.uuid(),
            })
          ),
        },
        responses: {
          ...includeJsonSchema(
            200,
            'Role added successfully',
            SuccessResponseSchema
          ),
          ...includeRouteSchemas([400, 401, 403, 404, 500]),
        },
      }),
      async (c) => {
        const { addRoleToUserGroupCommandHandler } = resolveServices(c);
        const data = c.req.valid('json');
        const params = c.req.valid('param');
        await addRoleToUserGroupCommandHandler.execute(
          { userGroupId: params.id, roleId: data.roleId },
          toApplicationContext(c)
        );
        return c.json({ success: true }, 200);
      }
    );

    app.openapi(
      createApiRoute({
        method: 'delete',
        path: '/user-groups/{id}/roles/{roleId}',
        tags: [TAG],
        summary: 'Remove a role from a user group',
        description: 'Removes a single role from the specified user group.',
        security: [{ bearerAuth: [] }],
        request: {
          params: z.object({
            id: z.uuid(),
            roleId: z.uuid(),
          }),
        },
        responses: {
          ...includeJsonSchema(
            200,
            'Role removed successfully',
            SuccessResponseSchema
          ),
          ...includeRouteSchemas([400, 401, 403, 404, 500]),
        },
      }),
      async (c) => {
        const { removeRoleFromUserGroupCommandHandler } = resolveServices(c);
        const params = c.req.valid('param');
        await removeRoleFromUserGroupCommandHandler.execute(
          { userGroupId: params.id, roleId: params.roleId },
          toApplicationContext(c)
        );
        return c.json({ success: true }, 200);
      }
    );
  },
  graphql: {
    typeDefs: `
      type UserGroup {
        id: String!
        name: String!
        description: String
        version: Int!
        createdAt: String!
        createdBy: String
        lastModifiedAt: String!
        lastModifiedBy: String
      }

      type UserGroupsResult {
        data: [UserGroup!]!
        pagination: PaginationInfo!
      }

      extend type Query {
        userGroups(searchTerm: String, pageIndex: Int, itemsPerPage: Int): UserGroupsResult
        userGroup(id: String!): UserGroup
      }

      extend type Mutation {
        createUserGroup(name: String!, description: String): UserGroup
        updateUserGroup(id: String!, name: String, description: String): UserGroup
        deleteUserGroup(id: String!): Boolean
        addRoleToUserGroup(id: String!, roleId: String!): Boolean
        removeRoleFromUserGroup(id: String!, roleId: String!): Boolean
      }
    `,
    resolvers: {
      userGroups: async (
        query: FindUserGroupsQuery,
        c: Context<AuthContainer>,
        info: GraphQLResolveInfo
      ) => {
        const { findUserGroupsQueryHandler } = resolveServices(c);
        return findUserGroupsQueryHandler.execute(
          {
            ...query,
            fields: extractGraphQLFields(info, 'data'),
          },
          toApplicationContext(c)
        );
      },
      userGroup: async (query: UserGroupIdArgs, c: Context<AuthContainer>) => {
        const { getUserGroupQueryHandler } = resolveServices(c);
        return getUserGroupQueryHandler.execute(query, toApplicationContext(c));
      },
      createUserGroup: async (
        command: CreateUserGroupCommand,
        c: Context<AuthContainer>
      ) => {
        const { createUserGroupCommandHandler } = resolveServices(c);
        return createUserGroupCommandHandler.execute(
          command,
          toApplicationContext(c)
        );
      },
      updateUserGroup: async (
        command: UpdateUserGroupCommand,
        c: Context<AuthContainer>
      ) => {
        const { updateUserGroupCommandHandler } = resolveServices(c);
        await updateUserGroupCommandHandler.execute(
          command,
          toApplicationContext(c)
        );
        return command;
      },
      deleteUserGroup: async (
        command: UserGroupIdArgs,
        c: Context<AuthContainer>
      ) => {
        const { deleteUserGroupCommandHandler } = resolveServices(c);
        await deleteUserGroupCommandHandler.execute(
          command,
          toApplicationContext(c)
        );
        return true;
      },
      addRoleToUserGroup: async (
        args: UserGroupRoleArgs,
        c: Context<AuthContainer>
      ) => {
        const { addRoleToUserGroupCommandHandler } = resolveServices(c);
        await addRoleToUserGroupCommandHandler.execute(
          { userGroupId: args.id, roleId: args.roleId },
          toApplicationContext(c)
        );
        return true;
      },
      removeRoleFromUserGroup: async (
        args: UserGroupRoleArgs,
        c: Context<AuthContainer>
      ) => {
        const { removeRoleFromUserGroupCommandHandler } = resolveServices(c);
        await removeRoleFromUserGroupCommandHandler.execute(
          { userGroupId: args.id, roleId: args.roleId },
          toApplicationContext(c)
        );
        return true;
      },
    },
  },
};
