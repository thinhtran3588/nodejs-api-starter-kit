import type { Transaction } from 'sequelize';
import {
  Uuid,
  validate,
  type ApplicationContext as AppContext,
  type AuthorizationService,
  type CommandHandler,
  type EventDispatcher,
} from '@app/common';
import type { RemoveRoleFromUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/remove-role-from-user-group-command';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';
import type { RoleRepository } from '@app/modules/auth/domain/interfaces/repositories/role-repository';
import type { UserGroupRepository } from '@app/modules/auth/domain/interfaces/repositories/user-group-repository';
import type { UserGroupValidatorService } from '@app/modules/auth/domain/interfaces/services/user-group-validator-service';

export class RemoveRoleFromUserGroupCommandHandler
  implements CommandHandler<RemoveRoleFromUserGroupCommand, void>
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
    command: RemoveRoleFromUserGroupCommand,
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
    validate(roleInGroup, AuthExceptionCode.ROLE_NOT_IN_GROUP);

    userGroup.prepareUpdate(context.user!.userId);
    userGroup.removeRole(roleId);

    await this.userGroupRepository.save(
      userGroup,
      async (transaction: Transaction) => {
        await this.userGroupRepository.removeRole(
          userGroupId,
          roleId,
          transaction
        );
      }
    );
    await this.eventDispatcher.dispatch(userGroup.getEvents());
  }
}
