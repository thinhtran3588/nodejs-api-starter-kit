import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import type { ModelConfiguration } from '@app/common/interfaces/configuration';

export class UserPendingDeletionModel extends Model<
  InferAttributes<UserPendingDeletionModel>,
  InferCreationAttributes<UserPendingDeletionModel>
> {
  declare id: string;
}

export const modelConfiguration: ModelConfiguration = {
  register: (sequelize) => {
    UserPendingDeletionModel.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
      },
      {
        sequelize,
        modelName: 'UserPendingDeletion',
        tableName: 'users_pending_deletion',
        timestamps: false,
        underscored: true,
      }
    );
  },
};
