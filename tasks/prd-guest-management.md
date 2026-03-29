# PRD: Guest Management (MVP)

## Introduction

Wedding Inviter is a fullstack app (FastAPI + Next.js) for Marcos and Amanda to manage their wedding guest list (November 1st, 2026 — Casa Maciço, Florianópolis – SC). The MVP focuses on CRUD operations for guests, capturing contextual data (closeness, memories, tone) that a future AI agent will use to generate personalized WhatsApp invitation messages.

Auth, User, and Wedding models are already in production. This PRD covers the guest data layer and UI needed before the AI messaging feature can be built.

## Goals

- Store guest data with all fields needed for future AI-personalized invitations
- Allow both partners (linked to the same Wedding) to manage guests via authenticated API
- Provide a clean UI for viewing, adding, editing, and deleting guests
- Enforce data isolation: users only see guests from their own wedding

## User Stories

### US-001: Guest model and migration (backend)

**Description:** As a developer, I need a `guests` table in the database with all fields required for the AI agent to generate personalized messages.

**Acceptance Criteria:**

- [ ] `Guest` SQLAlchemy model created with all fields listed below:
  - `id` (UUID, PK)
  - `wedding_id` (UUID, FK → `weddings`, NOT NULL)
  - `name` (String, NOT NULL)
  - `nickname` (String, nullable)
  - `relationship_type` (String, nullable) — e.g. tio, prima, colega
  - `friendship_level` (String, nullable) — e.g. amigo próximo, conhecido
  - `intimacy` (String, nullable) — alta / média / baixa
  - `contact_frequency` (String, nullable) — frequente / esporádico / raro / perdemos contato
  - `last_contact_medium` (String, nullable) — WhatsApp / Instagram / pessoalmente / telefone
  - `city` (String, nullable)
  - `state` (String, nullable)
  - `is_distant` (Boolean, default False)
  - `memory` (Text, nullable) — memorable shared memory
  - `shared_element` (Text, nullable) — humor, hobby, shared story
  - `ideal_tone` (String, nullable) — descontraído / carinhoso / respeitoso-formal / brincalhão
  - `notes` (Text, nullable) — extra observations
  - `invite_status` (String, default "pending") — pending / sent
  - `response_status` (String, default "pending") — pending / confirmed / absent / uncertain
  - `created_at`, `updated_at` (datetime with timezone)
- [ ] FK relationship to `Wedding` model established
- [ ] Alembic migration generated and applies cleanly
- [ ] `mypy src` passes

### US-002: Guest CRUD API (backend)

**Description:** As an authenticated user, I can create, list, update, and delete guests belonging to my wedding via the API.

**Acceptance Criteria:**

- [ ] `POST /guests` — creates a guest linked to the authenticated user's `wedding_id`
- [ ] `GET /guests` — returns all guests for the authenticated user's `wedding_id`
- [ ] `PATCH /guests/{guest_id}` — updates any subset of guest fields (partial body)
- [ ] `DELETE /guests/{guest_id}` — deletes the guest
- [ ] All endpoints require Bearer token authentication (`get_current_user` dependency)
- [ ] User can only access guests where `guest.wedding_id == user.wedding_id`
- [ ] Accessing a guest from another wedding returns 404 (not 403, to avoid leaking existence)
- [ ] Pydantic schemas created: `GuestCreate`, `GuestRead`, `GuestUpdate` (all fields optional except `name` on create)
- [ ] `GuestList` response schema wraps the list of `GuestRead`
- [ ] `mypy src` passes
- [ ] Behavior covered by automated tests (happy path + authorization boundary)

### US-003: Guest list page (frontend)

**Description:** As a user, I can see all my wedding guests in a table at `/dashboard/guests` with essential info and status badges.

**Acceptance Criteria:**

- [ ] New page at `/dashboard/guests` (App Router)
- [ ] Table/list displays columns: Name, City/State, Intimacy, Invite Status, Response Status
- [ ] Colored badges for status fields:
  - Invite: "Pendente" (yellow), "Enviado" (green)
  - Response: "Pendente" (yellow), "Confirmado" (green), "Ausente" (red), "Incerto" (orange)
