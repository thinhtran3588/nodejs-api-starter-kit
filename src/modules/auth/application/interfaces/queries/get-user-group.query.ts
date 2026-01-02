import type { Query } from '@app/common/interfaces/query';

export interface GetUserGroupQuery extends Query {
  readonly id: string;
}
