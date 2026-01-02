# Testing Guide

This document provides comprehensive instructions on how testing works in this API project, including detailed explanations of unit and E2E tests.

## Table of Contents

1. [Overview](#overview)
2. [Test Configuration](#test-configuration)
3. [Test Types](#test-types)
4. [Test Organization](#test-organization)
5. [Test Coverage Requirements](#test-coverage-requirements)
6. [Writing Tests](#writing-tests)
7. [Test Utilities and Helpers](#test-utilities-and-helpers)
8. [Running Tests](#running-tests)
9. [Best Practices](#best-practices)

## Overview

This API project uses **Vitest** as the testing framework and enforces **100% test coverage** for all code metrics. The testing strategy follows a two-tier approach:

- **Unit Tests**: Test individual components in isolation with mocked dependencies
- **E2E Tests**: Test complete HTTP flows through REST and GraphQL APIs

### Key Testing Principles

1. **100% Coverage Mandatory**: All code must achieve 100% coverage for lines, functions, branches, and statements
2. **Test-Driven Development**: Write tests immediately after writing production code
3. **Isolation**: Tests should be independent and not rely on shared state
4. **Fast Execution**: Unit tests should run quickly; E2E tests may be slower
5. **Clear and Readable**: Tests should clearly express what is being tested and why

## Test Configuration

### Vitest Configuration

The test configuration is defined in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/test-utils/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@app': new URL('./src', import.meta.url).pathname,
    },
  },
});
```

### Key Configuration Points

- **globals: true**: Enables global test functions (`describe`, `it`, `expect`, etc.) without imports
- **environment: 'node'**: Runs tests in Node.js environment
- **setupFiles**: Runs `setup.ts` before all tests to configure test environment
- **coverage thresholds**: Enforces 100% coverage for all metrics
- **testTimeout**: 10 seconds timeout for individual tests
- **@app alias**: Enables absolute imports from `src/` directory

### Test Setup File

The `src/__tests__/test-utils/setup.ts` file runs before all tests and configures the test environment:

```typescript
beforeAll(() => {
  process.env['NODE_ENV'] = 'test';
  process.env['PORT'] = '0'; // Use random port for tests
  process.env['HOST'] = '127.0.0.1';
});
```

## Test Types

### Unit Tests

**Purpose**: Test individual components (classes, functions, methods) in isolation with all dependencies mocked.

**Characteristics**:

- Fast execution (milliseconds per test)
- No external dependencies (database, network, file system)
- All dependencies are mocked using Vitest's `vi.fn()` and `vi.mock()`
- Test business logic, validation, and error handling
- Test all code paths and branches

**What to Test**:

- Command handlers (business logic, validation, error handling)
- Query handlers (data retrieval logic, authorization)
- Domain aggregates (business rules, invariants, state changes)
- Value objects (validation, immutability)
- Domain services (business logic)
- Utility functions (all code paths, edge cases)
- Controllers (request/response transformation)

**Example Structure**:

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterCommandHandler } from '@app/modules/auth/application/command-handlers/register.command-handler';
import type { UserRepository } from '@app/modules/auth/domain/interfaces/repositories/user.repository';

describe('RegisterCommandHandler', () => {
  let handler: RegisterCommandHandler;
  let mockUserRepository: UserRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserRepository = {
      save: vi.fn(),
      emailExists: vi.fn(),
    } as unknown as UserRepository;

    handler = new RegisterCommandHandler(
      mockUserRepository /* ... other mocks */
    );
  });

  describe('execute - happy path', () => {
    it('should register a new user', async () => {
      // Arrange
      vi.mocked(mockUserRepository.emailExists).mockResolvedValue(false);
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined);

      const command = {
        email: 'test@example.com',
        password: 'ValidPass123!',
      };

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result.id).toBeDefined();
    });
  });

  describe('execute - validation errors', () => {
    it('should throw ValidationException when email already exists', async () => {
      // Arrange
      vi.mocked(mockUserRepository.emailExists).mockResolvedValue(true);

      const command = {
        email: 'existing@example.com',
        password: 'ValidPass123!',
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        ValidationException
      );
    });
  });
});
```

**Key Patterns**:

- Use `vi.fn()` to create mock functions
- Use `vi.mocked()` to type mock functions and set return values
- Use `as unknown as Type` for type assertions when creating mock objects
- Clear mocks in `beforeEach` with `vi.clearAllMocks()`
- Group related tests using nested `describe` blocks
- Use descriptive test names that explain what is being tested

### E2E Tests

**Purpose**: Test complete HTTP flows through REST and GraphQL APIs, simulating real user interactions.

**Characteristics**:

- Test full request/response cycle
- Use Fastify's `app.inject()` for HTTP testing
- Test authentication, authorization, validation, error handling
- Test GraphQL queries and mutations
- May use mocked handlers or real implementations
- Slower than unit tests (hundreds of milliseconds to seconds per test)

**What to Test**:

- REST API endpoints (POST, GET, PUT, DELETE)
- GraphQL queries and mutations
- Authentication flows (register, sign in, token refresh)
- Authorization (role-based access control)
- Request validation (schema validation, error responses)
- Error handling (404, 400, 401, 500 responses)
- Complete user flows (register → sign in → get profile → update profile)

**Example Structure - REST API**:

```typescript
import { asValue } from 'awilix';
import fastify, { type FastifyInstance } from 'fastify';
import { Sequelize } from 'sequelize';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDIContainer } from '@app/application/container';
import { routeConfiguration } from '@app/modules/auth/adapters/routes/auth.route';
import { RegisterCommandHandler } from '@app/modules/auth/application/command-handlers/register.command-handler';

describe('auth.route - E2E', () => {
  let app: FastifyInstance;
  let mockRegisterCommandHandler: RegisterCommandHandler;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockRegisterCommandHandler = {
      execute: vi.fn(),
    } as unknown as RegisterCommandHandler;

    const container = createDIContainer(/* ... */);
    container.register({
      registerCommandHandler: asValue(mockRegisterCommandHandler),
    });

    app = fastify({ logger: false });
    app.decorate('diContainer', container);
    routeConfiguration.register(app);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      // Arrange
      vi.mocked(mockRegisterCommandHandler.execute).mockResolvedValue({
        id: 'user-id',
        idToken: 'id-token',
        signInToken: 'sign-in-token',
      });

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'ValidPass123!',
          displayName: 'Test User',
        },
      });

      // Assert
      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.id).toBe('user-id');
      expect(body.idToken).toBe('id-token');
      expect(mockRegisterCommandHandler.execute).toHaveBeenCalled();
    });

    it('should return 400 for invalid input', async () => {
      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'invalid-email',
          password: 'short',
        },
      });

      // Assert
      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error).toBeDefined();
    });
  });
});
```

**Example Structure - GraphQL**:

```typescript
import { asValue } from 'awilix';
import fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDIContainer } from '@app/application/container';
import { registerGraphQL } from '@app/application/middleware/register-graphql';
import { authResolvers } from '@app/modules/auth/adapters/graphql/auth.resolvers';
import { authSchema } from '@app/modules/auth/adapters/graphql/auth.schema';
import { GetProfileQueryHandler } from '@app/modules/auth/application/query-handlers/get-profile.query-handler';

describe('GraphQL Auth E2E', () => {
  let app: FastifyInstance;
  let mockGetProfileQueryHandler: GetProfileQueryHandler;

  beforeEach(async () => {
    mockGetProfileQueryHandler = {
      execute: vi.fn(),
    } as unknown as GetProfileQueryHandler;

    const container = createDIContainer(/* ... */);
    container.register({
      getProfileQueryHandler: asValue(mockGetProfileQueryHandler),
    });

    app = fastify({ logger: false });
    app.decorate('diContainer', container);

    await registerGraphQL(
      app,
      [{ schema: authSchema }],
      [{ resolvers: authResolvers }]
    );
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Query.me', () => {
    it('should return user profile when authenticated', async () => {
      // Arrange
      vi.mocked(mockGetProfileQueryHandler.execute).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        displayName: 'Test User',
      });

      const query = `
        query {
          me {
            id
            email
            displayName
          }
        }
      `;

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          authorization: 'Bearer valid-token',
        },
        payload: { query },
      });

      // Assert
      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.me.id).toBe('user-id');
      expect(body.data.me.email).toBe('test@example.com');
    });
  });
});
```

**Key Patterns**:

- Use `app.inject()` for HTTP testing (no need to start server)
- Mock handlers in DI container using `asValue()`
- Test complete request/response cycle
- Test authentication headers and tokens
- Test error responses (status codes, error messages)
- Clean up app instance in `afterEach`

## Test Organization

Tests are organized in `src/__tests__/` with the following structure:

```
src/__tests__/
├── unit/                          # Unit tests
│   ├── app.test.ts                # Application-level tests
│   ├── application/               # Application layer tests
│   │   ├── adapters/              # Adapter tests (routes, controllers)
│   │   ├── config/                # Configuration tests
│   │   ├── middleware/            # Middleware tests
│   │   └── ...
│   ├── common/                    # Common/shared tests
│   │   ├── domain/                # Domain base classes
│   │   ├── infrastructure/        # Infrastructure utilities
│   │   └── utils/                 # Utility functions
│   └── modules/                   # Module-specific tests
│       └── {module-name}/
│           ├── adapters/          # Route, controller, GraphQL tests
│           ├── application/       # Command/query handler tests
│           ├── domain/            # Aggregate, value object tests
│           └── infrastructure/    # Repository, service tests
├── e2e/                           # End-to-end tests
│   ├── graphql/                   # GraphQL E2E tests
│   └── modules/
│       └── {module-name}/
│           └── adapters/
│               └── routes/        # REST API E2E tests
└── test-utils/                    # Test utilities and helpers
    ├── setup.ts                   # Test setup configuration
    ├── test-helpers.ts            # Helper functions
    └── test-fixtures.ts           # Test data fixtures
```

### File Naming Convention

- Test files must end with `.test.ts` or `.spec.ts`
- Test file names should match the source file name
- Example: `register.command-handler.ts` → `register.command-handler.test.ts`

### Directory Structure

- Unit tests mirror the source directory structure
- Integration tests are organized by module and component type
- E2E tests are organized by API type (REST vs GraphQL) and module

## Test Coverage Requirements

### Mandatory 100% Coverage

The project **requires 100% test coverage** for all metrics:

- **Lines**: 100% - Every line of code must be executed in tests
- **Functions**: 100% - Every function must be called in tests
- **Branches**: 100% - Every conditional branch must be tested, including:
  - Nullish coalescing operators (`??`) - test both null/undefined and value cases
  - Ternary operators (`? :`) - test both true and false branches
  - If/else statements - test both branches
  - Switch statements - test all cases including default
  - Logical operators (`&&`, `||`) - test short-circuit behavior
  - Optional chaining (`?.`) - test both when property exists and when it doesn't
- **Statements**: 100% - Every statement must be executed in tests

### Coverage Enforcement

Coverage is enforced by:

1. **Vitest configuration**: Thresholds set to 100% in `vitest.config.ts`
2. **Validation script**: `npm run validate` fails if coverage is below 100%
3. **CI/CD**: Coverage checks should be part of the CI pipeline

### Coverage Exclusions

The following are excluded from coverage:

- Type definition files (`.d.ts`)
- Test files (`__tests__/`, `*.test.ts`, `*.spec.ts`)
- Test utilities (`test-utils/`)
- Interfaces without implementation (`interfaces/`, `*.interface.ts`)
- Configuration files (`*.config.*`)

### Achieving 100% Coverage

To achieve 100% coverage:

1. **Test all code paths**: Every if/else, switch case, ternary operator
2. **Test edge cases**: Null, undefined, empty strings, empty arrays, boundary values
3. **Test error paths**: Exception throwing, error handling
4. **Test all branches**: Use type assertions (`as any`) if needed to test null values
5. **Run coverage report**: `npm run test:coverage` to identify uncovered code
6. **Fix coverage gaps**: Add tests for any uncovered code before marking tasks complete

## Writing Tests

### Test Structure Pattern

Follow this structure for all test files:

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';
// ... other imports

describe('ClassName', () => {
  let instance: ClassName;
  let mockDependency: Dependency;

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup mocks and instances
    mockDependency = {
      method: vi.fn(),
    } as unknown as Dependency;

    instance = new ClassName(mockDependency);
  });

  describe('methodName - happy path', () => {
    it('should successfully perform action', async () => {
      // Arrange
      vi.mocked(mockDependency.method).mockResolvedValue(expectedValue);

      // Act
      const result = await instance.methodName(input);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockDependency.method).toHaveBeenCalledWith(expectedArgs);
    });
  });

  describe('methodName - validation errors', () => {
    it('should throw ValidationException for invalid input', async () => {
      // Arrange
      const invalidInput = /* ... */;

      // Act & Assert
      await expect(instance.methodName(invalidInput)).rejects.toThrow(
        ValidationException
      );
    });
  });

  describe('methodName - edge cases', () => {
    it('should handle null value', async () => {
      // Test null handling
    });
  });

  describe('methodName - error handling', () => {
    it('should handle errors gracefully', async () => {
      // Test error handling
    });
  });
});
```

### Test Naming Conventions

- Use descriptive test names that explain what is being tested
- Use `describe` blocks to group related tests
- Use nested `describe` blocks for different scenarios (happy path, errors, edge cases)
- Test names should read like sentences: "should [expected behavior] when [condition]"

**Examples**:

- `it('should register a new user', ...)`
- `it('should throw ValidationException when email already exists', ...)`
- `it('should return 404 when user not found', ...)`

### Arrange-Act-Assert Pattern

Follow the AAA (Arrange-Act-Assert) pattern:

1. **Arrange**: Set up test data, mocks, and preconditions
2. **Act**: Execute the code being tested
3. **Assert**: Verify the results and side effects

```typescript
it('should register a new user', async () => {
  // Arrange
  vi.mocked(mockUserRepository.emailExists).mockResolvedValue(false);
  const command = { email: 'test@example.com', password: 'ValidPass123!' };

  // Act
  const result = await handler.execute(command);

  // Assert
  expect(result.id).toBeDefined();
  expect(mockUserRepository.save).toHaveBeenCalled();
});
```

### Testing Command Handlers

Command handlers should test:

- Happy path (successful execution)
- Validation errors (invalid input, business rule violations)
- Authorization errors (unauthorized access)
- Error handling (exception propagation)

```typescript
describe('RegisterCommandHandler', () => {
  describe('execute - happy path', () => {
    it('should register a new user with email and password', async () => {
      // Test successful registration
    });
  });

  describe('execute - validation errors', () => {
    it('should throw ValidationException when email already exists', async () => {
      // Test email uniqueness validation
    });

    it('should throw ValidationException when password is too weak', async () => {
      // Test password validation
    });
  });

  describe('execute - authorization errors', () => {
    it('should throw AuthorizationException when user is not authenticated', async () => {
      // Test authorization
    });
  });
});
```

### Testing Query Handlers

Query handlers should test:

- Happy path (successful data retrieval)
- Not found errors (resource doesn't exist)
- Authorization errors (unauthorized access)
- Pagination and filtering

```typescript
describe('GetUserQueryHandler', () => {
  describe('execute - happy path', () => {
    it('should return user when found', async () => {
      // Test successful retrieval
    });
  });

  describe('execute - not found', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      // Test not found scenario
    });
  });

  describe('execute - authorization', () => {
    it('should throw AuthorizationException when user is not authorized', async () => {
      // Test authorization
    });
  });
});
```

### Testing Domain Aggregates

Domain aggregates should test:

- Creation (factory methods, constructors)
- Business logic (state changes, invariants)
- Validation (business rules, constraints)
- Event registration (domain events)

```typescript
describe('User', () => {
  describe('create', () => {
    it('should create a user with all fields', () => {
      // Test user creation
    });
  });

  describe('markForDeletion', () => {
    it('should mark user as deleted', () => {
      // Test state change
    });

    it('should throw ValidationException when user is already deleted', () => {
      // Test business rule validation
    });
  });
});
```

### Testing Value Objects

Value objects should test:

- Validation (format, length, pattern)
- Immutability
- Equality
- Edge cases (null, undefined, empty values)

```typescript
describe('Email', () => {
  describe('create', () => {
    it('should create email from valid string', () => {
      // Test valid email
    });

    it('should throw ValidationException for invalid email format', () => {
      // Test validation
    });

    it('should throw ValidationException for empty email', () => {
      // Test edge case
    });
  });
});
```

### Testing Branches

**CRITICAL**: All branches must be tested, including:

1. **Nullish Coalescing (`??`)**:

```typescript
const value = input ?? defaultValue;

