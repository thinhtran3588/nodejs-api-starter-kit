import { AuthorizationService } from '@app/common/application/services/authorization.service';
import type { AppContext } from '@app/common/interfaces/context';
import type {
  PaginatedResult,
  QueryHandler,
} from '@app/common/interfaces/query';
import { validatePaginationQuery } from '@app/common/utils/validate-pagination-query';
import { validateSearchTerm } from '@app/common/utils/validate-search-term';
import { validateUuid } from '@app/common/utils/validate-uuid';
import type { FindRolesQuery } from '@app/modules/auth/application/interfaces/queries/find-roles.query';
import {
  ROLE_READ_MODEL_FIELDS,
  ROLE_READ_MODEL_SORT_FIELDS,
  type RoleReadModel,
} from '@app/modules/auth/application/interfaces/queries/role.read-model';
import type { RoleReadRepository } from '@app/modules/auth/application/interfaces/repositories/role.read-repository';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';

export class FindRolesQueryHandler
  implements QueryHandler<FindRolesQuery, PaginatedResult<RoleReadModel>>
{
  constructor(
    private readonly roleReadRepository: RoleReadRepository,
    private readonly authorizationService: AuthorizationService
  ) {}

  async execute(
    query: FindRolesQuery,
    context: AppContext
  ): Promise<PaginatedResult<RoleReadModel>> {
    this.authorizationService.requireOneOfRoles(
      [AuthRole.AUTH_MANAGER, AuthRole.AUTH_VIEWER],
      context
    );

    const searchTerm = validateSearchTerm(query.searchTerm);
    const userGroupId = validateUuid(query.userGroupId, {
      field: 'userGroupId',
      required: false,
    });

    return await this.roleReadRepository.find({
      ...validatePaginationQuery(
        query,
        ROLE_READ_MODEL_FIELDS as string[],
        ROLE_READ_MODEL_SORT_FIELDS
      ),
      searchTerm,
      userGroupId,
    });
  }
}
