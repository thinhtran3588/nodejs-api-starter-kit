import type { PaginationQuery } from '@app/common/interfaces/query';

export interface FindRolesQuery extends PaginationQuery {
  readonly searchTerm?: string;
  readonly userGroupId?: string;
}
