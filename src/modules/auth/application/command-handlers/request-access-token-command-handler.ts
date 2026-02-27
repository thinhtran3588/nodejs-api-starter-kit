import {
  sanitize,
  ValidationErrorCode,
  ValidationException,
  type ApplicationContext as AppContext,
  type CommandHandler,
  type EventDispatcher,
  type JwtService,
} from '@app/common';
import {
  AuthExceptionCode,
  Email,
  SignInType,
  User,
  type ExternalAuthenticationService,
  type UserGroupRepository,
  type UserIdGeneratorService,
  type UserRepository,
  type UserValidatorService,
} from '@app/modules/auth/domain';
import type {
  RequestAccessTokenCommand,
  RequestAccessTokenResult,
} from '@app/modules/auth/interfaces';

export class RequestAccessTokenCommandHandler
  implements CommandHandler<RequestAccessTokenCommand, RequestAccessTokenResult>
{
  private readonly userGroupRepository: UserGroupRepository;
  private readonly jwtService: JwtService;
  private readonly externalAuthenticationService: ExternalAuthenticationService;
  private readonly userRepository: UserRepository;
  private readonly userIdGeneratorService: UserIdGeneratorService;
  private readonly userValidatorService: UserValidatorService;
  private readonly eventDispatcher: EventDispatcher;

  constructor({
    userGroupRepository,
    jwtService,
    externalAuthenticationService,
    userRepository,
    userIdGeneratorService,
    userValidatorService,
    eventDispatcher,
  }: {
    userGroupRepository: UserGroupRepository;
    jwtService: JwtService;
    externalAuthenticationService: ExternalAuthenticationService;
    userRepository: UserRepository;
    userIdGeneratorService: UserIdGeneratorService;
    userValidatorService: UserValidatorService;
    eventDispatcher: EventDispatcher;
  }) {
    this.userGroupRepository = userGroupRepository;
    this.jwtService = jwtService;
    this.externalAuthenticationService = externalAuthenticationService;
    this.userRepository = userRepository;
    this.userIdGeneratorService = userIdGeneratorService;
    this.userValidatorService = userValidatorService;
    this.eventDispatcher = eventDispatcher;
  }

  /**
   * Maps Firebase provider ID to SignInType enum
   * @param providerId - Firebase provider ID (e.g., 'password', 'google.com', 'apple.com')
   * @returns SignInType enum value
   * @throws ValidationException with FIELD_IS_INVALID code if provider is not supported
   */
  private mapFirebaseProviderToSignInType(providerId: string): SignInType {
    switch (providerId) {
      case 'password':
      case 'email':
        return SignInType.EMAIL;
      case 'google.com':
        return SignInType.GOOGLE;
      case 'apple.com':
        return SignInType.APPLE;
      default:
        throw new ValidationException(ValidationErrorCode.FIELD_IS_INVALID, {
          field: 'providerId',
          value: providerId,
        });
    }
  }

  async execute(
    command: RequestAccessTokenCommand,
    _context?: AppContext
  ): Promise<RequestAccessTokenResult> {
    const { externalId } = await this.externalAuthenticationService.verifyToken(
      command.idToken
    );
    let user = await this.userRepository.findByExternalId(externalId);

    if (!user) {
      const firebaseUser =
        await this.externalAuthenticationService.findUserById(externalId);

      if (!firebaseUser) {
        throw new ValidationException(
          AuthExceptionCode.USER_NOT_FOUND,
          undefined,
          'Firebase user not found after token verification'
        );
      }

      if (!firebaseUser.email) {
        throw new ValidationException(
          ValidationErrorCode.FIELD_IS_REQUIRED,
          { field: 'email' },
          'Firebase user must have an email address'
        );
      }

      const email = Email.create(firebaseUser.email);

      const existingUserByEmail = await this.userRepository.findByEmail(email);
      if (
        existingUserByEmail &&
        existingUserByEmail.externalId !== externalId
      ) {
        throw new ValidationException(
          AuthExceptionCode.EMAIL_ALREADY_TAKEN,
          undefined,
          'Email is already registered with a different account'
        );
      }

      await this.userValidatorService.validateEmailUniqueness(email);

      const primaryProvider =
        firebaseUser.providerData[0]?.providerId ?? 'password';
      const signInType = this.mapFirebaseProviderToSignInType(primaryProvider);

      const userId = this.userIdGeneratorService.generateUserId(email);

      const displayName = firebaseUser.displayName
        ? User.validateDisplayName(sanitize(firebaseUser.displayName))
        : undefined;

      user = User.create({
        id: userId,
        email,
        signInType,
        externalId: firebaseUser.uid,
        displayName,
        username: undefined,
        status: undefined,
      });

      await this.userRepository.save(user);
      await this.eventDispatcher.dispatch(user.getEvents());
    }

    user.ensureActive();

    const roles = await this.userGroupRepository.getUserRoleCodes(user.id);

    const token = this.jwtService.signToken({
      userId: user.id.getValue(),
      roles,
    });

    return {
      token,
    };
  }
}
