import type { Query } from '@app/common';

export interface GetRoleQuery extends Query {
  readonly id: string;
}
