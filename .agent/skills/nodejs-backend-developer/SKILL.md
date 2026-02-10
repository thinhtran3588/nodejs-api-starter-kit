---
name: nodejs-backend-developer
description: Guides backend implementation using Fastify, TypeScript, PostgreSQL (Sequelize), Awilix DI, and CQRS within our Clean Architecture module structure. Use when building or modifying API endpoints, command/query handlers, domain logic, repositories, GraphQL schemas, or when the user mentions backend, Fastify, Sequelize, Awilix, CQRS, or API development.
---

# Node.js Backend Developer

## Stack Overview

- **Fastify**: High-performance HTTP framework with schema-based validation and Swagger auto-generation.
- **TypeScript**: Strict mode, ES Modules, `@app/` path alias for `src/`.
- **PostgreSQL + Sequelize**: Relational database with ORM; models auto-discovered in `infrastructure/models/`.
- **Awilix**: Dependency injection with constructor injection; `module-configuration.ts` per module.
- **CQRS**: Command handlers (write) and query handlers (read) separated; domain events for side effects.
- **Mercurius**: GraphQL integration with auto-discovered schemas and resolvers.
- **Vitest**: Testing framework with 100% coverage requirement.

---

## Project Structure

```
src/
├── application/                    # Application bootstrap
│   ├── adapters/routes/            # App-level routes (auto-discovered)
│   ├── config/                     # App configuration
│   ├── container.ts                # DI container setup
│   └── middleware/                 # Fastify plugins, error handling
├── common/
│   ├── domain/                     # Base classes (Entity, AggregateRoot, ValueObject)
│   ├── infrastructure/             # Shared infra utilities
│   └── utils/                      # Shared helpers
└── modules/{module-name}/
    ├── domain/
    │   ├── aggregates/             # Aggregate roots (e.g., User, Role)
    │   ├── value-objects/          # Value objects (e.g., Email, Username)
    │   ├── interfaces/
    │   │   ├── repositories/       # Write repository interfaces
    │   │   └── services/           # Domain service interfaces
    │   ├── enums/                  # Exception codes, event types
    │   └── types/                  # Domain types
    ├── application/
    │   ├── command-handlers/       # CQRS write operations
    │   ├── query-handlers/         # CQRS read operations
    │   ├── event-handlers/         # Domain event handlers
    │   └── interfaces/
    │       ├── commands/           # Command interfaces
    │       ├── queries/            # Query interfaces
    │       └── repositories/       # Read repository interfaces
    ├── infrastructure/
    │   ├── models/                 # Sequelize models (auto-discovered)
    │   │   ├── *.model.ts          # Model with modelConfiguration
    │   │   └── associations.ts     # Model associations
    │   ├── repositories/           # Repository implementations
    │   │   ├── *-repository-impl.ts
    │   │   └── *.read-repository-impl.ts
    │   └── services/               # Service implementations
    ├── adapters/
    │   ├── routes/                 # Fastify routes (auto-discovered)
    │   │   └── *.route.ts          # Route with routeConfiguration
    │   ├── controllers/            # Controllers (service locator)
    │   ├── graphql/                # GraphQL (auto-discovered)
    │   │   ├── *.schema.ts         # GraphQL type definitions
    │   │   └── *.resolvers.ts      # GraphQL resolvers
    │   ├── dtos/                   # Request/response DTOs
    │   └── schemas.ts              # Fastify JSON schemas
    └── module-configuration.ts     # DI registration (auto-discovered)
```

---

## Route Conventions

### REST Routes

Routes are auto-discovered from `*.route.ts` files. Each route file exports a `routeConfiguration`:

```typescript
import type { RouteConfiguration } from '@app/common/types';

export const routeConfiguration: RouteConfiguration = {
  tags: [{ name: 'auth', description: 'Authentication endpoints' }],
  register: (app) => {
    app.post('/api/auth/register', {
      schema: { body: registerSchema, response: { 201: registerResponseSchema } },
      handler: async (request, reply) => {
        const controller = app.diContainer.resolve('authController');
        const result = await controller.register(request.body);
        reply.code(201).send(result);
      },
    });
  },
};
```

### Route Guidelines

- **Routes are thin**: Delegate all logic to controllers/handlers.
- **Schema validation**: Define Fastify JSON schemas for body, params, querystring, and response.
- **No business logic in routes**: Routes only resolve controllers and call methods.
- **Auto-discovery**: Place route files in `modules/{module}/adapters/routes/` with `.route.ts` extension.

---

## GraphQL

### Schema Definition

Schemas are auto-discovered from `*.schema.ts` files:

```typescript
export const authSchema = `
  type AuthPayload {
    id: ID!
    idToken: String!
    signInToken: String!
  }

  extend type Query {
    me: User
  }

  extend type Mutation {
    auth: AuthMutation!
  }

  type AuthMutation {
    register(input: RegisterInput!): AuthPayload!
    signIn(input: SignInInput!): AuthPayload!
  }
`;
```

### Resolver Definition

