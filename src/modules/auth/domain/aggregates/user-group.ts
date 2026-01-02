import {
  TEXT_DESCRIPTION_MAX_LENGTH,
  TEXT_MAX_LENGTH,
} from '@app/common/constants';
import {
  BaseAggregate,
  type BaseAggregateParams,
} from '@app/common/domain/base-aggregate';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { validateText } from '@app/common/utils/validate-text';
import { UserGroupEventType } from '@app/modules/auth/domain/enums/user-group-event-type';

enum UserGroupField {
  NAME = 'name',
  DESCRIPTION = 'description',
}

export interface UserGroupParams extends BaseAggregateParams {
  name: string;
  description?: string;
}

/**
 * UserGroup Aggregate Root
 *
 * Represents a group that can contain multiple users and have multiple roles assigned.
 * Relationships (users and roles) are managed through junction tables and queried via repository methods.
 */
export class UserGroup extends BaseAggregate {
  public static readonly NAME_MAX_LENGTH = TEXT_MAX_LENGTH;
  public static readonly DESCRIPTION_MAX_LENGTH = TEXT_DESCRIPTION_MAX_LENGTH;

  private _name: string;
  private _description?: string;

  constructor(params: UserGroupParams) {
    super(params);
    this._name = UserGroup.validateName(params.name);
    this._description = UserGroup.validateDescription(params.description);
  }

  public toJson(): Record<string, unknown> {
    return {
      id: this.id.getValue(),
      name: this.name,
      description: this.description,
      ...this.getBaseJson(),
    };
  }

  public get name(): string {
    return this._name;
  }

  public get description(): string | undefined {
    return this._description;
  }

  public setName(name: string): void {
    this._name = UserGroup.validateName(name);
    this.registerEvent(UserGroupEventType.UPDATED, {
      field: 'name',
      value: this._name,
    });
  }

  public setDescription(description: string | undefined): void {
    this._description = UserGroup.validateDescription(description);
    this.registerEvent(UserGroupEventType.UPDATED, {
      field: 'description',
      value: this._description,
    });
  }

  public markForDeletion(): void {
    this.registerEvent(UserGroupEventType.DELETED, {});
  }

  public addRole(roleId: Uuid): void {
    this.registerEvent(UserGroupEventType.ROLE_ADDED, {
      roleId: roleId.getValue(),
    });
  }

  public removeRole(roleId: Uuid): void {
    this.registerEvent(UserGroupEventType.ROLE_REMOVED, {
      roleId: roleId.getValue(),
    });
  }

  static validateName(name: string | undefined): string {
    const result = validateText(name, {
      maxLength: UserGroup.NAME_MAX_LENGTH,
      field: UserGroupField.NAME,
      required: true,
    });
    return result!;
  }

  static validateDescription(
    description: string | undefined
  ): string | undefined {
    return validateText(description, {
      maxLength: UserGroup.DESCRIPTION_MAX_LENGTH,
      field: UserGroupField.DESCRIPTION,
    });
  }

  /**
   * Factory method to create a new UserGroup aggregate
   */
  static create(params: {
    id: Uuid;
    name: string;
    description?: string;
    createdBy: Uuid;
  }): UserGroup {
    const userGroup = new UserGroup({
      id: params.id,
      name: params.name,
      description: params.description,
      createdBy: params.createdBy,
    });

    userGroup.registerEvent(UserGroupEventType.CREATED, {
      name: userGroup.name,
      description: userGroup.description,
    });

    return userGroup;
  }
}
