import type { Query } from '@app/common/interfaces/query';

export interface GetUserQuery extends Query {
  readonly id: string;
}
