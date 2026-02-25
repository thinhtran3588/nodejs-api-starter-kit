import type { PaginationQuery } from '@app/common';

export interface FindRolesQuery extends PaginationQuery {
  readonly searchTerm?: string;
  readonly userGroupId?: string;
}
