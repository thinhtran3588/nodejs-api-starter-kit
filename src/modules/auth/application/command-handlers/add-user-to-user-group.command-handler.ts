import type { Transaction } from 'sequelize';
import { AuthorizationService } from '@app/common/application/services/authorization.service';
import type { EventDispatcher } from '@app/common/domain/interfaces/event-dispatcher';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import type { CommandHandler } from '@app/common/interfaces/command';
import type { AppContext } from '@app/common/interfaces/context';
import { validate } from '@app/common/utils/validate';
import type { AddUserToUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/add-user-to-user-group.command';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';
import type { UserGroupRepository } from '@app/modules/auth/domain/interfaces/repositories/user-group.repository';
import type { UserRepository } from '@app/modules/auth/domain/interfaces/repositories/user.repository';
import type { UserGroupValidatorService } from '@app/modules/auth/domain/interfaces/services/user-group-validator.service';
import type { UserValidatorService } from '@app/modules/auth/domain/interfaces/services/user-validator.service';

export class AddUserToUserGroupCommandHandler
  implements CommandHandler<AddUserToUserGroupCommand, void>
{
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly userGroupValidatorService: UserGroupValidatorService,
    private readonly userRepository: UserRepository,
    private readonly userValidatorService: UserValidatorService,
    private readonly userGroupRepository: UserGroupRepository,
    private readonly eventDispatcher: EventDispatcher
  ) {}

  async execute(
    command: AddUserToUserGroupCommand,
    context: AppContext
  ): Promise<void> {
    this.authorizationService.requireRole(AuthRole.AUTH_MANAGER, context);

    const userGroupId = Uuid.create(command.userGroupId, 'userGroupId');
    await this.userGroupValidatorService.validateUserGroupExistsById(
      userGroupId
    );
    const userId = Uuid.create(command.userId, 'userId');
    const user = await this.userValidatorService.validateUserExistsById(userId);

    const userInGroup = await this.userGroupRepository.userInGroup(
      userGroupId,
      userId
    );
    validate(!userInGroup, AuthExceptionCode.USER_ALREADY_IN_GROUP);

    user.prepareUpdate(context.user!.userId);
    user.addedToUserGroup(userGroupId);

    await this.userRepository.save(user, async (transaction: Transaction) => {
      await this.userRepository.addToGroup(userId, userGroupId, transaction);
    });
    await this.eventDispatcher.dispatch(user.getEvents());
  }
}
