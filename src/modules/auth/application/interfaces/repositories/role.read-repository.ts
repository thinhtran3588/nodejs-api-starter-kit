import type { PaginatedResult } from '@app/common/interfaces/query';
import type { FindRolesQueryParams } from '@app/modules/auth/application/interfaces/queries/role-query-params';
import type { RoleReadModel } from '@app/modules/auth/application/interfaces/queries/role.read-model';

export interface RoleReadRepository {
  find(query: FindRolesQueryParams): Promise<PaginatedResult<RoleReadModel>>;
  findById(id: string): Promise<RoleReadModel | undefined>;
}
