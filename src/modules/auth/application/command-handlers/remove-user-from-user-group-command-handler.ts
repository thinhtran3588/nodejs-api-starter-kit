import type { Transaction } from 'sequelize';
import {
  Uuid,
  validate,
  type ApplicationContext as AppContext,
  type AuthorizationService,
  type CommandHandler,
  type EventDispatcher,
} from '@app/common';
import type { RemoveUserFromUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/remove-user-from-user-group-command';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';
import type { UserGroupRepository } from '@app/modules/auth/domain/interfaces/repositories/user-group-repository';
import type { UserRepository } from '@app/modules/auth/domain/interfaces/repositories/user-repository';
import type { UserGroupValidatorService } from '@app/modules/auth/domain/interfaces/services/user-group-validator-service';
import type { UserValidatorService } from '@app/modules/auth/domain/interfaces/services/user-validator-service';

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

    await this.userRepository.save(user, async (transaction: Transaction) => {
      await this.userRepository.removeFromGroup(
        userId,
        userGroupId,
        transaction
      );
    });
    await this.eventDispatcher.dispatch(user.getEvents());
  }
}
