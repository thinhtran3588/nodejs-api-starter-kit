import type { FastifyInstance, FastifyRequest } from 'fastify';
import { PAGINATION_MAX_ITEMS_PER_PAGE } from '@app/common/constants';
import type { RouteConfiguration } from '@app/common/interfaces/configuration';
import { success204ResponseSchema } from '@app/common/schemas/error-response.schemas';
import { includeRouteSchemas } from '@app/common/utils/include-route-schemas';
import { AddUserToUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/add-user-to-user-group.command-handler';
import { DeleteUserCommandHandler } from '@app/modules/auth/application/command-handlers/delete-user.command-handler';
import { RemoveUserFromUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/remove-user-from-user-group.command-handler';
import { ToggleUserStatusCommandHandler } from '@app/modules/auth/application/command-handlers/toggle-user-status.command-handler';
import { UpdateUserCommandHandler } from '@app/modules/auth/application/command-handlers/update-user.command-handler';
import type { ToggleUserStatusCommand } from '@app/modules/auth/application/interfaces/commands/toggle-user-status.command';
import type { UpdateUserCommand } from '@app/modules/auth/application/interfaces/commands/update-user.command';
import type { FindUsersQueryParams } from '@app/modules/auth/application/interfaces/queries/user-query-params';
import {
  USER_READ_MODEL_FIELDS,
  USER_READ_MODEL_SORT_FIELDS,
} from '@app/modules/auth/application/interfaces/queries/user.read-model';
import { FindUsersQueryHandler } from '@app/modules/auth/application/query-handlers/find-users.query-handler';
import { GetUserQueryHandler } from '@app/modules/auth/application/query-handlers/get-user.query-handler';

const TAG = 'user';

const userResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string' },
    signInType: {
      type: 'string',
      enum: ['EMAIL', 'GOOGLE', 'APPLE'],
    },
    externalId: { type: 'string' },
    displayName: { type: 'string', nullable: true },
    username: { type: 'string', nullable: true },
    status: {
      type: 'string',
      enum: ['ACTIVE', 'DISABLED', 'DELETED'],
    },
    version: { type: 'number' },
    createdAt: { type: 'string', format: 'date-time' },
    createdBy: { type: 'string', nullable: true },
    lastModifiedAt: { type: 'string', format: 'date-time' },
    lastModifiedBy: { type: 'string', nullable: true },
  },
} as const;