// Test both branches:
it('should use input when not null', () => {
  const result = getValue('input');
  expect(result).toBe('input');
});

it('should use default when input is null', () => {
  const result = getValue(null);
  expect(result).toBe('default');
});
```

2. **Ternary Operators (`? :`)**:

```typescript
const status = isActive ? 'active' : 'inactive';

// Test both branches:
it('should return active when isActive is true', () => {
  expect(getStatus(true)).toBe('active');
});

it('should return inactive when isActive is false', () => {
  expect(getStatus(false)).toBe('inactive');
});
```

3. **Optional Chaining (`?.`)**:

```typescript
const value = obj?.property?.nested;

// Test both branches:
it('should return value when property exists', () => {
  const obj = { property: { nested: 'value' } };
  expect(getValue(obj)).toBe('value');
});

it('should return undefined when property does not exist', () => {
  const obj = {};
  expect(getValue(obj)).toBeUndefined();
});
```

4. **Logical Operators (`&&`, `||`)**:

```typescript
const result = condition && action();

// Test short-circuit behavior:
it('should execute action when condition is true', () => {
  // Test true branch
});

it('should not execute action when condition is false', () => {
  // Test false branch (short-circuit)
});
```

### Using Type Assertions in Tests

When testing null/undefined values that TypeScript types don't allow, use type assertions:

```typescript
it('should handle null value', () => {
  const result = functionUnderTest(null as any);
  expect(result).toBe(expectedValue);
});
```

**Note**: Only use type assertions in test files, never in production code.

## Test Utilities and Helpers

### Test Helpers (`test-helpers.ts`)

The `src/__tests__/test-utils/test-helpers.ts` file provides utility functions:

- `createTestApp()`: Creates a minimal Fastify instance for testing
- `createMockFastifyLogger()`: Creates a mock Fastify logger
- `createMockLogger()`: Creates a mock Logger interface
- `wait(ms)`: Waits for a specified amount of time (useful for async testing)
- `createMockRequest()`: Creates a mock request object
- `isValidJson(str)`: Checks if a string is valid JSON
- `extractErrorMessage(response)`: Extracts error message from response

### Test Fixtures (`test-fixtures.ts`)

The `src/__tests__/test-utils/test-fixtures.ts` file provides test data:

- `testFixtures.users`: Sample user data for testing
- `testFixtures.uuids`: Predefined UUIDs for testing
- `testFixtures.errorResponses`: Expected error response structures
- `createTestRequestOptions()`: Creates test request options
- `expectSuccessResponse()`: Asserts successful response structure

### Using Test Utilities

```typescript
import { testFixtures } from '@app/__tests__/test-utils/test-fixtures';
import {
  createMockLogger,
  createTestApp,
} from '@app/__tests__/test-utils/test-helpers';

