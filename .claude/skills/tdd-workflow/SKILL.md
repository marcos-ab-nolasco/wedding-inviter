---
name: tdd-workflow
description: TDD workflow for both Python (pytest) and TypeScript (vitest/jest).
user-invocable: false
---

# TDD Workflow (RED-GREEN-REFACTOR-CONNECT)

## Phase 1: RED (Write Failing Tests)
- **Python**: Create `tests/test_{feature}.py`, run `pytest tests/test_{feature}.py -v`
- **TypeScript**: Create `__tests__/{feature}.test.ts`, run `npx vitest run __tests__/{feature}.test.ts`
- Write unit + integration + edge case tests, confirm they fail

## Phase 2: GREEN (Make Tests Pass)
- Implement minimal code — don't over-engineer
- Run tests, repeat until all pass

## Phase 3: REFACTOR (Improve Quality)
- Remove duplication, improve naming, refine types
- Run tests after each change
- **Python**: `ruff check . && mypy .`
- **TypeScript**: `npx tsc --noEmit && npx eslint .`

## Phase 4: CONNECT (Verify Integration)
- Verify existing code calls new feature correctly
- Add E2E tests for full user flow
- Run full test suite

## Test Execution Strategy
- **RED/GREEN**: Run only new test file (fast feedback)
- **REFACTOR**: New file + directly related tests
- **CONNECT**: Full suite to catch integration issues

## Pytest Commands
- Specific: `pytest tests/test_file.py::test_name -v`
- Coverage: `pytest --cov=src/module`
- Failed only: `pytest --lf` | Stop first: `pytest -x`

## Vitest/Jest Commands
- Specific: `npx vitest run __tests__/file.test.ts`
- Coverage: `npx vitest --coverage`
- Watch: `npx vitest --watch`
