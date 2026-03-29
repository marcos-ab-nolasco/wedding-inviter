---
name: react-nextjs
description: React 19 and Next.js App Router patterns.
user-invocable: false
---

# React 19 / Next.js Standards

## React 19
- Use `use`, `useTransition`, `startTransition`, promises as props
- Prefer these over `useEffect` — you probably don't need `useEffect`
- Server Components by default, `'use client'` only when necessary

## Component Design
- Keep components pure: no constants or functions declared inside
- React Query for client-side async data fetching (never in `useEffect`)
- Server Actions for mutations

## Loading & Error States
- `<Suspense>` + `useSuspenseQuery` over `isLoading` patterns
- Error boundaries with retry button

## Cache Management
- Enums/factories for cache keys — no magic strings
- Use React Query cache strings via enum

## Next.js App Router
- Server Components for data fetching and static content
- `'use client'` only for interactivity (state, effects, browser APIs)
- Route handlers for API endpoints
- Server Actions for form submissions and mutations

## Avoid
- Data fetching in `useEffect`
- Constants inside component bodies
- `isLoading` patterns when Suspense works
- Magic numbers/strings
