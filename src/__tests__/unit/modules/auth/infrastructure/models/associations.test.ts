import { Sequelize, type BelongsToMany } from 'sequelize';
import { beforeEach, describe, expect, it } from 'vitest';
import { associationConfiguration } from '@app/modules/auth/infrastructure/models/associations';
import {
  RoleModel,
  modelConfiguration as roleModelConfiguration,
} from '@app/modules/auth/infrastructure/models/role.model';
import {
  UserGroupRoleModel,
  modelConfiguration as userGroupRoleModelConfiguration,
} from '@app/modules/auth/infrastructure/models/user-group-role.model';
import {
  UserGroupUserModel,
  modelConfiguration as userGroupUserModelConfiguration,
} from '@app/modules/auth/infrastructure/models/user-group-user.model';
import {
  UserGroupModel,
  modelConfiguration as userGroupModelConfiguration,
} from '@app/modules/auth/infrastructure/models/user-group.model';
import {
  UserModel,
  modelConfiguration as userModelConfiguration,
} from '@app/modules/auth/infrastructure/models/user.model';

describe('associations', () => {
  let sequelize: Sequelize;

  beforeEach(() => {
    sequelize = new Sequelize({
      dialect: 'postgres',
      logging: false,
    });

    userModelConfiguration.register(sequelize);
    userGroupModelConfiguration.register(sequelize);
    roleModelConfiguration.register(sequelize);
    userGroupUserModelConfiguration.register(sequelize);
    userGroupRoleModelConfiguration.register(sequelize);
  });

  describe('associationConfiguration', () => {
    it('should have register function', () => {
      expect(typeof associationConfiguration.register).toBe('function');
    });

    it('should register UserGroup to User association', () => {
      associationConfiguration.register();

      const association = UserGroupModel.associations[
        'users'
      ] as unknown as BelongsToMany & {
        through: { model: typeof UserGroupUserModel };
      };
      expect(association).toBeDefined();
      expect(association.associationType).toBe('BelongsToMany');
      expect(association.target).toBe(UserModel);
      expect(association.through.model).toBe(UserGroupUserModel);
      expect(association.foreignKey).toBe('user_group_id');
      expect(association.otherKey).toBe('user_id');
      expect(association.as).toBe('users');
    });

    it('should register User to UserGroup association', () => {
      associationConfiguration.register();

      const association = UserModel.associations[
        'userGroups'
      ] as unknown as BelongsToMany & {
        through: { model: typeof UserGroupUserModel };
      };
      expect(association).toBeDefined();
      expect(association.associationType).toBe('BelongsToMany');
      expect(association.target).toBe(UserGroupModel);
      expect(association.through.model).toBe(UserGroupUserModel);
      expect(association.foreignKey).toBe('user_id');
      expect(association.otherKey).toBe('user_group_id');
      expect(association.as).toBe('userGroups');
    });

    it('should register UserGroup to Role association', () => {
      associationConfiguration.register();

      const association = UserGroupModel.associations[
        'roles'
      ] as unknown as BelongsToMany & {
        through: { model: typeof UserGroupRoleModel };
      };
      expect(association).toBeDefined();
      expect(association.associationType).toBe('BelongsToMany');
      expect(association.target).toBe(RoleModel);
      expect(association.through.model).toBe(UserGroupRoleModel);
      expect(association.foreignKey).toBe('user_group_id');
      expect(association.otherKey).toBe('role_id');
      expect(association.as).toBe('roles');
    });

    it('should register Role to UserGroup association', () => {
      associationConfiguration.register();

      const association = RoleModel.associations[
        'userGroups'
      ] as unknown as BelongsToMany & {
        through: { model: typeof UserGroupRoleModel };
      };
      expect(association).toBeDefined();
      expect(association.associationType).toBe('BelongsToMany');
      expect(association.target).toBe(UserGroupModel);
      expect(association.through.model).toBe(UserGroupRoleModel);
      expect(association.foreignKey).toBe('role_id');
      expect(association.otherKey).toBe('user_group_id');
      expect(association.as).toBe('userGroups');
    });
  });
});
