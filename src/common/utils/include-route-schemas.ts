import {
  error400ResponseSchema,
  error401ResponseSchema,
  error403ResponseSchema,
  error404ResponseSchema,
  error500ResponseSchema,
  success201ResponseSchema,
  success204ResponseSchema,
} from '@app/common/schemas/error-response.schemas';

type StatusCode = 201 | 204 | 400 | 401 | 403 | 404 | 500;

const statusCodeToSchemaMap = {
  201: success201ResponseSchema,
  204: success204ResponseSchema,
  400: error400ResponseSchema,
  401: error401ResponseSchema,
  403: error403ResponseSchema,
  404: error404ResponseSchema,
  500: error500ResponseSchema,
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
export function includeRouteSchemas(statusCodes: StatusCode[]): {
  [K in StatusCode]?: unknown;
} {
  return Object.assign(
    {},
    ...statusCodes.map((code) => statusCodeToSchemaMap[code])
  ) as { [K in StatusCode]?: unknown };
}
