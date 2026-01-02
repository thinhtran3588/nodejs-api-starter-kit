import { AuthorizationService } from '@app/common/application/services/authorization.service';
import type { EventDispatcher } from '@app/common/domain/interfaces/event-dispatcher';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import type {
  CommandHandler,
  CreateCommandResult,
} from '@app/common/interfaces/command';
import type { AppContext } from '@app/common/interfaces/context';
import { sanitize } from '@app/common/utils/sanitize';
import { validate } from '@app/common/utils/validate';
import type { CreateUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/create-user-group.command';
import { UserGroup } from '@app/modules/auth/domain/aggregates/user-group';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';
import type { UserGroupRepository } from '@app/modules/auth/domain/interfaces/repositories/user-group.repository';

export class CreateUserGroupCommandHandler
  implements CommandHandler<CreateUserGroupCommand, CreateCommandResult>
{
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly userGroupRepository: UserGroupRepository,
    private readonly eventDispatcher: EventDispatcher
  ) {}

  async execute(
    command: CreateUserGroupCommand,
    context: AppContext
  ): Promise<CreateCommandResult> {
    this.authorizationService.requireRole(AuthRole.AUTH_MANAGER, context);

    const name = UserGroup.validateName(sanitize(command.name));
    const description = UserGroup.validateDescription(
      sanitize(command.description)
    );

    const nameExists = await this.userGroupRepository.nameExists(name);
    validate(!nameExists, AuthExceptionCode.USER_GROUP_NAME_ALREADY_TAKEN);

    const userGroup = UserGroup.create({
      id: Uuid.generate(),
      name,
      description,
      createdBy: context.user!.userId,
    });

    await this.userGroupRepository.save(userGroup);
    await this.eventDispatcher.dispatch(userGroup.getEvents());

    return {
      id: userGroup.id.getValue(),
    };
  }
}
