import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import type { ModelConfiguration } from '@app/common/interfaces/configuration';

export class UserGroupRoleModel extends Model<
  InferAttributes<UserGroupRoleModel>,
  InferCreationAttributes<UserGroupRoleModel>
> {
  declare userGroupId: string;
  declare roleId: string;
  declare createdAt: Date;
  declare createdBy: CreationOptional<string | null>;
}

export const modelConfiguration: ModelConfiguration = {
  register: (sequelize) => {
    UserGroupRoleModel.init(
      {
        userGroupId: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
          references: {
            model: 'user_groups',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        roleId: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
          references: {
            model: 'roles',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          field: 'created_at',
        },
        createdBy: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'created_by',
        },
      },
      {
        sequelize,
        modelName: 'UserGroupRole',
        tableName: 'user_group_roles',
        timestamps: false,
        underscored: true,
      }
    );
  },
};
