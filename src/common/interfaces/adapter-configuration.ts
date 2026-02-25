import type { App } from './app';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface AdapterConfiguration<T extends object = any> {
  registerRoutes(app: App<T>): void;
  graphql?: {
    typeDefs: string;
    resolvers: Record<string, unknown>;
  };
}
