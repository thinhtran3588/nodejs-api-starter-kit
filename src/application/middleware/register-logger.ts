import { asValue } from 'awilix';
import type { Container } from '@app/application/container';
import type { App, Context } from '@app/common';

export const registerLogger = (app: App<Container>) => {
  const isLoggerEnabled = process.env['LOGGER_ENABLED'] === 'true';

  app.use('*', async (c: Context<Container>, next) => {
    const { ip } = c.var;
    const { container } = c.var;

    // Build a request-scoped logger so every downstream log entry carries client IP context.
    const childLogger = container.cradle.logger.child({ ip });
    const scopedContainer = container.createScope();

    scopedContainer.register({
      logger: asValue(childLogger),
    });

    c.set('container', scopedContainer);

    if (!isLoggerEnabled) {
      await next();
      return;
    }

    // Request logger: emit one access log after the handler finishes.
    const { method, path } = c.req;
    const start = Date.now();

    await next();

    const end = Date.now();
    const ms = end - start;
    const { status } = c.res;
    const { logger } = c.var.container.cradle;
    const message = `${method} ${path} ${status} ${ms}ms`;

    if (status >= 400) {
      logger.error(message);
    } else {
      logger.info(message);
    }
  });
};
