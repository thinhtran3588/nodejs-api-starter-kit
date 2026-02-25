import { Sequelize } from 'sequelize';
import type { Logger, ModuleConfiguration } from '@app/common';

const options = {
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
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

function getLogging(logger: Logger): ((sql: string) => void) | false {
  return process.env['DB_LOGGING_ENABLED'] === 'true'
    ? (sql: string) => {
        logger.info({}, sql);
      }
    : false;
}

/**
 * Initializes the write database connection (for write operations)
 */
export function initializeWriteDatabase(logger: Logger): Sequelize {
  const writeDatabaseUri = getRequiredEnv('WRITE_DATABASE_URI');
  return new Sequelize(writeDatabaseUri, {
    ...options,
    logging: getLogging(logger),
  });
}

/**
 * Initializes the read database connection (for read operations)
 */
export function initializeReadDatabase(logger: Logger): Sequelize {
  const readDatabaseUri = getRequiredEnv('READ_DATABASE_URI');
  return new Sequelize(readDatabaseUri, {
    ...options,
    logging: getLogging(logger),
  });
}

/**
 * Registers database models and associations from modules
 */
function registerDatabaseModels(
  modules: ModuleConfiguration[],
  readDatabase: Sequelize,
  writeDatabase: Sequelize
): void {
  // Register models for real and write databases
  modules.forEach((module: ModuleConfiguration) => {
    module.models?.forEach((model) => {
      model.register(readDatabase);
      model.register(writeDatabase);
    });
  });

  // Register model associations
  modules.forEach((module: ModuleConfiguration) => {
    module.modelAssociations?.forEach((association) => {
      association.register();
    });
  });
}

/**
 * Initializes both read and write database connections and registers models
 */
export function initializeDatabases(
  modules: ModuleConfiguration[],
  logger: Logger
): {
  readDatabase: Sequelize;
  writeDatabase: Sequelize;
} {
  const readDatabase = initializeReadDatabase(logger);
  const writeDatabase = initializeWriteDatabase(logger);

  registerDatabaseModels(modules, readDatabase, writeDatabase);

  return {
    readDatabase,
    writeDatabase,
  };
}
