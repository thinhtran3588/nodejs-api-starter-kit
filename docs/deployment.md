# Deployment Guide

This guide provides instructions for building and deploying the API application.

## Table of Contents

1. [Build and Push Docker Image](#build-and-push-docker-image)
2. [Docker Build](#docker-build)
3. [Environment Variables](#environment-variables)
4. [Database Migrations](#database-migrations)
5. [Health Check](#health-check)
6. [Production Checklist](#production-checklist)
7. [Docker Compose](#docker-compose)
8. [Troubleshooting](#troubleshooting)

## Build and Push Docker Image

Build and push the Docker image to your container registry (e.g., AWS ECR, Docker Hub):

```bash
# Build the image
docker build -t your-api-name:latest .

# Tag for your registry (replace with your registry URL)
docker tag your-api-name:latest your-registry-url/your-api-name:tag

# Push to registry
docker push your-registry-url/your-api-name:tag
```

## Docker Build

The Dockerfile uses a multi-stage build:

1. **Builder Stage**: Installs all dependencies (including dev dependencies) and builds TypeScript to JavaScript
2. **Production Stage**: Installs only production dependencies and copies compiled JavaScript

The application runs as a non-root user (`nodejs`) for security.

## Environment Variables

The application loads environment variables from:

1. `.env` file (base configuration, always loaded first)
2. `.env.{NODE_ENV}` file (environment-specific overrides)

### Required Environment Variables

**Application Configuration:**

- `NODE_ENV`: Environment (development, production, test)
- `PORT`: Server port (default: 8080)
- `HOST`: Server host (default: 0.0.0.0)

**Database Configuration:**

The application uses two separate database connections for read and write operations:

- `WRITE_DATABASE_URI`: PostgreSQL connection URI for write operations (commands, mutations)
  - Format: `postgresql://username:password@host:port/database`
  - Example: `postgresql://postgres:postgres@localhost:5432/postgres_write`
  - Required for all write operations (create, update, delete)
- `READ_DATABASE_URI`: PostgreSQL connection URI for read operations (queries)
  - Format: `postgresql://username:password@host:port/database`
  - Example: `postgresql://postgres:postgres@localhost:5432/postgres_read`
  - Required for all read operations (queries, searches)
  - If not provided, falls back to `WRITE_DATABASE_URI`

**Firebase Configuration:**

- `FIREBASE_SERVICE_ACCOUNT_JSON`: Firebase service account JSON (required)
- `FIREBASE_API_KEY`: Firebase API key (required for password verification, get from Firebase Web app settings)

**JWT Configuration:**

- `JWT_ACCESS_TOKEN_EXPIRES_IN`: JWT access token expiration time (default: `15m`). Accepts values like `1h`, `30m`, `2h`, etc.
- `JWT_PRIVATE_KEY`: Private key for JWT signing (optional, takes precedence over `FIREBASE_SERVICE_ACCOUNT_JSON` private key)
- `JWT_PUBLIC_KEY`: Public key for JWT verification (optional, auto-derived from private key if not provided)
- `JWT_ISSUER`: JWT issuer claim (default: `issuer`). Used when `JWT_PRIVATE_KEY` is set. If not set and `JWT_PRIVATE_KEY` is used, defaults to `issuer`.

**Web Configuration:**

- `WEB_CORS_ENABLED`: Enable CORS (true/false, default: false)
- `WEB_CORS_ORIGINS`: Comma-separated list of allowed origins (default: empty)
- `WEB_RATE_LIMIT_MAX`: Maximum requests per time window (default: 1000)
- `WEB_RATE_LIMIT_TIME_WINDOW`: Time window for rate limiting (default: `1 minute`)

**Swagger Configuration:**

- `SWAGGER_ENABLED`: Enable Swagger UI (true/false, default: false)
- `SWAGGER_DOCUMENTATION_ROUTE_PREFIX`: Swagger UI route prefix (default: `/docs`)
- `SWAGGER_CONTACT_NAME`: Contact name for API documentation
- `SWAGGER_CONTACT_EMAIL`: Contact email for API documentation
- `SWAGGER_CONTACT_URL`: Contact URL for API documentation
- `SWAGGER_PRODUCTION_URL`: Production server URL for Swagger documentation

**GraphQL Configuration:**

- `GRAPHQL_ENDPOINT`: GraphQL endpoint path (default: `/graphql`)
- `GRAPHQL_UI_ENABLED`: Enable GraphiQL UI (set to `'true'` to enable the GraphQL UI, similar to Swagger UI) (default: `'false'`)
- `GRAPHQL_UI_ROUTE_PREFIX`: GraphiQL UI route prefix (default: `/graphiql`)

**Note**: GraphQL is always enabled. The GraphQL endpoint is always available, but the GraphiQL UI can be enabled/disabled via `GRAPHQL_UI_ENABLED`. Schemas and resolvers are automatically discovered and registered.

**Module Configuration:**

- `MODULE_WHITELIST`: Comma-separated list of module names to load (optional, loads all modules if not set)

## Database Migrations

Run database migrations before starting the application:

```bash
# Run migrations
npm run migrate

# Check migration status
npm run migrate:status

# Rollback last migration
npm run migrate:down

# Create new migration
npm run migrate:create
```

Migrations are located in `sequelize/migrations/` and are executed using Sequelize CLI.

## Health Check

The application provides a health check endpoint at `/health` that returns the application status.

## Production Checklist

Before deploying to production:

- [ ] All environment variables are set and documented
- [ ] Database migrations have been tested and applied
- [ ] Database connection pooling is configured appropriately
- [ ] CORS is properly restricted to allowed origins
- [ ] Rate limiting is configured for expected load
- [ ] JWT keys are securely stored (not in code)
- [ ] Firebase service account credentials are securely stored
- [ ] Swagger UI is disabled or restricted in production
- [ ] GraphQL endpoint is properly secured in production
- [ ] Logging is configured and tested
- [ ] Error handling is comprehensive
- [ ] Health check endpoint is working
- [ ] Graceful shutdown is implemented
- [ ] Backup and recovery procedures are documented
- [ ] Monitoring and alerting are set up

## Docker Compose

For local development, use Docker Compose:

```bash
docker-compose up -d
```

This will start PostgreSQL and the application with appropriate environment variables.

## Troubleshooting

**Application won't start:**

- Check that all required environment variables are set
- Verify database connection settings
- Check that database migrations have been run
- Review application logs for errors

**Database connection errors:**

- Verify database credentials
- Check that database is running and accessible
- Ensure database exists and migrations have been applied

**JWT errors:**

- Verify `JWT_PRIVATE_KEY` or `FIREBASE_SERVICE_ACCOUNT_JSON` is set
- Check that private key is in valid PEM format
- Ensure `JWT_ISSUER` matches your configuration

**Module discovery errors:**

- Verify `MODULE_WHITELIST` contains valid module names (if set)
- Check that `module-configuration.ts` exists in each module directory
- Review module discovery logs for specific errors
