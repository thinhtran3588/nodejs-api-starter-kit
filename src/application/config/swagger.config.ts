import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = resolve(__dirname, '../../../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
  name: string;
  version: string;
  description: string;
};

const CONFIG = {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: packageJson.name,
      description: packageJson.description,
      version: packageJson.version,
      contact: {
        name: process.env['SWAGGER_CONTACT_NAME'] ?? '',
        email: process.env['SWAGGER_CONTACT_EMAIL'] ?? '',
        url: process.env['SWAGGER_CONTACT_URL'] ?? '',
      },
    },
    servers: [
      {
        url: `/`,
        description: 'Local server API',
      },
      ...(process.env['SWAGGER_PRODUCTION_URL']
        ? [
            {
              url: `${process.env['SWAGGER_PRODUCTION_URL']}`,
              description: 'Production server',
            },
          ]
        : []),
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http' as const,
          scheme: 'bearer' as const,
          bearerFormat: 'JWT',
          description: 'Enter JWT access token',
        },
      },
    },
    tags: [],
  },
};

const UI_CONFIG = {
  routePrefix: process.env['SWAGGER_DOCUMENTATION_ROUTE_PREFIX'] ?? '/docs',
  uiConfig: {
    docExpansion: 'list' as const,
    deepLinking: false,
    persistAuthorization: true,
  },
  staticCSP: false, // Disable strict CSP to allow HTTP access
};

/**
 * Swagger configuration
 */
export function swaggerConfig() {
  return CONFIG;
}

/**
 * Swagger UI configuration
 */
export function swaggerUiConfig() {
  return UI_CONFIG;
}
