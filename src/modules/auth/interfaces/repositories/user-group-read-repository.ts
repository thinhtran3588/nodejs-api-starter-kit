import type { PaginatedResult } from '@app/common';
import type {
  FindUserGroupsQueryParams,
  UserGroupReadModel,
} from '@app/modules/auth/interfaces';

export interface UserGroupReadRepository {
  find(
    query: FindUserGroupsQueryParams
  ): Promise<PaginatedResult<UserGroupReadModel>>;
  findById(id: string): Promise<UserGroupReadModel | undefined>;
}
