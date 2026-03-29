---
name: writing
description: Clear writing standards for commits, PRs, docs, and error messages.
---

# Writing Standards

Based on Zinsser's "On Writing Well".

## Core Principles
- **Clarity**: One idea per sentence, <25 words, active voice
- **Brevity**: Every word earns its place, cut clutter
- **Simplicity**: Simple over complex, concrete over abstract

## Patterns

### Commit Messages
`<verb> <what>` — Add user auth / Fix payment validation / Refactor queries
Never: "Fixed stuff", "Updates", "Claude Code"

### PR Descriptions
Summary (one sentence) → Why (one paragraph) → Testing (how to verify)

### Error Messages
`<What happened>. <What to do>.` — `User not found. Check the email.`

### Documentation
1. What it does  2. Why it exists  3. How to use it  4. Examples (if needed)

## Avoid
Passive voice, redundant words ("in order to" → "to"), jargon, hedging ("might"), long paragraphs (>5 sentences)

## Test
Can you cut 30%? Is every word necessary? Would you say this to a friend?
