import {
  BusinessException,
  sanitize,
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
  type UserValidatorService,
} from '@app/modules/auth/domain';
import type {
  RegisterCommand,
  RegisterResult,
} from '@app/modules/auth/interfaces';

export class RegisterCommandHandler
  implements CommandHandler<RegisterCommand, RegisterResult>
{
  private readonly userRepository: UserRepository;
  private readonly externalAuthenticationService: ExternalAuthenticationService;
  private readonly userIdGeneratorService: UserIdGeneratorService;
  private readonly userValidatorService: UserValidatorService;
  private readonly eventDispatcher: EventDispatcher;

  constructor({
    userRepository,
    externalAuthenticationService,
    userIdGeneratorService,
    userValidatorService,
    eventDispatcher,
  }: {
    userRepository: UserRepository;
    externalAuthenticationService: ExternalAuthenticationService;
    userIdGeneratorService: UserIdGeneratorService;
    userValidatorService: UserValidatorService;
    eventDispatcher: EventDispatcher;
  }) {
    this.userRepository = userRepository;
    this.externalAuthenticationService = externalAuthenticationService;
    this.userIdGeneratorService = userIdGeneratorService;
    this.userValidatorService = userValidatorService;
    this.eventDispatcher = eventDispatcher;
  }

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

    const existingFirebaseUser =
      await this.externalAuthenticationService.findUserByEmail(
        email.getValue()
      );
    if (existingFirebaseUser) {
      throw new ValidationException(AuthExceptionCode.EMAIL_ALREADY_TAKEN);
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
