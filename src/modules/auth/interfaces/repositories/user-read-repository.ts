import type { PaginatedResult } from '@app/common';
import type {
  FindUsersQueryParams,
  UserReadModel,
} from '@app/modules/auth/interfaces';

export interface UserReadRepository {
  find(query: FindUsersQueryParams): Promise<PaginatedResult<UserReadModel>>;
  findById(id: string): Promise<UserReadModel | undefined>;
}
