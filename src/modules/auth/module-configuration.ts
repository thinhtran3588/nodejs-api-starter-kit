import { asClass } from 'awilix';
import type { EventDispatcher, ModuleConfiguration } from '@app/common';

import { authAdapter } from './adapters/auth-adapter';
import { roleAdapter } from './adapters/role-adapter';
import { userAdapter } from './adapters/user-adapter';
import { userGroupAdapter } from './adapters/user-group-adapter';
import { AddRoleToUserGroupCommandHandler } from './application/command-handlers/add-role-to-user-group-command-handler';
import { AddUserToUserGroupCommandHandler } from './application/command-handlers/add-user-to-user-group-command-handler';
import { CreateUserGroupCommandHandler } from './application/command-handlers/create-user-group-command-handler';
import { DeleteAccountCommandHandler } from './application/command-handlers/delete-account-command-handler';
import { DeleteUserCommandHandler } from './application/command-handlers/delete-user-command-handler';
import { DeleteUserGroupCommandHandler } from './application/command-handlers/delete-user-group-command-handler';
import { RegisterCommandHandler } from './application/command-handlers/register-command-handler';
import { RemoveRoleFromUserGroupCommandHandler } from './application/command-handlers/remove-role-from-user-group-command-handler';
import { RemoveUserFromUserGroupCommandHandler } from './application/command-handlers/remove-user-from-user-group-command-handler';
import { RequestAccessTokenCommandHandler } from './application/command-handlers/request-access-token-command-handler';
import { SignInCommandHandler } from './application/command-handlers/sign-in-command-handler';
import { ToggleUserStatusCommandHandler } from './application/command-handlers/toggle-user-status-command-handler';
import { UpdateProfileCommandHandler } from './application/command-handlers/update-profile-command-handler';
import { UpdateUserCommandHandler } from './application/command-handlers/update-user-command-handler';
import { UpdateUserGroupCommandHandler } from './application/command-handlers/update-user-group-command-handler';
import { UserRegisteredHandler } from './application/event-handlers/user-registered-event-handler';
import { FindRolesQueryHandler } from './application/query-handlers/find-roles-query-handler';
import { FindUserGroupsQueryHandler } from './application/query-handlers/find-user-groups-query-handler';
import { FindUsersQueryHandler } from './application/query-handlers/find-users-query-handler';
import { GetProfileQueryHandler } from './application/query-handlers/get-profile-query-handler';
import { GetRoleQueryHandler } from './application/query-handlers/get-role-query-handler';
import { GetUserGroupQueryHandler } from './application/query-handlers/get-user-group-query-handler';
import { GetUserQueryHandler } from './application/query-handlers/get-user-query-handler';
import { RoleReadRepositoryImpl } from './infrastructure/repositories/role-read-repository-impl';
import { RoleRepositoryImpl } from './infrastructure/repositories/role-repository-impl';
import { UserGroupReadRepositoryImpl } from './infrastructure/repositories/user-group-read-repository-impl';
import { UserGroupRepositoryImpl } from './infrastructure/repositories/user-group-repository-impl';
import { UserReadRepositoryImpl } from './infrastructure/repositories/user-read-repository-impl';
import { UserRepositoryImpl } from './infrastructure/repositories/user-repository-impl';
import { schema as authSchema } from './infrastructure/schema';
import { FirebaseAuthenticationService } from './infrastructure/services/external-authentication-service-impl';
import { UserGroupValidatorServiceImpl } from './infrastructure/services/user-group-validator-service-impl';
import { UserIdGeneratorServiceImpl } from './infrastructure/services/user-id-generator-service-impl';
import { UserValidatorServiceImpl } from './infrastructure/services/user-validator-service-impl';

