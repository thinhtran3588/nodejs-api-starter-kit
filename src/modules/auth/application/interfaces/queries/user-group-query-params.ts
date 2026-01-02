import type { PaginationQueryParams } from '@app/common/interfaces/query';

export interface FindUserGroupsQueryParams extends PaginationQueryParams {
  readonly searchTerm?: string;
}
