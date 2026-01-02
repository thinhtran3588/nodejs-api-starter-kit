import { DataTypes, Sequelize } from 'sequelize';
import { describe, expect, it } from 'vitest';
import {
  modelConfiguration,
  UserGroupRoleModel,
} from '@app/modules/auth/infrastructure/models/user-group-role.model';

describe('UserGroupRoleModel', () => {
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

      expect(UserGroupRoleModel.name).toBe('UserGroupRole');
      expect(UserGroupRoleModel.tableName).toBe('user_group_roles');
    });

    it('should have correct model attributes', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = UserGroupRoleModel.getAttributes();
      expect(attributes.userGroupId).toBeDefined();
      expect(attributes.roleId).toBeDefined();
      expect(attributes.createdAt).toBeDefined();
    });

    it('should have composite primary key with userGroupId and roleId', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = UserGroupRoleModel.getAttributes();
      expect(attributes.userGroupId.primaryKey).toBe(true);
      expect(attributes.roleId.primaryKey).toBe(true);
      expect(attributes.userGroupId.type).toBeInstanceOf(DataTypes.UUID);
      expect(attributes.roleId.type).toBeInstanceOf(DataTypes.UUID);
    });

    it('should have foreign key references', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = UserGroupRoleModel.getAttributes();
      expect(attributes.userGroupId.references).toBeDefined();
      expect(
        typeof attributes.userGroupId.references === 'object' &&
          attributes.userGroupId.references !== null
          ? attributes.userGroupId.references.model
          : undefined
      ).toBe('user_groups');
      expect(attributes.roleId.references).toBeDefined();
      expect(
        typeof attributes.roleId.references === 'object' &&
          attributes.roleId.references !== null
          ? attributes.roleId.references.model
          : undefined
      ).toBe('roles');
    });

    it('should have CASCADE on delete', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = UserGroupRoleModel.getAttributes();
      expect(attributes.userGroupId.onDelete).toBe('CASCADE');
      expect(attributes.roleId.onDelete).toBe('CASCADE');
    });
  });
});
