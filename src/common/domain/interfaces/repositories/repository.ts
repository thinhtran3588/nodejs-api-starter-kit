import type { Transaction } from 'sequelize';
import type { BaseAggregate } from '@app/common/domain/base-aggregate';
import type { Uuid } from '@app/common/domain/value-objects/uuid';

/**
 * Generic repository interface for aggregate persistence operations
 *
 * Provides standard CRUD operations that all repositories should support.
 * Specific repositories can extend this interface and add domain-specific methods.
 *
 * @template TAggregate - The aggregate type (must extend BaseAggregate)
 */
export interface Repository<TAggregate extends BaseAggregate> {
  /**
   * Saves an aggregate (create or update)
   * @param aggregate - Aggregate to persist
   * @param postSaveCallback - Optional callback executed after aggregate save (within transaction)
   * @returns Promise that resolves when save is complete
   */
  save(
    aggregate: TAggregate,
    postSaveCallback?: (transaction: Transaction) => Promise<void>
  ): Promise<void>;

  /**
   * Deletes an aggregate after saving any pending domain events
   * @param aggregate - The aggregate to delete
   * @throws Error if delete is not supported for this aggregate type
   */
  delete(aggregate: TAggregate): Promise<void>;

  /**
   * Finds an aggregate by ID
   * @param id - Aggregate ID
   * @returns Aggregate if found, undefined otherwise
   */
  findById(id: Uuid): Promise<TAggregate | undefined>;
}
