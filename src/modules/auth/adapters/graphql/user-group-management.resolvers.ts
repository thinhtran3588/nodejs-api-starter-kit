import type { GraphQLResolveInfo } from 'graphql';
import type { MercuriusContext } from 'mercurius';
import { extractGraphQLFields } from '@app/common/utils/extract-graphql-fields';
import { AddRoleToUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/add-role-to-user-group.command-handler';
import { CreateUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/create-user-group.command-handler';
import { DeleteUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/delete-user-group.command-handler';
import { RemoveRoleFromUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/remove-role-from-user-group.command-handler';
import { UpdateUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/update-user-group.command-handler';
import type { AddRoleToUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/add-role-to-user-group.command';
import type { CreateUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/create-user-group.command';
import type { RemoveRoleFromUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/remove-role-from-user-group.command';
import type { UpdateUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/update-user-group.command';
import type { FindUserGroupsQueryParams } from '@app/modules/auth/application/interfaces/queries/user-group-query-params';
import { FindUserGroupsQueryHandler } from '@app/modules/auth/application/query-handlers/find-user-groups.query-handler';
import { GetUserGroupQueryHandler } from '@app/modules/auth/application/query-handlers/get-user-group.query-handler';

import '@app/application/graphql/context';

export const userGroupManagementResolvers = {
  Query: {
    userGroups: async (
      _parent: unknown,
      args: { input?: FindUserGroupsQueryParams },
      context: MercuriusContext,
      info: GraphQLResolveInfo
    ) => {
      const findUserGroupsQueryHandler =
        context.request.server.diContainer.resolve<FindUserGroupsQueryHandler>(
          'findUserGroupsQueryHandler'
        );
      const fields = extractGraphQLFields(info, 'data');
      return await findUserGroupsQueryHandler.execute(
        { ...args.input, fields },
        context.appContext
      );
    },
    userGroup: async (
      _parent: unknown,
      args: { id: string },
      context: MercuriusContext
    ) => {
      const getUserGroupQueryHandler =
        context.request.server.diContainer.resolve<GetUserGroupQueryHandler>(
          'getUserGroupQueryHandler'
        );
      return await getUserGroupQueryHandler.execute(
        { id: args.id },
        context.appContext
      );
    },
  },
  Mutation: {
    userGroups: () => ({}),
  },
  UserGroupManagementMutation: {
    createUserGroup: async (
      _parent: unknown,
      args: { input: CreateUserGroupCommand },
      context: MercuriusContext
    ) => {
      const createUserGroupCommandHandler =
        context.request.server.diContainer.resolve<CreateUserGroupCommandHandler>(
          'createUserGroupCommandHandler'
        );
      return await createUserGroupCommandHandler.execute(
        args.input,
        context.appContext
      );
    },
    updateUserGroup: async (
      _parent: unknown,
      args: { id: string; input: Omit<UpdateUserGroupCommand, 'id'> },
      context: MercuriusContext
    ) => {
      const updateUserGroupCommandHandler =
        context.request.server.diContainer.resolve<UpdateUserGroupCommandHandler>(
          'updateUserGroupCommandHandler'
        );
      await updateUserGroupCommandHandler.execute(
        { id: args.id, ...args.input },
        context.appContext
      );
      return true;
    },
    deleteUserGroup: async (
      _parent: unknown,
      args: { id: string },
      context: MercuriusContext
    ) => {
      const deleteUserGroupCommandHandler =
        context.request.server.diContainer.resolve<DeleteUserGroupCommandHandler>(
          'deleteUserGroupCommandHandler'
        );
      await deleteUserGroupCommandHandler.execute(
        { id: args.id },
        context.appContext
      );
      return true;
    },
    addRoleToUserGroup: async (
      _parent: unknown,
      args: {
        userGroupId: string;
        input: Omit<AddRoleToUserGroupCommand, 'userGroupId'>;
      },
      context: MercuriusContext
    ) => {
      const addRoleToUserGroupCommandHandler =
        context.request.server.diContainer.resolve<AddRoleToUserGroupCommandHandler>(
          'addRoleToUserGroupCommandHandler'
        );
      await addRoleToUserGroupCommandHandler.execute(
        { userGroupId: args.userGroupId, ...args.input },
        context.appContext
      );
      return true;
    },
    removeRoleFromUserGroup: async (
      _parent: unknown,
      args: {
        userGroupId: string;
        input: Omit<RemoveRoleFromUserGroupCommand, 'userGroupId'>;
      },
      context: MercuriusContext
    ) => {
      const removeRoleFromUserGroupCommandHandler =
        context.request.server.diContainer.resolve<RemoveRoleFromUserGroupCommandHandler>(
          'removeRoleFromUserGroupCommandHandler'
        );
      await removeRoleFromUserGroupCommandHandler.execute(
        { userGroupId: args.userGroupId, ...args.input },
        context.appContext
      );
      return true;
    },
  },
};
