import {
  validatePaginationQuery,
  validateSearchTerm,
  type ApplicationContext as AppContext,
  type AuthorizationService,
  type PaginatedResult,
  type QueryHandler,
} from '@app/common';
import { AuthRole } from '@app/modules/auth/domain';
import {
  USER_GROUP_READ_MODEL_FIELDS,
  USER_GROUP_READ_MODEL_SORT_FIELDS,
  type FindUserGroupsQuery,
  type UserGroupReadModel,
  type UserGroupReadRepository,
} from '@app/modules/auth/interfaces';

export class FindUserGroupsQueryHandler
  implements
    QueryHandler<FindUserGroupsQuery, PaginatedResult<UserGroupReadModel>>
{
  private readonly userGroupReadRepository: UserGroupReadRepository;
  private readonly authorizationService: AuthorizationService;

  constructor({
    userGroupReadRepository,
    authorizationService,
  }: {
    userGroupReadRepository: UserGroupReadRepository;
    authorizationService: AuthorizationService;
  }) {
    this.userGroupReadRepository = userGroupReadRepository;
    this.authorizationService = authorizationService;
  }

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
