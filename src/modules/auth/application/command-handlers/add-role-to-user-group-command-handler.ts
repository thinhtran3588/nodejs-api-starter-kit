import {
  Uuid,
  validate,
  type ApplicationContext as AppContext,
  type AuthorizationService,
  type CommandHandler,
  type DatabaseTransaction,
  type EventDispatcher,
} from '@app/common';
import {
  AuthExceptionCode,
  AuthRole,
  type RoleRepository,
  type UserGroupRepository,
  type UserGroupValidatorService,
} from '@app/modules/auth/domain';
import type { AddRoleToUserGroupCommand } from '@app/modules/auth/interfaces';

export class AddRoleToUserGroupCommandHandler
  implements CommandHandler<AddRoleToUserGroupCommand, void>
{
  private readonly authorizationService: AuthorizationService;
  private readonly userGroupValidatorService: UserGroupValidatorService;
  private readonly roleRepository: RoleRepository;
  private readonly userGroupRepository: UserGroupRepository;
  private readonly eventDispatcher: EventDispatcher;

  constructor({
    authorizationService,
    userGroupValidatorService,
    roleRepository,
    userGroupRepository,
    eventDispatcher,
  }: {
    authorizationService: AuthorizationService;
    userGroupValidatorService: UserGroupValidatorService;
    roleRepository: RoleRepository;
    userGroupRepository: UserGroupRepository;
    eventDispatcher: EventDispatcher;
  }) {
    this.authorizationService = authorizationService;
    this.userGroupValidatorService = userGroupValidatorService;
    this.roleRepository = roleRepository;
    this.userGroupRepository = userGroupRepository;
    this.eventDispatcher = eventDispatcher;
  }

  async execute(
    command: AddRoleToUserGroupCommand,
    context: AppContext
  ): Promise<void> {
    this.authorizationService.requireRole(AuthRole.AUTH_MANAGER, context);

    const userGroupId = Uuid.create(command.userGroupId, 'userGroupId');
    const roleId = Uuid.create(command.roleId, 'roleId');
    const userGroup =
      await this.userGroupValidatorService.validateUserGroupExistsById(
        userGroupId
      );

    const roleExists = await this.roleRepository.roleExists(roleId.getValue());
    validate(roleExists, AuthExceptionCode.ROLE_NOT_FOUND);

    const roleInGroup = await this.userGroupRepository.roleInGroup(
      userGroupId,
      roleId
    );
    validate(!roleInGroup, AuthExceptionCode.ROLE_ALREADY_IN_GROUP);

    userGroup.prepareUpdate(context.user!.userId);
    userGroup.addRole(roleId);

    await this.userGroupRepository.save(
      userGroup,
      async (transaction: DatabaseTransaction) => {
        await this.userGroupRepository.addRole(
          userGroupId,
          roleId,
          transaction
        );
      }
    );
    await this.eventDispatcher.dispatch(userGroup.getEvents());
  }
}
