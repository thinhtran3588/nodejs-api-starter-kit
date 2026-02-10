# Code Reviewer — Extended Reference

Use this when you need a deeper checklist or project-specific reminders. The main instructions are in [SKILL.md](SKILL.md).

## Extended bad-code checklist

### Logic

- [ ] All branches of conditionals are reachable and tested (including `else`, `default`, `??`, `?.`).
- [ ] Loops have correct termination and no infinite loops on edge input.
- [ ] Async code: no unhandled rejections; loading/error states handled correctly.
- [ ] Domain events: registered correctly and dispatched at the right time.
- [ ] Optimistic locking: version checked and incremented in update operations.

### Security (extra)

- [ ] No raw SQL with string concatenation; use parameterized queries or Sequelize methods.
- [ ] Auth errors do not leak whether an identifier exists (e.g. "Invalid credentials" vs "User not found").
- [ ] Sensitive operations require explicit authorization checks.
- [ ] Input sanitization applied before validation (e.g. trim, lowercase for emails).

### Performance (extra)

- [ ] Database queries use appropriate indexes and avoid full table scans.
- [ ] Pagination implemented for list endpoints (cursor-based or offset).
- [ ] Heavy operations consider caching or queuing via domain events.
- [ ] GraphQL resolvers avoid N+1 by batching or eager loading.

### Node.js / Fastify

- [ ] Route handlers delegate to controllers/handlers; no business logic in routes.
- [ ] Fastify schemas defined for request validation (body, params, querystring).
- [ ] Error handling uses domain exceptions mapped to HTTP status codes.
- [ ] Async handlers properly await all promises.

---

## Convention reminders (project)

- **Import type**: Every type-only import must use `import type`.
- **Comments**: Only for "why"; remove or refactor "what" comments.
- **Inline objects**: Single-use argument objects are created inline.
- **Validation**: Create = validate then repository; Update = validate then "has changes?" then repository.
- **Layers**: Domain (no framework/infra); handlers (interfaces only); models in `infrastructure/models/`.
- **DI**: Constructor injection via Awilix; register new types in `module-configuration.ts`.

---

## Test anti-patterns (avoid)

- Testing that a handler "executes" with no behavior assertion.
- Asserting on internal state (e.g. checking private properties).
- Testing implementation details (e.g. checking mock call count without verifying behavior).
- One huge test that does many actions and many assertions (hard to debug; split by behavior).
- Relying on real database or network in unit tests (use mocks).
- Missing tests for: validation errors, not-found cases, and authorization failures.
- Tests that only pass because mocks are too loose (e.g. never asserting on call args or return values).

---

## Test coverage reminders

- **Branches**: Every `if/else`, ternary, `&&`, `||`, `??`, `?.` path must be covered.
- **Error paths**: `catch` blocks, error states, and domain exceptions must have tests.
- **Boundaries**: Min/max length, zero, empty array, null/undefined as inputs.
- **Files**: New or modified production files should have a corresponding test file (or be covered by an existing test).

---

## Project test layout (this repo)

- Tests live under `src/__tests__/`, mirroring `src/` (e.g. `src/__tests__/unit/modules/auth/`).
- Naming: `*.test.ts`; match source name (e.g. `register.command-handler.test.ts`).
- Use Vitest with project setup from `src/__tests__/test-utils/`.
- Run: `npm test`, `npm run test:coverage`, `npm run validate` (includes coverage).

When in doubt, prefer the project's [testing-guide.md](../../../docs/testing-guide.md) and [architecture.md](../../../docs/architecture.md) for authoritative rules.
