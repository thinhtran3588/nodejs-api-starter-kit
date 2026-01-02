import type { FastifyInstance } from 'fastify';
import { Sequelize } from 'sequelize';
import { databaseConfig } from '@app/application/config/database.config';

const options = {
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

function getLogging(app: FastifyInstance): ((sql: string) => void) | false {
  return process.env['DB_LOGGING_ENABLED'] === 'true'
    ? (sql: string) => {
        app.log.info(sql);
      }
    : false;
}

/**
 * Initializes the write database connection (for write operations)
 */
export function initializeWriteDatabase(app: FastifyInstance): Sequelize {
  const config = databaseConfig();
  return new Sequelize(config.writeDatabaseUri, {
    ...options,
    logging: getLogging(app),
  });
}

/**
 * Initializes the read database connection (for read operations)
 */
export function initializeReadDatabase(app: FastifyInstance): Sequelize {
  const config = databaseConfig();
  return new Sequelize(config.readDatabaseUri, {
    ...options,
    logging: getLogging(app),
  });
}
