import type { Query } from '@app/common/interfaces/query';

export interface GetRoleQuery extends Query {
  readonly id: string;
}
