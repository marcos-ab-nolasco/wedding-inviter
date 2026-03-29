---
description: Review staged changes — auto-detects ecosystem + cross-stack check
allowed-tools: Bash(git:*)
---

# Review Staged Changes

Review all staged changes for quality and adherence to standards.

## Ecosystem Detection
- If files involve `*backend*` or `*_backend*` directories: Python/FastAPI ecosystem
  → Use ruff, mypy, pytest
- If files involve `*frontend*` or `*_frontend*` directories: TypeScript/React ecosystem
  → Use tsc, eslint, vitest/jest
- If both: check cross-stack alignment

## Process

### 1. Get Staged Changes
```bash
git diff --cached
```

### 2. Review Checklist

**Backend** (if applicable): Type hints, no `Any`, async I/O, custom exceptions, Pydantic, no raw SQL
**Frontend** (if applicable): No `any`, pure components, React Query, Suspense, semantic HTML
**Cross-Stack** (if both): Types match, error codes consistent, URL paths aligned, contracts synced

### 3. Output

```
## Summary
[Brief overview of changes]

## Issues Found
### Critical (must fix)
- [Issue + suggestion]

### Suggested (should fix)
- [Issue + suggestion]

## Approval
Ready to commit | Minor fixes needed | Needs changes
```
