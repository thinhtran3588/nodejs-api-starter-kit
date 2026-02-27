import {
  validatePaginationQuery,
  validateSearchTerm,
  validateUuid,
  type ApplicationContext as AppContext,
  type AuthorizationService,
  type PaginatedResult,
  type QueryHandler,
} from '@app/common';
import { AuthRole } from '@app/modules/auth/domain';
import {
  ROLE_READ_MODEL_FIELDS,
  ROLE_READ_MODEL_SORT_FIELDS,
  type FindRolesQuery,
  type RoleReadModel,
  type RoleReadRepository,
} from '@app/modules/auth/interfaces';

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
        ROLE_READ_MODEL_FIELDS,
        ROLE_READ_MODEL_SORT_FIELDS
      ),
      searchTerm,
      userGroupId,
    });
  }
}
