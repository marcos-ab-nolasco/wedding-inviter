## Project Structure
Fullstack monolith: Python/FastAPI backend + Next.js/TypeScript frontend.
- Backend and frontend live in separate root-level directories
  (e.g., `backend/` + `frontend/`, or `projectX_backend/` + `projectX_frontend/`)
- Tasks are usually isolated to one end
- When working on one end, READ the other end's API contracts for alignment

## Git Workflow
- Conventional commits with scope: feat(backend):, feat(frontend):, feat(api):
- Subjects: max 72 chars, imperative mood
- No "Claude Code" in messages

## Principles
- E2E type-safety across the full stack
- Observability and error monitoring
- Automated tests (behavior, not implementation)
- Readability over cleverness

## Skills
### Shared
- `software-engineering`, `reviewing-code`, `writing`, `tdd-workflow`

### Backend (Python/FastAPI)
- `python-coding`, `fastapi-patterns`, `langchain-agentic`, `event-driven-arch`

### Frontend (Next.js/TypeScript)
- `typescript`, `react-nextjs`
