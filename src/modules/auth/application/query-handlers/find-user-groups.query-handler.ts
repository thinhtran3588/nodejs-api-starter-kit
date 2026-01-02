import { AuthorizationService } from '@app/common/application/services/authorization.service';
import type { AppContext } from '@app/common/interfaces/context';
import type {
  PaginatedResult,
  QueryHandler,
} from '@app/common/interfaces/query';
import { validatePaginationQuery } from '@app/common/utils/validate-pagination-query';
import { validateSearchTerm } from '@app/common/utils/validate-search-term';
import type { FindUserGroupsQuery } from '@app/modules/auth/application/interfaces/queries/find-user-groups.query';
import {
  USER_GROUP_READ_MODEL_FIELDS,
  USER_GROUP_READ_MODEL_SORT_FIELDS,
  type UserGroupReadModel,
} from '@app/modules/auth/application/interfaces/queries/user-group.read-model';
import type { UserGroupReadRepository } from '@app/modules/auth/application/interfaces/repositories/user-group.read-repository';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';

export class FindUserGroupsQueryHandler
  implements
    QueryHandler<FindUserGroupsQuery, PaginatedResult<UserGroupReadModel>>
{
  constructor(
    private readonly userGroupReadRepository: UserGroupReadRepository,
    private readonly authorizationService: AuthorizationService
  ) {}

  async execute(
    query: FindUserGroupsQuery,
    context: AppContext
  ): Promise<PaginatedResult<UserGroupReadModel>> {
    this.authorizationService.requireOneOfRoles(
      [AuthRole.AUTH_MANAGER, AuthRole.AUTH_VIEWER],
      context
    );

    const searchTerm = validateSearchTerm(query.searchTerm);

    return await this.userGroupReadRepository.find({
      ...validatePaginationQuery(
        query,
        USER_GROUP_READ_MODEL_FIELDS,
        USER_GROUP_READ_MODEL_SORT_FIELDS
      ),
      searchTerm,
    });
  }
}
