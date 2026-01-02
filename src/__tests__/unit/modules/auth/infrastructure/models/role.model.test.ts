import { DataTypes, Sequelize } from 'sequelize';
import { describe, expect, it } from 'vitest';
import {
  modelConfiguration,
  RoleModel,
} from '@app/modules/auth/infrastructure/models/role.model';

describe('RoleModel', () => {
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

      expect(RoleModel.name).toBe('Role');
      expect(RoleModel.tableName).toBe('roles');
    });

    it('should have correct model attributes', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = RoleModel.getAttributes();
      expect(attributes.id).toBeDefined();
      expect(attributes.code).toBeDefined();
      expect(attributes.name).toBeDefined();
      expect(attributes.description).toBeDefined();
      expect(attributes.createdAt).toBeDefined();
      expect(attributes.lastModifiedAt).toBeDefined();
    });

    it('should have id as primary key', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = RoleModel.getAttributes();
      expect(attributes.id.primaryKey).toBe(true);
      expect(attributes.id.type).toBeInstanceOf(DataTypes.UUID);
      expect(attributes.id.allowNull).toBe(false);
    });

    it('should have code as unique and required', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = RoleModel.getAttributes();
      expect(attributes.code).toBeDefined();
      expect(attributes.code.allowNull).toBe(false);
      expect(attributes.code.unique).toBe(true);
      expect(attributes.code.type).toBeInstanceOf(DataTypes.STRING);
    });

    it('should have name as unique and required', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = RoleModel.getAttributes();
      expect(attributes.name.allowNull).toBe(false);
      expect(attributes.name.unique).toBe(true);
    });

    it('should have description as required', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = RoleModel.getAttributes();
      expect(attributes.description.allowNull).toBe(false);
      expect(attributes.description.type).toBeInstanceOf(DataTypes.TEXT);
    });
  });
});
