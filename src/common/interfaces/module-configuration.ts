import type { AwilixContainer } from 'awilix';

import type { AdapterConfiguration } from './adapter-configuration';
import type {
  ModelAssociationConfiguration,
  ModelConfiguration,
} from './database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ModuleConfiguration<T extends object = any> {
  registerDependencies(container: AwilixContainer<T>): void;
  adapters: AdapterConfiguration<T>[];
  models?: ModelConfiguration[];
  modelAssociations?: ModelAssociationConfiguration[];
}
