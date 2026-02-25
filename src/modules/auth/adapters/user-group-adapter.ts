/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
import { z } from '@hono/zod-openapi';
import {
  createApiRoute,
  PAGINATION_MAX_ITEMS_PER_PAGE,
  type AdapterConfiguration,
  type App,
  type Context,
} from '@app/common';
import {
  USER_GROUP_READ_MODEL_FIELDS,
  USER_GROUP_READ_MODEL_SORT_FIELDS,
} from '@app/modules/auth/application/interfaces/queries/user-group-read-model';
import type { AuthContainer } from '@app/modules/auth/interfaces';

const TAG = 'user-group';

const UserGroupSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    version: z.number(),
    createdAt: z.string().datetime(),
    createdBy: z.string().nullable().optional(),
    lastModifiedAt: z.string().datetime(),
    lastModifiedBy: z.string().nullable().optional(),
  })
  .openapi('UserGroup');

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
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  name: z.string().max(255),
                  description: z.string().max(2000).optional(),
                }),
              },
            },
          },
        },
        responses: {
          201: {
            content: {
              'application/json': {
                schema: z.object({ id: z.string() }),
              },
            },
            description: 'Created',
          },
          400: createErrorResponse('Bad request'),
          401: createErrorResponse('Unauthorized'),
          403: createErrorResponse('Forbidden'),
          500: createErrorResponse('Internal server error'),
        },
      }),
      async (c) => {
        const { createUserGroupCommandHandler } = c.var.container.cradle;
        const body = c.req.valid('json');
        const result = await createUserGroupCommandHandler.execute(
          body as any,
          c as any
        );
        return c.json(result as any, 201);
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
          query: z.object({
            searchTerm: z.string().optional(),
            pageIndex: z.coerce.number().min(0).optional(),
            itemsPerPage: z.coerce
              .number()
              .min(1)
              .max(PAGINATION_MAX_ITEMS_PER_PAGE)
              .optional(),
            fields: z
              .union([
                z.enum(USER_GROUP_READ_MODEL_FIELDS as any),
                z.array(z.enum(USER_GROUP_READ_MODEL_FIELDS as any)),
              ])
              .optional(),
            sortField: z
              .enum(USER_GROUP_READ_MODEL_SORT_FIELDS as any)
              .optional(),
            sortOrder: z.enum(['ASC', 'DESC']).optional(),
          }),
        },
        responses: {
          200: {
            content: {
              'application/json': {
                schema: z.object({
                  data: z.array(UserGroupSchema),
                  pagination: z.object({
                    count: z.number(),
                    pageIndex: z.number(),
                  }),
                }),
              },
            },
            description: 'List of user groups',
          },
          401: createErrorResponse('Unauthorized'),
          403: createErrorResponse('Forbidden'),
          500: createErrorResponse('Internal server error'),
        },
      }),
      async (c) => {
        const { findUserGroupsQueryHandler } = c.var.container.cradle;
        const query = c.req.valid('query');

        let fieldsArray: string[] | undefined;
        if (query.fields) {
          fieldsArray = Array.isArray(query.fields)
            ? query.fields
            : [query.fields];
        }

        const typedQuery = { ...query, fields: fieldsArray as any };

        const result = await findUserGroupsQueryHandler.execute(
          typedQuery as any,
          c as any
        );
        return c.json(result as any, 200);
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
          params: z.object({
            id: z.string().uuid(),
          }),
        },
        responses: {
          200: {
            content: {
              'application/json': {
                schema: UserGroupSchema,
              },
            },
            description: 'User group details',
          },
          401: createErrorResponse('Unauthorized'),
          403: createErrorResponse('Forbidden'),
          404: createErrorResponse('Not found'),
          500: createErrorResponse('Internal server error'),
        },
      }),
      async (c) => {
        const { getUserGroupQueryHandler } = c.var.container.cradle;
        const { id } = c.req.valid('param');
        const result = await getUserGroupQueryHandler.execute({ id }, c as any);
        return c.json(result as any, 200);
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
          params: z.object({
            id: z.string().uuid(),
          }),
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  name: z.string().max(255).optional(),
                  description: z.string().max(2000).optional(),
                }),
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Updated successfully',
            content: { 'application/json': { schema: UserGroupSchema } },
          },
          400: createErrorResponse('Bad request'),
          401: createErrorResponse('Unauthorized'),
          403: createErrorResponse('Forbidden'),
          404: createErrorResponse('Not found'),
          500: createErrorResponse('Internal server error'),
        },
      }),
      async (c) => {
        const { updateUserGroupCommandHandler } = c.var.container.cradle;
        const { id } = c.req.valid('param');
        const body = c.req.valid('json');
        await updateUserGroupCommandHandler.execute(
          { id, ...body } as any,
          c as any
        );
        return c.json({ id, ...body } as any, 200);
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
          params: z.object({
            id: z.string().uuid(),
          }),
        },
        responses: {
          200: {
            description: 'Deleted successfully',
            content: {
              'application/json': {
                schema: z.object({ success: z.boolean() }),
              },
            },
          },
          401: createErrorResponse('Unauthorized'),
          403: createErrorResponse('Forbidden'),
          404: createErrorResponse('Not found'),
          500: createErrorResponse('Internal server error'),
        },
      }),
      async (c) => {
        const { deleteUserGroupCommandHandler } = c.var.container.cradle;
        const { id } = c.req.valid('param');
        await deleteUserGroupCommandHandler.execute({ id } as any, c as any);
        return c.json({ success: true } as any, 200);
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
          params: z.object({
            id: z.string().uuid(),
          }),
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  roleId: z.string(),
                }),
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Role added successfully',
            content: {
              'application/json': {
                schema: z.object({ success: z.boolean() }),
              },
            },
          },
          400: createErrorResponse('Bad request'),
          401: createErrorResponse('Unauthorized'),
          403: createErrorResponse('Forbidden'),
          404: createErrorResponse('Not found'),
          500: createErrorResponse('Internal server error'),
        },
      }),
      async (c) => {
        const { addRoleToUserGroupCommandHandler } = c.var.container.cradle;
        const { id } = c.req.valid('param');
        const { roleId } = c.req.valid('json');
        await addRoleToUserGroupCommandHandler.execute(
          { userGroupId: id, roleId } as any,
          c as any
        );
        return c.json({ success: true } as any, 200);
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
            id: z.string().uuid(),
            roleId: z.string(),
          }),
        },
        responses: {
          200: {
            description: 'Role removed successfully',
            content: {
              'application/json': {
                schema: z.object({ success: z.boolean() }),
              },
            },
          },
          400: createErrorResponse('Bad request'),
          401: createErrorResponse('Unauthorized'),
          403: createErrorResponse('Forbidden'),
          404: createErrorResponse('Not found'),
          500: createErrorResponse('Internal server error'),
        },
      }),
      async (c) => {
        const { removeRoleFromUserGroupCommandHandler } =
          c.var.container.cradle;
        const { id, roleId } = c.req.valid('param');
        await removeRoleFromUserGroupCommandHandler.execute(
          { userGroupId: id, roleId } as any,
          c as any
        );
        return c.json({ success: true } as any, 200);
      }
    );

    app.openapi(
      createApiRoute({
        method: 'post',
        path: '/user-groups/{id}/users',
        tags: [TAG],
        summary: 'Add a user to a user group',
        description: 'Adds a single user to the specified user group.',
        security: [{ bearerAuth: [] }],
        request: {
          params: z.object({
            id: z.string().uuid(),
          }),
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  userId: z.string(),
                }),
              },
            },
          },
        },
        responses: {
          200: {
            description: 'User added successfully',
            content: {
              'application/json': {
                schema: z.object({ success: z.boolean() }),
              },
            },
          },
          400: createErrorResponse('Bad request'),
          401: createErrorResponse('Unauthorized'),
          403: createErrorResponse('Forbidden'),
          404: createErrorResponse('Not found'),
          500: createErrorResponse('Internal server error'),
        },
      }),
      async (c) => {
        const { addUserToUserGroupCommandHandler } = c.var.container.cradle;
        const { id } = c.req.valid('param');
        const { userId } = c.req.valid('json');
        await addUserToUserGroupCommandHandler.execute(
          { userGroupId: id, userId } as any,
          c as any
        );
        return c.json({ success: true } as any, 200);
      }
    );

    app.openapi(
      createApiRoute({
        method: 'delete',
        path: '/user-groups/{id}/users/{userId}',
        tags: [TAG],
        summary: 'Remove a user from a user group',
        description: 'Removes a single user from the specified user group.',
        security: [{ bearerAuth: [] }],
        request: {
          params: z.object({
            id: z.string().uuid(),
            userId: z.string(),
          }),
        },
        responses: {
          200: {
            description: 'User removed successfully',
            content: {
              'application/json': {
                schema: z.object({ success: z.boolean() }),
              },
            },
          },
          400: createErrorResponse('Bad request'),
          401: createErrorResponse('Unauthorized'),
          403: createErrorResponse('Forbidden'),
          404: createErrorResponse('Not found'),
          500: createErrorResponse('Internal server error'),
        },
      }),
      async (c) => {
        const { removeUserFromUserGroupCommandHandler } =
          c.var.container.cradle;
        const { id, userId } = c.req.valid('param');
        await removeUserFromUserGroupCommandHandler.execute(
          { userGroupId: id, userId } as any,
          c as any
        );
        return c.json({ success: true } as any, 200);
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

      extend type Query {
        userGroups(searchTerm: String, pageIndex: Int, itemsPerPage: Int): [UserGroup]
        userGroup(id: String!): UserGroup
      }

      extend type Mutation {
        createUserGroup(name: String!, description: String): UserGroup
        updateUserGroup(id: String!, name: String, description: String): UserGroup
        deleteUserGroup(id: String!): Boolean
        addRoleToUserGroup(id: String!, roleId: String!): Boolean
        removeRoleFromUserGroup(id: String!, roleId: String!): Boolean
        addUserToUserGroup(id: String!, userId: String!): Boolean
        removeUserFromUserGroup(id: String!, userId: String!): Boolean
      }
    `,
    resolvers: {
      userGroups: async (args: any, c: Context<AuthContainer>) => {
        const { findUserGroupsQueryHandler } = c.var.container.cradle;
        const result = await findUserGroupsQueryHandler.execute(args, c as any);
        return result.data;
      },
      userGroup: async ({ id }: { id: string }, c: Context<AuthContainer>) => {
        const { getUserGroupQueryHandler } = c.var.container.cradle;
        return getUserGroupQueryHandler.execute({ id }, c as any);
      },
      createUserGroup: async (args: any, c: Context<AuthContainer>) => {
        const { createUserGroupCommandHandler } = c.var.container.cradle;
        return createUserGroupCommandHandler.execute(args, c as any);
      },
      updateUserGroup: async (args: any, c: Context<AuthContainer>) => {
        const { updateUserGroupCommandHandler } = c.var.container.cradle;
        await updateUserGroupCommandHandler.execute(args, c as any);
        return args;
      },
      deleteUserGroup: async (
        { id }: { id: string },
        c: Context<AuthContainer>
      ) => {
        const { deleteUserGroupCommandHandler } = c.var.container.cradle;
        await deleteUserGroupCommandHandler.execute({ id } as any, c as any);
        return true;
      },
      addRoleToUserGroup: async (
        { id, roleId }: { id: string; roleId: string },
        c: Context<AuthContainer>
      ) => {
        const { addRoleToUserGroupCommandHandler } = c.var.container.cradle;
        await addRoleToUserGroupCommandHandler.execute(
          { userGroupId: id, roleId } as any,
          c as any
        );
        return true;
      },
      removeRoleFromUserGroup: async (
        { id, roleId }: { id: string; roleId: string },
        c: Context<AuthContainer>
      ) => {
        const { removeRoleFromUserGroupCommandHandler } =
          c.var.container.cradle;
        await removeRoleFromUserGroupCommandHandler.execute(
          { userGroupId: id, roleId } as any,
          c as any
        );
        return true;
      },
      addUserToUserGroup: async (
        { id, userId }: { id: string; userId: string },
        c: Context<AuthContainer>
      ) => {
        const { addUserToUserGroupCommandHandler } = c.var.container.cradle;
        await addUserToUserGroupCommandHandler.execute(
          { userGroupId: id, userId } as any,
          c as any
        );
        return true;
      },
      removeUserFromUserGroup: async (
        { id, userId }: { id: string; userId: string },
        c: Context<AuthContainer>
      ) => {
        const { removeUserFromUserGroupCommandHandler } =
          c.var.container.cradle;
        await removeUserFromUserGroupCommandHandler.execute(
          { userGroupId: id, userId } as any,
          c as any
        );
        return true;
      },
    },
  },
};
