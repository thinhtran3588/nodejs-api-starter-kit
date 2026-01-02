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
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import { ValidationException } from '@app/common/utils/exceptions';

import type { DomainEventRepository } from './domain-event.repository';

/**
 * Base repository class that provides common aggregate persistence logic
 * with domain event support
 *
 * Repositories that need event support should extend this class and implement:
 * - getAggregateName(): Returns the aggregate name (e.g., "User", "UserGroup")
 * - getModel(): Returns the Sequelize model for the aggregate
 * - toDomain(): Converts Sequelize model to domain aggregate
 *
 * @template TAggregate - The aggregate type (must extend BaseAggregate)
 */
export abstract class BaseRepository<
  TAggregate extends BaseAggregate = BaseAggregate,
> {
  constructor(
    protected readonly domainEventRepository: DomainEventRepository
  ) {}

  /**
   * Returns the name of the aggregate type
   * @returns Aggregate name (e.g., "User", "UserGroup")
   */
  protected abstract getAggregateName(): string;

  /**
   * Returns the Sequelize model for the aggregate
   * @returns Sequelize model class
   */
  protected abstract getModel(): ModelStatic<
    Model<InferAttributes<Model>, InferCreationAttributes<Model>>
  >;

  /**
   * Converts a Sequelize model to a domain aggregate
   * @param model - Sequelize model instance (guaranteed to be non-null when called)
   * @returns Domain aggregate instance
   */
  protected abstract toDomain(
    model: Model<InferAttributes<Model>, InferCreationAttributes<Model>>
  ): TAggregate;

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
    postSaveCallback?: (transaction: Transaction) => Promise<void>
  ): Promise<void> {
    const model = this.getModel();
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

      const domainEvents = aggregate.getEvents();

      if (domainEvents.length > 0) {
        await this.domainEventRepository.save(domainEvents, transaction);
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

  /**
   * Finds an aggregate by ID
   * @param id - Aggregate ID
   * @returns Aggregate if found, undefined otherwise
   */
  async findById(id: Uuid): Promise<TAggregate | undefined> {
    const model = this.getModel();
    const modelInstance = await model.findByPk(id.getValue());
    if (!modelInstance) {
      return undefined;
    }
    return this.toDomain(modelInstance);
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
    const model = this.getModel();
    const database = model.sequelize as Sequelize;
    if (!database) {
      throw new Error('Missing Sequelize instance');
    }

    const transaction = await database.transaction();
    try {
      const id = aggregate.id.getValue();

      await model.destroy({
        where: { id } as unknown as WhereOptions<Model>,
        transaction,
      });

      const domainEvents = aggregate.getEvents();

      if (domainEvents.length > 0) {
        await this.domainEventRepository.save(domainEvents, transaction);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
