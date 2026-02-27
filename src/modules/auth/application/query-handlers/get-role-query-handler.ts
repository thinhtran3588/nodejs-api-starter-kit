import {
  validateUuid,
  ValidationException,
  type ApplicationContext as AppContext,
  type AuthorizationService,
  type QueryHandler,
} from '@app/common';
import { AuthExceptionCode, AuthRole } from '@app/modules/auth/domain';
import type {
  GetRoleQuery,
  RoleReadModel,
  RoleReadRepository,
} from '@app/modules/auth/interfaces';

export class GetRoleQueryHandler
  implements QueryHandler<GetRoleQuery, RoleReadModel>
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
    query: GetRoleQuery,
    context: AppContext
  ): Promise<RoleReadModel> {
    this.authorizationService.requireOneOfRoles(
      [AuthRole.AUTH_MANAGER, AuthRole.AUTH_VIEWER],
      context
    );

    const id = validateUuid(query.id, {
      field: 'id',
      required: true,
    })!;

    const role = await this.roleReadRepository.findById(id);

    if (!role) {
      throw new ValidationException(AuthExceptionCode.ROLE_NOT_FOUND);
    }

    return role;
  }
}
