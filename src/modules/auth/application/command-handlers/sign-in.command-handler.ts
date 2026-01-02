import type { CommandHandler } from '@app/common/interfaces/command';
import type { AppContext } from '@app/common/interfaces/context';
import { ValidationException } from '@app/common/utils/exceptions';
import type {
  SignInCommand,
  SignInResult,
} from '@app/modules/auth/application/interfaces/commands/sign-in.command';
import type { User } from '@app/modules/auth/domain/aggregates/user';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import type { UserRepository } from '@app/modules/auth/domain/interfaces/repositories/user.repository';
import type { ExternalAuthenticationService } from '@app/modules/auth/domain/interfaces/services/external-authentication.service';
import { Email } from '@app/modules/auth/domain/value-objects/email';
import { Password } from '@app/modules/auth/domain/value-objects/password';
import { Username } from '@app/modules/auth/domain/value-objects/username';

export class SignInCommandHandler
  implements CommandHandler<SignInCommand, SignInResult>
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly externalAuthenticationService: ExternalAuthenticationService
  ) {}

  async execute(
    command: SignInCommand,
    _context?: AppContext
  ): Promise<SignInResult> {
    const password = Password.create(command.password);

    const emailResult = Email.tryCreate(command.emailOrUsername);
    let user: User | undefined;
    if (emailResult.email) {
      user = await this.userRepository.findByEmail(emailResult.email);
    } else {
      const username = Username.create(command.emailOrUsername);
      user = await this.userRepository.findByUsername(username);
    }
    if (!user) {
      throw new ValidationException(AuthExceptionCode.INVALID_CREDENTIALS);
    }
    user.ensureActive();

    const verificationResult =
      await this.externalAuthenticationService.verifyPassword(
        user.email.getValue(),
        password.getValue()
      );

    if (!verificationResult) {
      throw new ValidationException(AuthExceptionCode.INVALID_CREDENTIALS);
    }

    const signInToken =
      await this.externalAuthenticationService.createSignInToken(
        user.externalId
      );

    return {
      id: user.id.getValue(),
      idToken: verificationResult.idToken,
      signInToken,
    };
  }
}
