# Node.js API Starter Kit

[![CI - Main](https://github.com/thinhtran3588/nodejs-api-starter-kit/actions/workflows/ci-main.yml/badge.svg?branch=main)](https://github.com/thinhtran3588/nodejs-api-starter-kit/actions/workflows/ci-main.yml)
[![codecov - Main](https://codecov.io/github/thinhtran3588/nodejs-api-starter-kit/graph/badge.svg?token=b8InPphzTT)](https://codecov.io/github/thinhtran3588/nodejs-api-starter-kit)

[![CI - Develop](https://github.com/thinhtran3588/nodejs-api-starter-kit/actions/workflows/ci-develop.yml/badge.svg?branch=develop)](https://github.com/thinhtran3588/nodejs-api-starter-kit/actions/workflows/ci-develop.yml)
[![codecov - Develop](https://codecov.io/github/thinhtran3588/nodejs-api-starter-kit/branch/develop/graph/badge.svg?token=b8InPphzTT)](https://codecov.io/github/thinhtran3588/nodejs-api-starter-kit)

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-000000?style=flat&logo=fastify&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)
![GraphQL](https://img.shields.io/badge/GraphQL-E10098?style=flat&logo=graphql&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-DD2C00?style=flat&logo=firebase&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat&logo=vitest&logoColor=white)

**English** | [Tiếng Việt](README-vi.md) | [中文](README-zh.md)

A production-ready Node.js starter kit for building fast, scalable REST and GraphQL API servers with Clean Architecture, DDD, and CQRS.

## Features

- **Clean Architecture + DDD** — Domain, Application, Infrastructure, Adapters layers with Awilix DI
- **CQRS Pattern** — Separate command and query handlers for optimized reads and writes
- **Modular Structure** — Feature modules under `src/modules/` with automatic discovery
- **Tech Stack** — Fastify, TypeScript (strict), PostgreSQL, Sequelize ORM, Mercurius (GraphQL)
- **Auth & Security** — Firebase Admin SDK, JWT, input sanitization, rate limiting, CORS
- **Testing** — Vitest with 100% coverage requirement (lines, functions, branches, statements)
- **Domain Events** — Event-driven architecture with async processing and optimistic locking

## Quick Start

```bash
npm install
cp .env.example .env  # Edit with your database config
npm run migrate
npm run dev
```

The API runs at `http://localhost:3000`.

## Scripts

| Command              | Description                                     |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | Start development server with hot reload        |
| `npm run build`      | Build TypeScript to JavaScript                  |
| `npm run validate`   | Run lint, format check, and tests with coverage |
| `npm run migrate`    | Run database migrations                         |

## Documentation

| Document                                             | Description                                               |
| ---------------------------------------------------- | --------------------------------------------------------- |
| [Architecture](docs/architecture.md)                 | Layers, data flow, design patterns, DI with Awilix        |
| [Coding Conventions](docs/coding-conventions.md)     | File naming, code style, validation ordering, discovery    |
| [Development Guide](docs/development-guide.md)       | Git workflow, adding features, creating modules            |
| [Testing Guide](docs/testing-guide.md)               | Test organization, 100% coverage, best practices           |
| [Firebase Integration](docs/firebase-integration.md) | Admin SDK setup, token verification, user management       |
| [Deployment](docs/deployment.md)                     | Docker builds, environment variables, production checklist |

## AI Agent Integration

This project includes configuration for AI-assisted development, supporting both [Antigravity](https://github.com/google-deepmind/antigravity) and [Cursor](https://cursor.com/).

### Antigravity

| Path                                   | Purpose                                       |
| -------------------------------------- | --------------------------------------------- |
| `.agent/workflows/branch-and-pr.md`    | Mandatory Git workflow and validation process |
| `.agent/skills/project-rules/SKILL.md` | Project conventions and code style            |
| `.agent/skills/`                       | Specialized skills (reviewer, backend, arch)  |

### Cursor

| Path                                       | Purpose                                          |
| ------------------------------------------ | ------------------------------------------------ |
| `.cursor/rules/general.mdc`                | Project conventions and code style               |
| `.cursor/rules/branch-and-pr-workflow.mdc` | Git workflow, validation, and PR creation        |
| `.cursor/skills/`                          | Specialized agents (code review, backend, arch)  |

For other AI tools, copy rules to the agent's config location and adapt as needed.

## Contributing

1. Create a feature branch from `develop`
2. Write/update tests to maintain 100% coverage
3. Run `npm run validate` before committing
4. Open a Pull Request targeting `develop`

See [Development Guide](docs/development-guide.md) for detailed workflow.

## License

MIT
