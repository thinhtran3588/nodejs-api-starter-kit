export interface RoleReadModel {
  id: string;
  code: string;
  name: string;
  description: string;
  version: number;
  createdAt: Date;
  lastModifiedAt?: Date;
  createdBy?: string;
  lastModifiedBy?: string;
}

export type RoleReadModelField = keyof RoleReadModel;

export const ROLE_READ_MODEL_FIELDS = [
  'id',
  'code',
  'name',
  'description',
  'version',
  'createdAt',
  'lastModifiedAt',
  'createdBy',
  'lastModifiedBy',
] as const satisfies readonly RoleReadModelField[];

export const ROLE_READ_MODEL_SORT_FIELDS = [
  'name',
  'code',
  'createdAt',
  'lastModifiedAt',
] as const satisfies readonly RoleReadModelField[];
