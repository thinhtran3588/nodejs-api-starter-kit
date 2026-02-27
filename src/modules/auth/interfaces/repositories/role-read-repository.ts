import type { PaginatedResult } from '@app/common';
import type {
  FindRolesQueryParams,
  RoleReadModel,
} from '@app/modules/auth/interfaces';

export interface RoleReadRepository {
  find(query: FindRolesQueryParams): Promise<PaginatedResult<RoleReadModel>>;
  findById(id: string): Promise<RoleReadModel | undefined>;
}