- [ ] "Adicionar convidado" button opens the add guest modal (US-004)
- [ ] Each row has edit and delete action buttons
- [ ] Delete button shows confirmation dialog with guest name before proceeding
- [ ] Empty state with call-to-action when no guests exist
- [ ] "Convidados" link added to the dashboard navigation
- [ ] Data fetched via `api-client.ts` (openapi-fetch), typed from `types/api.ts`
- [ ] `tsc --noEmit` passes
- [ ] Verify in browser using dev-browser skill

### US-004: Add/Edit guest form (frontend)

**Description:** As a user, I can add a new guest or edit an existing one through a modal form with all guest fields organized into sections.

**Acceptance Criteria:**

- [ ] Modal dialog opens for both "add" and "edit" flows
- [ ] Form fields grouped into sections:
  - **Dados pessoais:** name, nickname, relationship_type, city, state, is_distant
  - **Contexto para IA:** friendship_level, intimacy, contact_frequency, last_contact_medium, ideal_tone, memory, shared_element
  - **Status e observações:** invite_status, response_status, notes
- [ ] Select/dropdown inputs for: intimacy, contact_frequency, last_contact_medium, ideal_tone, invite_status, response_status
- [ ] Text inputs for: name, nickname, relationship_type, city, state
- [ ] Textarea inputs for: memory, shared_element, notes
- [ ] Checkbox for: is_distant
- [ ] Client-side validation: `name` is required
- [ ] On save (create or update): modal closes and guest list refreshes
- [ ] Edit mode: form pre-filled with existing guest data
- [ ] API calls via `api-client.ts`, typed from `types/api.ts`
- [ ] `tsc --noEmit` passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: The system must store guests in a `guests` table with UUID primary key and FK to `weddings`
- FR-2: The system must enforce that all guest CRUD operations require a valid JWT Bearer token
- FR-3: The system must scope all guest queries to the authenticated user's `wedding_id`
- FR-4: The system must return 404 when a user attempts to access a guest from a different wedding
- FR-5: The `POST /guests` endpoint must require `name` and auto-assign `wedding_id` from the authenticated user
- FR-6: The `PATCH /guests/{guest_id}` endpoint must accept partial updates (any subset of fields)
- FR-7: The frontend must regenerate API types via `make generate-types` after the backend API is complete
- FR-8: The guest list page must display status badges with color coding for quick scanning
- FR-9: The add/edit modal must organize fields into three logical sections: personal data, AI context, and status
- FR-10: The delete flow must show a confirmation dialog displaying the guest's name before executing

## Non-Goals (Out of Scope)

- AI message generation (next feature, depends on this MVP)
- Guest list import/export (CSV, Excel, etc.)
- Search or filtering within the guest list
- Column sorting
- Pagination (simple list is acceptable for MVP guest counts)
- Actual WhatsApp message sending
- Bulk operations (bulk delete, bulk status update)
- Guest photos or avatars
- Guest grouping or tagging beyond the existing fields

## Design Considerations

- Reuse existing dashboard layout and navigation patterns from `/dashboard`
- Modal pattern for add/edit keeps the user in context of the list
- Badge colors should follow an intuitive traffic-light convention (green = positive, yellow = pending, red = negative)
- Form sections with clear headings reduce cognitive load for 17+ fields
- The "AI context" section label helps users understand why those fields exist

## Technical Considerations

- Follow the existing auth pattern: `get_current_user` FastAPI dependency extracts `wedding_id`
- Frontend API client is `api-client.ts` using openapi-fetch — no raw `fetch` calls
- Types generated from OpenAPI spec via `make generate-types` after backend endpoints are ready
- SQLAlchemy 2.0 async style with asyncpg for database operations
- Alembic migration generated via `make docker-migrate-create MESSAGE="add guests table"`
- Guest model should follow the same patterns as the existing `User` and `Wedding` models

## Success Metrics

- Both partners can independently add, view, edit, and delete guests
- Guest data includes all fields needed for the future AI personalization feature
- No data leaks between weddings (authorization boundary holds)
- All type checks pass (`mypy src` for backend, `tsc --noEmit` for frontend)

## Open Questions

- Should `friendship_level`, `intimacy`, `ideal_tone`, etc. be free-text strings or constrained enums in the database? (Free-text is more flexible for MVP; enums can be added later if needed)
- Will the guest count per wedding ever exceed a few hundred? (Affects whether pagination needs to be prioritized post-MVP)
