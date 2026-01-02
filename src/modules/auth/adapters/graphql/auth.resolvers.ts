import type { MercuriusContext } from 'mercurius';
import { DeleteAccountCommandHandler } from '@app/modules/auth/application/command-handlers/delete-account.command-handler';
import { RegisterCommandHandler } from '@app/modules/auth/application/command-handlers/register.command-handler';
import { RequestAccessTokenCommandHandler } from '@app/modules/auth/application/command-handlers/request-access-token.command-handler';
import { SignInCommandHandler } from '@app/modules/auth/application/command-handlers/sign-in.command-handler';
import { UpdateProfileCommandHandler } from '@app/modules/auth/application/command-handlers/update-profile.command-handler';
import type { RegisterCommand } from '@app/modules/auth/application/interfaces/commands/register.command';
import type { RequestAccessTokenCommand } from '@app/modules/auth/application/interfaces/commands/request-access-token.command';
import type { SignInCommand } from '@app/modules/auth/application/interfaces/commands/sign-in.command';
import type { UpdateProfileCommand } from '@app/modules/auth/application/interfaces/commands/update-profile.command';
import { GetProfileQueryHandler } from '@app/modules/auth/application/query-handlers/get-profile.query-handler';

import '@app/application/graphql/context';

export const authResolvers = {
  Query: {
    me: async (_parent: unknown, _args: unknown, context: MercuriusContext) => {
      const getProfileQueryHandler =
        context.request.server.diContainer.resolve<GetProfileQueryHandler>(
          'getProfileQueryHandler'
        );
      return await getProfileQueryHandler.execute({}, context.appContext);
    },
  },
  Mutation: {
    auth: () => ({}),
  },
  AuthMutation: {
    register: async (
      _parent: unknown,
      args: { input: RegisterCommand },
      context: MercuriusContext
    ) => {
      const registerCommandHandler =
        context.request.server.diContainer.resolve<RegisterCommandHandler>(
          'registerCommandHandler'
        );
      return await registerCommandHandler.execute(args.input);
    },
    signIn: async (
      _parent: unknown,
      args: { input: SignInCommand },
      context: MercuriusContext
    ) => {
      const signInCommandHandler =
        context.request.server.diContainer.resolve<SignInCommandHandler>(
          'signInCommandHandler'
        );
      return await signInCommandHandler.execute(args.input);
    },
    updateProfile: async (
      _parent: unknown,
      args: { input: UpdateProfileCommand },
      context: MercuriusContext
    ) => {
      const updateProfileCommandHandler =
        context.request.server.diContainer.resolve<UpdateProfileCommandHandler>(
          'updateProfileCommandHandler'
        );
      await updateProfileCommandHandler.execute(args.input, context.appContext);
      return true;
    },
    deleteAccount: async (
      _parent: unknown,
      _args: unknown,
      context: MercuriusContext
    ) => {
      const deleteAccountCommandHandler =
        context.request.server.diContainer.resolve<DeleteAccountCommandHandler>(
          'deleteAccountCommandHandler'
        );
      await deleteAccountCommandHandler.execute({}, context.appContext);
      return true;
    },
    requestAccessToken: async (
      _parent: unknown,
      args: { idToken: string },
      context: MercuriusContext
    ) => {
      const requestAccessTokenCommandHandler =
        context.request.server.diContainer.resolve<RequestAccessTokenCommandHandler>(
          'requestAccessTokenCommandHandler'
        );
      const command: RequestAccessTokenCommand = { idToken: args.idToken };
      return await requestAccessTokenCommandHandler.execute(command);
    },
  },
};
