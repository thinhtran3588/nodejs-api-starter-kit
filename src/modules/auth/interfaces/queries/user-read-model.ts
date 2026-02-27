import type { SignInType, UserStatus } from '@app/modules/auth/domain';

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

export const USER_READ_MODEL_FIELDS = [
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
] as const satisfies readonly UserReadModelField[];

export const USER_READ_MODEL_SORT_FIELDS = [
  'email',
  'username',
  'createdAt',
  'lastModifiedAt',
] as const satisfies readonly UserReadModelField[];

export type UserProfileReadModel = Omit<
  UserReadModel,
  'status' | 'lastModifiedAt' | 'createdBy' | 'lastModifiedBy'
>;
