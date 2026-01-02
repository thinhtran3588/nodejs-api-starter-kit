import type {
  Identifier,
  InferAttributes,
  InferCreationAttributes,
  Model,
  ModelStatic,
  Sequelize,
  Transaction,
  WhereOptions,
} from 'sequelize';
import { BaseAggregate } from '@app/common/domain/base-aggregate';
import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import { ValidationException } from '@app/common/utils/exceptions';

export interface SaveAggregateParams<
  TAggregate extends BaseAggregate = BaseAggregate,
  TModel extends Model<
    InferAttributes<TModel>,
    InferCreationAttributes<TModel>
  > = Model<InferAttributes<Model>, InferCreationAttributes<Model>>,
> {
  aggregate: TAggregate;
  model: ModelStatic<TModel>;
  postSaveCallback?: (transaction: Transaction) => Promise<void>;
}

/**
 * Saves an aggregate with optimistic locking version validation
 *
 * This utility function handles the common pattern for saving aggregates with
 * transactional support and optimistic locking:
 *
 * 1. For new aggregates (version === 0):
 *    - Creates the model in the database with version 0 using full aggregate data
 *    - Executes postSaveCallback if provided (within transaction)
 *    - Returns the id from the created model
 *
 * 2. For existing aggregates (version >= 1):
 *    - Updates the model where id matches and version equals (aggregate.version - 1)
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
 * @param params - Object containing aggregate, model, and optional postSaveCallback
 * @param params.aggregate - The aggregate to save
 * @param params.model - The Sequelize model class to use for persistence
 * @param params.postSaveCallback - Optional callback executed after successful save (within transaction, for both new and existing aggregates)
 * @returns The id of the saved aggregate (from model.create for new, aggregate.id for updates)
 * @throws ValidationException if version mismatch occurs (OUTDATED_VERSION)
 */
export async function saveAggregate<
  TAggregate extends BaseAggregate = BaseAggregate,
>(params: SaveAggregateParams<TAggregate>): Promise<void> {
  const { aggregate, model, postSaveCallback } = params;
  const database = model.sequelize as Sequelize;
  if (!database) {
    throw new Error('Missing Sequelize instance');
  }
  const transaction = await database.transaction();
  try {
    const id = aggregate.id.getValue();

    if (aggregate.version === 0) {
      const data = aggregate.toJson();
      await model.create(data, {
        transaction,
      });
    } else {
      if (!aggregate.updatePrepared) {
        throw new ValidationException(ValidationErrorCode.FIELD_IS_INVALID, {
          field: 'aggregate',
          message:
            'prepareUpdate must be called before saving an existing aggregate',
        });
      }

      const currentVersion = aggregate.version - 1;

      const [affectedRows] = await model.update(aggregate.toJson(), {
        where: {
          id,
          version: currentVersion,
        } as unknown as WhereOptions<Model>,
        transaction,
      });

      if (affectedRows === 0) {
        const currentModel = (await model.findByPk(id as Identifier, {
          transaction,
          attributes: ['version'],
        })) as { version?: number } | null;
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
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
