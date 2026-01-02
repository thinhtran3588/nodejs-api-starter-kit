import { DataTypes, Sequelize } from 'sequelize';
import { describe, expect, it } from 'vitest';
import {
  modelConfiguration,
  UserGroupModel,
} from '@app/modules/auth/infrastructure/models/user-group.model';

describe('UserGroupModel', () => {
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

      expect(UserGroupModel.name).toBe('UserGroup');
      expect(UserGroupModel.tableName).toBe('user_groups');
    });

    it('should have correct model attributes', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = UserGroupModel.getAttributes();
      expect(attributes.id).toBeDefined();
      expect(attributes.name).toBeDefined();
      expect(attributes.description).toBeDefined();
      expect(attributes.createdAt).toBeDefined();
      expect(attributes.lastModifiedAt).toBeDefined();
    });

    it('should have id as primary key with UUID type', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = UserGroupModel.getAttributes();
      expect(attributes.id.primaryKey).toBe(true);
      expect(attributes.id.type).toBeInstanceOf(DataTypes.UUID);
      expect(attributes.id.allowNull).toBe(false);
    });

    it('should have name as required', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = UserGroupModel.getAttributes();
      expect(attributes.name.allowNull).toBe(false);
    });

    it('should have description as optional', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = UserGroupModel.getAttributes();
      expect(attributes.description.allowNull).toBe(true);
      expect(attributes.description.type).toBeInstanceOf(DataTypes.TEXT);
    });
  });
});
