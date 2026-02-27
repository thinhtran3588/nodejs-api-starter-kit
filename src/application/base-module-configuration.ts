import { z } from '@hono/zod-openapi';
import {
  schema as commonSchema,
  createApiRoute,
  type App,
  type ModuleConfiguration,
} from '@app/common';

export const moduleConfiguration: ModuleConfiguration = {
  registerDependencies(_container): void {
    // No dependencies to register
  },
  adapters: [
    {
      registerRoutes(app: App): void {
        // GET /health
        app.openapi(
          createApiRoute({
            method: 'get',
            path: '/health',
            summary: 'Health check',
            tags: ['health'],
            responses: {
              200: {
                content: {
                  'application/json': {
                    schema: z.object({
                      status: z.string().openapi({ example: 'ok' }),
                    }),
                  },
                },
                description: 'Health status',
              },
            },
          }),
          (c) => {
            return c.json({ status: 'ok' });
          }
        );
      },
      graphql: {
        typeDefs: `
          type HealthStatus {
            status: String
          }
          extend type Query {
            health: HealthStatus
          }
        `,
        resolvers: {
          health: () => ({ status: 'ok' }),
        },
      },
    },
  ],
  schema: commonSchema,
};
