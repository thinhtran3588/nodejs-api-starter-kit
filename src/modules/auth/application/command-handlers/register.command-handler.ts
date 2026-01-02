import type { EventDispatcher } from '@app/common/domain/interfaces/event-dispatcher';
import type { CommandHandler } from '@app/common/interfaces/command';
import type { AppContext } from '@app/common/interfaces/context';
import { BusinessException } from '@app/common/utils/exceptions';
import { sanitize } from '@app/common/utils/sanitize';
import type {
  RegisterCommand,
  RegisterResult,
} from '@app/modules/auth/application/interfaces/commands/register.command';
import { User } from '@app/modules/auth/domain/aggregates/user';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { SignInType } from '@app/modules/auth/domain/enums/sign-in-type';
import type { UserRepository } from '@app/modules/auth/domain/interfaces/repositories/user.repository';
import type { ExternalAuthenticationService } from '@app/modules/auth/domain/interfaces/services/external-authentication.service';
import type { UserIdGeneratorService } from '@app/modules/auth/domain/interfaces/services/user-id-generator.service';
import type { UserValidatorService } from '@app/modules/auth/domain/interfaces/services/user-validator.service';
import { Email } from '@app/modules/auth/domain/value-objects/email';
import { Password } from '@app/modules/auth/domain/value-objects/password';
import { Username } from '@app/modules/auth/domain/value-objects/username';

export class RegisterCommandHandler
  implements CommandHandler<RegisterCommand, RegisterResult>
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly externalAuthenticationService: ExternalAuthenticationService,
    private readonly userIdGeneratorService: UserIdGeneratorService,
    private readonly userValidatorService: UserValidatorService,
    private readonly eventDispatcher: EventDispatcher
  ) {}

  async execute(
    command: RegisterCommand,
    _context?: AppContext
  ): Promise<RegisterResult> {
    const email = Email.create(command.email);
    const password = Password.create(command.password);
    const username = command.username
      ? Username.create(command.username)
      : undefined;
    const displayName = User.validateDisplayName(sanitize(command.displayName));

    await this.userValidatorService.validateEmailUniqueness(email);

    if (username) {
      await this.userValidatorService.validateUsernameUniqueness(username);
    }

    const externalId = await this.externalAuthenticationService.createUser({
      email: email.getValue(),
      password: password.getValue(),
    });

    const user = User.create({
      id: this.userIdGeneratorService.generateUserId(email),
      email,
      signInType: SignInType.EMAIL,
      externalId,
      username,
      displayName,
    });

    await this.userRepository.save(user);
    await this.eventDispatcher.dispatch(user.getEvents());

    const verificationResult =
      await this.externalAuthenticationService.verifyPassword(
        email.getValue(),
        password.getValue()
      );

    if (!verificationResult) {
      throw new BusinessException(
        AuthExceptionCode.EXTERNAL_AUTHENTICATION_ERROR,
        undefined,
        'Failed to sign in user after registration'
      );
    }

    const signInToken =
      await this.externalAuthenticationService.createSignInToken(externalId);

    return {
      id: user.id.getValue(),
      idToken: verificationResult.idToken,
      signInToken,
    };
  }
}
