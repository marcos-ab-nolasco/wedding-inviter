---
name: typescript
description: TypeScript standards for type-safe, maintainable code.
user-invocable: false
---

# TypeScript Standards

## Type Safety
- Strict TypeScript, never `any`, almost never `as`
- E2E type-safety (API → DB → UI), let compiler infer when possible
- Query builders instead of raw SQL

## Code Structure
- Named exports only (no default exports unless required)
- No index files for re-exports
- `await/async` over `.then()`
- Types over interfaces, keep types close to usage
- Unused vars: prefix `_`

## Naming & Style
- `SNAKE_CAPS` constants, `camelCase` functions, `kebab-case` files
- Descriptive names, no abbreviations
- Early return over if-else, hash-maps over switch
- Flat code, string literals over concatenation

## Avoid
- Redundant names: `users` not `userList`
- Suffixes: Manager, Helper, Service (unless essential)
- Magic strings/numbers — extract to named constants or enums

## Tooling
- Pre-commit hooks for lint/dead code removal
