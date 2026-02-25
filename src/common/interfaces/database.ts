import type { Sequelize } from 'sequelize';

export interface ModelConfiguration {
  register(sequelize: Sequelize): void;
}

export interface ModelAssociationConfiguration {
  register(): void;
}
