import type { CreationAttributes, Transaction } from 'sequelize';
import { DomainEvent } from '@app/common/domain/domain-event';
import { Uuid } from '@app/common/domain/value-objects/uuid';

import { DomainEventModel } from '../models/domain-event.model';
import type { DomainEventRepository } from './domain-event.repository';

/**
 * Sequelize implementation of DomainEventRepository
 */
export class SequelizeDomainEventRepository implements DomainEventRepository {
  async save(events: DomainEvent[], transaction: Transaction): Promise<void> {
    if (events.length === 0) {
      return;
    }

    await DomainEventModel.bulkCreate(
      events.map((event) =>
        event.toJson()
      ) as CreationAttributes<DomainEventModel>[],
      { transaction }
    );
  }

  async findByAggregateId(aggregateId: Uuid): Promise<DomainEvent[]> {
    const models = await DomainEventModel.findAll({
      where: {
        aggregateId: aggregateId.getValue(),
      },
      order: [['createdAt', 'ASC']],
    });

    return models.map(
      (model) =>
        new DomainEvent({
          id: Uuid.create(model.id, 'id'),
          aggregateId: Uuid.create(model.aggregateId, 'aggregateId'),
          aggregateName: model.aggregateName,
          eventType: model.eventType,
          data: model.data,
          metadata: model.metadata ?? undefined,
          createdAt: model.createdAt,
          createdBy: model.createdBy
            ? Uuid.create(model.createdBy, 'createdBy')
            : undefined,
        })
    );
  }
}
