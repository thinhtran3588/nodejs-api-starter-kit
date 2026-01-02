import { TEXT_MAX_LENGTH } from '@app/common/constants';
import {
  BaseAggregate,
  type BaseAggregateParams,
} from '@app/common/domain/base-aggregate';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { ValidationException } from '@app/common/utils/exceptions';
import { validateText } from '@app/common/utils/validate-text';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import type { SignInType } from '@app/modules/auth/domain/enums/sign-in-type';
import { UserEventType } from '@app/modules/auth/domain/enums/user-event-type';
import { UserStatus } from '@app/modules/auth/domain/enums/user-status';
import { Email } from '@app/modules/auth/domain/value-objects/email';
import { Username } from '@app/modules/auth/domain/value-objects/username';

enum UserField {
  EMAIL = 'email',
  SIGN_IN_TYPE = 'signInType',
  EXTERNAL_ID = 'externalId',
  USERNAME = 'username',
  DISPLAY_NAME = 'displayName',
  STATUS = 'status',
}

export interface UserParams extends BaseAggregateParams {
  email: Email;
  signInType: SignInType;
  externalId: string;
  username?: Username;
  displayName?: string;
  status?: UserStatus;
}

/**
 * User Aggregate Root
 */
export class User extends BaseAggregate {
  public static readonly DISPLAY_NAME_MAX_LENGTH = TEXT_MAX_LENGTH;

  private _email: Email;
  private _signInType: SignInType;
  private _externalId: string;
  private _username?: Username;
  private _displayName?: string;
  private _status: UserStatus;

  constructor(params: UserParams) {
    super(params);
    this._email = params.email;
    this._signInType = params.signInType;
    this._externalId = params.externalId;
    this._username = params.username;
    this._displayName = User.validateDisplayName(params.displayName);
    this._status = params.status ?? UserStatus.ACTIVE;
  }

  public toJson(): Record<string, unknown> {
    return {
      id: this.id.getValue(),
      email: this.email.getValue(),
      signInType: this.signInType,
      externalId: this.externalId,
      username: this.username?.getValue(),
      displayName: this.displayName,
      status: this.status,
      ...this.getBaseJson(),
    };
  }

  public get email(): Email {
    return this._email;
  }

  public get signInType(): SignInType {
    return this._signInType;
  }

  public get externalId(): string {
    return this._externalId;
  }

  public get username(): Username | undefined {
    return this._username;
  }

  public get displayName(): string | undefined {
    return this._displayName;
  }

  public get status(): UserStatus {
    return this._status;
  }

  public isActive(): boolean {
    return this._status === UserStatus.ACTIVE;
  }

  public isDeleted(): boolean {
    return this._status === UserStatus.DELETED;
  }

  public isDisabled(): boolean {
    return this._status === UserStatus.DISABLED;
  }

  public disable(): void {
    this.ensureActive();
    this._status = UserStatus.DISABLED;
    this.registerEvent(UserEventType.STATUS_CHANGED, {
      status: UserStatus.DISABLED,
    });
  }

  public activate(): void {
    this.ensureDisabled();
    this._status = UserStatus.ACTIVE;
    this.registerEvent(UserEventType.STATUS_CHANGED, {
      status: UserStatus.ACTIVE,
    });
  }

  public markForDeletion(): void {
    if (this.isDeleted()) {
      throw new ValidationException(AuthExceptionCode.USER_ALREADY_DELETED);
    }
    this._status = UserStatus.DELETED;
    this.registerEvent(UserEventType.DELETED, {
      email: this.email.getValue(),
    });
  }

  public setUsername(username: Username | undefined): void {
    this.ensureNotDeleted();
    this._username = username;
    this.registerEvent(UserEventType.UPDATED, {
      field: 'username',
      value: username?.getValue(),
    });
  }

  public setDisplayName(displayName: string | undefined): void {
    this.ensureNotDeleted();
    this._displayName = User.validateDisplayName(displayName);
    this.registerEvent(UserEventType.UPDATED, {
      field: 'displayName',
      value: this._displayName,
    });
  }

  public ensureActive(): void {
    if (!this.isActive()) {
      throw new ValidationException(AuthExceptionCode.USER_MUST_BE_ACTIVE);
    }
  }

  public ensureDisabled(): void {
    if (!this.isDisabled()) {
      throw new ValidationException(AuthExceptionCode.USER_MUST_BE_DISABLED);
    }
  }

  public ensureNotDeleted(): void {
    if (this.isDeleted()) {
      throw new ValidationException(AuthExceptionCode.USER_DELETED);
    }
  }

  public addedToUserGroup(userGroupId: Uuid): void {
    this.registerEvent(UserEventType.ADDED_TO_USER_GROUP, {
      userGroupId: userGroupId.getValue(),
    });
  }

  public removedFromUserGroup(userGroupId: Uuid): void {
    this.registerEvent(UserEventType.REMOVED_FROM_USER_GROUP, {
      userGroupId: userGroupId.getValue(),
    });
  }

  static validateDisplayName(
    displayName: string | undefined
  ): string | undefined {
    return validateText(displayName, {
      field: UserField.DISPLAY_NAME,
      maxLength: User.DISPLAY_NAME_MAX_LENGTH,
    });
  }

  /**
   * Factory method to create a new User aggregate
   */
  static create(params: {
    id: Uuid;
    email: Email;
    signInType: SignInType;
    externalId: string;
    username?: Username;
    displayName?: string;
    status?: UserStatus;
  }): User {
    const user = new User({
      id: params.id,
      email: params.email,
      signInType: params.signInType,
      externalId: params.externalId,
      username: params.username,
      displayName: params.displayName,
      status: params.status ?? UserStatus.ACTIVE,
    });

    user.registerEvent(UserEventType.REGISTERED, {
      email: user.email.getValue(),
      signInType: user.signInType,
      username: user.username?.getValue(),
      externalId: user.externalId,
      displayName: user.displayName,
      status: user.status,
    });

    return user;
  }
}
