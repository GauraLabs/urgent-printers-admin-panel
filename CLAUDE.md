@AGENTS.md

# Urgent Printers — Admin Panel

Production admin panel for an online printing business. Standalone Next.js 16 app that talks to a FastAPI backend.

## Project status
All 15 UI build steps are complete. Currently in **Step 15 — wiring to real backend**.
- Wired: auth, staff management, activity log, permissions catalog
- Pending: orders, products, customers, payments, coupons, content, shipping, reviews, communications (wire as backend ships each endpoint)

## Stack
- Next.js 16.2.4 · React 19 · TypeScript strict
- Tailwind CSS v4 · shadcn 4.x with **Base UI** (not Radix)
- TanStack Query v5 · TanStack Table v8
- Zustand v5 (persist) · React Hook Form · Zod v4
- Motion (motion/react) · Recharts · Sonner

## Directory structure
```
src/
  app/          — Next.js App Router (route segments)
  features/     — feature modules (orders/, staff/, products/, ...)
  components/   — shared UI (layout/, common/, ui/)
  hooks/        — shared hooks
  lib/
    api/        — all backend calls go here (client.ts + per-domain files)
    utils/      — helpers
    constants/  — roles, labels
  store/        — Zustand stores (authStore, sidebarStore)
  types/        — TypeScript types (index.ts + domain files)
```

## Auth
- Access token lives in memory only (Zustand, NOT in localStorage)
- `user` + `isAuthenticated` are persisted to localStorage via Zustand persist
- `_hasHydrated` flag in authStore — **AuthGuard and AuthLayout both wait for this** before acting (prevents page-reload race condition where localStorage hasn't loaded yet)
- 401 → refresh → retry is handled in `src/lib/api/client.ts` interceptor; auth endpoints are excluded from retry

## API conventions
- Base URL: `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`)
- All calls go through `src/lib/api/client.ts` (`get`, `post`, `patch`, `del` helpers)
- Response envelope `{ data: T, message: string }` — client unwraps to `T`
- Errors: backend sends `{ detail }` or `{ message }` — both are mapped to `ApiError`
- Pagination: `{ items, total, offset, limit }`
- Numeric IDs from backend → normalised to strings at API boundary

## RBAC
- 6 roles; each user can have per-role grant/revoke overrides
- Permission catalog is fetched once per session: `GET /admin/permissions` → `useRoleCatalogue()`
- `getEffectivePermissions(user)` in `src/lib/utils/permissions.ts` — trusts backend's `user.permissions` when non-empty

## Critical Tailwind v4 pattern
```css
/* WRONG — @theme inline does not emit CSS variables */
@theme inline { --color-primary: var(--some-var); }

/* CORRECT — Tailwind writes --color-primary to :root AND generates bg-primary etc. */
@theme { --color-primary: oklch(0.38 0.16 271); }
.dark { --color-primary: oklch(0.55 0.18 271); }
```

## shadcn 4.x / Base UI gotchas
- No `asChild` on Trigger components — style them directly with `className`
- Button has no `asChild` — use raw `<Link>` with button classes, or a `<button>` wrapping `<Link>`
- Select `onValueChange` types value as `string | null` — coerce with `?? ''`
- Dark mode requires `@custom-variant dark (&:is(.dark *))` in globals.css — NOT media query

## Working rules
- Frontend-only role. If a backend change is needed, describe what endpoint/payload is required; don't touch backend files.
- Wire mock → real by editing only `src/lib/api/<domain>.ts`. Function signatures stay the same.
- No comments unless the WHY is non-obvious. No trailing summaries in responses.
