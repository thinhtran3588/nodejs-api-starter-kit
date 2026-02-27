import type { AddRoleToUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/add-role-to-user-group-command-handler';
import type { AddUserToUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/add-user-to-user-group-command-handler';
import type { CreateUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/create-user-group-command-handler';
import type { DeleteAccountCommandHandler } from '@app/modules/auth/application/command-handlers/delete-account-command-handler';
import type { DeleteUserCommandHandler } from '@app/modules/auth/application/command-handlers/delete-user-command-handler';
import type { DeleteUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/delete-user-group-command-handler';
import type { RegisterCommandHandler } from '@app/modules/auth/application/command-handlers/register-command-handler';
import type { RemoveRoleFromUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/remove-role-from-user-group-command-handler';
import type { RemoveUserFromUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/remove-user-from-user-group-command-handler';
import type { RequestAccessTokenCommandHandler } from '@app/modules/auth/application/command-handlers/request-access-token-command-handler';
import type { SignInCommandHandler } from '@app/modules/auth/application/command-handlers/sign-in-command-handler';
import type { ToggleUserStatusCommandHandler } from '@app/modules/auth/application/command-handlers/toggle-user-status-command-handler';
import type { UpdateProfileCommandHandler } from '@app/modules/auth/application/command-handlers/update-profile-command-handler';
import type { UpdateUserCommandHandler } from '@app/modules/auth/application/command-handlers/update-user-command-handler';
import type { UpdateUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/update-user-group-command-handler';
import type { FindRolesQueryHandler } from '@app/modules/auth/application/query-handlers/find-roles-query-handler';
import type { FindUserGroupsQueryHandler } from '@app/modules/auth/application/query-handlers/find-user-groups-query-handler';
import type { FindUsersQueryHandler } from '@app/modules/auth/application/query-handlers/find-users-query-handler';
import type { GetProfileQueryHandler } from '@app/modules/auth/application/query-handlers/get-profile-query-handler';
import type { GetRoleQueryHandler } from '@app/modules/auth/application/query-handlers/get-role-query-handler';
import type { GetUserGroupQueryHandler } from '@app/modules/auth/application/query-handlers/get-user-group-query-handler';
import type { GetUserQueryHandler } from '@app/modules/auth/application/query-handlers/get-user-query-handler';
import type {
  ExternalAuthenticationService,
  RoleRepository,
  UserGroupRepository,
  UserGroupValidatorService,
  UserIdGeneratorService,
  UserRepository,
  UserValidatorService,
} from '@app/modules/auth/domain';
import type {
  RoleReadRepository,
  UserGroupReadRepository,
  UserReadRepository,
} from '@app/modules/auth/interfaces';

export interface AuthContainer {
  userRepository: UserRepository;
  roleRepository: RoleRepository;
  userGroupRepository: UserGroupRepository;

  userReadRepository: UserReadRepository;
  roleReadRepository: RoleReadRepository;
  userGroupReadRepository: UserGroupReadRepository;

  externalAuthenticationService: ExternalAuthenticationService;
  userValidatorService: UserValidatorService;
  userGroupValidatorService: UserGroupValidatorService;
  userIdGeneratorService: UserIdGeneratorService;

  registerCommandHandler: RegisterCommandHandler;
  signInCommandHandler: SignInCommandHandler;
  updateProfileCommandHandler: UpdateProfileCommandHandler;
  deleteAccountCommandHandler: DeleteAccountCommandHandler;
  requestAccessTokenCommandHandler: RequestAccessTokenCommandHandler;
  updateUserCommandHandler: UpdateUserCommandHandler;
  deleteUserCommandHandler: DeleteUserCommandHandler;
  toggleUserStatusCommandHandler: ToggleUserStatusCommandHandler;
  createUserGroupCommandHandler: CreateUserGroupCommandHandler;
  updateUserGroupCommandHandler: UpdateUserGroupCommandHandler;
  deleteUserGroupCommandHandler: DeleteUserGroupCommandHandler;
  addUserToUserGroupCommandHandler: AddUserToUserGroupCommandHandler;
  removeUserFromUserGroupCommandHandler: RemoveUserFromUserGroupCommandHandler;
  addRoleToUserGroupCommandHandler: AddRoleToUserGroupCommandHandler;
  removeRoleFromUserGroupCommandHandler: RemoveRoleFromUserGroupCommandHandler;

  getProfileQueryHandler: GetProfileQueryHandler;
  getUserQueryHandler: GetUserQueryHandler;
  findUsersQueryHandler: FindUsersQueryHandler;
  findRolesQueryHandler: FindRolesQueryHandler;
  getRoleQueryHandler: GetRoleQueryHandler;
  getUserGroupQueryHandler: GetUserGroupQueryHandler;
  findUserGroupsQueryHandler: FindUserGroupsQueryHandler;
}
