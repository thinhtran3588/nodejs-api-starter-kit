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

export const USER_GROUP_READ_MODEL_FIELDS: UserGroupReadModelField[] = [
  'id',
  'name',
  'description',
  'version',
  'createdAt',
  'lastModifiedAt',
  'createdBy',
  'lastModifiedBy',
];

export const USER_GROUP_READ_MODEL_SORT_FIELDS: UserGroupReadModelField[] = [
  'name',
  'createdAt',
  'lastModifiedAt',
];
