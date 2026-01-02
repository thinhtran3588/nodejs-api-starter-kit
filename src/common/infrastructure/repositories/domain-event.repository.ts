import type { Transaction } from 'sequelize';
import type { DomainEvent } from '@app/common/domain/domain-event';
import type { Uuid } from '@app/common/domain/value-objects/uuid';

/**
 * Repository interface for domain event persistence
 */
export interface DomainEventRepository {
  /**
   * Saves domain events in a transaction
   * @param events - Array of domain events to save
   * @param transaction - Database transaction to use
   */
  save(events: DomainEvent[], transaction: Transaction): Promise<void>;

  /**
   * Finds all domain events for a specific aggregate
   * @param aggregateId - ID of the aggregate
   * @returns Array of domain events for the aggregate
   */
  findByAggregateId(aggregateId: Uuid): Promise<DomainEvent[]>;
}
