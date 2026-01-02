import { DataTypes, Sequelize } from 'sequelize';
import { describe, expect, it } from 'vitest';
import {
  modelConfiguration,
  UserPendingDeletionModel,
} from '@app/modules/auth/infrastructure/models/user-pending-deletion.model';

describe('UserPendingDeletionModel', () => {
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

      expect(UserPendingDeletionModel.name).toBe('UserPendingDeletion');
      expect(UserPendingDeletionModel.tableName).toBe('users_pending_deletion');
    });

    it('should have correct model attributes', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = UserPendingDeletionModel.getAttributes();
      expect(attributes.id).toBeDefined();
    });

    it('should have id as primary key with UUID type', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = UserPendingDeletionModel.getAttributes();
      expect(attributes.id.primaryKey).toBe(true);
      expect(attributes.id.type).toBeInstanceOf(DataTypes.UUID);
      expect(attributes.id.allowNull).toBe(false);
    });

    it('should have foreign key reference to users table', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = UserPendingDeletionModel.getAttributes();
      expect(attributes.id.references).toBeDefined();
      const references =
        typeof attributes.id.references === 'object' &&
        attributes.id.references !== null
          ? attributes.id.references
          : undefined;
      expect(references?.model).toBe('users');
      expect(references?.key).toBe('id');
    });

    it('should have CASCADE on delete', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      const attributes = UserPendingDeletionModel.getAttributes();
      expect(attributes.id.onDelete).toBe('CASCADE');
    });

    it('should not have timestamps', () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        logging: false,
      });

      modelConfiguration.register(sequelize);

      expect(UserPendingDeletionModel.options.timestamps).toBe(false);
    });
  });
});
