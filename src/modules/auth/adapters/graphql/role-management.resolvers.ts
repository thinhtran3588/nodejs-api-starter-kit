import type { GraphQLResolveInfo } from 'graphql';
import type { MercuriusContext } from 'mercurius';
import { extractGraphQLFields } from '@app/common/utils/extract-graphql-fields';
import type { FindRolesQueryParams } from '@app/modules/auth/application/interfaces/queries/role-query-params';
import { FindRolesQueryHandler } from '@app/modules/auth/application/query-handlers/find-roles.query-handler';
import { GetRoleQueryHandler } from '@app/modules/auth/application/query-handlers/get-role.query-handler';

import '@app/application/graphql/context';

export const roleManagementResolvers = {
  Query: {
    roles: async (
      _parent: unknown,
      args: { input?: FindRolesQueryParams },
      context: MercuriusContext,
      info: GraphQLResolveInfo
    ) => {
      const findRolesQueryHandler =
        context.request.server.diContainer.resolve<FindRolesQueryHandler>(
          'findRolesQueryHandler'
        );
      const fields = extractGraphQLFields(info, 'data');
      return await findRolesQueryHandler.execute(
        { ...args.input, fields },
        context.appContext
      );
    },
    role: async (
      _parent: unknown,
      args: { id: string },
      context: MercuriusContext
    ) => {
      const getRoleQueryHandler =
        context.request.server.diContainer.resolve<GetRoleQueryHandler>(
          'getRoleQueryHandler'
        );
      return await getRoleQueryHandler.execute(
        { id: args.id },
        context.appContext
      );
    },
  },
};
