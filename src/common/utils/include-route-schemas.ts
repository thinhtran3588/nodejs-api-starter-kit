import { createErrorResponse } from './create-error-response';

type StatusCode = 201 | 204 | 400 | 401 | 403 | 404 | 500;
type StatusCodeToSchemaMap = typeof statusCodeToSchemaMap;
type SchemaForCode<Code extends StatusCode> =
  StatusCodeToSchemaMap[Code] extends Record<Code, infer Schema>
    ? Schema
    : never;
type RouteSchemasFor<Codes extends readonly StatusCode[]> = {
  [K in Codes[number]]: SchemaForCode<K>;
};

const statusCodeToSchemaMap = {
  201: {
    201: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
          },
        },
      },
      description: 'Resource created successfully',
    },
  },
  204: {
    204: {
      description: 'Operation completed successfully',
    },
  },
  400: {
    400: createErrorResponse(
      'Bad Request - Validation or business logic error'
    ),
  },
  401: { 401: createErrorResponse('Unauthorized - Authentication required') },
  403: { 403: createErrorResponse('Forbidden - Insufficient permissions') },
  404: { 404: createErrorResponse('Not Found - Resource does not exist') },
  500: { 500: createErrorResponse('Internal Server Error') },
} as const;

/**
 * Includes route response schemas for the specified status codes
 * @param statusCodes Array of HTTP status codes (201, 204, 400, 401, 403, 404, 500)
 * @returns Object with all specified response schemas spread together
 *
 * @example
 * response: {
 *   200: userResponseSchema,
 *   ...includeRouteSchemas([400, 401, 403, 404, 500]),
 * }
 */
export function includeRouteSchemas<const Codes extends readonly StatusCode[]>(
  statusCodes: Codes
): RouteSchemasFor<Codes> {
  return statusCodes.reduce(
    (schemas, code) => ({ ...schemas, ...statusCodeToSchemaMap[code] }),
    {} as RouteSchemasFor<Codes>
  );
}
