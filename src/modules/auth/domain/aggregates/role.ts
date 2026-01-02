import {
  TEXT_DESCRIPTION_MAX_LENGTH,
  TEXT_MAX_LENGTH,
} from '@app/common/constants';
import {
  BaseAggregate,
  type BaseAggregateParams,
} from '@app/common/domain/base-aggregate';

export interface RoleParams extends BaseAggregateParams {
  code: string;
  name: string;
  description: string;
}

/**
 * Role Aggregate Root
 */
export class Role extends BaseAggregate {
  public static readonly NAME_MAX_LENGTH = TEXT_MAX_LENGTH;
  public static readonly DESCRIPTION_MAX_LENGTH = TEXT_DESCRIPTION_MAX_LENGTH;

  private _code: string;
  private _name: string;
  private _description: string;

  constructor(params: RoleParams) {
    super(params);
    this._code = params.code;
    this._name = params.name;
    this._description = params.description;
  }

  public toJson(): Record<string, unknown> {
    return {
      id: this.id.getValue(),
      code: this.code,
      name: this.name,
      description: this.description,
      ...this.getBaseJson(),
    };
  }

  public get code(): string {
    return this._code;
  }

  public get name(): string {
    return this._name;
  }

  public get description(): string {
    return this._description;
  }
}
