import { createRoute } from '@hono/zod-openapi';

import { withApiPrefix } from './api-prefix';

export const createApiRoute: typeof createRoute = ((config) => {
  return createRoute({
    ...config,
    path: withApiPrefix(config.path),
  });
}) as typeof createRoute;
