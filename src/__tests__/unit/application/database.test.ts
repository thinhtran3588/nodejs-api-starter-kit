import type { FastifyInstance } from 'fastify';
import { Sequelize } from 'sequelize';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { databaseConfig } from '@app/application/config/database.config';
import {
  initializeReadDatabase,
  initializeWriteDatabase,
} from '@app/application/database';

vi.mock('@app/application/config/database.config', () => ({
  databaseConfig: vi.fn(() => ({
    writeDatabaseUri: 'postgresql://testuser:testpass@localhost:5432/testdb',
    readDatabaseUri: 'postgresql://testuser:testpass@localhost:5432/testdb',
  })),
}));

describe('initializeWriteDatabase', () => {
  const originalEnv = process.env;
  let mockApp: FastifyInstance;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    mockApp = {
      log: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        trace: vi.fn(),
        fatal: vi.fn(),
        child: vi.fn(),
      },
    } as unknown as FastifyInstance;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('happy path', () => {
    it('should initialize database with default logging disabled', () => {
      delete process.env['DB_LOGGING_ENABLED'];

      const sequelize = initializeWriteDatabase(mockApp);

      expect(sequelize).toBeInstanceOf(Sequelize);
      expect(databaseConfig).toHaveBeenCalled();
    });

    it('should initialize database with logging enabled when DB_LOGGING_ENABLED is true', () => {
      process.env['DB_LOGGING_ENABLED'] = 'true';

      const sequelize = initializeWriteDatabase(mockApp);

      expect(sequelize).toBeInstanceOf(Sequelize);
      const sequelizeOptions = (
        sequelize as unknown as { options: { logging: unknown } }
      ).options;
      expect(sequelizeOptions.logging).toBeDefined();
      expect(typeof sequelizeOptions.logging).toBe('function');
    });

    it('should initialize database with correct connection URI', () => {
      delete process.env['DB_LOGGING_ENABLED'];

      const sequelize = initializeWriteDatabase(mockApp);

      expect(sequelize).toBeInstanceOf(Sequelize);
      const sequelizeOptions = (
        sequelize as unknown as { options: { dialect: string } }
      ).options;
      expect(sequelizeOptions.dialect).toBe('postgres');
      expect(databaseConfig).toHaveBeenCalled();
    });

    it('should initialize database with pool configuration', () => {
      delete process.env['DB_LOGGING_ENABLED'];

      const sequelize = initializeWriteDatabase(mockApp);

      const sequelizeOptions = (
        sequelize as unknown as { options: { pool: Record<string, number> } }
      ).options;
      expect(sequelizeOptions.pool).toEqual({
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      });
    });
  });

  describe('logging', () => {
    it('should log SQL queries when logging is enabled', () => {
      process.env['DB_LOGGING_ENABLED'] = 'true';

      const sequelize = initializeWriteDatabase(mockApp);
      const sequelizeOptions = (
        sequelize as unknown as { options: { logging: (sql: string) => void } }
      ).options;
      const loggingFn = sequelizeOptions.logging;

      loggingFn('SELECT * FROM users');

      expect(mockApp.log.info).toHaveBeenCalledWith('SELECT * FROM users');
    });

    it('should not log SQL queries when logging is disabled', () => {
      delete process.env['DB_LOGGING_ENABLED'];

      const sequelize = initializeWriteDatabase(mockApp);

      const sequelizeOptions = (
        sequelize as unknown as { options: { logging: unknown } }
      ).options;
      expect(sequelizeOptions.logging).toBe(false);
    });

    it('should not log SQL queries when DB_LOGGING_ENABLED is false', () => {
      process.env['DB_LOGGING_ENABLED'] = 'false';

      const sequelize = initializeWriteDatabase(mockApp);

      const sequelizeOptions = (
        sequelize as unknown as { options: { logging: unknown } }
      ).options;
      expect(sequelizeOptions.logging).toBe(false);
    });
  });
});

describe('initializeReadDatabase', () => {
  const originalEnv = process.env;
  let mockApp: FastifyInstance;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    mockApp = {
      log: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        trace: vi.fn(),
        fatal: vi.fn(),
        child: vi.fn(),
      },
    } as unknown as FastifyInstance;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('happy path', () => {
    it('should initialize database with default logging disabled', () => {
      delete process.env['DB_LOGGING_ENABLED'];

      const sequelize = initializeReadDatabase(mockApp);

      expect(sequelize).toBeInstanceOf(Sequelize);
      expect(databaseConfig).toHaveBeenCalled();
    });

    it('should initialize database with logging enabled when DB_LOGGING_ENABLED is true', () => {
      process.env['DB_LOGGING_ENABLED'] = 'true';

      const sequelize = initializeReadDatabase(mockApp);

      expect(sequelize).toBeInstanceOf(Sequelize);
      const sequelizeOptions = (
        sequelize as unknown as { options: { logging: unknown } }
      ).options;
      expect(sequelizeOptions.logging).toBeDefined();
      expect(typeof sequelizeOptions.logging).toBe('function');
    });

    it('should initialize database with correct connection URI', () => {
      delete process.env['DB_LOGGING_ENABLED'];

      const sequelize = initializeReadDatabase(mockApp);

      expect(sequelize).toBeInstanceOf(Sequelize);
      const sequelizeOptions = (
        sequelize as unknown as { options: { dialect: string } }
      ).options;
      expect(sequelizeOptions.dialect).toBe('postgres');
      expect(databaseConfig).toHaveBeenCalled();
    });

    it('should initialize database with pool configuration', () => {
      delete process.env['DB_LOGGING_ENABLED'];

      const sequelize = initializeReadDatabase(mockApp);

      const sequelizeOptions = (
        sequelize as unknown as { options: { pool: Record<string, number> } }
      ).options;
      expect(sequelizeOptions.pool).toEqual({
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      });
    });
  });

  describe('logging', () => {
    it('should log SQL queries when logging is enabled', () => {
      process.env['DB_LOGGING_ENABLED'] = 'true';

      const sequelize = initializeReadDatabase(mockApp);
      const sequelizeOptions = (
        sequelize as unknown as { options: { logging: (sql: string) => void } }
      ).options;
      const loggingFn = sequelizeOptions.logging;

      loggingFn('SELECT * FROM users');

      expect(mockApp.log.info).toHaveBeenCalledWith('SELECT * FROM users');
    });

    it('should not log SQL queries when logging is disabled', () => {
      delete process.env['DB_LOGGING_ENABLED'];

      const sequelize = initializeReadDatabase(mockApp);

      const sequelizeOptions = (
        sequelize as unknown as { options: { logging: unknown } }
      ).options;
      expect(sequelizeOptions.logging).toBe(false);
    });

    it('should not log SQL queries when DB_LOGGING_ENABLED is false', () => {
      process.env['DB_LOGGING_ENABLED'] = 'false';

      const sequelize = initializeReadDatabase(mockApp);

      const sequelizeOptions = (
        sequelize as unknown as { options: { logging: unknown } }
      ).options;
      expect(sequelizeOptions.logging).toBe(false);
    });
  });
});
