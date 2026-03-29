---
description: Implement feature using TDD — auto-detects pytest or vitest
argument-hint: [feature description]
---

# TDD Feature Implementation

Implement using Test-Driven Development: $ARGUMENTS

## Ecosystem Detection
- If files involve `*backend*` or `*_backend*` directories: Python/FastAPI ecosystem
  → Use ruff, mypy, pytest
- If files involve `*frontend*` or `*_frontend*` directories: TypeScript/React ecosystem
  → Use tsc, eslint, vitest/jest
- If both: implement backend first, then frontend, verify API alignment

## Process

### RED Phase
- **Python**: Create `tests/test_{feature}.py`, run `pytest tests/test_{feature}.py -v`
- **TypeScript**: Create `__tests__/{feature}.test.ts`, run `npx vitest run __tests__/{feature}.test.ts`
- Write failing tests (unit + integration + edge cases)

### GREEN Phase
- Implement minimal code to pass tests
- Run tests, repeat until all pass

### REFACTOR Phase
- Clean up: remove duplication, improve naming, refine types
- **Python**: `ruff check . && mypy .`
- **TypeScript**: `npx tsc --noEmit && npx eslint .`

### CONNECT Phase
- Verify integration with existing code
- Add E2E tests for full user flow
- If cross-stack: verify API contracts match

## Final Checklist
- [ ] All tests passing
- [ ] Types complete (mypy + tsc)
- [ ] Linting clean (ruff + eslint)
- [ ] API contracts aligned (if cross-stack)
- [ ] Integration verified
