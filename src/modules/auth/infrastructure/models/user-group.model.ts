import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import type { ModelConfiguration } from '@app/common/interfaces/configuration';

export class UserGroupModel extends Model<
  InferAttributes<UserGroupModel>,
  InferCreationAttributes<UserGroupModel>
> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare description: CreationOptional<string | null>;
  declare version: number;
  declare createdAt: Date;
  declare createdBy: CreationOptional<string | null>;
  declare lastModifiedAt: CreationOptional<Date>;
  declare lastModifiedBy: CreationOptional<string | null>;
}

export const modelConfiguration: ModelConfiguration = {
  register: (sequelize) => {
    UserGroupModel.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
          defaultValue: DataTypes.UUIDV4,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        version: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        createdBy: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        lastModifiedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        lastModifiedBy: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'UserGroup',
        tableName: 'user_groups',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'last_modified_at',
        underscored: true,
      }
    );
  },
};
