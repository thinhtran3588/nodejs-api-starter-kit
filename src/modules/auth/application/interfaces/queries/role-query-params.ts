import type { PaginationQueryParams } from '@app/common';

export interface FindRolesQueryParams extends PaginationQueryParams {
  readonly searchTerm?: string;
  readonly userGroupId?: string;
}
