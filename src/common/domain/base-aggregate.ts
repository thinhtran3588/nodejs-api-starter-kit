import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import { validate } from '@app/common/utils/validate';

import { DomainEvent } from './domain-event';
import { Uuid } from './value-objects/uuid';

export enum BaseAggregateField {
  ID = 'id',
  VERSION = 'version',
  CREATED_AT = 'createdAt',
  LAST_MODIFIED_AT = 'lastModifiedAt',
  CREATED_BY = 'createdBy',
  LAST_MODIFIED_BY = 'lastModifiedBy',
}

/**
 * Base Aggregate Root
 *
 * Provides common properties for all aggregate roots:
 * - id: Unique identifier (Uuid value object)
 * - version: Version number for optimistic locking (starts at 0)
 * - createdAt: Timestamp when the aggregate was created
 * - createdBy: Optional identifier of who created the aggregate
 * - lastModifiedAt: Timestamp when the aggregate was last modified
 * - lastModifiedBy: Optional identifier of who last modified the aggregate
 */
export interface BaseAggregateParams {
  id: Uuid;
  version?: number;
  createdAt?: Date;
  lastModifiedAt?: Date;
  createdBy?: Uuid;
  lastModifiedBy?: Uuid;
}

export abstract class BaseAggregate {
  private _id: Uuid;
  private _version: number;
  private _createdAt: Date;
  protected _lastModifiedAt?: Date;
  private _createdBy?: Uuid;
  private _lastModifiedBy?: Uuid;
  private _updatePrepared: boolean = false;
  private _events: DomainEvent[] = [];

  constructor(params: BaseAggregateParams) {
    this._id = params.id;
    // default to current date if not provided
    this._createdAt = params.createdAt ?? new Date();
    this._lastModifiedAt = params.lastModifiedAt;
    this._createdBy = params.createdBy;
    this._lastModifiedBy = params.lastModifiedBy;
    // 0 for new entities
    this._version = params.version ?? 0;
  }

  /**
   * Returns the name of the aggregate type
   * Automatically derived from the class name
   * @returns Aggregate name (e.g., "User", "UserGroup")
   */
  protected getAggregateName(): string {
    return this.constructor.name;
  }

  /**
   * Converts the aggregate to a plain object for database persistence
   * Child classes must override this method to provide their specific fields
   */
  public abstract toJson(): Record<string, unknown>;

  public get id(): Uuid {
    return this._id;
  }

  public get version(): number {
    return this._version;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get lastModifiedAt(): Date | undefined {
    return this._lastModifiedAt;
  }

  public get createdBy(): Uuid | undefined {
    return this._createdBy;
  }

  public get lastModifiedBy(): Uuid | undefined {
    return this._lastModifiedBy;
  }

  public get updatePrepared(): boolean {
    return this._updatePrepared;
  }

  /**
   * Prepares the aggregate for update by validating version (if provided) and setting update info
   * Should be called right after getting the aggregate instance in command handlers
   * @param operatorId - The ID of the user performing the update
   * @param expectedVersion - Optional expected version for optimistic locking validation
   */
  public prepareUpdate(operatorId: Uuid, expectedVersion?: number): void {
    if (expectedVersion !== undefined) {
      validate(this._version === expectedVersion, {
        code: ValidationErrorCode.OUTDATED_VERSION,
        data: {
          id: this._id.getValue(),
          expectedVersion,
          actualVersion: this._version,
        },
      });
    }

    this._lastModifiedBy = operatorId;
    this._lastModifiedAt = new Date();
    this._version += 1;
    this._updatePrepared = true;
  }

  /**
   * Gets all registered events
   * @returns Array of domain events
   */
  public getEvents(): DomainEvent[] {
    return [...this._events];
  }

  /**
   * Clears all registered events
   * Should be called after events are successfully persisted
   */
  public clearEvents(): void {
    this._events = [];
  }

  /**
   * Returns the base aggregate fields as a plain object
   * Child classes can use this in their toJson() implementation
   */
  protected getBaseJson(): Record<string, unknown> {
    return {
      version: this.version,
      createdAt: this.createdAt,
      lastModifiedAt: this.lastModifiedAt,
      createdBy: this.createdBy?.getValue(),
      lastModifiedBy: this.lastModifiedBy?.getValue(),
    };
  }

  /**
   * Registers a domain event to be persisted when the aggregate is saved
   * @param eventType - The type of event (e.g., "USER_REGISTERED")
   * @param data - Event payload data
   * @param metadata - Optional metadata (correlationId, requestId, etc.)
   */
  protected registerEvent(
    eventType: string,
    data: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): void {
    const now = new Date();
    const createdBy = this._lastModifiedBy ?? this._createdBy;

    this._events.push(
      new DomainEvent({
        id: Uuid.generate(),
        aggregateId: this._id,
        aggregateName: this.getAggregateName(),
        eventType,
        data,
        metadata,
        createdAt: now,
        createdBy,
      })
    );
  }
}
