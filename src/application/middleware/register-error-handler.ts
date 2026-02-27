import type { Container } from '@app/application/container';
import {
  BusinessError,
  getStatusCodeFromErrorCode,
  ValidationError,
  type App,
  type Context,
} from '@app/common';

function getLoggerFromContext(c: Context<Container>) {
  return c.var.container?.cradle.logger;
}

export const registerErrorHandler = (app: App<Container>) => {
  app.onError((error, c) => {
    if (error instanceof BusinessError || error instanceof ValidationError) {
      const statusCode = getStatusCodeFromErrorCode(error.code);
      return c.json(
        {
          error: error.code,
          data: error.data,
        },
        statusCode
      );
    }

    const logger = getLoggerFromContext(c);
    if (logger) {
      logger.error({ error }, 'Unhandled application error');
    }

    return c.json(
      {
        error: 'INTERNAL_SERVER_ERROR',
      },
      500
    );
  });
};
