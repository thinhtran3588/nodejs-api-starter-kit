import { AuthorizationService } from '@app/common/application/services/authorization.service';
import type { EventDispatcher } from '@app/common/domain/interfaces/event-dispatcher';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import type { CommandHandler } from '@app/common/interfaces/command';
import type { AppContext } from '@app/common/interfaces/context';
import { ValidationException } from '@app/common/utils/exceptions';
import { sanitize } from '@app/common/utils/sanitize';
import { validate } from '@app/common/utils/validate';
import type { UpdateUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/update-user-group.command';
import { UserGroup } from '@app/modules/auth/domain/aggregates/user-group';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';
import type { UserGroupRepository } from '@app/modules/auth/domain/interfaces/repositories/user-group.repository';
import type { UserGroupValidatorService } from '@app/modules/auth/domain/interfaces/services/user-group-validator.service';

export class UpdateUserGroupCommandHandler
  implements CommandHandler<UpdateUserGroupCommand, void>
{
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly userGroupValidatorService: UserGroupValidatorService,
    private readonly userGroupRepository: UserGroupRepository,
    private readonly eventDispatcher: EventDispatcher
  ) {}

  async execute(
    command: UpdateUserGroupCommand,
    context: AppContext
  ): Promise<void> {
    this.authorizationService.requireRole(AuthRole.AUTH_MANAGER, context);

    const hasUpdates =
      command.name !== undefined || command.description !== undefined;

    if (!hasUpdates) {
      throw new ValidationException(ValidationErrorCode.NO_UPDATES);
    }

    const userGroupId = Uuid.create(command.id, 'id');
    const userGroup =
      await this.userGroupValidatorService.validateUserGroupExistsById(
        userGroupId
      );

    userGroup.prepareUpdate(context.user!.userId);

    if (command.name !== undefined) {
      const name = UserGroup.validateName(sanitize(command.name));
      const nameExists = await this.userGroupRepository.nameExists(
        name,
        userGroupId
      );
      validate(!nameExists, AuthExceptionCode.USER_GROUP_NAME_ALREADY_TAKEN);
      userGroup.setName(name);
    }

    if (command.description !== undefined) {
      userGroup.setDescription(sanitize(command.description));
    }

    await this.userGroupRepository.save(userGroup);
    await this.eventDispatcher.dispatch(userGroup.getEvents());
  }
}
