import {
  Uuid,
  type ApplicationContext as AppContext,
  type AuthorizationService,
  type CommandHandler,
  type EventDispatcher,
} from '@app/common';
import type { DeleteUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/delete-user-group-command';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';
import type { UserGroupRepository } from '@app/modules/auth/domain/interfaces/repositories/user-group-repository';
import type { UserGroupValidatorService } from '@app/modules/auth/domain/interfaces/services/user-group-validator-service';

export class DeleteUserGroupCommandHandler
  implements CommandHandler<DeleteUserGroupCommand, void>
{
  private readonly authorizationService: AuthorizationService;
  private readonly userGroupValidatorService: UserGroupValidatorService;
  private readonly userGroupRepository: UserGroupRepository;
  private readonly eventDispatcher: EventDispatcher;

  constructor({
    authorizationService,
    userGroupValidatorService,
    userGroupRepository,
    eventDispatcher,
  }: {
    authorizationService: AuthorizationService;
    userGroupValidatorService: UserGroupValidatorService;
    userGroupRepository: UserGroupRepository;
    eventDispatcher: EventDispatcher;
  }) {
    this.authorizationService = authorizationService;
    this.userGroupValidatorService = userGroupValidatorService;
    this.userGroupRepository = userGroupRepository;
    this.eventDispatcher = eventDispatcher;
  }

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
