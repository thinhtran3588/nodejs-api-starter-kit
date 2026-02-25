import type { PaginationQueryParams } from '@app/common';

export interface FindUserGroupsQueryParams extends PaginationQueryParams {
  readonly searchTerm?: string;
}
