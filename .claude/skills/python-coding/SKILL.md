---
name: python-coding
description: Python standards — type safety, async, error handling, code organization.
user-invocable: false
---

# Python Coding Standards

## Type Safety (mypy strict)
- Full type hints on all functions, methods, class attributes
- No `Any` — use specific types, `Protocol`, or generics
- Pydantic models for data validation and serialization
- Type guards for runtime type narrowing

## Async/Await
- All I/O operations async (network, file, DB)
- `async with` for resource management
- Never use blocking calls in async code

## Error Handling
- Custom exception classes with context (user_id, request_id)
- Structured logging with context — no silent failures
- Handle or propagate, never suppress

## Code Organization
- Imports grouped: stdlib → third-party → local (ruff/isort)
- Functions < 50 lines, single responsibility
- Early returns to reduce nesting
- No magic values — extract to named constants

## Tooling
- `ruff` for linting and formatting
- `mypy --strict` for type checking
- `isort` for import ordering