describe('MyTest', () => {
  it('should use test helpers', () => {
    const app = createTestApp();
    const logger = createMockLogger();
    const userId = testFixtures.uuids.user123;
    // ...
  });
});
```

## Running Tests

### Test Commands

The project provides several npm scripts for running tests:

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with UI (interactive test runner)
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only E2E tests
npm run test:e2e

# Run full validation (type check, lint, format, tests with coverage)
npm run validate
```

### Test Output

When running tests, you'll see:

- **Test results**: Pass/fail status for each test
- **Coverage report**: Coverage percentages for lines, functions, branches, statements
- **Coverage details**: Uncovered lines and branches (if coverage < 100%)
- **Test duration**: Time taken for each test and total test suite

### Coverage Report

After running `npm run test:coverage`, you'll get:

1. **Console output**: Summary of coverage percentages
2. **HTML report**: Detailed coverage report in `coverage/` directory (open `coverage/index.html`)
3. **LCOV report**: Machine-readable coverage data in `coverage/lcov.info`

### Viewing Coverage Report

1. Run `npm run test:coverage`
2. Open `coverage/index.html` in a browser
3. Navigate through files to see covered/uncovered lines
4. Identify missing coverage and add tests

## Best Practices

### 1. Write Tests Immediately

- Write tests immediately after writing production code
- Don't defer test writing - it's harder to test code you've already moved on from
- Tests help catch bugs early and document expected behavior

