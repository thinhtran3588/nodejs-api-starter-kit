import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import type { ModelConfiguration } from '@app/common/interfaces/configuration';

export class DomainEventModel extends Model<
  InferAttributes<DomainEventModel>,
  InferCreationAttributes<DomainEventModel>
> {
  declare id: string;
  declare aggregateId: string;
  declare aggregateName: string;
  declare eventType: string;
  declare data: Record<string, unknown>;
  declare createdAt: Date;
  declare createdBy: CreationOptional<string | null>;
  declare metadata: CreationOptional<Record<string, unknown> | null>;
}

export const modelConfiguration: ModelConfiguration = {
  register: (sequelize) => {
    DomainEventModel.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
          defaultValue: DataTypes.UUIDV4,
        },
        aggregateId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'aggregate_id',
        },
        aggregateName: {
          type: DataTypes.STRING,
          allowNull: false,
          field: 'aggregate_name',
        },
        eventType: {
          type: DataTypes.STRING,
          allowNull: false,
          field: 'event_type',
        },
        data: {
          type: DataTypes.JSONB,
          allowNull: false,
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
        metadata: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'DomainEvent',
        tableName: 'domain_events',
        timestamps: false,
        underscored: true,
      }
    );
  },
};
