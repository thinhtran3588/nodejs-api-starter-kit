import type { PaginationQuery } from '@app/common';

export interface FindUsersQuery extends PaginationQuery {
  readonly searchTerm?: string;
  readonly userGroupId?: string;
}
