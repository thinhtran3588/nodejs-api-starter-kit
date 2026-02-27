import {
  ValidationException,
  type ApplicationContext as AppContext,
  type AuthorizationService,
  type QueryHandler,
} from '@app/common';
import { AuthExceptionCode, UserStatus } from '@app/modules/auth/domain';
import type {
  GetProfileQuery,
  UserProfileReadModel,
  UserReadRepository,
} from '@app/modules/auth/interfaces';

export class GetProfileQueryHandler
  implements QueryHandler<GetProfileQuery, UserProfileReadModel>
{
  private readonly userReadRepository: UserReadRepository;
  private readonly authorizationService: AuthorizationService;

  constructor({
    userReadRepository,
    authorizationService,
  }: {
    userReadRepository: UserReadRepository;
    authorizationService: AuthorizationService;
  }) {
    this.userReadRepository = userReadRepository;
    this.authorizationService = authorizationService;
  }

  async execute(
    _query: GetProfileQuery,
    context: AppContext
  ): Promise<UserProfileReadModel> {
    this.authorizationService.requireAuthenticated(context);

    const userId = context.user.userId.getValue();
    const user = await this.userReadRepository.findById(userId);

    if (!user) {
      throw new ValidationException(AuthExceptionCode.USER_NOT_FOUND);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ValidationException(AuthExceptionCode.USER_MUST_BE_ACTIVE);
    }

    return {
      id: user.id,
      email: user.email,
      signInType: user.signInType,
      externalId: user.externalId,
      displayName: user.displayName,
      username: user.username,
      version: user.version,
      createdAt: user.createdAt,
    };
  }
}
