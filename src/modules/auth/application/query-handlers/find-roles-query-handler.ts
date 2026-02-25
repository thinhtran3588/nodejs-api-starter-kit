import {
  validatePaginationQuery,
  validateSearchTerm,
  validateUuid,
  type ApplicationContext as AppContext,
  type AuthorizationService,
  type PaginatedResult,
  type QueryHandler,
} from '@app/common';
import type { FindRolesQuery } from '@app/modules/auth/application/interfaces/queries/find-roles-query';
import {
  ROLE_READ_MODEL_FIELDS,
  ROLE_READ_MODEL_SORT_FIELDS,
  type RoleReadModel,
} from '@app/modules/auth/application/interfaces/queries/role-read-model';
import type { RoleReadRepository } from '@app/modules/auth/application/interfaces/repositories/role-read-repository';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';

export class FindRolesQueryHandler
  implements QueryHandler<FindRolesQuery, PaginatedResult<RoleReadModel>>
{
  private readonly roleReadRepository: RoleReadRepository;
  private readonly authorizationService: AuthorizationService;

  constructor({
    roleReadRepository,
    authorizationService,
  }: {
    roleReadRepository: RoleReadRepository;
    authorizationService: AuthorizationService;
  }) {
    this.roleReadRepository = roleReadRepository;
    this.authorizationService = authorizationService;
  }

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
