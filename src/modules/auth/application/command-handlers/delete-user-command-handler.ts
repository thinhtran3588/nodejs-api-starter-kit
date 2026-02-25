import {
  Uuid,
  type ApplicationContext as AppContext,
  type AuthorizationService,
  type CommandHandler,
  type EventDispatcher,
} from '@app/common';
import type { DeleteUserCommand } from '@app/modules/auth/application/interfaces/commands/delete-user-command';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';
import type { UserRepository } from '@app/modules/auth/domain/interfaces/repositories/user-repository';
import type { UserValidatorService } from '@app/modules/auth/domain/interfaces/services/user-validator-service';

export class DeleteUserCommandHandler
  implements CommandHandler<DeleteUserCommand, void>
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
    command: DeleteUserCommand,
    context: AppContext
  ): Promise<void> {
    this.authorizationService.requireRole(AuthRole.AUTH_MANAGER, context);

    const userId = Uuid.create(command.id, 'userId');
    const user = await this.userValidatorService.validateUserExistsById(userId);

    user.prepareUpdate(context.user!.userId);
    user.markForDeletion();

    await this.userRepository.save(user);
    await this.eventDispatcher.dispatch(user.getEvents());
  }
}