function register(app: FastifyInstance): void {
  const { diContainer } = app;
  const findUsersQueryHandler = diContainer.resolve<FindUsersQueryHandler>(
    'findUsersQueryHandler'
  );
  const getUserQueryHandler = diContainer.resolve<GetUserQueryHandler>(
    'getUserQueryHandler'
  );
  const updateUserCommandHandler =
    diContainer.resolve<UpdateUserCommandHandler>('updateUserCommandHandler');
  const toggleUserStatusCommandHandler =
    diContainer.resolve<ToggleUserStatusCommandHandler>(
      'toggleUserStatusCommandHandler'
    );
  const deleteUserCommandHandler =
    diContainer.resolve<DeleteUserCommandHandler>('deleteUserCommandHandler');
  const addUserToUserGroupCommandHandler =
    diContainer.resolve<AddUserToUserGroupCommandHandler>(
      'addUserToUserGroupCommandHandler'
    );
  const removeUserFromUserGroupCommandHandler =
    diContainer.resolve<RemoveUserFromUserGroupCommandHandler>(
      'removeUserFromUserGroupCommandHandler'
    );

  // Find users by search term with pagination
  app.get(
    '/users',
    {
      schema: {
        summary: 'Find users by search term with pagination',
        description:
          'Searches for users by displayName, email, or username with pagination support. If no searchTerm is provided, returns all users.',
        tags: [TAG],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            searchTerm: {
              type: 'string',
              description:
                'Search term to match against displayName, email, or username (case-insensitive)',
            },
            userGroupId: {
              type: 'string',
              description: 'Filter users by user group ID (UUID)',
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
                enum: USER_READ_MODEL_FIELDS,
              },
              description:
                'Optional array of field names to include in the response. If not provided, all fields are returned.',
            },
            sortField: {
              type: 'string',
              enum: USER_READ_MODEL_SORT_FIELDS,
              description:
                'Optional field name to sort by. Valid values: email, username, createdAt, lastModifiedAt. Defaults to email.',
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
                items: userResponseSchema,
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
      request: FastifyRequest<{ Querystring: FindUsersQueryParams }>,
      reply
    ) => {
      const result = await findUsersQueryHandler.execute(
        request.query,
        request.appContext
      );
      await reply.code(200).send(result);
    }
  );

  // Get a user by ID
  app.get(
    '/users/:id',
    {
      schema: {
        summary: 'Get user by ID',
        description: 'Retrieves a specific user by their unique identifier.',
        tags: [TAG],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User unique identifier (UUID)',
            },
          },
          required: ['id'],
        },
        response: {
          200: userResponseSchema,
          ...includeRouteSchemas([401, 403, 404, 500]),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await getUserQueryHandler.execute(
        { id },
        request.appContext
      );
      await reply.code(200).send(result);
    }
  );

  // Update a user
  app.put(
    '/users/:id',
    {
      schema: {
        summary: 'Update user',
        description:
          'Updates an existing user. Only displayName and username can be updated.',
        tags: [TAG],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User unique identifier (UUID)',
            },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            displayName: {
              type: 'string',
              description: 'New display name (optional)',
            },
            username: {
              type: 'string',
              description:
                'New username (optional, must be unique if provided, 8-20 characters, alphanumeric with underscores)',
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
      await updateUserCommandHandler.execute(
        {
          id,
          ...(request.body as Omit<UpdateUserCommand, 'id'>),
        },
        request.appContext
      );
      await reply.code(204).send();
    }
  );

  // Toggle user status (enable/disable)
  app.patch(
    '/users/:id/status',
    {
      schema: {
        summary: 'Toggle user status',
        description:
          'Enables or disables a user by their unique identifier. Setting enabled to true sets status to ACTIVE, false sets it to DISABLED.',
        tags: [TAG],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User unique identifier (UUID)',
            },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          required: ['enabled'],
          properties: {
            enabled: {
              type: 'boolean',
              description:
                'Set to true to enable (ACTIVE) or false to disable (DISABLED) the user',
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
      await toggleUserStatusCommandHandler.execute(
        {
          id,
          ...(request.body as Omit<ToggleUserStatusCommand, 'id'>),
        },
        request.appContext
      );
      await reply.code(204).send();
    }
  );

  // Delete a user
  app.delete(
    '/users/:id',
    {
      schema: {
        summary: 'Delete user',
        description: 'Deletes a user by their unique identifier.',
        tags: [TAG],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User unique identifier (UUID)',
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
      await deleteUserCommandHandler.execute({ id }, request.appContext);
      await reply.code(204).send();
    }
  );

  // Add a user to a user group
  app.post(
    '/users/:id/user-groups/:userGroupId',
    {
      schema: {
        summary: 'Add a user to a user group',
        description:
          'Adds a user to the specified user group. The user must exist and not already be in the group.',
        tags: [TAG],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User unique identifier (UUID)',
            },
            userGroupId: {
              type: 'string',
              description: 'User group unique identifier (UUID)',
            },
          },
          required: ['id', 'userGroupId'],
        },
        response: {
          ...success204ResponseSchema,
          ...includeRouteSchemas([400, 401, 403, 404, 500]),
        },
      },
    },
    async (request, reply) => {
      const { id, userGroupId } = request.params as {
        id: string;
        userGroupId: string;
      };
      await addUserToUserGroupCommandHandler.execute(
        { userId: id, userGroupId },
        request.appContext
      );
      await reply.code(204).send();
    }
  );

  // Remove a user from a user group
  app.delete(
    '/users/:id/user-groups/:userGroupId',
    {
      schema: {
        summary: 'Remove a user from a user group',
        description:
          'Removes a user from the specified user group. The user must exist and be in the group.',
        tags: [TAG],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User unique identifier (UUID)',
            },
            userGroupId: {
              type: 'string',
              description: 'User group unique identifier (UUID)',
            },
          },
          required: ['id', 'userGroupId'],
        },
        response: {
          ...success204ResponseSchema,
          ...includeRouteSchemas([400, 401, 403, 404, 500]),
        },
      },
    },
    async (request, reply) => {
      const { id, userGroupId } = request.params as {
        id: string;
        userGroupId: string;
      };
      await removeUserFromUserGroupCommandHandler.execute(
        { userId: id, userGroupId },
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
      description: 'User management endpoints',
    },
  ],
  register,
};
