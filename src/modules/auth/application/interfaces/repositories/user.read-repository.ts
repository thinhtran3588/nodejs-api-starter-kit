import type { PaginatedResult } from '@app/common/interfaces/query';
import type { FindUsersQueryParams } from '@app/modules/auth/application/interfaces/queries/user-query-params';
import type { UserReadModel } from '@app/modules/auth/application/interfaces/queries/user.read-model';

export interface UserReadRepository {
  find(query: FindUsersQueryParams): Promise<PaginatedResult<UserReadModel>>;
  findById(id: string): Promise<UserReadModel | undefined>;
}
