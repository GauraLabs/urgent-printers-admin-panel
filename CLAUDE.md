@AGENTS.md

# Urgent Printers — Admin Panel

Production admin panel for an online printing business. Standalone Next.js 16 app that talks to a FastAPI backend.

## Project status
All 15 UI build steps are complete. Currently in **Step 15 — wiring to real backend**.
- Wired: auth, staff, activity log, permissions catalog, categories, products
- Partially wired (orders): list page wired to real backend (getOrders); artwork proof workflow (Step 4A–4I) — ProofUploadDialog, OrderProofs panel, proof API functions, proof hooks; order item normaliser updated for AdminOrderItemDetail snake_case shape + new fields (category_name, artwork_type, artwork_filename, template_data, turnaround_extra_cost); OrderItems.tsx rebuilt with category badge, spec pills, artwork section, and a separate turnaround surcharge line so per-unit price × quantity + surcharge = total is self-explanatory
- Partially wired (printing queue): `getPrintingQueueAll` (all four tabs incl. `ready_to_dispatch`, sourced from real `GET /admin/orders?status=` × 4 + per-order `GET /admin/orders/{id}`), `startPrinting`, and `markReadyToDispatch` wired to real backend (`PATCH /admin/orders/{id}/status`). `getServiceabilityBulk` and `createShipmentsBulk` now call the real Shiprocket-backed endpoints (see Shipping below). `approveArtwork`/`requestReupload` remain mock — still no admin-facing endpoint for staff-side artwork approve/reject (only customer-token/WhatsApp-driven `resolve_approval`). See `src/lib/api/printingQueue.ts` comments.
- Wired (shipping): `getShipments` (`GET /admin/shipments`), `checkServiceability`/`getServiceabilityBulk` (`POST /admin/shipping/serviceability[/bulk]`), `createShipment`/`createShipmentsBulk` (`POST /admin/orders/{id}/shipment`, `POST /admin/shipments/bulk`, partial-failure tolerant). `Shipment` type renamed to match backend (`tracking_number`/`shipment_status`/`estimated_delivery_date`, `order_id` as row key, new `rto`/`cancelled` statuses). Courier rate is paise on the wire — converted to rupees in `src/lib/api/shipping.ts` before display. Couriers are now identified by `courier_id`, threaded through `BatchDispatchDialog`. Fixed a pre-existing bug in `orders.ts`'s address normaliser (`shippingAddress.pincode` → `.postal_code`, matching the backend field) that left `shipping_pincode` blank on printing-queue items. Manual courier fallback wired: `createManualShipment` (`POST /admin/orders/{id}/shipment/manual`, `shipping.manage`) via new `ManualShipmentDialog` (`src/features/shipping/components/`) — used from `OrderShipping.tsx` (order detail, shown when `shipping.courier` is empty and status is `ready_to_dispatch`) and as a per-row "Enter manually" escape hatch in `BatchDispatchDialog.tsx` when bulk serviceability errors for an order. `Shipment.shipment_source` (`'shiprocket' | 'manual' | null`) added and surfaced as a "Manual" badge in `ShipmentsTable.tsx`. Verified end-to-end in the browser: manual entry moves the order to `shipped`, populates the shipping card, and shows the Manual badge in the shipments list; existing Shiprocket bulk-dispatch happy path re-verified with no regressions.
- Partially wired (communications): WhatsApp templates wired — list, create (via Meta API), sync from Meta, message preview; notification templates and comm log still mock
- Wired (staff notification preferences, Phase 4): new page `/staff/notifications` (`src/app/(admin)/staff/notifications/page.tsx`) renders `StaffNotificationsMatrix` (`src/features/staff/components/`), a staff × channel (in_app/email/sms/push/whatsapp) grid for the `order.created` event, modelled on `RolePermissionsMatrix.tsx`'s table structure. `GET`/`PUT /admin/staff-notifications/preferences` wired via `src/lib/api/staffNotifications.ts` (`getStaffNotificationPreferences`, `upsertStaffNotificationPreference`); `useStaffNotificationPreferences`/`useToggleStaffNotificationPreference` in `src/features/staff/hooks/useStaffNotifications.ts` do optimistic toggle-with-rollback via TanStack Query `onMutate`/`onError`/`onSettled`. Adding a future event type is one entry in the `EVENT_TABS` array in `StaffNotificationsMatrix.tsx` — renders as a Tabs bar once there's more than one. SMS/WhatsApp switches are disabled (with an explanatory `title` tooltip) for staff without `phone_number` on file, matching the backend's `has_phone_number` flag and the 422 it returns otherwise; a note under the matrix links to the Staff page when any staff member lacks a phone. Gated behind `staff.manage` both in `SidebarNav.tsx` (nav item hidden) and inside `StaffNotificationsMatrix` itself (renders an "Access restricted" state instead of the table) via `usePermissions().canManageStaff`. Also added the previously-missing `phone_number` field to `StaffForm.tsx` (backend's `AdminStaffCreate`/`AdminStaffUpdate` already supported it) so there's actually somewhere to set it — `AdminUser`, `CreateStaffRequest`, `UpdateStaffRequest` types updated to match.
- Wired (dashboard + admin notifications bell): `src/lib/api/dashboard.ts` rewritten to call real `GET /admin/dashboard[, /revenue-chart, /recent-orders, /top-products, /order-status-breakdown]` — all money fields (`revenue_today`, `revenue_sparkline[]`, revenue-chart `value`, recent-orders `amount`, top-products `revenue`) arrive as Decimal-serialized JSON strings and are converted with `Number(...)` at the API boundary, same convention as `orders.ts`; `recent_orders`/`top_products` `id` (backend `int`) normalised to `string`. Hooks (`useDashboardStats.ts`) and components (`StatsRow`, `RevenueChart`, `OrderStatusBreakdown`, `RecentOrdersFeed`, `TopProducts`, `AlertsPanel`) needed no changes — shapes preserved. New bell-icon notification center: `src/lib/api/adminNotifications.ts` (`getAdminNotifications`/`markNotificationRead`/`markAllNotificationsRead`, wired to `GET/POST /admin/notifications[...]`, `id`/`admin_user_id` normalised to string), `src/features/notifications/hooks/useAdminNotifications.ts` (30s poll, optimistic mark-read via `onMutate`/`onError`/`onSettled`), `src/features/notifications/components/NotificationBell.tsx` (Base UI `DropdownMenu` off the bell in `AdminHeader.tsx`, unread badge, "mark all read", click-to-read + navigates to `ROUTES.ORDER_DETAIL` when `event_type` starts with `order.` and `data.order_id` is present). `AdminHeader.tsx`'s old alert-count bell (sourced from `stats.alerts`, a different concept — dashboard operational alerts, untouched, still feeds `AlertsPanel`) replaced entirely by `NotificationBell`. Note: Base UI's `Menu.GroupLabel` throws `MenuGroupRootContext is missing` outside a `<Menu.Group>` — don't use `DropdownMenuLabel` as a bare heading inside `DropdownMenuContent`, use a plain `<span>` instead. Verified end-to-end in the browser (Playwright + Chrome, logged in as the seeded super admin): dashboard renders real revenue/order/product/status-breakdown data (not the old `284500`/`Rahul Sharma` mock), bell shows correct unread badge count, dropdown lists a real notification with title/body/relative-time/unread dot, clicking it marks it read and navigates to `/orders/{id}`, "mark all read" and the empty state both confirmed.
- Pending: orders (detail page full wiring), customers, payments, coupons, content, reviews

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
