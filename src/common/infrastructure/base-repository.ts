import {
  and,
  eq,
  type InferInsertModel,
  type InferSelectModel,
} from 'drizzle-orm';
import type { AnyPgTable, PgColumn } from 'drizzle-orm/pg-core';
import type { BaseAggregate } from '@app/common/domain/base-aggregate';
import type { Uuid } from '@app/common/domain/uuid';
import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import type { BaseRepository } from '@app/common/interfaces/base-repository';
import type {
  DatabaseClient,
  DatabaseTransaction,
} from '@app/common/interfaces/database';
import type { DomainEventRepository } from '@app/common/interfaces/domain-event-repository';
import { ValidationException } from '@app/common/utils/errors';

/**
 * Base repository class that provides common aggregate persistence logic
 * with domain event support
 *
 * Repositories that need event support should extend this class and implement:
 * - getAggregateName(): Returns the aggregate name (e.g., "User", "UserGroup")
 * - getTable(): Returns the Drizzle table for the aggregate
 * - toDomain(): Converts a database row to domain aggregate
 *
 * @template TAggregate - The aggregate type (must extend BaseAggregate)
 */
export abstract class BaseRepositoryImpl<
  TAggregate extends BaseAggregate = BaseAggregate,
  TTable extends AnyPgTable & {
    id: PgColumn;
    version: PgColumn;
  } = AnyPgTable & {
    id: PgColumn;
    version: PgColumn;
  },
> implements BaseRepository<TAggregate>
{
  protected readonly writeDatabase: DatabaseClient;
  protected readonly domainEventRepository: DomainEventRepository;

  constructor({
    writeDatabase,
    domainEventRepository,
  }: {
    writeDatabase: DatabaseClient;
    domainEventRepository: DomainEventRepository;
  }) {
    this.writeDatabase = writeDatabase;
    this.domainEventRepository = domainEventRepository;
  }

  /**
   * Returns the name of the aggregate type
   * @returns Aggregate name (e.g., "User", "UserGroup")
   */
  protected abstract getAggregateName(): string;

  /**
   * Returns the Drizzle table for the aggregate
   */
  protected abstract getTable(): TTable;

  /**
   * Converts a database row to a domain aggregate
   * @param model - Database row (guaranteed to be non-null when called)
   * @returns Domain aggregate instance
   */
  protected abstract toDomain(model: InferSelectModel<TTable>): TAggregate;

  /**
   * Saves an aggregate with optimistic locking and domain event persistence
   *
   * This method handles:
   * 1. Saving the aggregate (create or update with optimistic locking)
   * 2. Persisting domain events in the same transaction
   *
   * @param aggregate - The aggregate to save
   * @param postSaveCallback - Optional callback executed after aggregate save (within transaction)
   * @throws ValidationException if version mismatch occurs (OUTDATED_VERSION)
   */
  async save(
    aggregate: TAggregate,
    postSaveCallback?: (transaction: DatabaseTransaction) => Promise<void>
  ): Promise<void> {
    const table = this.getTable();
    const tableReference = table as AnyPgTable;
    await this.writeDatabase.transaction(async (transaction) => {
      const id = aggregate.id.getValue();

      if (aggregate.version === 0) {
        const data = aggregate.toJson() as InferInsertModel<TTable>;
        await transaction.insert(tableReference).values(data);
      } else {
        if (!aggregate.updatePrepared) {
          throw new ValidationException(ValidationErrorCode.FIELD_IS_INVALID, {
            field: 'aggregate',
            message:
              'prepareUpdate must be called before saving an existing aggregate',
          });
        }

        const currentVersion = aggregate.version - 1;

        const updateResult = await transaction
          .update(tableReference)
          .set(aggregate.toJson() as Partial<InferInsertModel<TTable>>)
          .where(and(eq(table.id, id), eq(table.version, currentVersion)))
          .execute();

        if (updateResult.rowCount === 0) {
          const [currentModel] = await transaction
            .select({ version: table.version })
            .from(tableReference)
            .where(eq(table.id, id));
          throw new ValidationException(ValidationErrorCode.OUTDATED_VERSION, {
            id,
            expectedVersion: currentVersion,
            actualVersion: currentModel?.version ?? undefined,
          });
        }
      }

      const domainEvents = aggregate.getEvents();

      if (domainEvents.length > 0) {
        await this.domainEventRepository.save(domainEvents, transaction);
      }

      if (postSaveCallback) {
        await postSaveCallback(transaction);
      }
    });
  }

  /**
   * Finds an aggregate by ID
   * @param id - Aggregate ID
   * @returns Aggregate if found, undefined otherwise
   */
  async findById(id: Uuid): Promise<TAggregate | undefined> {
    const table = this.getTable();
    const tableReference = table as AnyPgTable;
    const [row] = await this.writeDatabase
      .select()
      .from(tableReference)
      .where(eq(table.id, id.getValue()))
      .limit(1);
    if (!row) {
      return undefined;
    }
    return this.toDomain(row as InferSelectModel<TTable>);
  }

  /**
   * Deletes an aggregate and saves any pending domain events in a single transaction
   *
   * This method:
   * 1. Deletes the aggregate record from the database
   * 2. Saves any pending domain events (e.g., delete events) in the same transaction
   *
   * @param aggregate - The aggregate to delete
   * @throws Error if deletion is not supported for this aggregate type
   */
  async delete(aggregate: TAggregate): Promise<void> {
    const table = this.getTable();
    const tableReference = table as AnyPgTable;
    await this.writeDatabase.transaction(async (transaction) => {
      const id = aggregate.id.getValue();

      await transaction.delete(tableReference).where(eq(table.id, id));

      const domainEvents = aggregate.getEvents();

      if (domainEvents.length > 0) {
        await this.domainEventRepository.save(domainEvents, transaction);
      }
    });
  }
}
