import {
  validateUuid,
  ValidationException,
  type ApplicationContext as AppContext,
  type AuthorizationService,
  type QueryHandler,
} from '@app/common';
import { AuthExceptionCode, AuthRole } from '@app/modules/auth/domain';
import type {
  GetUserGroupQuery,
  UserGroupReadModel,
  UserGroupReadRepository,
} from '@app/modules/auth/interfaces';

export class GetUserGroupQueryHandler
  implements QueryHandler<GetUserGroupQuery, UserGroupReadModel>
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
