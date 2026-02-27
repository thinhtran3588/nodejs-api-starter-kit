import { z } from '@hono/zod-openapi';

const errorResponseSchema = z.object({
  error: z.string(),
  data: z.any().optional(),
});

export function createErrorResponse(description: string) {
  return {
    content: {
      'application/json': {
        schema: errorResponseSchema,
      },
    },
    description,
  };
}
