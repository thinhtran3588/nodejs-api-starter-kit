import type { Container } from '@app/application/container';
import {
  AuthorizationExceptionCode,
  BusinessError,
  ValidationError,
  type App,
  type Context,
} from '@app/common';

const UNAUTHORIZED_CODES = new Set<string>([
  AuthorizationExceptionCode.UNAUTHORIZED,
  AuthorizationExceptionCode.INVALID_TOKEN,
]);

const FORBIDDEN_CODES = new Set<string>([
  AuthorizationExceptionCode.FORBIDDEN,
  AuthorizationExceptionCode.INSUFFICIENT_PERMISSIONS,
]);

function getStatusCodeFromErrorCode(code: string): 400 | 401 | 403 | 404 {
  if (UNAUTHORIZED_CODES.has(code)) {
    return 401;
  }

  if (FORBIDDEN_CODES.has(code)) {
    return 403;
  }

  return code.endsWith('_NOT_FOUND') ? 404 : 400;
}

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
