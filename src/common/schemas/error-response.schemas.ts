/**
 * Reusable error response schemas for route definitions
 * These schemas match the error response format used by the error handler middleware
 * @see src/application/middleware/error.handler.ts
 *
 * Usage:
 * response: {
 *   ...error400ResponseSchema,
 *   ...error401ResponseSchema,
 * }
 */

/**
 * Base error response schema
 * All error responses follow this structure:
 * - error: string (error code)
 * - data: object (dynamic map with additional error details)
 */
const baseErrorResponseSchema = {
  type: 'object',
  properties: {
    error: {
      type: 'string',
      description: 'Error code',
    },
    data: {
      type: 'object',
      description: 'Additional error data (dynamic map)',
      additionalProperties: true,
    },
  },
  required: ['error'],
} as const;

/**
 * 201 Created success response schema
 * Can be spread directly into response object: ...success201ResponseSchema
 */
export const success201ResponseSchema = {
  201: {
    type: 'object',
    description: 'Resource created successfully',
  },
} as const;

/**
 * 204 No Content success response schema
 * Can be spread directly into response object: ...success204ResponseSchema
 */
export const success204ResponseSchema = {
  204: {
    type: 'null',
    description: 'Operation completed successfully',
  },
} as const;

/**
 * 400 Bad Request error response schema
 * Can be spread directly into response object: ...error400ResponseSchema
 */
export const error400ResponseSchema = {
  400: {
    ...baseErrorResponseSchema,
    description: 'Bad Request - Validation or business logic error',
  },
} as const;

/**
 * 401 Unauthorized error response schema
 * Can be spread directly into response object: ...error401ResponseSchema
 */
export const error401ResponseSchema = {
  401: {
    ...baseErrorResponseSchema,
    description: 'Unauthorized - Authentication required',
  },
} as const;

/**
 * 403 Forbidden error response schema
 * Can be spread directly into response object: ...error403ResponseSchema
 */
export const error403ResponseSchema = {
  403: {
    ...baseErrorResponseSchema,
    description: 'Forbidden - Insufficient permissions',
  },
} as const;

/**
 * 404 Not Found error response schema
 * Can be spread directly into response object: ...error404ResponseSchema
 */
export const error404ResponseSchema = {
  404: {
    ...baseErrorResponseSchema,
    description: 'Not Found - Resource does not exist',
  },
} as const;

/**
 * 500 Internal Server Error response schema
 * Can be spread directly into response object: ...error500ResponseSchema
 */
export const error500ResponseSchema = {
  500: {
    ...baseErrorResponseSchema,
    description: 'Internal Server Error',
  },
} as const;
