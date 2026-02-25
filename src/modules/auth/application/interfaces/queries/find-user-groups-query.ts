import type { PaginationQuery } from '@app/common';

export interface FindUserGroupsQuery extends PaginationQuery {
  readonly searchTerm?: string;
}
