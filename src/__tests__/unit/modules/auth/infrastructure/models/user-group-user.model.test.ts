import { DataTypes, Sequelize } from 'sequelize';
import { describe, expect, it } from 'vitest';
import {
  modelConfiguration,
  UserGroupUserModel,
} from '@app/modules/auth/infrastructure/models/user-group-user.model';

describe('UserGroupUserModel', () => {
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

      expect(UserGroupUserModel.name).toBe('UserGroupUser');
      expect(UserGroupUserModel.tableName).toBe('user_group_users');
    });

    it('should have correct model attributes', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = UserGroupUserModel.getAttributes();
      expect(attributes.userGroupId).toBeDefined();
      expect(attributes.userId).toBeDefined();
      expect(attributes.createdAt).toBeDefined();
    });

    it('should have composite primary key with userGroupId and userId', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = UserGroupUserModel.getAttributes();
      expect(attributes.userGroupId.primaryKey).toBe(true);
      expect(attributes.userId.primaryKey).toBe(true);
      expect(attributes.userGroupId.type).toBeInstanceOf(DataTypes.UUID);
      expect(attributes.userId.type).toBeInstanceOf(DataTypes.UUID);
    });

    it('should have foreign key references', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = UserGroupUserModel.getAttributes();
      expect(attributes.userGroupId.references).toBeDefined();
      expect(
        typeof attributes.userGroupId.references === 'object' &&
          attributes.userGroupId.references !== null
          ? attributes.userGroupId.references.model
          : undefined
      ).toBe('user_groups');
      expect(attributes.userId.references).toBeDefined();
      expect(
        typeof attributes.userId.references === 'object' &&
          attributes.userId.references !== null
          ? attributes.userId.references.model
          : undefined
      ).toBe('users');
    });

    it('should have CASCADE on delete', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = UserGroupUserModel.getAttributes();
      expect(attributes.userGroupId.onDelete).toBe('CASCADE');
      expect(attributes.userId.onDelete).toBe('CASCADE');
    });
  });
});
