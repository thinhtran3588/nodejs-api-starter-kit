import { Uuid } from './value-objects/uuid';

/**
 * DomainEvent - Full event with aggregate context
 *
 * Contains all event information including aggregate context needed by event handlers.
 * This is the complete event object that handlers receive.
 */
export class DomainEvent {
  readonly eventType: string;
  readonly data: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
  readonly id: Uuid;
  readonly aggregateId: Uuid;
  readonly aggregateName: string;
  readonly createdAt: Date;
  readonly createdBy?: Uuid;

  constructor(params: {
    id: Uuid;
    aggregateId: Uuid;
    aggregateName: string;
    eventType: string;
    data: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    createdBy?: Uuid;
  }) {
    this.id = params.id;
    this.aggregateId = params.aggregateId;
    this.aggregateName = params.aggregateName;
    this.eventType = params.eventType;
    this.data = params.data;
    this.metadata = params.metadata;
    this.createdAt = params.createdAt;
    this.createdBy = params.createdBy;
  }

  /**
   * Converts the domain event to a plain object
   * @returns Plain object representation of the domain event
   */
  toJson(): Record<string, unknown> {
    return {
      id: this.id.getValue(),
      aggregateId: this.aggregateId.getValue(),
      aggregateName: this.aggregateName,
      eventType: this.eventType,
      data: this.data,
      metadata: this.metadata,
      createdAt: this.createdAt,
      createdBy: this.createdBy?.getValue(),
    };
  }
}