### 2. Test Behavior, Not Implementation

- Test what the code does, not how it does it
- Focus on inputs, outputs, and side effects
- Avoid testing internal implementation details

### 3. Keep Tests Independent

- Each test should be independent and not rely on other tests
- Use `beforeEach` to set up fresh state for each test
- Clean up resources in `afterEach` if needed

### 4. Use Descriptive Test Names

- Test names should clearly describe what is being tested
- Use `describe` blocks to group related tests
- Test names should read like documentation

### 5. Follow AAA Pattern

- Always follow Arrange-Act-Assert pattern
- Keep arrange section focused on test setup
- Keep act section to a single action
- Keep assert section focused on verification

### 6. Test Edge Cases

- Test null, undefined, empty values
- Test boundary conditions (min, max, zero)
- Test invalid inputs
- Test error conditions

### 7. Mock External Dependencies

- Mock all external dependencies (database, APIs, file system)
- Use `vi.fn()` for function mocks
- Use `vi.mock()` for module mocks
- Verify mock calls in assertions

### 8. Test All Branches

- Test all if/else branches
- Test all switch cases
- Test ternary operators (both branches)
- Test nullish coalescing (both branches)
- Test optional chaining (both branches)

### 9. Keep Tests Fast

- Unit tests should run in milliseconds
- Avoid slow operations in unit tests (use mocks)
- E2E tests may be slower but should still be reasonable

