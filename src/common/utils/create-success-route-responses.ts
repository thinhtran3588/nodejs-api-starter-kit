import type { z } from '@hono/zod-openapi';

type SuccessStatusCode = 200 | 201;

type JsonRouteResponse<Code extends SuccessStatusCode, Schema> = {
  [K in Code]: {
    content: {
      'application/json': {
        schema: Schema;
      };
    };
    description: string;
  };
};

export const includeJsonSchema = <Code extends SuccessStatusCode, Schema>(
  status: Code,
  description: string,
  schema: z.ZodType<Schema>
): JsonRouteResponse<Code, z.ZodType<Schema>> =>
  ({
    [status]: {
      content: {
        'application/json': {
          schema,
        },
      },
      description,
    },
  }) as JsonRouteResponse<Code, z.ZodType<Schema>>;
