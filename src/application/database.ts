import { DefaultLogger } from 'drizzle-orm/logger';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { AnyPgTable } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';
import {
  schema as commonSchema,
  type DatabaseClient,
  type Logger,
  type ModuleConfiguration,
} from '@app/common';

const poolOptions = {
  max: 10,
  min: 0,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 30000,
};

function getRequiredEnv(
  name: 'WRITE_DATABASE_URI' | 'READ_DATABASE_URI'
): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function getLogging(logger: Logger): DefaultLogger | undefined {
  if (process.env['DB_LOGGING_ENABLED'] !== 'true') {
    return undefined;
  }

  return new DefaultLogger({
    writer: {
      write(message: string) {
        logger.info({}, message);
      },
    },
  });
}

/**
 * Initializes the write database connection (for write operations)
 */
export function initializeWriteDatabase(
  logger: Logger,
  schema: Record<string, AnyPgTable>
): DatabaseClient {
  const writeDatabaseUri = getRequiredEnv('WRITE_DATABASE_URI');
  const pool = new Pool({
    connectionString: writeDatabaseUri,
    ...poolOptions,
  });

  return drizzle(pool, {
    schema,
    logger: getLogging(logger),
  }) as unknown as DatabaseClient;
}

function initializeDatabase(
  logger: Logger,
  databaseUri: string,
  schema: Record<string, AnyPgTable>
): DatabaseClient {
  const pool = new Pool({
    connectionString: databaseUri,
    ...poolOptions,
  });

  return drizzle(pool, {
    schema,
    logger: getLogging(logger),
  }) as unknown as DatabaseClient;
}

/**
 * Initializes the read database connection (for read operations)
 */
export function initializeReadDatabase(
  logger: Logger,
  schema: Record<string, AnyPgTable>
): DatabaseClient {
  const readDatabaseUri = getRequiredEnv('READ_DATABASE_URI');
  return initializeDatabase(logger, readDatabaseUri, schema);
}

/**
 * Initializes both read and write database connections
 */
export function initializeDatabases(
  modules: ModuleConfiguration[],
  logger: Logger
): {
  readDatabase: DatabaseClient;
  writeDatabase: DatabaseClient;
} {
  const mergedSchema = modules.reduce(
    (acc, module) => ({
      ...acc,
      ...(module.schema ?? {}),
    }),
    { ...commonSchema }
  );
  const readDatabase = initializeReadDatabase(logger, mergedSchema);
  const writeDatabase = initializeWriteDatabase(logger, mergedSchema);

  return {
    readDatabase,
    writeDatabase,
  };
}