export const moduleConfiguration: ModuleConfiguration = {
  registerDependencies: (container) => {
    // Register write repositories (singleton - one instance for the entire app)
    const userRepository = asClass(UserRepositoryImpl).singleton();
    const roleRepository = asClass(RoleRepositoryImpl).singleton();
    const userGroupRepository = asClass(UserGroupRepositoryImpl).singleton();

    // Register read repositories (singleton - one instance for the entire app)
    const userReadRepository = asClass(UserReadRepositoryImpl).singleton();
    const roleReadRepository = asClass(RoleReadRepositoryImpl).singleton();
    const userGroupReadRepository = asClass(
      UserGroupReadRepositoryImpl
    ).singleton();

    container.register({
      // Write repositories (for domain operations)
      userRepository,
      roleRepository,
      userGroupRepository,
      // Read repositories (for data requests from end users)
      userReadRepository,
      roleReadRepository,
      userGroupReadRepository,
    });

    // Register infrastructure services (singleton - one instance for the entire app)
    container.register({
      externalAuthenticationService: asClass(
        FirebaseAuthenticationService
      ).singleton(),
      userGroupValidatorService: asClass(
        UserGroupValidatorServiceImpl
      ).singleton(),
      userIdGeneratorService: asClass(UserIdGeneratorServiceImpl).singleton(),
      userValidatorService: asClass(UserValidatorServiceImpl).singleton(),
    });

    // Register command handlers (singleton - can be reused)
    container.register({
      registerCommandHandler: asClass(RegisterCommandHandler).singleton(),
      signInCommandHandler: asClass(SignInCommandHandler).singleton(),
      updateProfileCommandHandler: asClass(
        UpdateProfileCommandHandler
      ).singleton(),
      deleteAccountCommandHandler: asClass(
        DeleteAccountCommandHandler
      ).singleton(),
      requestAccessTokenCommandHandler: asClass(
        RequestAccessTokenCommandHandler
      ).singleton(),
      updateUserCommandHandler: asClass(UpdateUserCommandHandler).singleton(),
      deleteUserCommandHandler: asClass(DeleteUserCommandHandler).singleton(),
      toggleUserStatusCommandHandler: asClass(
        ToggleUserStatusCommandHandler
      ).singleton(),
      createUserGroupCommandHandler: asClass(
        CreateUserGroupCommandHandler
      ).singleton(),
      updateUserGroupCommandHandler: asClass(
        UpdateUserGroupCommandHandler
      ).singleton(),
      deleteUserGroupCommandHandler: asClass(
        DeleteUserGroupCommandHandler
      ).singleton(),
      addUserToUserGroupCommandHandler: asClass(
        AddUserToUserGroupCommandHandler
      ).singleton(),
      removeUserFromUserGroupCommandHandler: asClass(
        RemoveUserFromUserGroupCommandHandler
      ).singleton(),
      addRoleToUserGroupCommandHandler: asClass(
        AddRoleToUserGroupCommandHandler
      ).singleton(),
      removeRoleFromUserGroupCommandHandler: asClass(
        RemoveRoleFromUserGroupCommandHandler
      ).singleton(),
    });

    // Register query handlers (singleton - can be reused)
    container.register({
      getProfileQueryHandler: asClass(GetProfileQueryHandler).singleton(),
      getUserQueryHandler: asClass(GetUserQueryHandler).singleton(),
      findUsersQueryHandler: asClass(FindUsersQueryHandler).singleton(),
      findRolesQueryHandler: asClass(FindRolesQueryHandler).singleton(),
      getRoleQueryHandler: asClass(GetRoleQueryHandler).singleton(),
      getUserGroupQueryHandler: asClass(GetUserGroupQueryHandler).singleton(),
      findUserGroupsQueryHandler: asClass(
        FindUserGroupsQueryHandler
      ).singleton(),
    });

    // Register event handlers
    const eventDispatcher =
      container.resolve<EventDispatcher>('eventDispatcher');
    const userRegisteredHandler = new UserRegisteredHandler();
    eventDispatcher.registerHandler(userRegisteredHandler);
  },
  adapters: [authAdapter, roleAdapter, userAdapter, userGroupAdapter],
  schema: authSchema,
};
