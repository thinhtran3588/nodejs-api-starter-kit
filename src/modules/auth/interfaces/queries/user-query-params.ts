import type { PaginationQueryParams } from '@app/common';

export interface FindUsersQueryParams extends PaginationQueryParams {
  readonly searchTerm?: string;
  readonly userGroupId?: string;
}
