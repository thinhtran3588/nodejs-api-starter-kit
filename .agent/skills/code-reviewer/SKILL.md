---
name: code-reviewer
description: Reviews code for correctness, security, maintainability, and convention compliance; checks test quality and coverage. Use when reviewing pull requests, examining diffs, or when the user asks for a code review, review my code, or spot bad code.
---

# Code Reviewer

Reviews code for bugs, convention violations, and test adequacy. Apply when the user requests a code review or when reviewing PRs/diffs.

## Quick start

1. **Scope**: Identify changed files and affected layers (domain, application, infrastructure, adapters).
2. **Bad code**: Check logic, edge cases, security, performance, and maintainability.
3. **Conventions**: Verify project and language conventions (imports, comments, objects, validation order).
4. **Tests**: Verify coverage, structure, and that tests assert behavior, not implementation.
5. **Feedback**: Use the severity format below and give concrete, actionable suggestions.

---

## Spotting bad code

### Logic and correctness

- **Wrong or missing edge cases**: Empty lists, null/undefined, empty strings, zero, negative numbers, max lengths, duplicates.
- **Off-by-one or wrong conditions**: Loop bounds, `<=` vs `<`, inclusive vs exclusive ranges.
- **Incorrect assumptions**: Assuming data is sorted, unique, or present without validation.
- **Race conditions**: Async operations without proper ordering; concurrent database writes without locking.
- **Missing error handling**: Unhandled promise rejections, missing try/catch for external calls.

### Security

- **Injection**: User input passed unsanitized to queries, HTML, or eval-like APIs (SQL, NoSQL, command injection).
- **Secrets**: Tokens, keys, or PII in logs, errors, or response bodies.
- **Auth/authorization**: Missing or wrong checks; trusting client for permissions or ownership.
- **Validation**: Relying only on client validation; missing or weak server-side validation.

### Performance

- **Unnecessary work**: API calls or heavy computation when input is invalid or unchanged (validate/skip before database).
- **N+1 or missing pagination**: Loading full lists or per-item queries instead of batched/cursor-based reads.
- **Heavy work on hot paths**: Expensive ops in frequently called handlers without caching or debounce.
- **Missing indexes**: Database queries on non-indexed columns for frequently accessed data.

### Maintainability and clarity

- **Giant functions/files**: Hard to test and reason about; suggest splitting by responsibility.
- **Deep nesting**: Replace with early returns, guard clauses, or small functions.
- **Unclear names**: Abbreviations, single letters (except idiomatic `i`, `e`), or names that don't reflect behavior.
- **Magic numbers/strings**: Use named constants or enums and document meaning if non-obvious.
- **Dead code**: Unused imports, variables, or branches; commented-out blocks (remove or explain in comment).
- **Copy-paste**: Repeated logic that should be a shared function or utility.

### Anti-patterns

- **Business logic in adapters**: Validation or domain rules in routes/controllers instead of domain/use-cases.
- **Infrastructure in domain**: Domain importing frameworks, DB, or HTTP; keep domain pure.
- **Tight coupling**: Handlers or services depending on concrete implementations instead of interfaces.
- **Leaky abstractions**: Exposing implementation details (e.g. Sequelize types) outside the repository layer.

---

## Coding conventions

Respect project rules (e.g. from `.cursor/rules/` and `docs/`). Check at least:

### Import type

- Use `import type { X } from '...'` when `X` is only used as a type.
- Use normal `import` for values (classes, functions, enums). Flag `import { Type }` when `Type` is only in type positions.

### Comments

- No comments that only repeat what the code does.
- Comments should explain **why** (business rule, workaround, non-obvious constraint), not **what**.

### Object creation

- No intermediate object variables used only once as a single argument; use inline objects.
- Allow intermediate variables when the object is reused, mutated before use, or improves readability for complex literals.

### Validation order

- **Create flows**: Local validation (value objects) first; only then call repository.
- **Update flows**: Local validation first; then check "any changes?"; skip repository when nothing changed.

### Architecture and structure

- Domain: aggregates, value objects, interfaces only; no framework or infra imports.
- Application: command/query handlers; depend on interfaces (repositories), not concrete implementations.
- Infrastructure: Sequelize models, repository implementations, service implementations.
- Adapters: routes, controllers, GraphQL schemas/resolvers; thin layer delegating to handlers.
- Naming: kebab-case for files; clear, consistent names for exports.

---

## Comprehensive tests

### Coverage

- **Target**: 100% line, function, branch, and statement coverage (configured in `vitest.config.ts`).
- New or modified code must have corresponding tests; flag untested branches and error paths.

### What to verify

- **Domain/value objects**: Valid and invalid inputs; boundary values; error messages.
- **Command handlers**: Happy path, validation failures, not-found, and permission/error propagation; mock repositories.
- **Query handlers**: Successful retrieval, not-found, authorization errors; mock read repositories.
- **Repositories/Services**: Contract and error mapping; use mocks in unit tests to avoid real I/O.
- **Routes/Controllers**: Request/response transformation; HTTP status codes; error responses.

### Test quality

- **Behavior over implementation**: Prefer testing outcomes; avoid asserting on internal state or private functions.
- **Isolation**: Mock external services and dependencies; no shared mutable state between tests.
- **Readability**: Descriptive test names (`it('does X when Y')`); arrange/act/assert; one logical assertion per test when practical.
- **Stability**: No flakiness from timers, randomness, or global state; use fake timers or controlled mocks when needed.

### Structure and location

- Tests under `src/__tests__/`, mirroring `src/` (e.g. `src/__tests__/unit/modules/auth/...`).
- Unit tests: `src/__tests__/unit/`; E2E tests: `src/__tests__/e2e/`.
- Naming: `*.test.ts`; match source name (e.g. `register.command-handler.test.ts`).

### Red flags

- Tests that only check "it doesn't throw" with no behavior assertions.
- Missing tests for error paths, empty states, or validation.
- Tests that depend on implementation details (e.g. internal method names or call counts without behavior).
- Tests that only pass because mocks are too loose (e.g. never asserting on call args or return values).

---

## Feedback format

Use this severity and structure so authors know what to fix first:

- **Critical**: Must fix before merge (bugs, security, broken tests, violation of architecture or mandatory conventions).
- **Suggestion**: Should fix or strongly consider (readability, performance, missing edge-case tests).
- **Nice to have**: Optional improvement (style, minor refactors, extra tests for already-covered behavior).

For each point:

1. **Where**: File and line or scope (e.g. "in `register.command-handler.ts`, when validation fails").
2. **What**: Concrete issue (e.g. "Repository is called even when payload is invalid").
3. **Why it matters**: One line on impact (correctness, security, performance, maintainability, or tests).
4. **Change**: Actionable fix (e.g. "Create value objects first; only call `repository.save` if validation succeeds").

---

## Review checklist (summary)

Before concluding the review, confirm:

- [ ] Logic and edge cases (empty, null, boundaries, async) are correct.
- [ ] No security issues (injection, secrets in logs, missing auth/validation).
- [ ] Performance is acceptable (no unnecessary calls, N+1, or heavy work on hot paths).
- [ ] Code follows project conventions (import type, comments, inline objects, validation order).
- [ ] Architecture boundaries are respected (domain pure, handlers use interfaces).
- [ ] Tests exist for new/changed code and cover success and failure paths.
- [ ] Tests are behavior-focused, isolated, and readable.
- [ ] Feedback is labeled by severity and includes location, issue, reason, and concrete fix.

For extended checklists and project-specific rules, see [reference.md](reference.md).
