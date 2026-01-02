import type { PaginationQuery } from '@app/common/interfaces/query';

export interface FindUsersQuery extends PaginationQuery {
  readonly searchTerm?: string;
  readonly userGroupId?: string;
}
