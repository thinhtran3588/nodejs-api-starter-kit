import {
  sanitize,
  Uuid,
  validate,
  ValidationErrorCode,
  ValidationException,
  type ApplicationContext as AppContext,
  type AuthorizationService,
  type CommandHandler,
  type EventDispatcher,
} from '@app/common';
import {
  AuthExceptionCode,
  AuthRole,
  UserGroup,
  type UserGroupRepository,
  type UserGroupValidatorService,
} from '@app/modules/auth/domain';
import type { UpdateUserGroupCommand } from '@app/modules/auth/interfaces';

export class UpdateUserGroupCommandHandler
  implements CommandHandler<UpdateUserGroupCommand, void>
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
