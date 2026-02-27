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
  USER_READ_MODEL_FIELDS,
  USER_READ_MODEL_SORT_FIELDS,
  type FindUsersQuery,
  type UserReadModel,
  type UserReadRepository,
} from '@app/modules/auth/interfaces';

export class FindUsersQueryHandler
  implements QueryHandler<FindUsersQuery, PaginatedResult<UserReadModel>>
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
