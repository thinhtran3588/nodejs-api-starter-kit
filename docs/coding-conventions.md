# Coding Conventions

This document covers coding conventions, file organization, and framework-specific patterns used in this project.

## Table of Contents

1. [File and Folder Naming](#file-and-folder-naming)
2. [Code Style](#code-style)
3. [Code Comments](#code-comments)
4. [Object Creation Pattern](#object-creation-pattern)
5. [Validation Ordering](#validation-ordering)
6. [Module Structure](#module-structure)
7. [Automatic Discovery](#automatic-discovery)
8. [Common Commands](#common-commands)

## File and Folder Naming

Use `kebab-case` (hyphen-separated) for all file and directory names.

| File Type | Pattern | Example |
|-----------|---------|---------|
| Command Handlers | `*-command-handler.ts` | `register.command-handler.ts` |
| Query Handlers | `*-query-handler.ts` | `get-user.query-handler.ts` |
| Event Handlers | `*.event-handler.ts` | `user-registered.event-handler.ts` |
| Routes | `*.route.ts` | `auth.route.ts` |
| Write Repositories | `*-repository.ts` (interface), `*-repository-impl.ts` (impl) | `user-repository.ts` |
| Read Repositories | `*.read-repository.ts` (interface), `*.read-repository-impl.ts` (impl) | `user.read-repository.ts` |
| DTOs | `*.dtos.ts` | `user.dtos.ts` |
| Aggregates | `*.ts` | `user.ts` |
| Value Objects | `*.ts` | `email.ts` |
| Models | `*.model.ts` | `user.model.ts` |
| Controllers | `*-controller.ts` | `auth-controller.ts` |
| GraphQL Schemas | `*.schema.ts` | `auth.schema.ts` |
| GraphQL Resolvers | `*.resolvers.ts` | `auth.resolvers.ts` |

## Code Style

- Use `PascalCase` for class names and types
- Use `camelCase` for variables and methods
- Use `UPPER_SNAKE_CASE` for constants
- Prefer single quotes for strings
- Use trailing commas in multi-line objects and arrays
- Group imports: Node.js built-ins first, then external packages, then relative imports
- Use `@app/` alias for absolute imports from `src/`

### Import Type

Use `import type` for type-only imports:

```typescript
// ✅ Type-only import
import type { User } from '@app/modules/auth/domain/aggregates/user';
import type { UserRepository } from '@app/modules/auth/domain/interfaces/repositories/user-repository';

// ✅ Runtime import
import { Email } from '@app/modules/auth/domain/value-objects/email';
import { ValidationException } from '@app/common/domain/exceptions/validation-exception';
```

## Code Comments

**CRITICAL**: Do not write comments if the code is obvious. Code should be self-documenting through clear naming and structure.

**When NOT to add comments:**

- Don't comment what the code does — the code should be clear enough
- Don't add obvious comments like `// Set the user` above `user.set(...)`
- Don't add comments that just repeat the code

**When to add comments:**

- Explain **why** something is done, not what is done
- Document non-obvious business logic or domain rules
- Explain workarounds or temporary solutions
- Clarify complex algorithms or non-intuitive implementations

**Examples:**

```typescript
// ❌ BAD - Obvious comment
// Get user by ID
const user = await this.userRepository.findById(id);

// ✅ GOOD - No comment needed (code is self-explanatory)
const user = await this.userRepository.findById(id);

// ✅ GOOD - Comment explains WHY, not what
// Use legacy validation for backward compatibility with existing users
const isValid = await this.legacyValidator.validate(user);

// ✅ GOOD - Comment explains non-obvious business rule
// Users created before 2024 don't require email verification
if (user.createdAt < new Date('2024-01-01')) {
  return user;
}
```

## Object Creation Pattern

Do not create intermediate object variables if the object is only used once as a parameter to a function. Create the object inline instead.

```typescript
// ❌ BAD - Unnecessary intermediate variable
const data: RegisterData = {
  email,
  signInType: SignInType.EMAIL,
  username,
  displayName,
  password: passwordResult.password,
};
return this.userRepository.create(data);

// ✅ GOOD - Inline object creation
return this.userRepository.create({
  email,
  signInType: SignInType.EMAIL,
  username,
  displayName,
  password: passwordResult.password,
});

// ✅ GOOD - Intermediate variable needed (used multiple times)
const userData = { email, username, displayName };
await this.validateUserData(userData);
return this.userRepository.create(userData);

// ✅ GOOD - Intermediate variable needed (modification required)
const data = { email, username, displayName };
if (isAdmin) {
  data.role = 'admin';
}
return this.userRepository.create(data);
```

## Validation Ordering

When using the `validate` function in command handlers, **always prioritize local operations first before validations that need access to the repository**.

### For Create Operations

1. **Local validations first** — Value object validations (format, length, pattern) that don't require database access
   - Examples: `Email.create()`, `Username.create()`
   - These methods throw `ValidationException` immediately if invalid (fail fast)
2. **Repository-dependent validations second** — Validations that require querying the database
   - Examples: `emailExists()`, `usernameExists()`, `findById()`

```typescript
// Create value objects (local validation)
const email = Email.create(sanitizedData.email);
const username = sanitizedData.username
  ? Username.create(sanitizedData.username)
  : undefined;

// Repository-dependent validations
const emailExists = await this.userRepository.emailExists(email);
validate(!emailExists, AuthExceptionCode.EMAIL_ALREADY_TAKEN);
```

### For Update Operations

1. **Local validations first** — Value object validations
2. **Check for updates** — Return early if no changes (avoids unnecessary database queries)
3. **Repository-dependent validations** — Load aggregate, validate version, check business rules

```typescript
// 1. Local validations first (format checks)
const displayName = User.validateDisplayName(sanitize(requestData.displayName));
const username = requestData.username
  ? Username.create(requestData.username)
  : undefined;

// 2. Check if there are updates
const hasUpdates = displayName !== undefined || username !== undefined;
if (!hasUpdates) {
  return; // Early return - no database query needed
}

// 3. Repository-dependent validations
const user = await this.userValidatorService.validateUserNotDeletedById(idUuid);
user.prepareUpdate(operatorId, requestData.version);

if (username) {
  const usernameExists = await this.userRepository.usernameExists(username, idUuid);
  validate(!usernameExists, AuthExceptionCode.USERNAME_ALREADY_TAKEN);
}

// 4. Apply updates and save
if (username !== undefined) user.setUsername(username);
if (displayName !== undefined) user.setDisplayName(displayName);
await this.userRepository.save(user);
```

## Module Structure

Modules follow a consistent structure that enables automatic discovery:

```text
modules/{module-name}/
├── domain/                      # Domain layer
│   ├── aggregates/              # Aggregate roots (e.g., User, Role)
│   ├── value-objects/           # Value objects (e.g., Email, Username)
│   ├── interfaces/              # Domain interfaces
│   │   ├── repositories/        # Write repository interfaces
│   │   └── services/            # Domain service interfaces
│   ├── enums/                   # Exception codes, event types, domain enums
│   └── types/                   # Domain types (if needed)
├── application/                 # Application layer
│   ├── command-handlers/        # Command handlers (CQRS write)
│   ├── query-handlers/          # Query handlers (CQRS read)
│   ├── event-handlers/          # Event handlers (async processing)
│   ├── interfaces/              # Application interfaces
│   │   ├── commands/            # Command interfaces
│   │   ├── queries/             # Query interfaces
│   │   └── repositories/        # Read repository interfaces
│   └── dtos/                    # Data Transfer Objects (if needed)
├── infrastructure/              # Infrastructure layer
│   ├── models/                  # Sequelize models (auto-discovered)
│   │   ├── *.model.ts           # Model files with modelConfiguration
│   │   └── associations.ts      # Model associations (auto-discovered)
│   ├── repositories/            # Repository implementations
│   │   ├── *.repository-impl.ts # Write repositories
│   │   └── *.read-repository-impl.ts # Read repositories
│   └── services/                # Service implementations
├── adapters/                    # Adapters layer
│   ├── routes/                  # HTTP routes (auto-discovered)
│   │   └── *.route.ts           # Route files with routeConfiguration
│   ├── controllers/             # Controllers (service locator)
│   ├── graphql/                 # GraphQL (auto-discovered, optional)
│   │   ├── *.schema.ts          # GraphQL schemas
│   │   └── *.resolvers.ts       # GraphQL resolvers
│   ├── dtos/                    # Data Transfer Objects
│   └── schemas.ts               # Request/response schemas
└── module-configuration.ts      # Module registration (auto-discovered)
```

**Application-Level Routes:** Application-level routes (shared across modules) are located in `application/adapters/routes/` and are also automatically discovered.

## Automatic Discovery

The application uses **automatic discovery** for modules, models, associations, routes, and GraphQL schemas/resolvers. No manual registration is needed — just follow the conventions.

### Module Discovery

- Modules are automatically discovered by scanning for `module-configuration.ts` files in `modules/*/`
- Each module must export a `moduleConfiguration` object with `registerDependencies` and `registerErrorCodes`
- Module whitelist can be configured via `MODULE_WHITELIST` environment variable

### Model Discovery

Create model files in `modules/{module-name}/infrastructure/models/` with `.model.ts` extension:

```typescript
export const modelConfiguration: ModelConfiguration = {
  register: (sequelize) => {
    EntityModel.init(/* ... */);
  },
};
```

### Association Discovery

Create `associations.ts` in `modules/{module-name}/infrastructure/models/`:

```typescript
export const associationConfiguration: ModelAssociationConfiguration = {
  register: () => {
    EntityModel.belongsToMany(RelatedModel, { /* ... */ });
  },
};
```

### Route Discovery

Create route files in `modules/{module-name}/adapters/routes/` with `.route.ts` extension:

```typescript
export const routeConfiguration: RouteConfiguration = {
  tags: [{ name: 'module-name', description: 'Module description' }],
  register: (app) => {
    app.post('/api/endpoint', async (request, reply) => {
      // Route handler
    });
  },
};
```

### GraphQL Discovery

- Schema files: `.schema.ts` extension, export a schema string ending with `Schema`
- Resolver files: `.resolvers.ts` extension, export a resolvers object ending with `Resolvers`
- GraphQL is always enabled; GraphiQL UI can be toggled via `GRAPHQL_UI_ENABLED=true` environment variable

## Common Commands

```bash
# Install dependencies
npm install

# Run development server with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run production server
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Validate (lint, format check, tests)
npm run validate
```
