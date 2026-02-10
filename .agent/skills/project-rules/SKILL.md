---
name: project-rules
description: General project rules and documentation references
---

# General Instructions

## Documentation References

**CRITICAL**: When making code changes, always refer to the project documentation:

| Document                                                      | Description                                                                                     |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **[Architecture](../../../docs/architecture.md)**             | Clean Architecture layers, module structure, data flow, DDD patterns, and DI with Awilix        |
| **[Coding Conventions](../../../docs/coding-conventions.md)** | File naming, code style, object creation, validation ordering, and automatic discovery           |
| **[Development Guide](../../../docs/development-guide.md)**   | Step-by-step guide for creating features, domain entities, use cases, repositories, and routes   |
| **[Testing Guide](../../../docs/testing-guide.md)**           | Vitest, 100% coverage requirement, test organization, and best practices                        |

## Project Quick Reference

| Category      | Details                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------ |
| **Framework** | Fastify, TypeScript (strict mode), ES Modules                                              |
| **Source**    | `src/` — all code                                                                          |
| **Modules**   | `src/modules/{module-name}/` with `domain/`, `application/`, `infrastructure/`, `adapters/` |
| **DI**        | Awilix — constructor injection, `module-configuration.ts` per module                       |
| **Database**  | PostgreSQL with Sequelize ORM                                                              |
| **Testing**   | Vitest with 100% coverage in `src/__tests__/`                                              |
| **API**       | REST (Fastify routes) and GraphQL (Mercurius)                                              |

## AI Agent Workflow

### Branch Management

**CRITICAL**: Before any code changes, you MUST:

1. Check current branch: `git branch --show-current`
2. If on `main`: switch to `develop` first: `git checkout develop`
3. If on `develop`: fetch and pull latest: `git fetch origin && git pull origin develop`
4. Create feature branch from `develop`: `git checkout -b <branch-name>`
5. **Never** commit directly to `main` or `develop`

**Always base feature branches on `develop`, never on `main`.**

For the detailed execution steps, refer to the **`branch-and-pr`** workflow in [branch-and-pr](../../workflows/branch-and-pr.md).

See [Development Guide](../../../docs/development-guide.md) for branch naming conventions.

### Commit and PR Rules

- **Request permission** before committing: show summary, ask "May I commit these changes?"
- **Auto-push** after commit: `git push -u origin <branch-name>`
- **Request permission** before creating PR: ask "May I create a Pull Request?"
- Use temp file for PR description to avoid shell escaping issues

### Validation

Run `npm run validate` after code changes (includes lint, format check, and tests with 100% coverage).

## Code Style Guidelines

### Import Type

Use `import type` for type-only imports:

```typescript
// Type-only import
import type { User } from './types';

// Runtime import
import { UserRepository } from './repositories';
```

### Code Comments

- Don't comment obvious code — code should be self-documenting
- Comment **why**, not **what**
- Document non-obvious business logic or workarounds

### Object Creation

Create objects inline when used once:

```typescript
// Inline (used once)
return this.userRepository.create({ email, username, displayName });

// Variable (used multiple times or modified)
const data = { email, username, displayName };
await this.validateUserData(data);
return this.userRepository.create(data);
```

### Validation Order

1. Local validation first (value objects: Email.create(), Username.create())
2. Check for updates (skip repository if nothing changed)
3. Repository-dependent validations (emailExists, usernameExists)