Resolvers are auto-discovered from `*.resolvers.ts` files:

```typescript
export const authResolvers = {
  Query: {
    me: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      const handler = context.app.diContainer.resolve('getProfileQueryHandler');
      return handler.execute({ userId: context.auth.userId });
    },
  },
  Mutation: {
    auth: () => ({}),
  },
  AuthMutation: {
    register: async (_parent: unknown, args: { input: RegisterInput }, context: GraphQLContext) => {
      const handler = context.app.diContainer.resolve('registerCommandHandler');
      return handler.execute(args.input);
    },
  },
};
```

---

## CQRS Pattern

### Command Handlers (Write)

Command handlers encapsulate write operations with validation:

```typescript
// src/modules/auth/application/command-handlers/register.command-handler.ts
import type { UserRepository } from '@app/modules/auth/domain/interfaces/repositories/user-repository';
import { Email } from '@app/modules/auth/domain/value-objects/email';
import { User } from '@app/modules/auth/domain/aggregates/user';

interface Dependencies {
  userRepository: UserRepository;
  passwordService: PasswordService;
}

export class RegisterCommandHandler {
  private readonly userRepository: UserRepository;
  private readonly passwordService: PasswordService;

  constructor({ userRepository, passwordService }: Dependencies) {
    this.userRepository = userRepository;
    this.passwordService = passwordService;
  }

  async execute(command: RegisterCommand): Promise<RegisterResult> {
    // 1. Local validation (value objects)
    const email = Email.create(command.email);

    // 2. Repository-dependent validation
    const emailExists = await this.userRepository.emailExists(email);
    validate(!emailExists, AuthExceptionCode.EMAIL_ALREADY_TAKEN);

    // 3. Business logic
    const hashedPassword = await this.passwordService.hash(command.password);
    const user = User.create({ email, password: hashedPassword });

    // 4. Persist
    await this.userRepository.save(user);
    return { id: user.id };
  }
}
```

### Query Handlers (Read)

Query handlers encapsulate read operations:

```typescript
// src/modules/auth/application/query-handlers/get-user.query-handler.ts
import type { UserReadRepository } from '@app/modules/auth/application/interfaces/repositories/user-read-repository';

interface Dependencies {
  userReadRepository: UserReadRepository;
}

export class GetUserQueryHandler {
  private readonly userReadRepository: UserReadRepository;

  constructor({ userReadRepository }: Dependencies) {
    this.userReadRepository = userReadRepository;
  }

  async execute(query: GetUserQuery): Promise<UserDto> {
    const user = await this.userReadRepository.findById(query.id);
    if (!user) throw new NotFoundException(AuthExceptionCode.USER_NOT_FOUND);
    return user;
  }
}
```

---

## Domain Layer

### Aggregates

Aggregates are the core domain entities with business logic:

```typescript
// src/modules/auth/domain/aggregates/user.ts
import { AggregateRoot } from '@app/common/domain/aggregate-root';

export class User extends AggregateRoot {
  private email: Email;
  private username?: Username;
  private displayName?: string;
  private status: UserStatus;

  static create(props: CreateUserProps): User {
    const user = new User();
    user.email = props.email;
    user.status = UserStatus.ACTIVE;
    user.registerEvent(new UserCreatedEvent(user));
    return user;
  }

  prepareUpdate(operatorId: string, version: number): void {
    this.validateVersion(version);
    this.incrementVersion();
    this.setUpdatedBy(operatorId);
  }

  setUsername(username: Username): void {
    this.username = username;
  }
}
```

### Value Objects

Value objects encapsulate validation and immutability:

```typescript
// src/modules/auth/domain/value-objects/email.ts
import { ValueObject } from '@app/common/domain/value-object';

export class Email extends ValueObject<string> {
  static create(value: string): Email {
    if (!Email.isValid(value)) {
      throw new ValidationException(AuthExceptionCode.INVALID_EMAIL);
    }
    return new Email(value.toLowerCase().trim());
  }

  private static isValid(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}
```

---

## Repository Pattern

### Write Repository (Domain Interface)

```typescript
// src/modules/auth/domain/interfaces/repositories/user-repository.ts
export interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  emailExists(email: Email): Promise<boolean>;
  usernameExists(username: Username, excludeId?: string): Promise<boolean>;
}
```

### Read Repository (Application Interface)

```typescript
// src/modules/auth/application/interfaces/repositories/user-read-repository.ts
export interface UserReadRepository {
  findById(id: string): Promise<UserDto | null>;
  findAll(query: PaginationQuery): Promise<PaginatedResult<UserDto>>;
}
```

### Repository Implementation

```typescript
// src/modules/auth/infrastructure/repositories/user-repository-impl.ts
import { UserModel } from '@app/modules/auth/infrastructure/models/user.model';
import type { UserRepository } from '@app/modules/auth/domain/interfaces/repositories/user-repository';

export class UserRepositoryImpl implements UserRepository {
  async save(user: User): Promise<void> {
    await UserModel.upsert(this.toModel(user));
  }

  async findById(id: string): Promise<User | null> {
    const model = await UserModel.findByPk(id);
    return model ? this.toDomain(model) : null;
  }
}
```

