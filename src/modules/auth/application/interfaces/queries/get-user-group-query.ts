import type { Query } from '@app/common';

export interface GetUserGroupQuery extends Query {
  readonly id: string;
}
