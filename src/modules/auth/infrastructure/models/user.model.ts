import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import type { ModelConfiguration } from '@app/common/interfaces/configuration';

export class UserModel extends Model<
  InferAttributes<UserModel>,
  InferCreationAttributes<UserModel>
> {
  declare id: string;
  declare email: string;
  declare externalId: string;
  declare signInType: CreationOptional<'EMAIL' | 'GOOGLE' | 'APPLE'>;
  declare displayName: CreationOptional<string | null>;
  declare username: CreationOptional<string | null>;
  declare status: CreationOptional<'ACTIVE' | 'DISABLED' | 'DELETED'>;
  declare version: number;
  declare createdAt: Date;
  declare createdBy: CreationOptional<string | null>;
  declare lastModifiedAt: CreationOptional<Date>;
  declare lastModifiedBy: CreationOptional<string | null>;
}

export const modelConfiguration: ModelConfiguration = {
  register: (sequelize) => {
    UserModel.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
          defaultValue: DataTypes.UUIDV4,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
          },
        },
        externalId: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        signInType: {
          type: DataTypes.ENUM('EMAIL', 'GOOGLE', 'APPLE'),
          allowNull: false,
          defaultValue: 'EMAIL',
        },
        displayName: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        username: {
          type: DataTypes.STRING,
          allowNull: true,
          unique: true,
        },
        status: {
          type: DataTypes.ENUM('ACTIVE', 'DISABLED', 'DELETED'),
          allowNull: false,
          defaultValue: 'ACTIVE',
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
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'last_modified_at',
        underscored: true,
      }
    );
  },
};