---

## Dependency Injection

### Module Configuration

Each module registers its dependencies in `module-configuration.ts`:

```typescript
// src/modules/auth/module-configuration.ts
import { asClass } from 'awilix';
import type { ModuleConfiguration } from '@app/common/types';

export const moduleConfiguration: ModuleConfiguration = {
  registerDependencies: (container) => {
    container.register({
      // Handlers
      registerCommandHandler: asClass(RegisterCommandHandler).scoped(),
      getUserQueryHandler: asClass(GetUserQueryHandler).scoped(),

      // Repositories
      userRepository: asClass(UserRepositoryImpl).scoped(),
      userReadRepository: asClass(UserReadRepositoryImpl).scoped(),

      // Services
      passwordService: asClass(PasswordServiceImpl).scoped(),

      // Controllers
      authController: asClass(AuthController).scoped(),
    });
  },
  registerErrorCodes: () => {
    // Register module-specific error codes
  },
};
```

### Resolving Dependencies

In routes and controllers, resolve from the DI container:

```typescript
// In routes
const controller = app.diContainer.resolve('authController');

// In controllers (resolved via constructor injection)
export class AuthController {
  private readonly registerCommandHandler: RegisterCommandHandler;

  constructor({ registerCommandHandler }: Dependencies) {
    this.registerCommandHandler = registerCommandHandler;
  }
}
```

---

## Sequelize Models

### Model Definition

Models are auto-discovered from `*.model.ts` files:

```typescript
// src/modules/auth/infrastructure/models/user.model.ts
import { DataTypes, Model } from 'sequelize';
import type { ModelConfiguration } from '@app/common/types';

export class UserModel extends Model {
  declare id: string;
  declare email: string;
  declare username: string | null;
  declare displayName: string | null;
  declare status: string;
}

export const modelConfiguration: ModelConfiguration = {
  register: (sequelize) => {
    UserModel.init(
      {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        username: { type: DataTypes.STRING, allowNull: true, unique: true },
        displayName: { type: DataTypes.STRING, allowNull: true },
        status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'active' },
      },
      { sequelize, tableName: 'users', timestamps: true },
    );
  },
};
```

### Model Associations

Associations are auto-discovered from `associations.ts` files:

```typescript
// src/modules/auth/infrastructure/models/associations.ts
import type { ModelAssociationConfiguration } from '@app/common/types';
import { UserModel } from './user.model';
import { RoleModel } from './role.model';

export const associationConfiguration: ModelAssociationConfiguration = {
  register: () => {
    UserModel.belongsToMany(RoleModel, { through: 'user_roles', foreignKey: 'userId' });
    RoleModel.belongsToMany(UserModel, { through: 'user_roles', foreignKey: 'roleId' });
  },
};
```

---

## Quick Decision Guide

| Task                             | Approach                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------ |
| New API endpoint                 | Create `*.route.ts` in `adapters/routes/`, add controller method, add handler                    |
| New write operation              | Create command handler in `application/command-handlers/`, register in `module-configuration.ts`  |
| New read operation               | Create query handler in `application/query-handlers/`, use read repository                       |
| New domain entity                | Create aggregate in `domain/aggregates/`, value objects in `domain/value-objects/`                |
| New database table               | Create `*.model.ts` in `infrastructure/models/`, add `associations.ts` if needed                 |
| New repository method            | Add to interface in `domain/interfaces/repositories/`, implement in `infrastructure/repositories/`|
| New GraphQL operation            | Add to `*.schema.ts` and `*.resolvers.ts` in `adapters/graphql/`                                 |
| New module                       | Create module folder with all layers, add `module-configuration.ts` for auto-discovery           |
| Domain event handler             | Create event handler in `application/event-handlers/`, register in `module-configuration.ts`     |
| Shared utility                   | Add to `common/utils/` or `common/domain/` depending on layer                                    |

---

## Checklist for New Features

- [ ] Command/query handler in `application/` with validation ordering (local first, then repository)
- [ ] Domain aggregate or value object with business rules in `domain/`
- [ ] Repository interface in `domain/interfaces/repositories/` (write) or `application/interfaces/repositories/` (read)
- [ ] Repository implementation in `infrastructure/repositories/`
- [ ] Sequelize model in `infrastructure/models/` with `modelConfiguration` export
- [ ] Route in `adapters/routes/` with Fastify JSON schema validation
- [ ] Controller in `adapters/controllers/` delegating to handlers
- [ ] GraphQL schema and resolvers in `adapters/graphql/` (if needed)
- [ ] Dependencies registered in `module-configuration.ts`
- [ ] Unit tests for handler, domain logic, and repository (100% coverage)
- [ ] E2E tests for REST and GraphQL endpoints
- [ ] Imports use `@app/` path alias
- [ ] `import type` used for type-only imports
