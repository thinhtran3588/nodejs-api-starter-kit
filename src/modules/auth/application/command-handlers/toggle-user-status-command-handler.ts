import {
  Uuid,
  type ApplicationContext as AppContext,
  type AuthorizationService,
  type CommandHandler,
  type EventDispatcher,
} from '@app/common';
import {
  AuthRole,
  type ExternalAuthenticationService,
  type UserRepository,
  type UserValidatorService,
} from '@app/modules/auth/domain';
import type { ToggleUserStatusCommand } from '@app/modules/auth/interfaces';

export class ToggleUserStatusCommandHandler
  implements CommandHandler<ToggleUserStatusCommand, void>
{
  private readonly userValidatorService: UserValidatorService;
  private readonly userRepository: UserRepository;
  private readonly externalAuthenticationService: ExternalAuthenticationService;
  private readonly authorizationService: AuthorizationService;
  private readonly eventDispatcher: EventDispatcher;

  constructor({
    userValidatorService,
    userRepository,
    externalAuthenticationService,
    authorizationService,
    eventDispatcher,
  }: {
    userValidatorService: UserValidatorService;
    userRepository: UserRepository;
    externalAuthenticationService: ExternalAuthenticationService;
    authorizationService: AuthorizationService;
    eventDispatcher: EventDispatcher;
  }) {
    this.userValidatorService = userValidatorService;
    this.userRepository = userRepository;
    this.externalAuthenticationService = externalAuthenticationService;
    this.authorizationService = authorizationService;
    this.eventDispatcher = eventDispatcher;
  }

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
