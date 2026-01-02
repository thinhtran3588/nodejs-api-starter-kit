import { AuthorizationService } from '@app/common/application/services/authorization.service';
import type { AppContext } from '@app/common/interfaces/context';
import type { QueryHandler } from '@app/common/interfaces/query';
import { ValidationException } from '@app/common/utils/exceptions';
import { validateUuid } from '@app/common/utils/validate-uuid';
import type { GetUserGroupQuery } from '@app/modules/auth/application/interfaces/queries/get-user-group.query';
import type { UserGroupReadModel } from '@app/modules/auth/application/interfaces/queries/user-group.read-model';
import type { UserGroupReadRepository } from '@app/modules/auth/application/interfaces/repositories/user-group.read-repository';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';

export class GetUserGroupQueryHandler
  implements QueryHandler<GetUserGroupQuery, UserGroupReadModel>
{
  constructor(
    private readonly userGroupReadRepository: UserGroupReadRepository,
    private readonly authorizationService: AuthorizationService
  ) {}

  async execute(
    query: GetUserGroupQuery,
    context: AppContext
  ): Promise<UserGroupReadModel> {
    this.authorizationService.requireOneOfRoles(
      [AuthRole.AUTH_MANAGER, AuthRole.AUTH_VIEWER],
      context
    );

    const id = validateUuid(query.id, {
      field: 'id',
      required: true,
    })!;

    const userGroup = await this.userGroupReadRepository.findById(id);

    if (!userGroup) {
      throw new ValidationException(AuthExceptionCode.USER_GROUP_NOT_FOUND);
    }

    return userGroup;
  }
}
