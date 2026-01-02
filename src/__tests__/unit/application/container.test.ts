import { Sequelize } from 'sequelize';
import { describe, expect, it } from 'vitest';
import { createMockFastifyLogger } from '@app/__tests__/test-utils/test-helpers';
import { createDIContainer } from '@app/application/container';
import { AuthorizationService } from '@app/common/application/services/authorization.service';
import { JwtService } from '@app/common/infrastructure/services/jwt.service';

describe('createDIContainer', () => {
  describe('happy path', () => {
    it('should create a container with application services', () => {
      const mockWriteDatabase = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });
      const mockReadDatabase = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      const container = createDIContainer(
        mockWriteDatabase,
        mockReadDatabase,
        createMockFastifyLogger()
      );

      expect(container).toBeDefined();
      expect(container.resolve('authorizationService')).toBeInstanceOf(
        AuthorizationService
      );
      expect(container.resolve('jwtService')).toBeInstanceOf(JwtService);
      expect(container.resolve('writeDatabase')).toBe(mockWriteDatabase);
      expect(container.resolve('readDatabase')).toBe(mockReadDatabase);
    });

    it('should register services as singletons', () => {
      const mockWriteDatabase = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });
      const mockReadDatabase = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      const container = createDIContainer(
        mockWriteDatabase,
        mockReadDatabase,
        createMockFastifyLogger()
      );

      const service1 = container.resolve('authorizationService');
      const service2 = container.resolve('authorizationService');

      expect(service1).toBe(service2);
    });

    it('should register databases as values', () => {
      const mockWriteDatabase = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });
      const mockReadDatabase = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      const container = createDIContainer(
        mockWriteDatabase,
        mockReadDatabase,
        createMockFastifyLogger()
      );

      const writeDb1 = container.resolve('writeDatabase');
      const writeDb2 = container.resolve('writeDatabase');
      const readDb1 = container.resolve('readDatabase');
      const readDb2 = container.resolve('readDatabase');

      expect(writeDb1).toBe(mockWriteDatabase);
      expect(writeDb2).toBe(mockWriteDatabase);
      expect(writeDb1).toBe(writeDb2);
      expect(readDb1).toBe(mockReadDatabase);
      expect(readDb2).toBe(mockReadDatabase);
      expect(readDb1).toBe(readDb2);
    });
  });

  describe('service resolution', () => {
    it('should resolve all registered services', () => {
      const mockWriteDatabase = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });
      const mockReadDatabase = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      const container = createDIContainer(
        mockWriteDatabase,
        mockReadDatabase,
        createMockFastifyLogger()
      );

      expect(() => container.resolve('authorizationService')).not.toThrow();
      expect(() => container.resolve('jwtService')).not.toThrow();
      expect(() => container.resolve('writeDatabase')).not.toThrow();
      expect(() => container.resolve('readDatabase')).not.toThrow();
    });

    it('should use CLASSIC injection mode', () => {
      const mockWriteDatabase = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });
      const mockReadDatabase = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      const container = createDIContainer(
        mockWriteDatabase,
        mockReadDatabase,
        createMockFastifyLogger()
      );

      const authorizationService = container.resolve('authorizationService');
      expect(authorizationService).toBeInstanceOf(AuthorizationService);
    });
  });
});
