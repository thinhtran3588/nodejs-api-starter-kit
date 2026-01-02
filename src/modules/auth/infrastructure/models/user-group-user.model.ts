import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import type { ModelConfiguration } from '@app/common/interfaces/configuration';

export class UserGroupUserModel extends Model<
  InferAttributes<UserGroupUserModel>,
  InferCreationAttributes<UserGroupUserModel>
> {
  declare userGroupId: string;
  declare userId: string;
  declare createdAt: Date;
  declare createdBy: CreationOptional<string | null>;
}

export const modelConfiguration: ModelConfiguration = {
  register: (sequelize) => {
    UserGroupUserModel.init(
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
        userId: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
          references: {
            model: 'users',
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
        modelName: 'UserGroupUser',
        tableName: 'user_group_users',
        timestamps: false,
        underscored: true,
      }
    );
  },
};
