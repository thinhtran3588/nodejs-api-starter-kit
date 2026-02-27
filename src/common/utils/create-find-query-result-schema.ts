import { z } from '@hono/zod-openapi';

export const createFindQueryResultSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) =>
  z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      count: z.number(),
      pageIndex: z.number(),
    }),
  });
