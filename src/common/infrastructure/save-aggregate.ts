import { and, eq, type InferInsertModel } from 'drizzle-orm';
import type { AnyPgTable, PgColumn } from 'drizzle-orm/pg-core';
import type { BaseAggregate } from '@app/common/domain/base-aggregate';
import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import type {
  DatabaseClient,
  DatabaseTransaction,
} from '@app/common/interfaces/database';
import { ValidationException } from '@app/common/utils/errors';

export interface SaveAggregateParams<
  TAggregate extends BaseAggregate = BaseAggregate,
  TTable extends AnyPgTable & {
    id: PgColumn;
    version: PgColumn;
  } = AnyPgTable & {
    id: PgColumn;
    version: PgColumn;
  },
> {
  aggregate: TAggregate;
  table: TTable;
  writeDatabase: DatabaseClient;
  postSaveCallback?: (transaction: DatabaseTransaction) => Promise<void>;
}

/**
 * Saves an aggregate with optimistic locking version validation
 *
 * This utility function handles the common pattern for saving aggregates with
 * transactional support and optimistic locking:
 *
 * 1. For new aggregates (version === 0):
 *    - Inserts the row in the database with version 0 using full aggregate data
 *    - Executes postSaveCallback if provided (within transaction)
 *
 * 2. For existing aggregates (version >= 1):
 *    - Updates the row where id matches and version equals (aggregate.version - 1)
 *    - Validates that exactly one row was affected (optimistic locking check)
 *    - If no rows affected, throws ValidationException with version mismatch details
 *    - Executes postSaveCallback if provided (within transaction)
 *    - Returns the aggregate id
 *
 * All operations are performed within a database transaction:
 * - Commits the transaction on success
 * - Rolls back the transaction on any error
 *
 * The postSaveCallback is always executed (when provided) after the aggregate
 * is successfully saved, for both new and existing aggregates, within the same
 * transaction. This ensures that any additional operations (e.g., saving related
 * entities, updating denormalized data) are atomic with the aggregate save.
 *
 * Note: The aggregate's creation/update info (version, timestamps, createdBy, lastModifiedBy)
 * must be set by the caller (typically in command handlers) before calling this function.
 * The aggregate's version is expected to be already incremented for updates.
 * If the update fails (version mismatch), the transaction is rolled back.
 *
 * @template TAggregate - The aggregate type (must extend BaseAggregate)
 * @param params - Object containing aggregate, table, database, and optional postSaveCallback
 * @param params.aggregate - The aggregate to save
 * @param params.table - The Drizzle table to use for persistence
 * @param params.writeDatabase - The Drizzle database client
 * @param params.postSaveCallback - Optional callback executed after successful save (within transaction, for both new and existing aggregates)
 * @throws ValidationException if version mismatch occurs (OUTDATED_VERSION)
 */
export async function saveAggregate<
  TAggregate extends BaseAggregate = BaseAggregate,
  TTable extends AnyPgTable & {
    id: PgColumn;
    version: PgColumn;
  } = AnyPgTable & {
    id: PgColumn;
    version: PgColumn;
  },
>(params: SaveAggregateParams<TAggregate, TTable>): Promise<void> {
  const { aggregate, table, writeDatabase, postSaveCallback } = params;
  const tableReference = table as AnyPgTable;
  await writeDatabase.transaction(async (transaction) => {
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

    if (postSaveCallback) {
      await postSaveCallback(transaction);
    }
  });
}
