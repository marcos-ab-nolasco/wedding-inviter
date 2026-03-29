---
description: Plan and implement a new feature — auto-detects backend/frontend ecosystem
argument-hint: [feature description]
disable-model-invocation: true
---

# Create Feature

Implement: $ARGUMENTS

## Ecosystem Detection
- If files involve `*backend*` or `*_backend*` directories: Python/FastAPI ecosystem
  → Use ruff, mypy, pytest
- If files involve `*frontend*` or `*_frontend*` directories: TypeScript/React ecosystem
  → Use tsc, eslint, vitest/jest
- If both: implement backend first, then frontend, verify API alignment

## Workflow

### 1. Branch Creation
```bash
git checkout main && git pull
git checkout -b feat/<feature-name>
```

### 2. Planning Phase
- Analyze existing codebase patterns
- Identify integration points and API contracts
- Break into small, atomic tasks

### 3. Implementation
**Backend**: Apply `python-coding` + `fastapi-patterns` skills
**Frontend**: Apply `typescript` + `react-nextjs` skills
**Both**: Verify request/response types match across stack

### 4. Quality Checks
- [ ] Type-safe end-to-end (mypy + tsc)
- [ ] Error handling with monitoring
- [ ] Tests for behavior
- [ ] API contracts aligned (if cross-stack)

### 5. Stage Changes
```bash
git add -A
```

Leave all changes staged for review before commit.
