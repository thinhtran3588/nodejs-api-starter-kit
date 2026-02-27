import type { AwilixContainer } from 'awilix';
import type { AnyPgTable } from 'drizzle-orm/pg-core';

import type { AdapterConfiguration } from './adapter-configuration';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ModuleConfiguration<T extends object = any> {
  registerDependencies(container: AwilixContainer<T>): void;
  adapters: AdapterConfiguration<T>[];
  schema?: Record<string, AnyPgTable>;
}
