import { AuthorizationService } from '@app/common/application/services/authorization.service';
import type { AppContext } from '@app/common/interfaces/context';
import type { QueryHandler } from '@app/common/interfaces/query';
import { ValidationException } from '@app/common/utils/exceptions';
import { validateUuid } from '@app/common/utils/validate-uuid';
import type { GetRoleQuery } from '@app/modules/auth/application/interfaces/queries/get-role.query';
import type { RoleReadModel } from '@app/modules/auth/application/interfaces/queries/role.read-model';
import type { RoleReadRepository } from '@app/modules/auth/application/interfaces/repositories/role.read-repository';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';

export class GetRoleQueryHandler
  implements QueryHandler<GetRoleQuery, RoleReadModel>
{
  constructor(
    private readonly roleReadRepository: RoleReadRepository,
    private readonly authorizationService: AuthorizationService
  ) {}

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
