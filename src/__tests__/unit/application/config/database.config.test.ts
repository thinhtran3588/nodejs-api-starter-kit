import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { databaseConfig } from '@app/application/config/database.config';

describe('databaseConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('happy path', () => {
    it('should return object with writeDatabaseUri and readDatabaseUri', () => {
      process.env['WRITE_DATABASE_URI'] =
        'postgresql://user:pass@localhost:5432/testdb';
      process.env['READ_DATABASE_URI'] =
        'postgresql://user:pass@localhost:5432/readdb';

      const config = databaseConfig();

      expect(config).toHaveProperty('writeDatabaseUri');
      expect(config).toHaveProperty('readDatabaseUri');
      expect(config.writeDatabaseUri).toBe(
        'postgresql://user:pass@localhost:5432/testdb'
      );
      expect(config.readDatabaseUri).toBe(
        'postgresql://user:pass@localhost:5432/readdb'
      );
    });

    it('should return empty string for writeDatabaseUri when WRITE_DATABASE_URI is not set', () => {
      delete process.env['WRITE_DATABASE_URI'];
      delete process.env['READ_DATABASE_URI'];

      const config = databaseConfig();

      expect(config.writeDatabaseUri).toBe('');
      expect(config.readDatabaseUri).toBe('');
    });
  });

  describe('read database fallback', () => {
    it('should fallback to write database URI when READ_DATABASE_URI is not set', () => {
      process.env['WRITE_DATABASE_URI'] =
        'postgresql://user:pass@localhost:5432/writedb';
      delete process.env['READ_DATABASE_URI'];

      const config = databaseConfig();

      expect(config.writeDatabaseUri).toBe(
        'postgresql://user:pass@localhost:5432/writedb'
      );
      expect(config.readDatabaseUri).toBe(config.writeDatabaseUri);
    });
  });
});
