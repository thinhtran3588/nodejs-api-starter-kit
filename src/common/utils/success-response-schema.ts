import { z } from '@hono/zod-openapi';

export const SuccessResponseSchema = z.object({
  success: z.boolean(),
});
