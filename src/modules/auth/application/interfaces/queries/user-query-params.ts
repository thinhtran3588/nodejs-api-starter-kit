import type { PaginationQueryParams } from '@app/common/interfaces/query';

export interface FindUsersQueryParams extends PaginationQueryParams {
  readonly searchTerm?: string;
  readonly userGroupId?: string;
}
