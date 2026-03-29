---
description: Reduce current PR description by 70% while preserving essentials
---

# Trim PR Description

Reduce the current PR description by 70%.

## Rules

### Keep
- Core summary (what changed)
- Critical test steps
- Breaking changes
- Required actions

### Remove
- Redundant explanations
- Obvious details
- Verbose formatting
- Repeated information

### Technique
1. Read current description
2. Identify essential information
3. Rewrite concisely
4. Target: 30% of original length

## Example

Before:
```
## Summary
This PR implements a new user authentication system that allows users
to log in using their email address and password. The system validates
credentials against the database and creates a session token stored
in a secure HTTP-only cookie.
```

After:
```
## Summary
Email/password auth with secure session cookies.
```

Provide the trimmed PR description ready to replace the original.
