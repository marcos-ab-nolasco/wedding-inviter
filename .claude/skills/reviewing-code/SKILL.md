---
name: reviewing-code
description: Fullstack review — Python + TypeScript checklists + cross-stack alignment.
---

# Code Review Standards (Fullstack)

## Backend (Python)
- [ ] Full type hints (mypy strict), no `Any`, Pydantic models
- [ ] Async I/O, no blocking calls, custom exceptions with context
- [ ] ORM/query builders (no raw SQL), no exposed secrets

## Frontend (TypeScript)
- [ ] No `any`, minimal `as`, E2E type coverage
- [ ] Pure components, React Query, Suspense/Error boundaries
- [ ] Semantic HTML, ARIA labels, keyboard navigation

## Cross-Stack Alignment
- [ ] Request/response types match between frontend and backend
- [ ] Error codes handled consistently on both ends
- [ ] URL paths match between client calls and API routes
- [ ] Pagination/filter contracts aligned

## Shared
- [ ] No magic strings/numbers, tests behavior not implementation, bug fixes have tests

## Output Format
```
## Summary
[What changed]

## Issues
### Critical (blocks merge)
- [Issue]: [Fix]

### Suggested (improve quality)
- [Issue]: [Fix]

## Status
Approved | Minor changes | Needs work
```

## Priority
Critical (security, types, cross-stack misalignment) > High > Medium > Low
