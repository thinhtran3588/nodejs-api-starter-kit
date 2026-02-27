import {
  asc,
  eq,
  type InferInsertModel,
  type InferSelectModel,
} from 'drizzle-orm';
import { DomainEvent } from '@app/common/domain/domain-event';
import { Uuid } from '@app/common/domain/uuid';
import type {
  DatabaseClient,
  DatabaseTransaction,
} from '@app/common/interfaces/database';
import type { DomainEventRepository } from '@app/common/interfaces/domain-event-repository';

import { domainEvents } from './schema';

/**
 * Drizzle implementation of DomainEventRepository
 */
export class DrizzleDomainEventRepository implements DomainEventRepository {
  private readonly writeDatabase: DatabaseClient;

  constructor({ writeDatabase }: { writeDatabase: DatabaseClient }) {
    this.writeDatabase = writeDatabase;
  }

  async save(
    events: DomainEvent[],
    transaction: DatabaseTransaction
  ): Promise<void> {
    if (events.length === 0) {
      return;
    }

    const payloads = events.map(
      (event) => event.toJson() as InferInsertModel<typeof domainEvents>
    );
    await transaction.insert(domainEvents).values(payloads);
  }

  async findByAggregateId(aggregateId: Uuid): Promise<DomainEvent[]> {
    const rows = await this.writeDatabase
      .select()
      .from(domainEvents)
      .where(eq(domainEvents.aggregateId, aggregateId.getValue()))
      .orderBy(asc(domainEvents.createdAt));

    return rows.map(
      (row: InferSelectModel<typeof domainEvents>) =>
        new DomainEvent({
          id: Uuid.create(row.id, 'id'),
          aggregateId: Uuid.create(row.aggregateId, 'aggregateId'),
          aggregateName: row.aggregateName,
          eventType: row.eventType,
          data: row.data as Record<string, unknown>,
          metadata: row.metadata
            ? (row.metadata as Record<string, unknown>)
            : undefined,
          createdAt: row.createdAt,
          createdBy: row.createdBy
            ? Uuid.create(row.createdBy, 'createdBy')
            : undefined,
        })
    );
  }
}
