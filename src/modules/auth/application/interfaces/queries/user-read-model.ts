import type { SignInType } from '@app/modules/auth/domain/enums/sign-in-type';
import type { UserStatus } from '@app/modules/auth/domain/enums/user-status';

export interface UserReadModel {
  id: string;
  email: string;
  signInType: SignInType;
  externalId: string;
  username?: string;
  displayName?: string;
  status: UserStatus;
  version: number;
  createdAt: Date;
  lastModifiedAt?: Date;
  createdBy?: string;
  lastModifiedBy?: string;
}

export type UserReadModelField = keyof UserReadModel;

export const USER_READ_MODEL_FIELDS: UserReadModelField[] = [
  'id',
  'email',
  'signInType',
  'externalId',
  'username',
  'displayName',
  'status',
  'version',
  'createdAt',
  'lastModifiedAt',
  'createdBy',
  'lastModifiedBy',
];

export const USER_READ_MODEL_SORT_FIELDS: UserReadModelField[] = [
  'email',
  'username',
  'createdAt',
  'lastModifiedAt',
];

export type UserProfileReadModel = Omit<
  UserReadModel,
  'status' | 'lastModifiedAt' | 'createdBy' | 'lastModifiedBy'
>;
