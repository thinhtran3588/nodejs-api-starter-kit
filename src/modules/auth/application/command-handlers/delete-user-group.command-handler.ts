import { AuthorizationService } from '@app/common/application/services/authorization.service';
import type { EventDispatcher } from '@app/common/domain/interfaces/event-dispatcher';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import type { CommandHandler } from '@app/common/interfaces/command';
import type { AppContext } from '@app/common/interfaces/context';
import type { DeleteUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/delete-user-group.command';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';
import type { UserGroupRepository } from '@app/modules/auth/domain/interfaces/repositories/user-group.repository';
import type { UserGroupValidatorService } from '@app/modules/auth/domain/interfaces/services/user-group-validator.service';

export class DeleteUserGroupCommandHandler
  implements CommandHandler<DeleteUserGroupCommand, void>
{
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly userGroupValidatorService: UserGroupValidatorService,
    private readonly userGroupRepository: UserGroupRepository,
    private readonly eventDispatcher: EventDispatcher
  ) {}

  async execute(
    command: DeleteUserGroupCommand,
    context: AppContext
  ): Promise<void> {
    this.authorizationService.requireRole(AuthRole.AUTH_MANAGER, context);

    const userGroupId = Uuid.create(command.id, 'id');
    const userGroup =
      await this.userGroupValidatorService.validateUserGroupExistsById(
        userGroupId
      );

    userGroup.prepareUpdate(context.user!.userId);
    userGroup.markForDeletion();

    await this.userGroupRepository.delete(userGroup);
    await this.eventDispatcher.dispatch(userGroup.getEvents());
  }
}
