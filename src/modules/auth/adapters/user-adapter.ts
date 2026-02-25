/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import { z } from '@hono/zod-openapi';
import {
  createApiRoute,
  type AdapterConfiguration,
  type App,
  type Context,
} from '@app/common';
import type { AuthContainer } from '@app/modules/auth/interfaces';

const UserSchema = z.object({
  id: z.string().openapi({ example: '1' }),
  name: z.string().openapi({ example: 'John Doe' }),
  email: z.string().email().openapi({ example: 'john@example.com' }),
});

export const userAdapter: AdapterConfiguration<AuthContainer> = {
  registerRoutes(app: App<AuthContainer>): void {
    // GET /users
    app.openapi(
      createApiRoute({
        method: 'get',
        path: '/users',
        summary: 'List users',
        tags: ['users'],
        request: {
          query: z.object({
            name: z.string().optional().openapi({ example: 'John' }),
          }),
        },
        responses: {
          200: {
            content: {
              'application/json': {
                schema: z.array(UserSchema),
              },
            },
            description: 'List of users',
          },
        },
      }),
      async (c) => {
        const { findUsersQueryHandler } = c.var.container.cradle;
        const name = c.req.query('name');
        const users = await findUsersQueryHandler.execute(
          { searchTerm: name } as any,
          c as any
        );
        return c.json(users.data as any);
      }
    );

    // GET /users/:id
    app.openapi(
      createApiRoute({
        method: 'get',
        path: '/users/{id}',
        summary: 'Get user by ID',
        tags: ['users'],
        request: {
          params: z.object({
            id: z.string().openapi({ example: '1' }),
          }),
        },
        responses: {
          200: {
            content: {
              'application/json': {
                schema: UserSchema,
              },
            },
            description: 'User details',
          },
          404: {
            description: 'User not found',
          },
        },
      }),
      async (c) => {
        const { getUserQueryHandler } = c.var.container.cradle;
        const { id } = c.req.valid('param');
        const user = await getUserQueryHandler.execute({ id }, c as any);
        if (!user) {
          return c.json({ error: 'User not found' }, 404);
        }
        return c.json(user as any);
      }
    );

    // PATCH /users/:id
    app.openapi(
      createApiRoute({
        method: 'patch',
        path: '/users/{id}',
        summary: 'Update user',
        tags: ['users'],
        request: {
          params: z.object({
            id: z.string().openapi({ example: '1' }),
          }),
          body: {
            content: {
              'application/json': {
                schema: UserSchema.omit({ id: true }).partial(),
              },
            },
          },
        },
        responses: {
          200: {
            content: {
              'application/json': {
                schema: UserSchema,
              },
            },
            description: 'User updated',
          },
          404: {
            description: 'User not found',
          },
        },
      }),
      async (c) => {
        const { updateUserCommandHandler } = c.var.container.cradle;
        const { id } = c.req.valid('param');
        const data = c.req.valid('json');
        await updateUserCommandHandler.execute(
          { id, ...data } as any,
          c as any
        );
        return c.json({ id, ...data } as any);
      }
    );

    // DELETE /users/:id
    app.openapi(
      createApiRoute({
        method: 'delete',
        path: '/users/{id}',
        summary: 'Delete user',
        tags: ['users'],
        request: {
          params: z.object({
            id: z.string().openapi({ example: '1' }),
          }),
        },
        responses: {
          200: {
            content: {
              'application/json': {
                schema: z.object({ success: z.boolean() }),
              },
            },
            description: 'User deleted',
          },
          404: {
            description: 'User not found',
          },
        },
      }),
      async (c) => {
        const { deleteUserCommandHandler } = c.var.container.cradle;
        const { id } = c.req.valid('param');
        await deleteUserCommandHandler.execute({ id }, c as any);
        return c.json({ success: true });
      }
    );
    // POST /users/:id/toggle-status
    app.openapi(
      createApiRoute({
        method: 'post',
        path: '/users/{id}/toggle-status',
        summary: 'Toggle user status',
        tags: ['users'],
        request: {
          params: z.object({
            id: z.string().openapi({ example: '1' }),
          }),
          body: {
            content: {
              'application/json': {
                schema: z.object({ enabled: z.boolean() }),
              },
            },
          },
        },
        responses: {
          200: {
            content: {
              'application/json': {
                schema: z.object({ success: z.boolean() }),
              },
            },
            description: 'Status toggled',
          },
          404: {
            description: 'User not found',
          },
        },
      }),
      async (c) => {
        const { toggleUserStatusCommandHandler } = c.var.container.cradle;
        const { id } = c.req.valid('param');
        const { enabled } = c.req.valid('json');
        await toggleUserStatusCommandHandler.execute({ id, enabled }, c as any);
        return c.json({ success: true });
      }
    );
  },
  graphql: {
    typeDefs: `
      type User {
        id: String
        name: String
        email: String
      }

      extend type Query {
        users(name: String): [User]
        user(id: String!): User
      }

      extend type Mutation {
        updateUser(id: String!, name: String, email: String): User
        deleteUser(id: String!): Boolean
        toggleUserStatus(id: String!, enabled: Boolean!): Boolean
      }
    `,
    resolvers: {
      users: async ({ name }: { name?: string }, c: Context<AuthContainer>) => {
        const { findUsersQueryHandler } = c.var.container.cradle;
        const res = await findUsersQueryHandler.execute(
          { searchTerm: name } as any,
          c as any
        );
        return res.data;
      },
      user: async ({ id }: { id: string }, c: Context<AuthContainer>) => {
        const { getUserQueryHandler } = c.var.container.cradle;
        return getUserQueryHandler.execute({ id }, c as any);
      },
      updateUser: async (
        { id, ...data }: { id: string; name?: string; email?: string },
        c: Context<AuthContainer>
      ) => {
        const { updateUserCommandHandler } = c.var.container.cradle;
        await updateUserCommandHandler.execute(
          { id, ...data } as any,
          c as any
        );
        return { id, ...data };
      },
      deleteUser: async ({ id }: { id: string }, c: Context<AuthContainer>) => {
        const { deleteUserCommandHandler } = c.var.container.cradle;
        await deleteUserCommandHandler.execute({ id }, c as any);
        return true;
      },
      toggleUserStatus: async (
        { id, enabled }: { id: string; enabled: boolean },
        c: Context<AuthContainer>
      ) => {
        const { toggleUserStatusCommandHandler } = c.var.container.cradle;
        await toggleUserStatusCommandHandler.execute({ id, enabled }, c as any);
        return true;
      },
    },
  },
};
