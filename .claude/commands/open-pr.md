---
description: Commit, push, and create a pull request with scoped commits
argument-hint: [pr title]
disable-model-invocation: true
allowed-tools: Bash(git:*), Bash(gh:*)
---

# Open Pull Request

Create PR: $ARGUMENTS

## Process

### 1. Pre-flight
```bash
git status
git log --oneline main..HEAD
git diff main...HEAD --stat
```

### 2. Commit Changes
If there are uncommitted changes, use scoped commits:
```bash
git add -A
git commit -m "<type>(<scope>): <description>"
```
Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`
Scopes: `backend`, `frontend`, `api`

### 3. Push Branch
```bash
git push -u origin HEAD
```

### 4. Create PR
```bash
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
- [Main change 1]
- [Main change 2]

## Test Plan
- [ ] Backend: [How to verify]
- [ ] Frontend: [How to verify]

## Notes
[Any deployment, migration, or API contract notes]
EOF
)"
```

Return the PR URL.
