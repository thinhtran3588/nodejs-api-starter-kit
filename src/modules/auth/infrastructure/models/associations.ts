import type { ModelAssociationConfiguration } from '@app/common/interfaces/configuration';
import { RoleModel } from '@app/modules/auth/infrastructure/models/role.model';
import { UserGroupRoleModel } from '@app/modules/auth/infrastructure/models/user-group-role.model';
import { UserGroupUserModel } from '@app/modules/auth/infrastructure/models/user-group-user.model';
import { UserGroupModel } from '@app/modules/auth/infrastructure/models/user-group.model';
import { UserModel } from '@app/modules/auth/infrastructure/models/user.model';

export const associationConfiguration: ModelAssociationConfiguration = {
  register: () => {
    // UserGroup <-> User (many-to-many through UserGroupUser)
    UserGroupModel.belongsToMany(UserModel, {
      through: UserGroupUserModel,
      foreignKey: 'user_group_id',
      otherKey: 'user_id',
      as: 'users',
    });

    UserModel.belongsToMany(UserGroupModel, {
      through: UserGroupUserModel,
      foreignKey: 'user_id',
      otherKey: 'user_group_id',
      as: 'userGroups',
    });

    // UserGroup <-> Role (many-to-many through UserGroupRole)
    UserGroupModel.belongsToMany(RoleModel, {
      through: UserGroupRoleModel,
      foreignKey: 'user_group_id',
      otherKey: 'role_id',
      as: 'roles',
    });

    RoleModel.belongsToMany(UserGroupModel, {
      through: UserGroupRoleModel,
      foreignKey: 'role_id',
      otherKey: 'user_group_id',
      as: 'userGroups',
    });
  },
};
