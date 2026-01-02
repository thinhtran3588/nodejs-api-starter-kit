import type { FastifyInstance, FastifyRequest } from 'fastify';
import { PAGINATION_MAX_ITEMS_PER_PAGE } from '@app/common/constants';
import type { RouteConfiguration } from '@app/common/interfaces/configuration';
import { success204ResponseSchema } from '@app/common/schemas/error-response.schemas';
import { includeRouteSchemas } from '@app/common/utils/include-route-schemas';
import { AddRoleToUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/add-role-to-user-group.command-handler';
import { CreateUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/create-user-group.command-handler';
import { DeleteUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/delete-user-group.command-handler';
import { RemoveRoleFromUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/remove-role-from-user-group.command-handler';
import { UpdateUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/update-user-group.command-handler';
import type { AddRoleToUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/add-role-to-user-group.command';
import type { CreateUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/create-user-group.command';
import type { UpdateUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/update-user-group.command';
import type { FindUserGroupsQueryParams } from '@app/modules/auth/application/interfaces/queries/user-group-query-params';
import {
  USER_GROUP_READ_MODEL_FIELDS,
  USER_GROUP_READ_MODEL_SORT_FIELDS,
} from '@app/modules/auth/application/interfaces/queries/user-group.read-model';
import { FindUserGroupsQueryHandler } from '@app/modules/auth/application/query-handlers/find-user-groups.query-handler';
import { GetUserGroupQueryHandler } from '@app/modules/auth/application/query-handlers/get-user-group.query-handler';

const TAG = 'user-group';

const userGroupResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string', nullable: true },
    version: { type: 'number' },
    createdAt: { type: 'string', format: 'date-time' },
    createdBy: { type: 'string', nullable: true },
    lastModifiedAt: { type: 'string', format: 'date-time' },
    lastModifiedBy: { type: 'string', nullable: true },
  },
} as const;

function register(app: FastifyInstance): void {
  const { diContainer } = app;
  const createUserGroupCommandHandler =
    diContainer.resolve<CreateUserGroupCommandHandler>(
      'createUserGroupCommandHandler'
    );
  const findUserGroupsQueryHandler =
    diContainer.resolve<FindUserGroupsQueryHandler>(
      'findUserGroupsQueryHandler'
    );
  const getUserGroupQueryHandler =
    diContainer.resolve<GetUserGroupQueryHandler>('getUserGroupQueryHandler');
  const updateUserGroupCommandHandler =
    diContainer.resolve<UpdateUserGroupCommandHandler>(
      'updateUserGroupCommandHandler'
    );
  const deleteUserGroupCommandHandler =
    diContainer.resolve<DeleteUserGroupCommandHandler>(
      'deleteUserGroupCommandHandler'
    );
  const addRoleToUserGroupCommandHandler =
    diContainer.resolve<AddRoleToUserGroupCommandHandler>(
      'addRoleToUserGroupCommandHandler'
    );
  const removeRoleFromUserGroupCommandHandler =
    diContainer.resolve<RemoveRoleFromUserGroupCommandHandler>(
      'removeRoleFromUserGroupCommandHandler'
    );

  // Create a new user group
  app.post(
    '/user-groups',
    {
      schema: {
        summary: 'Create a new user group',
        description:
          'Creates a new user group with the provided name and optional description.',
        tags: [TAG],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              description: 'User group name (required, max 255 characters)',
            },
            description: {
              type: 'string',
              description:
                'User group description (optional, max 2000 characters)',
            },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
            required: ['id'],
          },
          ...includeRouteSchemas([400, 401, 403, 500]),
        },
      },
    },
    async (request, reply) => {
      const result = await createUserGroupCommandHandler.execute(
        request.body as CreateUserGroupCommand,
        request.appContext
      );
      await reply.code(201).send(result);
    }
  );

  // Find user groups by search term with pagination
  app.get(
    '/user-groups',
    {
      schema: {
        summary: 'Find user groups by search term with pagination',
        description:
          'Searches for user groups by name or description with pagination support. If no searchTerm is provided, returns all user groups.',
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
                enum: USER_GROUP_READ_MODEL_FIELDS,
              },
              description:
                'Optional array of field names to include in the response. If not provided, all fields are returned.',
            },
            sortField: {
              type: 'string',
              enum: USER_GROUP_READ_MODEL_SORT_FIELDS,
              description:
                'Optional field name to sort by. Valid values: name, createdAt, lastModifiedAt. Defaults to name.',
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
                items: userGroupResponseSchema,
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
      request: FastifyRequest<{ Querystring: FindUserGroupsQueryParams }>,
      reply
    ) => {
      const result = await findUserGroupsQueryHandler.execute(
        request.query,
        request.appContext
      );
      await reply.code(200).send(result);
    }
  );

  // Get a user group by ID
  app.get(
    '/user-groups/:id',
    {
      schema: {
        summary: 'Get user group by ID',
        description:
          'Retrieves a specific user group by its unique identifier.',
        tags: [TAG],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User group unique identifier (UUID)',
            },
          },
          required: ['id'],
        },
        response: {
          200: userGroupResponseSchema,
          ...includeRouteSchemas([401, 403, 404, 500]),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await getUserGroupQueryHandler.execute(
        { id },
        request.appContext
      );
      await reply.code(200).send(result);
    }
  );

  // Update a user group
  app.put(
    '/user-groups/:id',
    {
      schema: {
        summary: 'Update user group',
        description:
          'Updates an existing user group. Both name and description can be updated.',
        tags: [TAG],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User group unique identifier (UUID)',
            },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'New name (optional, max 255 characters)',
            },
            description: {
              type: 'string',
              description: 'New description (optional, max 2000 characters)',
            },
          },
        },
        response: {
          ...success204ResponseSchema,
          ...includeRouteSchemas([400, 401, 403, 404, 500]),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await updateUserGroupCommandHandler.execute(
        {
          id,
          ...(request.body as Omit<UpdateUserGroupCommand, 'id'>),
        },
        request.appContext
      );
      await reply.code(204).send();
    }
  );

  // Delete a user group
  app.delete(
    '/user-groups/:id',
    {
      schema: {
        summary: 'Delete user group',
        description:
          'Deletes a user group by its unique identifier. This operation is permanent.',
        tags: [TAG],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User group unique identifier (UUID)',
            },
          },
          required: ['id'],
        },
        response: {
          ...success204ResponseSchema,
          ...includeRouteSchemas([401, 403, 404, 500]),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await deleteUserGroupCommandHandler.execute({ id }, request.appContext);
      await reply.code(204).send();
    }
  );

  // Add a role to a user group
  app.post(
    '/user-groups/:id/roles',
    {
      schema: {
        summary: 'Add a role to a user group',
        description:
          'Adds a single role to the specified user group. The role must exist and not already be in the group.',
        tags: [TAG],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User group unique identifier (UUID)',
            },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          required: ['roleId'],
          properties: {
            roleId: {
              type: 'string',
              description: 'Role unique identifier',
            },
          },
        },
        response: {
          ...success204ResponseSchema,
          ...includeRouteSchemas([400, 401, 403, 404, 500]),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await addRoleToUserGroupCommandHandler.execute(
        {
          userGroupId: id,
          ...(request.body as Omit<AddRoleToUserGroupCommand, 'userGroupId'>),
        },
        request.appContext
      );
      await reply.code(204).send();
    }
  );

  // Remove a role from a user group
  app.delete(
    '/user-groups/:id/roles/:roleId',
    {
      schema: {
        summary: 'Remove a role from a user group',
        description:
          'Removes a single role from the specified user group. The role must exist and be in the group.',
        tags: [TAG],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User group unique identifier (UUID)',
            },
            roleId: {
              type: 'string',
              description: 'Role unique identifier',
            },
          },
          required: ['id', 'roleId'],
        },
        response: {
          ...success204ResponseSchema,
          ...includeRouteSchemas([400, 401, 403, 404, 500]),
        },
      },
    },
    async (request, reply) => {
      const { id, roleId } = request.params as {
        id: string;
        roleId: string;
      };
      await removeRoleFromUserGroupCommandHandler.execute(
        { userGroupId: id, roleId },
        request.appContext
      );
      await reply.code(204).send();
    }
  );
}

export const routeConfiguration: RouteConfiguration = {
  tags: [
    {
      name: TAG,
      description: 'User group management endpoints',
    },
  ],
  register,
};
