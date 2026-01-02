import { AuthorizationService } from '@app/common/application/services/authorization.service';
import type { AppContext } from '@app/common/interfaces/context';
import type { QueryHandler } from '@app/common/interfaces/query';
import { ValidationException } from '@app/common/utils/exceptions';
import type { GetProfileQuery } from '@app/modules/auth/application/interfaces/queries/get-profile.query';
import type { UserProfileReadModel } from '@app/modules/auth/application/interfaces/queries/user.read-model';
import type { UserReadRepository } from '@app/modules/auth/application/interfaces/repositories/user.read-repository';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { UserStatus } from '@app/modules/auth/domain/enums/user-status';

export class GetProfileQueryHandler
  implements QueryHandler<GetProfileQuery, UserProfileReadModel>
{
  constructor(
    private readonly userReadRepository: UserReadRepository,
    private readonly authorizationService: AuthorizationService
  ) {}

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
