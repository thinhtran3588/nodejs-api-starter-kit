import { AuthorizationService } from '@app/common/application/services/authorization.service';
import type { EventDispatcher } from '@app/common/domain/interfaces/event-dispatcher';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import type { CommandHandler } from '@app/common/interfaces/command';
import type { AppContext } from '@app/common/interfaces/context';
import { ValidationException } from '@app/common/utils/exceptions';
import { sanitize } from '@app/common/utils/sanitize';
import { validate } from '@app/common/utils/validate';
import type { UpdateUserCommand } from '@app/modules/auth/application/interfaces/commands/update-user.command';
import { User } from '@app/modules/auth/domain/aggregates/user';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';
import type { UserRepository } from '@app/modules/auth/domain/interfaces/repositories/user.repository';
import type { UserValidatorService } from '@app/modules/auth/domain/interfaces/services/user-validator.service';
import { Username } from '@app/modules/auth/domain/value-objects/username';

export class UpdateUserCommandHandler
  implements CommandHandler<UpdateUserCommand, void>
{
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly userRepository: UserRepository,
    private readonly userValidatorService: UserValidatorService,
    private readonly eventDispatcher: EventDispatcher
  ) {}

  async execute(
    command: UpdateUserCommand,
    context: AppContext
  ): Promise<void> {
    this.authorizationService.requireRole(AuthRole.AUTH_MANAGER, context);

    const displayName = User.validateDisplayName(sanitize(command.displayName));
    const username = command.username
      ? Username.create(command.username)
      : undefined;

    const hasUpdates = displayName !== undefined || username !== undefined;

    if (!hasUpdates) {
      throw new ValidationException(ValidationErrorCode.NO_UPDATES);
    }

    const userId = Uuid.create(command.id, 'id');
    const user =
      await this.userValidatorService.validateUserNotDeletedById(userId);

    user.prepareUpdate(context.user!.userId);

    if (username) {
      const usernameExists = await this.userRepository.usernameExists(
        username,
        userId
      );
      validate(!usernameExists, AuthExceptionCode.USERNAME_ALREADY_TAKEN);
    }

    if (username !== undefined) {
      user.setUsername(username);
    }

    if (displayName !== undefined) {
      user.setDisplayName(displayName);
    }

    await this.userRepository.save(user);
    await this.eventDispatcher.dispatch(user.getEvents());
  }
}
