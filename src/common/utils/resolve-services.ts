import type { Context } from '@app/common/interfaces/app';

export const resolveServices = <T extends object>(
  context: Context<T>
): Context<T>['var']['container']['cradle'] => context.var.container.cradle;
