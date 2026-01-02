import type { PaginationQueryParams } from '@app/common/interfaces/query';

export interface FindRolesQueryParams extends PaginationQueryParams {
  readonly searchTerm?: string;
  readonly userGroupId?: string;
}
