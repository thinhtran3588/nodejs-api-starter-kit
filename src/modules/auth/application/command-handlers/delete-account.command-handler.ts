import { AuthorizationService } from '@app/common/application/services/authorization.service';
import type { EventDispatcher } from '@app/common/domain/interfaces/event-dispatcher';
import type { CommandHandler } from '@app/common/interfaces/command';
import type { AppContext } from '@app/common/interfaces/context';
import type { DeleteAccountCommand } from '@app/modules/auth/application/interfaces/commands/delete-account.command';
import type { UserRepository } from '@app/modules/auth/domain/interfaces/repositories/user.repository';
import type { UserValidatorService } from '@app/modules/auth/domain/interfaces/services/user-validator.service';

export class DeleteAccountCommandHandler
  implements CommandHandler<DeleteAccountCommand, void>
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userValidatorService: UserValidatorService,
    private readonly authorizationService: AuthorizationService,
    private readonly eventDispatcher: EventDispatcher
  ) {}

  async execute(
    _command: DeleteAccountCommand,
    context: AppContext
  ): Promise<void> {
    this.authorizationService.requireAuthenticated(context);

    const user = await this.userValidatorService.validateUserActiveById(
      context.user.userId
    );

    user.prepareUpdate(context.user.userId);
    user.markForDeletion();

    await this.userRepository.save(user);
    await this.eventDispatcher.dispatch(user.getEvents());
  }
}
