import {
  sanitize,
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
  User,
  Username,
  type UserRepository,
  type UserValidatorService,
} from '@app/modules/auth/domain';
import type { UpdateProfileCommand } from '@app/modules/auth/interfaces';

export class UpdateProfileCommandHandler
  implements CommandHandler<UpdateProfileCommand, void>
{
  private readonly authorizationService: AuthorizationService;
  private readonly userRepository: UserRepository;
  private readonly userValidatorService: UserValidatorService;
  private readonly eventDispatcher: EventDispatcher;

  constructor({
    authorizationService,
    userRepository,
    userValidatorService,
    eventDispatcher,
  }: {
    authorizationService: AuthorizationService;
    userRepository: UserRepository;
    userValidatorService: UserValidatorService;
    eventDispatcher: EventDispatcher;
  }) {
    this.authorizationService = authorizationService;
    this.userRepository = userRepository;
    this.userValidatorService = userValidatorService;
    this.eventDispatcher = eventDispatcher;
  }

  async execute(
    command: UpdateProfileCommand,
    context: AppContext
  ): Promise<void> {
    this.authorizationService.requireAuthenticated(context);

    const displayName = User.validateDisplayName(sanitize(command.displayName));
    const username = command.username
      ? Username.create(command.username)
      : undefined;

    const hasUpdates = displayName !== undefined || username !== undefined;

    if (!hasUpdates) {
      throw new ValidationException(ValidationErrorCode.NO_UPDATES);
    }

    const user = await this.userValidatorService.validateUserActiveById(
      context.user.userId
    );

    user.prepareUpdate(context.user.userId);

    if (username) {
      const usernameExists = await this.userRepository.usernameExists(
        username,
        context.user.userId
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
