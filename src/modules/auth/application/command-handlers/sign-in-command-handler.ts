import {
  ValidationException,
  type ApplicationContext as AppContext,
  type CommandHandler,
  type EventDispatcher,
} from '@app/common';
import {
  AuthExceptionCode,
  Email,
  Password,
  SignInType,
  User,
  Username,
  type ExternalAuthenticationService,
  type UserIdGeneratorService,
  type UserRepository,
} from '@app/modules/auth/domain';
import type { SignInCommand, SignInResult } from '@app/modules/auth/interfaces';

export class SignInCommandHandler
  implements CommandHandler<SignInCommand, SignInResult>
{
  private readonly userRepository: UserRepository;
  private readonly externalAuthenticationService: ExternalAuthenticationService;
  private readonly userIdGeneratorService: UserIdGeneratorService;
  private readonly eventDispatcher: EventDispatcher;

  constructor({
    userRepository,
    externalAuthenticationService,
    userIdGeneratorService,
    eventDispatcher,
  }: {
    userRepository: UserRepository;
    externalAuthenticationService: ExternalAuthenticationService;
    userIdGeneratorService: UserIdGeneratorService;
    eventDispatcher: EventDispatcher;
  }) {
    this.userRepository = userRepository;
    this.externalAuthenticationService = externalAuthenticationService;
    this.userIdGeneratorService = userIdGeneratorService;
    this.eventDispatcher = eventDispatcher;
  }

  async execute(
    command: SignInCommand,
    _context?: AppContext
  ): Promise<SignInResult> {
    const password = Password.create(command.password);

    const emailResult = Email.tryCreate(command.emailOrUsername);
    let user: User | undefined;
    if (emailResult.email) {
      const { email } = emailResult;
      user = await this.userRepository.findByEmail(email);

      // edge case: user is using email but not found in database
      if (!user) {
        const verificationResult =
          await this.externalAuthenticationService.verifyPassword(
            email.getValue(),
            password.getValue()
          );
        if (!verificationResult) {
          throw new ValidationException(AuthExceptionCode.INVALID_CREDENTIALS);
        }

        // create user in database
        const user = User.create({
          id: this.userIdGeneratorService.generateUserId(emailResult.email),
          email,
          signInType: SignInType.EMAIL,
          externalId: verificationResult.externalId,
          username: undefined,
          displayName: undefined,
        });
        await this.userRepository.save(user);
        await this.eventDispatcher.dispatch(user.getEvents());

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
