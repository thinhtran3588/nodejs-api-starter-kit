import {
  sanitize,
  Uuid,
  validate,
  type ApplicationContext as AppContext,
  type AuthorizationService,
  type CommandHandler,
  type CreateCommandResult,
  type EventDispatcher,
} from '@app/common';
import type { CreateUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/create-user-group-command';
import { UserGroup } from '@app/modules/auth/domain/aggregates/user-group';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';
import type { UserGroupRepository } from '@app/modules/auth/domain/interfaces/repositories/user-group-repository';

export class CreateUserGroupCommandHandler
  implements CommandHandler<CreateUserGroupCommand, CreateCommandResult>
{
  private readonly authorizationService: AuthorizationService;
  private readonly userGroupRepository: UserGroupRepository;
  private readonly eventDispatcher: EventDispatcher;

  constructor({
    authorizationService,
    userGroupRepository,
    eventDispatcher,
  }: {
    authorizationService: AuthorizationService;
    userGroupRepository: UserGroupRepository;
    eventDispatcher: EventDispatcher;
  }) {
    this.authorizationService = authorizationService;
    this.userGroupRepository = userGroupRepository;
    this.eventDispatcher = eventDispatcher;
  }

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
