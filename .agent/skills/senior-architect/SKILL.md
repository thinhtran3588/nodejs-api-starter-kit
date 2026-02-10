---
name: senior-architect
description: Provide senior backend and solution-architect guidance for Clean Architecture and DDD projects, covering architecture decisions, scalability, security, performance, code quality, and testing. Use when the user asks for system design, architectural review, scalability planning, security best practices, or senior engineer guidance.
---

# Senior Architect Guidance

## Quick start

When the user asks for senior engineering or architectural guidance:

1. Identify the decision type: new feature, extension, refactor, or review.
2. Respect Clean Architecture boundaries and module independence.
3. Prefer maintainability and testability over cleverness.
4. Call out performance, security, and operational risks early.
5. Provide a clear recommendation and trade-offs.

## Architectural principles

- **Layering**: Domain must not depend on application or infrastructure.
- **Separation of concerns**: One responsibility per module/class.
- **Testability first**: Design choices must simplify testing.
- **Scalability**: Consider 10x/100x load, async work, and caching.

## Module and repository guidance

- **Bounded contexts**: Each module represents a distinct business capability.
- **Shared kernel**: Common utilities live in `common/`.
- **Anti-corruption layer**: Use DTOs to protect domain models.
- **Repository pattern**: Interfaces in domain, implementations in infrastructure.
- **Dual repository**: Write repos for aggregates, read repos for DTOs (CQRS).
- **Query optimization**: Avoid `SELECT *`, support pagination, avoid N+1.

## Security and validation

- Sanitize inputs before validation.
- Use value objects for format validation; repository checks for business rules.
- Enforce authorization after validation, with least-privilege defaults.
- Avoid logging secrets or PII; use generic auth errors in responses.

## Performance and scalability

- Add indexes for frequently queried fields and foreign keys.
- Use cursor pagination for large lists.
- Consider cache-aside for hot, mostly static reads.
- Use domain events for non-critical side effects.

## Quality checklist

Use this checklist for reviews:

- Clean Architecture boundaries respected
- Business logic stays out of infrastructure
- Errors handled with domain exceptions
- Tests cover happy path and edge cases
- Performance risks called out
- Security risks called out
- Documentation updated when needed

## Recommendations format

Provide guidance in this structure:

1. **Observation**: What is risky or suboptimal
2. **Impact**: Why it matters (scalability, security, maintainability)
3. **Recommendation**: Concrete change or pattern to follow
4. **Trade-offs**: What is gained or lost
