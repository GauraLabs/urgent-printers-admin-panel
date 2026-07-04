@AGENTS.md

# Urgent Printers — Admin Panel

Production admin panel for an online printing business. Standalone Next.js 16 app that talks to a FastAPI backend.

## Project status
All 15 UI build steps are complete. Currently in **Step 15 — wiring to real backend**.
- Wired: auth, staff, activity log, permissions catalog, categories, products
- Partially wired (orders): list page wired to real backend (getOrders); artwork proof workflow (Step 4A–4I) — ProofUploadDialog, OrderProofs panel, proof API functions, proof hooks; order item normaliser updated for AdminOrderItemDetail snake_case shape + new fields (category_name, artwork_type, artwork_filename, template_data); OrderItems.tsx rebuilt with category badge, spec pills, artwork section
- Partially wired (communications): WhatsApp templates wired — list, create (via Meta API), sync from Meta, message preview; notification templates and comm log still mock
- Pending: orders (detail page full wiring), customers, payments, coupons, content, shipping, reviews

## Stack
- Next.js 16.2.4 · React 19 · TypeScript strict
- Tailwind CSS v4 · shadcn 4.x with **Base UI** (not Radix)
- TanStack Query v5 · TanStack Table v8
- Zustand v5 (persist) · React Hook Form · Zod v4
- Tiptap v3 (rich text — `immediatelyRender: false`, uncontrolled via `defaultValue`)
- Motion (motion/react) · Recharts · Sonner · react-dropzone

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
- Button has no `asChild` — use raw `<Link>` with button classes. Always add `cursor-pointer` to button base styles.
- **DropdownMenuItem uses `onClick`, NOT `onSelect`** — `onSelect` is Radix-only and silently does nothing in Base UI
- Select `onValueChange` types value as `string | null` — coerce with `?? ''`
- Dark mode requires `@custom-variant dark (&:is(.dark *))` in globals.css — NOT media query

## Working rules
- Frontend-only role. If a backend change is needed, describe what endpoint/payload is required; don't touch backend files.
- Wire mock → real by editing only `src/lib/api/<domain>.ts`. Function signatures stay the same.
- No comments unless the WHY is non-obvious. No trailing summaries in responses.
