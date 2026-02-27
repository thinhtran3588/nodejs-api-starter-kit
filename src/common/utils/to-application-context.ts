import type { Context } from '@app/common/interfaces/app';
import type { ApplicationContext } from '@app/common/interfaces/context';

export const toApplicationContext = <T extends object>(
  context: Context<T>
): ApplicationContext => ({ user: context.var.user });
