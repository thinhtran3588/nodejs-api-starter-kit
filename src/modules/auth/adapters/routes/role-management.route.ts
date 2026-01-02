import type { FastifyInstance, FastifyRequest } from 'fastify';
import { PAGINATION_MAX_ITEMS_PER_PAGE } from '@app/common/constants';
import type { RouteConfiguration } from '@app/common/interfaces/configuration';
import { includeRouteSchemas } from '@app/common/utils/include-route-schemas';
import type { FindRolesQueryParams } from '@app/modules/auth/application/interfaces/queries/role-query-params';
import {
  ROLE_READ_MODEL_FIELDS,
  ROLE_READ_MODEL_SORT_FIELDS,
} from '@app/modules/auth/application/interfaces/queries/role.read-model';
import { FindRolesQueryHandler } from '@app/modules/auth/application/query-handlers/find-roles.query-handler';
import { GetRoleQueryHandler } from '@app/modules/auth/application/query-handlers/get-role.query-handler';

const TAG = 'role';

const roleResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    code: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    version: { type: 'number' },
    createdAt: { type: 'string', format: 'date-time' },
    createdBy: { type: 'string', nullable: true },
    lastModifiedAt: { type: 'string', format: 'date-time' },
    lastModifiedBy: { type: 'string', nullable: true },
  },
} as const;

function register(app: FastifyInstance): void {
  const { diContainer } = app;
  const findRolesQueryHandler = diContainer.resolve<FindRolesQueryHandler>(
    'findRolesQueryHandler'
  );
  const getRoleQueryHandler = diContainer.resolve<GetRoleQueryHandler>(
    'getRoleQueryHandler'
  );

  // Find roles by search term with pagination
  app.get(
    '/roles',
    {
      schema: {
        summary: 'Find roles by search term with pagination',
        description:
          'Searches for roles by name or description with pagination support. If no searchTerm is provided, returns all roles.',
        tags: [TAG],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            searchTerm: {
              type: 'string',
              description:
                'Search term to match against name or description (case-insensitive, accent-insensitive)',
            },
            userGroupId: {
              type: 'string',
              description: 'Filter roles by user group ID (UUID)',
            },
            pageIndex: {
              type: 'number',
              description: 'Zero-based page index (0 = first page)',
              minimum: 0,
            },
            itemsPerPage: {
              type: 'number',
              description: 'Number of items per page (max 50)',
              minimum: 1,
              maximum: PAGINATION_MAX_ITEMS_PER_PAGE,
            },
            fields: {
              type: 'array',
              items: {
                type: 'string',
                enum: ROLE_READ_MODEL_FIELDS,
              },
              description:
                'Optional array of field names to include in the response. If not provided, all fields are returned.',
            },
            sortField: {
              type: 'string',
              enum: ROLE_READ_MODEL_SORT_FIELDS,
              description:
                'Optional field name to sort by. Valid values: name, code, createdAt, lastModifiedAt. Defaults to name.',
            },
            sortOrder: {
              type: 'string',
              enum: ['ASC', 'DESC'],
              description:
                'Optional sort order: ASC or DESC. Defaults to ASC if sortField is provided.',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: roleResponseSchema,
              },
              pagination: {
                type: 'object',
                properties: {
                  count: { type: 'number' },
                  pageIndex: { type: 'number' },
                },
                required: ['count', 'pageIndex'],
              },
            },
            required: ['data', 'pagination'],
          },
          ...includeRouteSchemas([401, 403, 500]),
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: FindRolesQueryParams }>,
      reply
    ) => {
      const result = await findRolesQueryHandler.execute(
        request.query,
        request.appContext
      );
      await reply.code(200).send(result);
    }
  );

  // Get a role by ID
  app.get(
    '/roles/:id',
    {
      schema: {
        summary: 'Get role by ID',
        description: 'Retrieves a specific role by its unique identifier.',
        tags: [TAG],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Role unique identifier',
            },
          },
          required: ['id'],
        },
        response: {
          200: roleResponseSchema,
          ...includeRouteSchemas([401, 403, 404, 500]),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await getRoleQueryHandler.execute(
        { id },
        request.appContext
      );
      await reply.code(200).send(result);
    }
  );
}

export const routeConfiguration: RouteConfiguration = {
  tags: [
    {
      name: TAG,
      description: 'Role management endpoints',
    },
  ],
  register,
};