### 10. Maintain Test Coverage

- Always run `npm run validate` before committing
- Fix coverage gaps immediately
- Don't skip tests to meet deadlines - tests are part of the code

### 11. Use Test Fixtures

- Use test fixtures for consistent test data
- Don't hardcode test data in every test
- Keep fixtures in `test-fixtures.ts`

### 12. Clean Up After Tests

- Close app instances in E2E tests
- Clear mocks in `beforeEach` or `afterEach`

### 13. Test Error Handling

- Test that errors are thrown correctly
- Test error messages and codes
- Test error propagation

### 14. Test Authorization

- Test that unauthorized users are rejected
- Test that authorized users can access resources
- Test role-based access control

### 15. Document Complex Tests

- Add comments for complex test scenarios
- Explain why a test exists if it's not obvious
- Document non-obvious test setup

## Summary

This testing guide provides comprehensive instructions for testing this API project. Key takeaways:

1. **100% coverage is mandatory** - All code must achieve 100% coverage for lines, functions, branches, and statements
2. **Two test types** - Unit tests (fast, isolated), E2E tests (HTTP flows)
3. **Test organization** - Tests mirror source structure in `src/__tests__/`
4. **Test patterns** - Follow AAA pattern, use descriptive names, test all branches
5. **Test utilities** - Use helpers and fixtures for consistent test setup
6. **Run validation** - Always run `npm run validate` before committing

For more information, refer to:

- [Development Guide](./development-guide.md) - Step-by-step guide for creating features
- [Architecture Guide](./architecture.md) - Architecture patterns and principles
- [README.md](../README.md) - Project overview and getting started
