import type { PaginatedResult } from '@app/common/interfaces/query';
import type { FindUserGroupsQueryParams } from '@app/modules/auth/application/interfaces/queries/user-group-query-params';
import type { UserGroupReadModel } from '@app/modules/auth/application/interfaces/queries/user-group.read-model';

export interface UserGroupReadRepository {
  find(
    query: FindUserGroupsQueryParams
  ): Promise<PaginatedResult<UserGroupReadModel>>;
  findById(id: string): Promise<UserGroupReadModel | undefined>;
}
