/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import { z } from '@hono/zod-openapi';
import {
  createApiRoute,
  PAGINATION_MAX_ITEMS_PER_PAGE,
  type AdapterConfiguration,
  type App,
  type Context,
} from '@app/common';
import {
  ROLE_READ_MODEL_FIELDS,
  ROLE_READ_MODEL_SORT_FIELDS,
} from '@app/modules/auth/application/interfaces/queries/role-read-model';
import type { AuthContainer } from '@app/modules/auth/interfaces';

const TAG = 'role';

const RoleSchema = z
  .object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    description: z.string(),
    version: z.number(),
    createdAt: z.string().datetime(),
    createdBy: z.string().nullable().optional(),
    lastModifiedAt: z.string().datetime(),
    lastModifiedBy: z.string().nullable().optional(),
  })
  .openapi('Role');

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

export const roleAdapter: AdapterConfiguration<AuthContainer> = {
  registerRoutes(app: App<AuthContainer>): void {
    app.openapi(
      createApiRoute({
        method: 'get',
        path: '/roles',
        tags: [TAG],
        summary: 'Find roles by search term with pagination',
        description:
          'Searches for roles by name or description with pagination support. If no searchTerm is provided, returns all roles.',
        security: [{ bearerAuth: [] }],
        request: {
          query: z.object({
            searchTerm: z.string().optional(),
            userGroupId: z.string().uuid().optional(),
            pageIndex: z.coerce.number().min(0).optional(),
            itemsPerPage: z.coerce
              .number()
              .min(1)
              .max(PAGINATION_MAX_ITEMS_PER_PAGE)
              .optional(),
            fields: z
              .union([
                z.enum(ROLE_READ_MODEL_FIELDS as any),
                z.array(z.enum(ROLE_READ_MODEL_FIELDS as any)),
              ])
              .optional(),
            sortField: z.enum(ROLE_READ_MODEL_SORT_FIELDS as any).optional(),
            sortOrder: z.enum(['ASC', 'DESC']).optional(),
          }),
        },
        responses: {
          200: {
            content: {
              'application/json': {
                schema: z.object({
                  data: z.array(RoleSchema),
                  pagination: z.object({
                    count: z.number(),
                    pageIndex: z.number(),
                  }),
                }),
              },
            },
            description: 'List of roles',
          },
          401: createErrorResponse('Unauthorized'),
          403: createErrorResponse('Forbidden'),
          500: createErrorResponse('Internal server error'),
        },
      }),
      async (c) => {
        const { findRolesQueryHandler } = c.var.container.cradle;
        const query = c.req.valid('query');

        let fieldsArray: string[] | undefined;
        if (query.fields) {
          fieldsArray = Array.isArray(query.fields)
            ? query.fields
            : [query.fields];
        }

        const typedQuery = {
          ...query,
          fields: fieldsArray,
        };

        const result = await findRolesQueryHandler.execute(
          typedQuery as any,
          c as any
        );
        return c.json(result as any, 200);
      }
    );

    app.openapi(
      createApiRoute({
        method: 'get',
        path: '/roles/{id}',
        tags: [TAG],
        summary: 'Get role by ID',
        description: 'Retrieves a specific role by its unique identifier.',
        security: [{ bearerAuth: [] }],
        request: {
          params: z.object({
            id: z.string(),
          }),
        },
        responses: {
          200: {
            content: {
              'application/json': {
                schema: RoleSchema,
              },
            },
            description: 'Role details',
          },
          401: createErrorResponse('Unauthorized'),
          403: createErrorResponse('Forbidden'),
          404: createErrorResponse('Not found'),
          500: createErrorResponse('Internal server error'),
        },
      }),
      async (c) => {
        const { getRoleQueryHandler } = c.var.container.cradle;
        const { id } = c.req.valid('param');
        const result = await getRoleQueryHandler.execute({ id }, c as any);
        return c.json(result as any, 200);
      }
    );
  },
  graphql: {
    typeDefs: `
      type Role {
        id: String!
        code: String!
        name: String!
        description: String!
        version: Int!
        createdAt: String!
        createdBy: String
        lastModifiedAt: String!
        lastModifiedBy: String
      }

      extend type Query {
        roles(searchTerm: String, userGroupId: String, pageIndex: Int, itemsPerPage: Int): [Role]
        role(id: String!): Role
      }
    `,
    resolvers: {
      roles: async (args: any, c: Context<AuthContainer>) => {
        const { findRolesQueryHandler } = c.var.container.cradle;
        const result = await findRolesQueryHandler.execute(args, c as any);
        return result.data;
      },
      role: async ({ id }: { id: string }, c: Context<AuthContainer>) => {
        const { getRoleQueryHandler } = c.var.container.cradle;
        return getRoleQueryHandler.execute({ id }, c as any);
      },
    },
  },
};
