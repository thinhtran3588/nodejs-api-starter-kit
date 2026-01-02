# Node.js Fast API Starter Kit

A production-ready Node.js starter kit for building fast, scalable REST and GraphQL API servers. This starter kit implements Clean Architecture and Domain-Driven Design (DDD) principles with a modular structure, providing a solid foundation for building enterprise-grade APIs.

## Overview

This starter kit provides a complete, battle-tested architecture for building API servers with:

- **Clean Architecture**: Layered architecture with clear separation of concerns
- **Domain-Driven Design**: Rich domain models with business logic encapsulation
- **CQRS Pattern**: Separate command and query handlers for optimized reads and writes
- **Modular Structure**: Module-based organization for scalable codebases
- **Automatic Discovery**: Convention-based discovery for modules, models, routes, and GraphQL schemas
- **Comprehensive Testing**: Built-in testing infrastructure with 100% coverage requirement

## Tech Stack

### Core Framework & Language

- **Node.js**: JavaScript runtime
- **TypeScript**: Type-safe development with strict mode
- **Fastify**: High-performance web framework
- **ES Modules (ESM)**: Modern JavaScript module system

### Database & ORM

- **PostgreSQL**: Relational database
- **Sequelize**: TypeScript ORM with migrations support

### API Interfaces

- **REST API**: Fastify routes with OpenAPI/Swagger documentation
- **GraphQL**: Mercurius integration with automatic schema and resolver discovery

### Authentication & Security

- **Firebase Admin SDK**: Firebase Authentication integration
- **JWT**: JSON Web Tokens for access token generation
- **Input Sanitization**: HTML sanitization to prevent XSS attacks
- **Rate Limiting**: Built-in rate limiting for API protection
- **CORS**: Configurable cross-origin resource sharing

### Dependency Injection & Architecture

- **Awilix**: Dependency injection container with constructor injection
- **Service Locator Pattern**: Used in controllers for flexible dependency resolution

### Testing

- **Vitest**: Fast unit testing framework
- **100% Coverage Requirement**: **MANDATORY** - Strictly enforced test coverage for all code
  - **Lines**: 100% coverage required
  - **Functions**: 100% coverage required
  - **Branches**: 100% coverage required (including nullish coalescing, ternary operators, conditionals)
  - **Statements**: 100% coverage required
  - Validation fails if coverage drops below 100% for any metric

### Development Tools

- **ESLint**: Code linting with TypeScript support
- **Prettier**: Code formatting
- **Nodemon**: Development server with hot reload
- **TypeScript Compiler**: Type checking and compilation

### Deployment

- **Docker**: Multi-stage Docker builds
- **AWS ECR**: Container registry support (configurable)

## Key Features

- **Modular Architecture**: Module-based structure following Clean Architecture and DDD principles
- **Automatic Discovery**: Convention-based automatic discovery for modules, models, associations, routes, and GraphQL - no manual registration needed
- **Dependency Injection**: Awilix-powered DI container for loose coupling and testability
- **Input Validation & Sanitization**: Comprehensive validation pipeline with HTML sanitization
- **Error Handling**: Centralized error code registry with consistent error response format
- **API Documentation**: OpenAPI/Swagger integration with automatic schema generation
- **GraphQL API**: GraphQL integration with automatic schema and resolver discovery
- **Rate Limiting**: Built-in rate limiting to protect API endpoints
- **CORS Support**: Configurable CORS for cross-origin requests
- **Domain Events**: Event-driven architecture with async event processing
- **Optimistic Locking**: Built-in optimistic locking to prevent concurrent modification conflicts
- **Comprehensive Testing**: Unit, integration, and E2E test infrastructure

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
# Configure WRITE_DATABASE_URI and READ_DATABASE_URI for database connections
```

4. Run database migrations:

```bash
npm run migrate
```

5. Start the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:3000` (or your configured port).

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production server
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run validate` - Run full validation (type check, lint, format check, tests)
- `npm run migrate` - Run database migrations
- `npm run migrate:down` - Rollback last migration
- `npm run migrate:status` - Check migration status
- `npm run migrate:create` - Create a new migration

## Documentation

Comprehensive documentation is available in the `docs/` folder:

### [Architecture Guide](docs/architecture.md)

Detailed explanation of the Clean Architecture and DDD principles, layer responsibilities, module structure, design patterns, and technology stack. This guide covers:

- Architecture overview and layer structure
- Data flow diagrams (REST and GraphQL)
- Layer responsibilities and components
- Critical design patterns (CQRS, Repository Pattern, Domain Events, etc.)
- Module structure and automatic discovery
- Application bootstrap process

### [Development Guide](docs/development-guide.md)

Step-by-step instructions for creating new features and modules. This guide includes:

- Adding new features to existing modules
- Creating new modules from scratch
- Common patterns and best practices
- Testing guidelines and examples
- Code conventions and style guidelines

### [Deployment Guide](docs/deployment.md)

Instructions for building and deploying the application, including:

- Docker build and deployment
- Environment variable configuration
- AWS ECR deployment (configurable)
- Production considerations

### [Working with Cursor](docs/cursor-guide.md)

Guide for using Cursor AI editor with this project, including:

- Cursor rules and configuration
- Branch and PR workflow automation
- Code quality and validation rules
- AI-assisted development patterns

## Project Structure

```
├── src/
│   ├── modules/                # Feature modules
│   │   └── {module-name}/
│   │       ├── domain/         # Domain layer (aggregates, value objects, interfaces)
│   │       ├── application/    # Application layer (command/query handlers, DTOs)
│   │       ├── infrastructure/ # Infrastructure layer (repositories, models, services)
│   │       └── adapters/       # Adapters layer (routes, controllers, GraphQL)
│   ├── application/            # Application-level routes and GraphQL
│   ├── common/                 # Shared utilities and base classes
│   └── index.ts                # Application entry point
├── docs/                       # Documentation
├── sequelize/                  # Database migrations
├── .cursor/                    # Cursor AI editor configuration
└── package.json
```

## Contributing

When contributing to this project, please follow the established patterns and conventions:

1. Create a feature branch from `develop`
2. Follow the code conventions and architecture patterns
3. Write tests for all new code (100% coverage required)
4. Run `npm run validate` before committing
5. Follow the branch and PR workflow (see [Cursor Guide](docs/cursor-guide.md))

## License

UNLICENSED
