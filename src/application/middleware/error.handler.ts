import type {
  FastifyBaseLogger,
  FastifyError,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import { ErrorCodeRegistry } from '@app/common/utils/error-code-registry';
import { BusinessException } from '@app/common/utils/exceptions';

/**
 * Error handler middleware for Fastify
 * Handles all errors thrown in route handlers and controllers
 * Note: ValidationException extends BusinessException, so both are handled here
 */
export function errorHandler(
  error: Error | FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
  errorCodeRegistry: ErrorCodeRegistry,
  log: FastifyBaseLogger
): void {
  // Handle BusinessException (includes ValidationException which extends it)
  if (error instanceof BusinessException) {
    const statusCode = errorCodeRegistry.getStatusCode(error.code) ?? 400;
    reply.raw.statusCode = statusCode;
    reply.raw.setHeader('Content-Type', 'application/json');
    reply.raw.end(
      JSON.stringify({
        error: error.code,
        data: error.data,
      })
    );
    return;
  }

  // Handle Fastify validation errors
  // Fastify validation errors can have different structures:
  // - error.validation (array of validation errors)
  // - error.validationContext (validation context)
  // - statusCode 400 with code starting with 'FST_ERR_VALIDATION'
  const hasValidationProperty =
    'validation' in error && Boolean(error.validation);
  const hasValidationContext =
    'validationContext' in error && Boolean(error.validationContext);
  const isFastifyValidationError =
    'statusCode' in error &&
    error.statusCode === 400 &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code.startsWith('FST_ERR_VALIDATION');

  if (
    hasValidationProperty ||
    hasValidationContext ||
    isFastifyValidationError
  ) {
    reply.raw.statusCode = 400;
    reply.raw.setHeader('Content-Type', 'application/json');
    reply.raw.end(
      JSON.stringify({
        error: 'VALIDATION_ERROR',
        data: {
          validation:
            'validation' in error
              ? error.validation
              : 'validationContext' in error
                ? error.validationContext
                : undefined,
        },
      })
    );
    return;
  }

  log.error(error);
  reply
    .code(500)
    .send({ error: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
}
