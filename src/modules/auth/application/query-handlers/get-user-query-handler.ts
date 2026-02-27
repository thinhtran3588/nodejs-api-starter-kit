import {
  validateUuid,
  ValidationException,
  type ApplicationContext as AppContext,
  type AuthorizationService,
  type QueryHandler,
} from '@app/common';
import {
  AuthExceptionCode,
  AuthRole,
  UserStatus,
} from '@app/modules/auth/domain';
import type {
  GetUserQuery,
  UserReadModel,
  UserReadRepository,
} from '@app/modules/auth/interfaces';

export class GetUserQueryHandler
  implements QueryHandler<GetUserQuery, UserReadModel>
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
