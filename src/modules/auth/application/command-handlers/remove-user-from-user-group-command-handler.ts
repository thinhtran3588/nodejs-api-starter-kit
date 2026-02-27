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
  type UserGroupRepository,
  type UserGroupValidatorService,
  type UserRepository,
  type UserValidatorService,
} from '@app/modules/auth/domain';
import type { RemoveUserFromUserGroupCommand } from '@app/modules/auth/interfaces';

export class RemoveUserFromUserGroupCommandHandler
  implements CommandHandler<RemoveUserFromUserGroupCommand, void>
{
  private readonly authorizationService: AuthorizationService;
  private readonly userGroupValidatorService: UserGroupValidatorService;
  private readonly userRepository: UserRepository;
  private readonly userValidatorService: UserValidatorService;
  private readonly userGroupRepository: UserGroupRepository;
  private readonly eventDispatcher: EventDispatcher;

  constructor({
    authorizationService,
    userGroupValidatorService,
    userRepository,
    userValidatorService,
    userGroupRepository,
    eventDispatcher,
  }: {
    authorizationService: AuthorizationService;
    userGroupValidatorService: UserGroupValidatorService;
    userRepository: UserRepository;
    userValidatorService: UserValidatorService;
    userGroupRepository: UserGroupRepository;
    eventDispatcher: EventDispatcher;
  }) {
    this.authorizationService = authorizationService;
    this.userGroupValidatorService = userGroupValidatorService;
    this.userRepository = userRepository;
    this.userValidatorService = userValidatorService;
    this.userGroupRepository = userGroupRepository;
    this.eventDispatcher = eventDispatcher;
  }

  async execute(
    command: RemoveUserFromUserGroupCommand,
    context: AppContext
  ): Promise<void> {
    this.authorizationService.requireRole(AuthRole.AUTH_MANAGER, context);

    const userGroupId = Uuid.create(command.userGroupId, 'userGroupId');
    await this.userGroupValidatorService.validateUserGroupExistsById(
      userGroupId
    );
    const userId = Uuid.create(command.userId, 'userId');
    const user = await this.userValidatorService.validateUserExistsById(userId);
    await this.userValidatorService.validateUserExistsById(userId);

    const userInGroup = await this.userGroupRepository.userInGroup(
      userGroupId,
      userId
    );
    validate(userInGroup, AuthExceptionCode.USER_NOT_IN_GROUP);

    user.prepareUpdate(context.user!.userId);
    user.removedFromUserGroup(userGroupId);

    await this.userRepository.save(
      user,
      async (transaction: DatabaseTransaction) => {
        await this.userRepository.removeFromGroup(
          userId,
          userGroupId,
          transaction
        );
      }
    );
    await this.eventDispatcher.dispatch(user.getEvents());
  }
}
