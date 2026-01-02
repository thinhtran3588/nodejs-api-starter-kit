# Mocks Directory

This directory contains mock implementations for external dependencies.

## Usage

Mocks are used to:

- Isolate unit tests from external dependencies
- Simulate external service responses
- Test error scenarios
- Speed up test execution

## Examples

### Mocking External APIs

```typescript
// __mocks__/externalApi.ts
export const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
};
```

### Mocking Database

```typescript
// __mocks__/database.ts
export const mockDatabase = {
  query: vi.fn(),
  connect: vi.fn(),
};
```

## Best Practices

1. Keep mocks simple and focused
2. Reset mocks between tests
3. Use TypeScript types for mock implementations
4. Document mock behavior in comments
