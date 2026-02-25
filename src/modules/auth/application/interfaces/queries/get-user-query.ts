import type { Query } from '@app/common';

export interface GetUserQuery extends Query {
  readonly id: string;
}
