import { AuthorizationService } from '@app/common/application/services/authorization.service';
import type { AppContext } from '@app/common/interfaces/context';
import type {
  PaginatedResult,
  QueryHandler,
} from '@app/common/interfaces/query';
import { validatePaginationQuery } from '@app/common/utils/validate-pagination-query';
import { validateSearchTerm } from '@app/common/utils/validate-search-term';
import { validateUuid } from '@app/common/utils/validate-uuid';
import type { FindUsersQuery } from '@app/modules/auth/application/interfaces/queries/find-users.query';
import {
  USER_READ_MODEL_FIELDS,
  USER_READ_MODEL_SORT_FIELDS,
  type UserReadModel,
} from '@app/modules/auth/application/interfaces/queries/user.read-model';
import type { UserReadRepository } from '@app/modules/auth/application/interfaces/repositories/user.read-repository';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';

export class FindUsersQueryHandler
  implements QueryHandler<FindUsersQuery, PaginatedResult<UserReadModel>>
{
  constructor(
    private readonly userReadRepository: UserReadRepository,
    private readonly authorizationService: AuthorizationService
  ) {}

  async execute(
    query: FindUsersQuery,
    context: AppContext
  ): Promise<PaginatedResult<UserReadModel>> {
    this.authorizationService.requireOneOfRoles(
      [AuthRole.AUTH_MANAGER, AuthRole.AUTH_VIEWER],
      context
    );

    const searchTerm = validateSearchTerm(query.searchTerm);
    const userGroupId = validateUuid(query.userGroupId, {
      field: 'userGroupId',
      required: false,
    });

    return await this.userReadRepository.find({
      ...validatePaginationQuery(
        query,
        USER_READ_MODEL_FIELDS,
        USER_READ_MODEL_SORT_FIELDS
      ),
      searchTerm,
      userGroupId,
    });
  }
}
