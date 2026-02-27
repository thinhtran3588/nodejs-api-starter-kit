export interface UserGroupReadModel {
  id: string;
  name: string;
  description?: string;
  version: number;
  createdAt: Date;
  lastModifiedAt?: Date;
  createdBy?: string;
  lastModifiedBy?: string;
}

export type UserGroupReadModelField = keyof UserGroupReadModel;

export const USER_GROUP_READ_MODEL_FIELDS = [
  'id',
  'name',
  'description',
  'version',
  'createdAt',
  'lastModifiedAt',
  'createdBy',
  'lastModifiedBy',
] as const satisfies readonly UserGroupReadModelField[];

export const USER_GROUP_READ_MODEL_SORT_FIELDS = [
  'name',
  'createdAt',
  'lastModifiedAt',
] as const satisfies readonly UserGroupReadModelField[];
