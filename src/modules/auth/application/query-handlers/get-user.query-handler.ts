import { AuthorizationService } from '@app/common/application/services/authorization.service';
import type { AppContext } from '@app/common/interfaces/context';
import type { QueryHandler } from '@app/common/interfaces/query';
import { ValidationException } from '@app/common/utils/exceptions';
import { validateUuid } from '@app/common/utils/validate-uuid';
import type { GetUserQuery } from '@app/modules/auth/application/interfaces/queries/get-user.query';
import type { UserReadModel } from '@app/modules/auth/application/interfaces/queries/user.read-model';
import type { UserReadRepository } from '@app/modules/auth/application/interfaces/repositories/user.read-repository';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';
import { UserStatus } from '@app/modules/auth/domain/enums/user-status';

export class GetUserQueryHandler
  implements QueryHandler<GetUserQuery, UserReadModel>
{
  constructor(
    private readonly userReadRepository: UserReadRepository,
    private readonly authorizationService: AuthorizationService
  ) {}

  async execute(
    query: GetUserQuery,
    context: AppContext
  ): Promise<UserReadModel> {
    this.authorizationService.requireOneOfRoles(
      [AuthRole.AUTH_MANAGER, AuthRole.AUTH_VIEWER],
      context
    );

    const id = validateUuid(query.id, {
      field: 'id',
      required: true,
    })!;

    const user = await this.userReadRepository.findById(id);

    if (!user) {
      throw new ValidationException(AuthExceptionCode.USER_NOT_FOUND);
    }

    if (user.status === UserStatus.DELETED) {
      throw new ValidationException(AuthExceptionCode.USER_DELETED);
    }

    return user;
  }
}
