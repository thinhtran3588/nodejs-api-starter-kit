import { z } from '@hono/zod-openapi';
import type { GraphQLResolveInfo } from 'graphql';
import {
  createApiRoute,
  createFindQueryResultSchema,
  createFindQuerySchema,
  createIdSchema,
  extractGraphQLFields,
  includeJsonSchema,
  includeRouteSchemas,
  resolveServices,
  toApplicationContext,
  type AdapterConfiguration,
  type App,
  type Context,
} from '@app/common';
import {
  ROLE_READ_MODEL_FIELDS,
  ROLE_READ_MODEL_SORT_FIELDS,
  type AuthContainer,
  type FindRolesQuery,
  type GetRoleQuery,
} from '@app/modules/auth/interfaces';

const TAG = 'role';
const RoleSchema = z
  .object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    description: z.string(),
    version: z.number(),
    createdAt: z.iso.datetime(),
    createdBy: z.string().nullable().optional(),
    lastModifiedAt: z.iso.datetime().optional(),
    lastModifiedBy: z.string().nullable().optional(),
  })
  .openapi('Role');

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
          query: createFindQuerySchema(
            ROLE_READ_MODEL_FIELDS,
            ROLE_READ_MODEL_SORT_FIELDS,
            {
              userGroupId: z.uuid().optional(),
            }
          ),
        },
        responses: {
          ...includeJsonSchema(
            200,
            'List of roles',
            createFindQueryResultSchema(RoleSchema)
          ),
          ...includeRouteSchemas([401, 403, 500]),
        },
      }),
      async (c) => {
        const { findRolesQueryHandler } = resolveServices(c);
        const query = c.req.valid('query');
        const result = await findRolesQueryHandler.execute(
          query,
          toApplicationContext(c)
        );

        return c.json(result, 200);
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
          params: createIdSchema(),
        },
        responses: {
          ...includeJsonSchema(200, 'Role details', RoleSchema),
          ...includeRouteSchemas([401, 403, 404, 500]),
        },
      }),
      async (c) => {
        const { getRoleQueryHandler } = resolveServices(c);
        const params = c.req.valid('param');
        const result = await getRoleQueryHandler.execute(
          params,
          toApplicationContext(c)
        );
        return c.json(result, 200);
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

      type RolesResult {
        data: [Role!]!
        pagination: PaginationInfo!
      }

      extend type Query {
        roles(searchTerm: String, userGroupId: String, pageIndex: Int, itemsPerPage: Int): RolesResult
        role(id: String!): Role
      }
    `,
    resolvers: {
      roles: async (
        query: FindRolesQuery,
        c: Context<AuthContainer>,
        info: GraphQLResolveInfo
      ) => {
        const { findRolesQueryHandler } = resolveServices(c);
        return findRolesQueryHandler.execute(
          {
            ...query,
            fields: extractGraphQLFields(info, 'data'),
          },
          toApplicationContext(c)
        );
      },
      role: async (query: GetRoleQuery, c: Context<AuthContainer>) => {
        const { getRoleQueryHandler } = resolveServices(c);
        return getRoleQueryHandler.execute(query, toApplicationContext(c));
      },
    },
  },
};
