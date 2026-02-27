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
  User,
  Username,
  type UserRepository,
  type UserValidatorService,
} from '@app/modules/auth/domain';
import type { UpdateUserCommand } from '@app/modules/auth/interfaces';

export class UpdateUserCommandHandler
  implements CommandHandler<UpdateUserCommand, void>
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
