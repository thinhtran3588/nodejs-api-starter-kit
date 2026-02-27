import { jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const domainEvents = pgTable('domain_events', {
  id: uuid('id').primaryKey(),
  aggregateId: uuid('aggregate_id').notNull(),
  aggregateName: varchar('aggregate_name', { length: 255 }).notNull(),
  eventType: varchar('event_type', { length: 255 }).notNull(),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
  createdBy: uuid('created_by'),
  metadata: jsonb('metadata'),
});

export const schema = {
  domainEvents,
};
