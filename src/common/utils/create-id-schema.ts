import { z } from '@hono/zod-openapi';

export const createIdSchema = () =>
  z.object({
    id: z.uuid(),
  });
