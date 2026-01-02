import { DataTypes, Sequelize } from 'sequelize';
import { describe, expect, it } from 'vitest';
import {
  modelConfiguration,
  UserModel,
} from '@app/modules/auth/infrastructure/models/user.model';

describe('UserModel', () => {
  describe('modelConfiguration', () => {
    it('should have register function', () => {
      expect(typeof modelConfiguration.register).toBe('function');
    });

    it('should initialize model with correct configuration', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      expect(UserModel.name).toBe('User');
      expect(UserModel.tableName).toBe('users');
    });

    it('should have correct model attributes', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = UserModel.getAttributes();
      expect(attributes.id).toBeDefined();
      expect(attributes.email).toBeDefined();
      expect(attributes.externalId).toBeDefined();
      expect(attributes.signInType).toBeDefined();
      expect(attributes.displayName).toBeDefined();
      expect(attributes.username).toBeDefined();
      expect(attributes.status).toBeDefined();
      expect(attributes.createdAt).toBeDefined();
      expect(attributes.lastModifiedAt).toBeDefined();
    });

    it('should have id as primary key', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = UserModel.getAttributes();
      expect(attributes.id.primaryKey).toBe(true);
      expect(attributes.id.type).toBeInstanceOf(DataTypes.UUID);
    });

    it('should have email as unique and required', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = UserModel.getAttributes();
      expect(attributes.email.allowNull).toBe(false);
      expect(attributes.email.unique).toBe(true);
    });

    it('should have externalId as unique and required', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = UserModel.getAttributes();
      expect(attributes.externalId.allowNull).toBe(false);
      expect(attributes.externalId.unique).toBe(true);
    });

    it('should have status with default value ACTIVE', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = UserModel.getAttributes();
      expect(attributes.status.allowNull).toBe(false);
      expect(attributes.status.defaultValue).toBe('ACTIVE');
    });

    it('should have signInType with default value EMAIL', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = UserModel.getAttributes();
      expect(attributes.signInType.allowNull).toBe(false);
      expect(attributes.signInType.defaultValue).toBe('EMAIL');
    });

    it('should have optional displayName and username', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = UserModel.getAttributes();
      expect(attributes.displayName.allowNull).toBe(true);
      expect(attributes.username.allowNull).toBe(true);
    });

    it('should have username as unique when provided', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = UserModel.getAttributes();
      expect(attributes.username.unique).toBe(true);
    });
  });
});
