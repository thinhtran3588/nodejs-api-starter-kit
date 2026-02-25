import { swaggerUI } from '@hono/swagger-ui';
import { type App } from '@app/common';

// eslint-disable-next-line no-restricted-imports
import pkg from '../../../package.json';

export const registerSwagger = (app: App) => {
  if (process.env['SWAGGER_ENABLED'] === 'true') {
    const routePrefix = process.env['SWAGGER_DOCUMENTATION_ROUTE'] ?? '/api';
    const jsonRoute = `${routePrefix}.json`;

    app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter JWT access token',
    });

    app.doc(jsonRoute, {
      openapi: '3.0.0',
      info: {
        version: pkg.version,
        title: pkg.name,
        description: pkg.description,
        contact: {
          name: process.env['SWAGGER_CONTACT_NAME'] ?? '',
          email: process.env['SWAGGER_CONTACT_EMAIL'] ?? '',
          url: process.env['SWAGGER_CONTACT_URL'] ?? '',
        },
      },
      servers: [
        {
          url: '/',
          description: 'API server',
        },
        ...(process.env['SWAGGER_PRODUCTION_URL']
          ? [
              {
                url: process.env['SWAGGER_PRODUCTION_URL'],
                description: 'Production server',
              },
            ]
          : []),
      ],
    });

    app.get(routePrefix, swaggerUI({ url: jsonRoute }));
  }
};
