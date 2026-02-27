import type { z } from '@hono/zod-openapi';

export const createBodySchema = <T extends z.ZodTypeAny>(schema: T) => ({
  content: {
    'application/json': {
      schema,
    },
  },
});
