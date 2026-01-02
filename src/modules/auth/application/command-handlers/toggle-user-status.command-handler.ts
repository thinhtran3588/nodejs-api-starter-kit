import { AuthorizationService } from '@app/common/application/services/authorization.service';
import type { EventDispatcher } from '@app/common/domain/interfaces/event-dispatcher';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import type { CommandHandler } from '@app/common/interfaces/command';
import type { AppContext } from '@app/common/interfaces/context';
import type { ToggleUserStatusCommand } from '@app/modules/auth/application/interfaces/commands/toggle-user-status.command';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';
import type { UserRepository } from '@app/modules/auth/domain/interfaces/repositories/user.repository';
import type { ExternalAuthenticationService } from '@app/modules/auth/domain/interfaces/services/external-authentication.service';
import type { UserValidatorService } from '@app/modules/auth/domain/interfaces/services/user-validator.service';

export class ToggleUserStatusCommandHandler
  implements CommandHandler<ToggleUserStatusCommand, void>
{
  constructor(
    private readonly userValidatorService: UserValidatorService,
    private readonly userRepository: UserRepository,
    private readonly externalAuthenticationService: ExternalAuthenticationService,
    private readonly authorizationService: AuthorizationService,
    private readonly eventDispatcher: EventDispatcher
  ) {}

  async execute(
    command: ToggleUserStatusCommand,
    context: AppContext
  ): Promise<void> {
    this.authorizationService.requireRole(AuthRole.AUTH_MANAGER, context);

    const userId = Uuid.create(command.id, 'userId');
    const user =
      await this.userValidatorService.validateUserNotDeletedById(userId);

    user.prepareUpdate(context.user!.userId);

    if (command.enabled) {
      user.activate();
    } else {
      user.disable();
    }

    await this.userRepository.save(user);
    await this.eventDispatcher.dispatch(user.getEvents());

    if (command.enabled) {
      await this.externalAuthenticationService.enableUser(user.externalId);
    } else {
      await this.externalAuthenticationService.disableUser(user.externalId);
    }
  }
}
