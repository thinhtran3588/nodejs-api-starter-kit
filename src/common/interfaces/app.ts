import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AwilixContainer } from 'awilix';
import type { Context as HonoContext } from 'hono';

import type { AppUser } from './context';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface AppEnv<T extends object = any> {
  Variables: {
    container: AwilixContainer<T>;
    ip: string;
    user?: AppUser;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type App<T extends object = any> = OpenAPIHono<AppEnv<T>>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Context<T extends object = any> = HonoContext<AppEnv<T>>;
