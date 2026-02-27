import type { TablesRelationalConfig } from 'drizzle-orm';
import type {
  NodePgDatabase,
  NodePgTransaction,
} from 'drizzle-orm/node-postgres';

export type DatabaseClient = NodePgDatabase<TablesRelationalConfig>;
export type DatabaseTransaction = NodePgTransaction<
  TablesRelationalConfig,
  TablesRelationalConfig
>;
