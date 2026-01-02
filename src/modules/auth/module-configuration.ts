import { asClass } from 'awilix';
import type { EventDispatcher } from '@app/common/domain/interfaces/event-dispatcher';
import type { ModuleConfiguration } from '@app/common/interfaces/configuration';
import { AddRoleToUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/add-role-to-user-group.command-handler';
import { AddUserToUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/add-user-to-user-group.command-handler';
import { CreateUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/create-user-group.command-handler';
import { DeleteAccountCommandHandler } from '@app/modules/auth/application/command-handlers/delete-account.command-handler';
import { DeleteUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/delete-user-group.command-handler';
import { DeleteUserCommandHandler } from '@app/modules/auth/application/command-handlers/delete-user.command-handler';
import { RegisterCommandHandler } from '@app/modules/auth/application/command-handlers/register.command-handler';
import { RemoveRoleFromUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/remove-role-from-user-group.command-handler';
import { RemoveUserFromUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/remove-user-from-user-group.command-handler';
import { RequestAccessTokenCommandHandler } from '@app/modules/auth/application/command-handlers/request-access-token.command-handler';
import { SignInCommandHandler } from '@app/modules/auth/application/command-handlers/sign-in.command-handler';
import { ToggleUserStatusCommandHandler } from '@app/modules/auth/application/command-handlers/toggle-user-status.command-handler';
import { UpdateProfileCommandHandler } from '@app/modules/auth/application/command-handlers/update-profile.command-handler';
import { UpdateUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/update-user-group.command-handler';
import { UpdateUserCommandHandler } from '@app/modules/auth/application/command-handlers/update-user.command-handler';
import { UserRegisteredHandler } from '@app/modules/auth/application/event-handlers/user-registered.event-handler';
import { FindRolesQueryHandler } from '@app/modules/auth/application/query-handlers/find-roles.query-handler';
import { FindUserGroupsQueryHandler } from '@app/modules/auth/application/query-handlers/find-user-groups.query-handler';
import { FindUsersQueryHandler } from '@app/modules/auth/application/query-handlers/find-users.query-handler';
import { GetProfileQueryHandler } from '@app/modules/auth/application/query-handlers/get-profile.query-handler';
import { GetRoleQueryHandler } from '@app/modules/auth/application/query-handlers/get-role.query-handler';
import { GetUserGroupQueryHandler } from '@app/modules/auth/application/query-handlers/get-user-group.query-handler';
import { GetUserQueryHandler } from '@app/modules/auth/application/query-handlers/get-user.query-handler';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { RoleReadRepositoryImpl } from '@app/modules/auth/infrastructure/repositories/role.read-repository-impl';
import { RoleRepositoryImpl } from '@app/modules/auth/infrastructure/repositories/role.repository-impl';
import { UserGroupReadRepositoryImpl } from '@app/modules/auth/infrastructure/repositories/user-group.read-repository-impl';
import { UserGroupRepositoryImpl } from '@app/modules/auth/infrastructure/repositories/user-group.repository-impl';
import { UserReadRepositoryImpl } from '@app/modules/auth/infrastructure/repositories/user.read-repository-impl';
import { UserRepositoryImpl } from '@app/modules/auth/infrastructure/repositories/user.repository-impl';
import { FirebaseAuthenticationService } from '@app/modules/auth/infrastructure/services/external-authentication.service-impl';
import { UserGroupValidatorServiceImpl } from '@app/modules/auth/infrastructure/services/user-group-validator.service-impl';
import { UserIdGeneratorServiceImpl } from '@app/modules/auth/infrastructure/services/user-id-generator.service-impl';
import { UserValidatorServiceImpl } from '@app/modules/auth/infrastructure/services/user-validator.service-impl';

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
  registerErrorCodes: (registry) => {
    registry.register({
      [AuthExceptionCode.USER_NOT_FOUND]: 404,
      [AuthExceptionCode.EMAIL_ALREADY_TAKEN]: 400,
      [AuthExceptionCode.USERNAME_ALREADY_TAKEN]: 400,
      [AuthExceptionCode.INVALID_CREDENTIALS]: 401,
      [AuthExceptionCode.USER_DELETED]: 404,
      [AuthExceptionCode.USER_ALREADY_DELETED]: 400,
      [AuthExceptionCode.USER_MUST_BE_ACTIVE]: 403,
      [AuthExceptionCode.USER_MUST_BE_DISABLED]: 400,
      [AuthExceptionCode.INVALID_USER_STATUS]: 400,
      [AuthExceptionCode.USER_GROUP_NOT_FOUND]: 404,
      [AuthExceptionCode.ROLE_NOT_FOUND]: 404,
      [AuthExceptionCode.USER_ALREADY_IN_GROUP]: 400,
      [AuthExceptionCode.USER_NOT_IN_GROUP]: 400,
      [AuthExceptionCode.ROLE_ALREADY_IN_GROUP]: 400,
      [AuthExceptionCode.ROLE_NOT_IN_GROUP]: 400,
      [AuthExceptionCode.EXTERNAL_AUTHENTICATION_ERROR]: 500,
    });
  },
};
