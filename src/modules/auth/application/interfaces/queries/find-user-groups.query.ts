import type { PaginationQuery } from '@app/common/interfaces/query';

export interface FindUserGroupsQuery extends PaginationQuery {
  readonly searchTerm?: string;
}
