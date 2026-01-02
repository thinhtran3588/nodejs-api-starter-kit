import type { Transaction } from 'sequelize';
import { AuthorizationService } from '@app/common/application/services/authorization.service';
import type { EventDispatcher } from '@app/common/domain/interfaces/event-dispatcher';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import type { CommandHandler } from '@app/common/interfaces/command';
import type { AppContext } from '@app/common/interfaces/context';
import { validate } from '@app/common/utils/validate';
import type { RemoveRoleFromUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/remove-role-from-user-group.command';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';
import type { RoleRepository } from '@app/modules/auth/domain/interfaces/repositories/role.repository';
import type { UserGroupRepository } from '@app/modules/auth/domain/interfaces/repositories/user-group.repository';
import type { UserGroupValidatorService } from '@app/modules/auth/domain/interfaces/services/user-group-validator.service';

export class RemoveRoleFromUserGroupCommandHandler
  implements CommandHandler<RemoveRoleFromUserGroupCommand, void>
{
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly userGroupValidatorService: UserGroupValidatorService,
    private readonly roleRepository: RoleRepository,
    private readonly userGroupRepository: UserGroupRepository,
    private readonly eventDispatcher: EventDispatcher
  ) {}

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
