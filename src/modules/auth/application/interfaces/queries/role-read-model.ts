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

export const ROLE_READ_MODEL_FIELDS: RoleReadModelField[] = [
  'id',
  'code',
  'name',
  'description',
  'version',
  'createdAt',
  'lastModifiedAt',
  'createdBy',
  'lastModifiedBy',
];

export const ROLE_READ_MODEL_SORT_FIELDS: RoleReadModelField[] = [
  'name',
  'code',
  'createdAt',
  'lastModifiedAt',
];
