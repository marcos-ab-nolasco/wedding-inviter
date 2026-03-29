---
name: software-engineering
description: Core engineering principles for quality, maintainable code.
user-invocable: false
---

# Software Engineering Standards

## Naming & Clarity
- Be concrete: `retryAfterMs` > `timeout`, `emailValidator` > `validator`
- Avoid vague terms: `data`, `item`, `list`, `component`, `info`
- Every character must earn its place

## Code Organization
- Keep code close to where it's used (unless used 2-3+ times)
- A folder with a single file should be a single file
- Comments are unnecessary 98% of the time — convert to functions/variables

## Error Handling
- Always provide user feedback on errors
- Log errors with observability tools (structured context)
- Use higher-order functions for monitoring/error handling/profiling

## Testing
- Test behavior, not implementation
- Write a test for each bug fixed
- 3rd person verbs (not "should"), organize with describe blocks

## Avoid
- Premature optimization
- Useless abstractions (wrappers that call one function, helpers used once)
- Over-engineering
