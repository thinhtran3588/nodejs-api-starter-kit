import {
  type ApplicationContext as AppContext,
  type AuthorizationService,
  type CommandHandler,
  type EventDispatcher,
} from '@app/common';
import type {
  UserRepository,
  UserValidatorService,
} from '@app/modules/auth/domain';
import type { DeleteAccountCommand } from '@app/modules/auth/interfaces';

export class DeleteAccountCommandHandler
  implements CommandHandler<DeleteAccountCommand, void>
{
  private readonly userRepository: UserRepository;
  private readonly userValidatorService: UserValidatorService;
  private readonly authorizationService: AuthorizationService;
  private readonly eventDispatcher: EventDispatcher;

  constructor({
    userRepository,
    userValidatorService,
    authorizationService,
    eventDispatcher,
  }: {
    userRepository: UserRepository;
    userValidatorService: UserValidatorService;
    authorizationService: AuthorizationService;
    eventDispatcher: EventDispatcher;
  }) {
    this.userRepository = userRepository;
    this.userValidatorService = userValidatorService;
    this.authorizationService = authorizationService;
    this.eventDispatcher = eventDispatcher;
  }

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
