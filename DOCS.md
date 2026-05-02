# Urgent Printers Admin Panel — Documentation

## Step 1 Complete: Project Setup

### What was built

**Framework & Config**
- Next.js 16.2.4 with React 19, TypeScript strict mode, App Router, `src/` directory, `@/*` import alias
- shadcn/ui with Base UI (not Radix UI — new default in shadcn 4.x)
- `.npmrc` with `legacy-peer-deps=true` to resolve Tremor peer dep conflicts

**Design System** (`src/app/globals.css`)
- Full CSS variable token system: background, surface, sidebar colors, semantic colors (success/warning/danger/info)
- Dark mode class via `next-themes` (`ThemeProvider` in providers.tsx)
- Inter font via `next/font/google` with `--font-inter` variable
- Custom scrollbar styling

**Providers** (`src/app/providers.tsx`)
- `QueryClientProvider` (TanStack Query v5) — staleTime 60s, retry 1, no refetchOnWindowFocus
- `ThemeProvider` from next-themes
- `react-hot-toast` Toaster — success auto-dismiss 4s, errors persist until manually dismissed

**TypeScript Types** (`src/types/`)
- `auth.ts` — `Role`, `Permission`, `AdminUser`, `AuthState`, `LoginRequest/Response`, `ActivityLog`
- `order.ts` — `OrderStatus`, `Order`, `OrderWithDetails`, `OrderItem`, `OrderFilters`
- `product.ts` — `Product`, `ProductSummary`, `ProductPricingTier`, `ProductTurnaroundOption`, etc.
- `customer.ts` — `Customer`, `CustomerWithDetails`, `CustomerActivity`
- `payment.ts` — `Payment`, `Refund`, `CreateRefundRequest`
- `coupon.ts` — `Coupon`, `CouponAnalytics`, `CreateCouponRequest`
- `report.ts` — `SalesReportData`, `OrdersReportData`, `CustomersReportData`, `OperationsReportData`, `DateRange`
- `index.ts` — `DashboardStats`, `SystemHealth`, `JobStatus`, `NotificationTemplate`, `Banner`, `Testimonial`, `Announcement`, `Faq`, `Review`, `Shipment`, `PaginatedResponse`, `ApiError`
- `staff.ts` — re-exports from auth + Staff-specific request types

**API Client** (`src/lib/api/client.ts`)
- Axios-based with JWT interceptor (reads from Zustand auth store)
- 401 handler: attempts token refresh once, then clears auth + redirects to /login
- Queue-based retry for concurrent 401s during token refresh
- Helper functions: `get`, `post`, `put`, `patch`, `del` — all typed generics

**Mock API Modules** (`src/lib/api/`)
All return realistic mock data with 300–800ms simulated delay:
- `dashboard.ts` — stats, revenue chart, recent orders, top products
- `orders.ts` — paginated list (247 orders), detail with full nesting, status updates
- `products.ts` — paginated list (38 products), full product detail, CRUD
- `categories.ts` — categories list, CRUD, reorder
- `customers.ts` — paginated list (1847 customers), detail, activity log
- `payments.ts` — paginated list (312 payments), refunds, create refund
- `coupons.ts` — list, detail, analytics, CRUD
- `content.ts` — banners, testimonials, announcement, FAQs — all CRUD
- `reviews.ts` — paginated list, status update, reply
- `shipping.ts` — shipments list, serviceability check, create shipment
- `communications.ts` — templates, log, send notification
- `reports.ts` — all 4 report types (sales/orders/customers/operations)
- `staff.ts` — staff list, CRUD, activity log
- `settings.ts` — general/operations/payment/notification settings
- `system.ts` — service health, job queue, error log

**Auth Store** (`src/store/authStore.ts`)
- Zustand with `persist` middleware
- Token stored in memory only (not persisted) — user/isAuthenticated persisted to localStorage under `up-admin-auth`
- Actions: `setAuth`, `setToken`, `logout`

**Utilities** (`src/lib/utils/`)
- `cn.ts` — clsx + tailwind-merge
- `formatPrice.ts` — INR currency formatter + number formatter
- `formatDate.ts` — date-fns wrappers: `formatDate`, `formatDateTime`, `formatTimeAgo`, `formatApiDate`
- `exportCsv.ts` — client-side CSV export
- `permissions.ts` — role→permissions map + `hasPermission` / `getPermissionsForRole`

**Constants** (`src/lib/constants/`)
- `routes.ts` — typed `ROUTES` object for all app routes
- `orderStatuses.ts` — labels and color variants for all 11 order statuses
- `roles.ts` — labels, colors, and full list for all 6 roles

**Hooks** (`src/hooks/`)
- `useDebounce.ts` — debounce any value by configurable delay
- `useMediaQuery.ts` — reactive window.matchMedia hook
- `usePermissions.ts` — reads role from auth store, exposes `can(permission)` + boolean convenience flags

**Common Components** (`src/components/common/`)
- `DataTable.tsx` — full TanStack Table v8 wrapper with server-side pagination/sorting, row selection, bulk actions, column visibility, loading skeleton, empty state
- `ConfirmDialog.tsx` — reusable destructive action dialog with danger/warning variants
- `StatusBadge.tsx` — `StatusBadge` (order-specific) + `Badge` (generic with variant)
- `SearchInput.tsx` — debounced search with clear button
- `ExportButton.tsx` — CSV export button wrapper
- `EmptyState.tsx` — centered empty state with icon, message, optional action
- `LoadingSkeleton.tsx` — `LoadingSkeleton`, `CardSkeleton`, `PageSkeleton`
- `ImageUpload.tsx` — react-dropzone with preview grid and remove button
- `RichTextEditor.tsx` — placeholder textarea-based editor (ready for Tiptap integration)
- `DateRangePicker.tsx` — Popover + Calendar dual-month date range picker

### How to run locally

```bash
cd urgent-printers-admin-panel
npm install
npm run dev    # http://localhost:3000
```

### Environment variables added

| Variable | Purpose | Required |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | FastAPI backend base URL | Yes |
| `NEXT_PUBLIC_APP_NAME` | App title | No |
| `NEXT_PUBLIC_APP_ENV` | Environment name | No |
| `NEXTAUTH_SECRET` | JWT secret (set in prod) | Yes (prod) |
| `NEXTAUTH_URL` | App URL for auth redirects | Yes (prod) |

### shadcn/ui notes

This project uses **shadcn 4.x with Base UI** (not Radix UI). Key differences:
- Trigger components (`DropdownMenuTrigger`, `PopoverTrigger`, `DialogTrigger`) do **not** accept `asChild` — style them directly or wrap with className
- All components import from `@base-ui/react/*` packages

### Mock API → real backend migration

When the FastAPI backend is ready:
1. Update `NEXT_PUBLIC_API_URL` in `.env.local` to point to real backend
2. Remove mock data from each `src/lib/api/*.ts` file and replace with real `get/post/put/patch/del` calls from `client.ts`
3. All function signatures stay identical — no component code changes required

### Known limitations at this step

- RichTextEditor is a styled textarea placeholder; Tiptap or similar should be integrated when needed
- ImageUpload previews use `URL.createObjectURL` — actual S3/CDN upload logic needs backend integration
- Tremor requires `--legacy-peer-deps` with React 19 (see `.npmrc`)

---

---

## Step 2 Complete: Auth

### What was built

**Login Page** (`src/app/(auth)/login/page.tsx`)
- React Hook Form + Zod v4 validation (`z.email()` syntax)
- Email + password fields with inline error messages on blur and submit
- Show/hide password toggle
- Loading spinner state during submit
- Server error banner (persists until next submit attempt)
- Redirects to `/dashboard` on success via `router.replace`
- Demo credentials hint box for development

**Auth Layout** (`src/app/(auth)/layout.tsx`)
- Client component that reads Zustand auth state
- Redirects to `/dashboard` if already authenticated (prevents showing login to logged-in users)
- Centered layout with light gray background

**Auth API** (`src/lib/api/auth.ts`)
- `loginUser(data)` — mock with 4 seeded admin accounts across all roles; throws typed error on wrong credentials
- `logoutUser()` — mock, ready for real API call
- `getCurrentUser()` — mock, ready for real API call
- All comments show exact lines to swap for real `post/get` calls

**AuthGuard Component** (`src/components/layout/AuthGuard.tsx`)
- Client component that protects all admin routes
- Reads `isAuthenticated` + `user` from Zustand store
- Shows spinner while hydrating; redirects to `/login` if unauthenticated
- Accepts optional `requiredPermission: Permission` — redirects to `/not-authorized` if role lacks it
- Used in admin layout and can wrap individual pages for page-level protection

**Admin Layout** (`src/app/(admin)/layout.tsx`)
- Wraps all `(admin)` routes with `AuthGuard`
- Step 3 will expand this with the full sidebar + header shell

**PermissionGate Component** (`src/components/common/PermissionGate.tsx`)
- Inline component for hiding UI elements based on role
- Usage: `<PermissionGate permission="orders.refund"><RefundButton /></PermissionGate>`
- Accepts optional `fallback` for alternative content

**Not Authorized Page** (`src/app/not-authorized/page.tsx`)
- Red shield icon, clear message, Go Back button
- Shown when authenticated user navigates to a page their role cannot access

**Root page** (`src/app/page.tsx`)
- Redirects to `/dashboard` (which the AuthGuard then redirects to `/login` if unauthenticated)

### Mock credentials for testing

| Email | Password | Role |
|---|---|---|
| admin@urgentprinters.com | Admin@1234 | Super Admin |
| ops@urgentprinters.com | Ops@1234 | Operations Manager |
| support@urgentprinters.com | Support@1234 | Customer Support |
| finance@urgentprinters.com | Finance@1234 | Finance |

### How to test auth locally

```bash
npm run dev    # http://localhost:3000
# → redirects to /login
# → sign in with any demo credential
# → lands on /dashboard (stub page)
# → navigate to / → redirects to /dashboard (auth guard active)
```

### Mock API → real backend

In `src/lib/api/auth.ts`:
- `loginUser`: replace mock block with `return post<LoginResponse>('/auth/login', data)`
- `logoutUser`: uncomment the `post('/auth/logout')` line
- `getCurrentUser`: uncomment the `get<AdminUser>('/auth/me')` line

### Known limitations at this step

- Token refresh (401 retry in client.ts) cannot be tested until real backend is connected
- No "remember me" or persistent session — closing the tab clears the token from memory; user state persists but a silent refresh on next open would need the real backend

---

---

## Step 3 Complete: Layout Shell

### What was built

**Sidebar Store** (`src/store/sidebarStore.ts`)
- Zustand with `persist` — stores `collapsed: boolean` in `up-admin-sidebar` localStorage key
- `toggle()` and `setCollapsed(v)` actions

**SidebarNav** (`src/components/layout/SidebarNav.tsx`)
- 7 navigation groups: Operations, Catalogue, Customers, Finance, Communications, Content, System
- 24 navigation items total, each with Lucide icon, href, and optional required `Permission`
- Items hidden automatically when the signed-in role lacks the required permission (Super Admin sees everything)
- Active detection via `usePathname` — supports exact match (`/dashboard`) and prefix match (`/reports/*`)
- Active indicator dot on right side of item
- Collapsed mode: icon-only with title tooltip

**AdminSidebar** (`src/components/layout/AdminSidebar.tsx`)
- `hidden lg:flex` — desktop only (mobile uses Sheet instead)
- Fixed left, 240px open / 64px collapsed; animated via CSS `transition-[width]`
- Logo, SidebarNav, user avatar + name + role at bottom, logout button, collapse toggle button

**MobileSidebar** (`src/components/layout/MobileSidebar.tsx`)
- Hamburger button rendered inline (shown in AdminHeader on mobile)
- Sheet (Base UI dialog, `side="left"`) with same nav content and user footer
- `onNavigate` callback closes the sheet on link click

**AdminHeader** (`src/components/layout/AdminHeader.tsx`)
- Fixed top, spans right of sidebar; offset tracks `collapsed` state via CSS `left-*`
- Auto-built breadcrumb from `usePathname` — segments mapped to readable labels; UUID-like segments shown as "Detail"
- Notification bell pulls alert count from cached dashboard stats query (30s refetch interval)

**AdminShellContent** (`src/components/layout/AdminShellContent.tsx`)
- Client component that reads collapsed state and applies `pl-60` / `pl-16` offset with `pt-14` for header
- Wraps all page content in a `p-6` container

**PageHeader** (`src/components/layout/PageHeader.tsx`)
- Simple stateless component: title, optional description, optional actions slot
- Used at the top of every admin page

**Admin layout** (`src/app/(admin)/layout.tsx`)
- Now renders: `AuthGuard` → `AdminSidebar` + `AdminHeader` + `AdminShellContent`

### Files created

```
src/store/sidebarStore.ts
src/components/layout/SidebarNav.tsx
src/components/layout/AdminSidebar.tsx
src/components/layout/MobileSidebar.tsx
src/components/layout/AdminHeader.tsx
src/components/layout/AdminShellContent.tsx
src/components/layout/PageHeader.tsx
```

### Verified

- `tsc --noEmit` — no errors
- `next build` — clean
- `GET /login` → 200, `GET /dashboard` → 200 (dev server)

---

## Step 4 Complete: Dashboard

### What was built

**`src/features/dashboard/hooks/useDashboardStats.ts`**
Five TanStack Query hooks: `useDashboardStats` (30s poll), `useRevenueChart(period)`, `useRecentOrders` (30s poll), `useTopProducts`, `useOrderStatusBreakdown` (30s poll).

**`StatsRow`** — 6 stat cards in responsive grid (2-col → 3-col → 6-col):
- Revenue Today, Orders Today (each with sparkline AreaChart + % change indicator)
- Active Orders, Artwork Pending, New Customers (with % change), Failed Payments
- Skeleton loading state per-card

**`RevenueChart`** — Recharts AreaChart with period toggle (7D/30D/3M/1Y), CSS-variable-themed axes, gradient fill, formatted tooltip.

**`OrderStatusBreakdown`** — Recharts PieChart (donut, innerRadius 46) with 7 status segments, colour-coded legend with counts and percentages.

**`RecentOrdersFeed`** — 10 most recent orders as a compact linked list: order number, customer, StatusBadge, amount, time-ago. Links to order detail. 30s polling.

**`TopProducts`** — Top 5 products by revenue with inline progress bars (scaled to max), order counts. Links to products page.

**`AlertsPanel`** — Alert list from dashboard stats, colour-coded by severity (error=red, warning=orange), contextual icons, links to relevant pages. Shows "All clear" empty state.

**Dashboard page** (`src/app/(admin)/dashboard/page.tsx`)
- 3-section layout: stats row → 2-column charts (2:1 ratio) → 3-column feeds
- Manual Refresh button invalidates all dashboard queries
- "Updated at" timestamp from `dataUpdatedAt`
- Spinner on refresh button while `isFetching`

**Dashboard API addition** — `getOrderStatusBreakdown()` mock added to `src/lib/api/dashboard.ts`

### Recharts 3 note
Tooltip `formatter` value is typed as `ValueType | undefined` — always coerce with `Number(value ?? 0)`.

### Verified
- `tsc --noEmit` — no errors
- `next build` — clean

---

## Step 5 Complete: Orders

### What was built

**Hooks** (`src/features/orders/hooks/`)
- `useOrders` — paginated list with local filter/sort state; exposes `setPage`, `setSearch`, `setStatus`, `setTurnaround`, `setDateRange`
- `useOrderDetail(id)` — single order query, enabled only when id is present
- `useUpdateOrderStatus`, `useAddOrderNote`, `useCancelOrder`, `useCreateRefund` — mutations, all invalidate relevant query keys

**OrderFilters** — Search + Status select + Turnaround select + DateRangePicker + Clear button; shown in DataTable toolbar slot

**OrdersTable** — Full DataTable with 7 columns (order#, customer, status, type, amount, date, actions), sortable columns, row selection with bulk cancel, DropdownMenu per-row actions (View, Update Status, Cancel), integrated UpdateStatusDialog and ConfirmDialog

**UpdateStatusDialog** — Status transition map enforces valid next statuses per current status; Select + optional note textarea; mutation with toast feedback

**RefundDialog** — Amount (number input with `valueAsNumber`), Reason select, Notes; red confirm button; mutation with toast

**Order Detail sub-components** (all in `src/features/orders/components/OrderDetail/`):
- `OrderDetailClient` — client wrapper fetching order by id, 2/3 + 1/3 grid layout
- `OrderTimeline` — vertical timeline of all status changes with timestamps and admin names
- `OrderItems` — item list with print config, artwork status badges, artwork file link
- `OrderCustomer` — name/email/phone/total orders with link to customer profile
- `OrderPayment` — method/provider/transaction ID/amount/status/paid-at
- `OrderShipping` — delivery address + shipment details (courier, AWB, tracking link, ETA)
- `OrderActions` — quick action buttons (status-specific), Change Status, Refund, Cancel
- `OrderNotes` — internal notes list + add note form (name auto-prefilled from auth store)

**Pages**
- `src/app/(admin)/orders/page.tsx` — orders list with metadata
- `src/app/(admin)/orders/[id]/page.tsx` — async server component awaiting `params: Promise<{id}>`, renders `OrderDetailClient`

### Bug fixed — Base UI Select
`onValueChange` callback types `v` as `string | null` in Base UI. Always coerce: `v ?? ''`.

### Bug fixed — Zod v4 + RHF
`z.coerce.number()` causes Resolver type mismatch with hookform/resolvers. Use `z.number()` + `register('field', { valueAsNumber: true })` instead.

### Verified
- `tsc --noEmit` — no errors
- `next build` — clean; `/orders` static, `/orders/[id]` dynamic

---

## Step 6 Complete: Printing Queue

### What was built

**`src/lib/api/printingQueue.ts`** — Dedicated printing queue API with `PrintingQueueItem` type, mock data spread across 4 statuses (34 items total), `approveArtwork`, `requestReupload`, `startPrinting`, `markReadyToDispatch`, `getServiceabilityBulk`, `createShipmentsBulk`.

**`usePrintingQueue` hook** — Polls all queue items every 15 seconds; `useQueueCounts` derives per-tab counts from cached data; individual mutation hooks for each action, all invalidate `['printing-queue']`.

**`QueueTable`** — DataTable with 8 columns; status-driven inline action buttons per row:
- `artwork_pending` → Approve + Request Reupload + View Artwork link
- `artwork_approved` → Start Printing
- `printing` → Mark Complete
- `ready_to_dispatch` → Create Shipment
- Bulk actions: approve all selected artworks (artwork_pending tab), batch dispatch (ready_to_dispatch tab)
- ConfirmDialog for reupload requests

**`BatchDispatchDialog`** — Fetches serviceability data on open, shows per-order courier select, creates all shipments in one call with loading state.

**`/printing-queue` page** — Tabs (Base UI, `value`/`onValueChange`) with count badges per tab, 15s live data, manual Refresh button with spinner, updated-at timestamp.

### Verified
- `tsc --noEmit` — no errors
- `next build` — clean; `/printing-queue` static

---

## Step 7 Complete: Products & Categories

**ProductsTable** — DataTable with image, name/category, status+badge, price, orders, revenue, created date; search + status + category filters; delete ConfirmDialog.

**ProductForm** — 6 collapsible sections: BasicInfo (name auto-slugs, RichTextEditor, category/badge/tags, Featured+Active switches), PrintSpecs (useFieldArray for sizes/papers/finishes; tag-pill UI for sides/qty steps), PricingTiers (dynamic table with qty+price+auto-total+best-value star), Turnaround (fixed 3-row layout), SEO (char counters), Images (8-file ImageUpload). Sticky sidebar with status, save/draft/preview/delete.

**CategoriesTable** — Up/Down reorder buttons (immediate API call), product count, status badge, edit/delete row actions.

**CategoryForm** — name, auto-slug, description, Active switch; handles create+edit via `isNew` flag.

**Pages:** `/products`, `/products/new`, `/products/[id]`, `/categories`, `/categories/[id]` — all using async params pattern for dynamic routes.

`tsc --noEmit` ✓ | `next build` ✓ — 12 routes

---

## Step 8 Complete: Customers

**CustomersTable** — avatar initials, name+email with verified badge, status pill, total orders, total spent, last order (time-ago), joined date, search + status filter, ban/unban via ConfirmDialog.

**Customer Detail** (`/customers/[id]`) — 4/1 col grid (tabs + sticky sidebar):
- **Profile tab** — identity (name, email+verified icon, phone, status, joined, referral) + order summary (count, total spent, AOV, last order) + internal note banner
- **Orders tab** — order history table (number, status badge, turnaround, amount, date) linked to order detail
- **Addresses tab** — address cards in 2-col grid with default star badge
- **Activity tab** — vertical timeline with colour-coded icons per activity type

**Sidebar** — avatar initials, quick stats (orders / lifetime value), mailto link, ban/reinstate buttons with ConfirmDialogs

**Bug fixed** — Lucide React v1 dropped `title` prop on SVG icons; use wrapping element or `aria-label` instead.

`tsc --noEmit` ✓ | `next build` ✓ — 15 routes

---

## Step 9 (next): Payments & Coupons

Build PaymentsTable and RefundsTable. Build RefundDialog. Build CouponsTable and CouponForm with all configuration options and CouponAnalytics.

---

## Step 9 Complete: Payments & Coupons

**PaymentsTable** — transaction ID (monospace), order link, customer, method+provider, amount, status pill, paid-at datetime. Search + status filter + CSV export.

**RefundsTable** — refund ID, order link, customer, amount (red negative), reason label, status pill, processed-by, date. CSV export.

**CouponsTable** — code (bold monospace), description, discount value with max, min order, usage with inline progress bar (red at ≥90%), status, expiry. Row actions: Edit, Analytics, Delete.

**CouponForm** — 4 sections: code+description, discount (type select + value + max), conditions (min order / usage limit / per-user limit), validity (date inputs). Active switch. Handles create + edit.

**CouponAnalytics** — 6 stat cards + Recharts BarChart of daily usage over 30 days; shown as second tab on coupon detail page.

**Pages:** `/payments`, `/payments/refunds`, `/coupons`, `/coupons/[id]`

`tsc --noEmit` ✓ | `next build` ✓ — 19 routes

---

## Step 10 (next): Content Management

Build BannersManager, TestimonialsManager, AnnouncementBar toggle, FaqsManager.

---

## Step 10 Complete: Content Management

**BannersManager** — card list with image preview, title, active status pill, up/down reorder buttons (immediate API call). Inline `BannerForm` expands in-place for create/edit. BannerForm: title, subtitle, image URL with live preview, link URL+text, valid from/until dates, active switch.

**TestimonialsManager** — avatar initials card, star rating display, content preview, active pill. Inline edit form with `StarRating` interactive component (click to set). Create/edit/delete with ConfirmDialog.

**AnnouncementBar** — live colour preview banner at top of form updates as user types. Message, link URL+text, bg+text colour pickers (native `<input type="color">` + hex text input wired to same field), active switch. Loads existing announcement on mount via `useEffect` + `reset()`.

**FaqsManager** — FAQs grouped by category, accordion expand/collapse per item. Edit form expands inline per FAQ. Create new FAQs with category field. Delete with ConfirmDialog showing the question text.

**Pages:** `/content/banners`, `/content/testimonials`, `/content/announcements`, `/content/faqs`

`tsc --noEmit` ✓ | `next build` ✓ — 23 routes

---

## Step 11 (next): Reviews, Shipping, Communications

Build ReviewsTable with moderation actions and ReplyDialog. Build ShipmentsTable and ServiceabilityChecker and CourierPerformance. Build SendNotificationForm and TemplatesManager and CommunicationLog.

---

## Step 11 Complete: Reviews, Shipping, Communications

**Reviews**
- `ReviewsTable` — star rating display, review content preview, status badge, replied indicator; inline Approve/Reject icon buttons using `Button` + `variant="ghost"`; `ReplyDialog` (Dialog with original review quote, textarea, submit)
- `/reviews` page

**Shipping**
- `ShipmentsTable` — AWB (monospace), order link, courier, shipment status badge (`Badge` shared), dispatch date, ETA, external tracking link; CSV export via `ExportButton`
- `ServiceabilityChecker` — pincode input → `useServiceability` query (enabled when 6 digits) → shows serviceable/not with available couriers list (name, days, rate)
- `/shipping` + `/shipping/serviceability` pages

**Communications**
- `SendNotificationForm` — channel toggle (Email/SMS/Push as button group), recipients toggle (All/Active), subject (email only), message textarea; success toast with sent count
- `TemplatesManager` — list of templates with type badge and active badge; expand-in-place `TemplateEditor` with body textarea, variable hints as code pills, active switch
- `CommunicationLog` — DataTable of sent history: channel icon + label, recipient, subject, status badge, timestamp
- `/communications` (form + log) + `/communications/templates` pages

**Reusable patterns maintained:** `Badge` (not inline styles), `Button`, `DataTable`, `ExportButton`, `LoadingSkeleton`, `PageHeader`, `ConfirmDialog`, `Select` — zero hand-rolled badge classes

`./node_modules/.bin/tsc --noEmit` ✓ | `next build` ✓ — 12 admin route groups

---

## Step 12 (next): Reports

Build all four report pages — Sales, Orders, Customers, Operations. Each with date range picker, stat cards, charts, and detailed data table with export.

---

## Step 12 Complete: Reports

**Shared report infrastructure:**
- `useReportDateRange()` — manages period (7d/30d/3m/1y) and optional custom DateRange; derives ISO `from`/`to` strings for API calls
- `ReportControls` — segmented-control period selector + DateRangePicker + ExportButton, wired together in one toolbar
- `StatCards` — responsive grid of stat cards with value, optional % change (TrendingUp/Down icon), sub-label; skeleton on load
- `ChartCard` — labeled container with skeleton; wraps any Recharts chart
- Chart primitives: `TrendChart` (area), `HBarChart` (horizontal bars), `GroupBarChart` (grouped bars), `DonutChart` (pie)

**Sales Report** — 3 stat cards + revenue trend, AOV trend, revenue by category (HBar), payment method breakdown (Donut) + top products table

**Orders Report** — 4 stat cards + order volume trend, cancellation rate trend, orders by status (Donut), fulfillment time trend

**Customers Report** — 4 stat cards + new customers trend, new vs returning (GroupBar), LTV distribution (Donut), customers by state (HBar)

**Operations Report** — 4 stat cards + production time by product (HBar), turnaround distribution (Donut), artwork reupload rate trend, orders by turnaround over time (GroupBar)

**Recharts v3 note:** `Tooltip.labelFormatter` receives `ReactNode`, not `string` — always coerce with `String(l ?? "")`.

`tsc --noEmit` ✓ | `next build` ✓

---

## Step 13 (next): Staff & Settings

Build StaffTable and StaffForm and RolePermissionsMatrix. Build ActivityLogTable with all filters. Build all four settings pages — General, Operations, Payments, Notifications.

---

## Step 13 Complete: Staff & Settings

**Staff**
- `StaffTable` — avatar initials, name/email, role pill (from `ROLE_COLORS`), `ActiveBadge`, last login (time-ago); inline `StaffForm` animates in with `motion/AnimatePresence`; delete ConfirmDialog
- `StaffForm` — name, email (disabled on edit), role Select, password (new only), active Switch; uses `zodResolver` with different schemas for create vs edit
- `RolePermissionsMatrix` — full grid of all 9 permission groups × 6 roles; ✓/✗ icons; built from `getPermissionsForRole()` — zero hardcoding, always in sync with the permissions utility
- `ActivityLogTable` — admin filter (populated from staff list), entity type filter, CSV export; action names coloured by type; entity type + label in one cell
- `/staff` (table + matrix) · `/staff/activity-log`

**Settings** — shared primitives in `SettingsForm.tsx`:
- `SettingsSection` — card wrapper with title + description header
- `FieldRow` — label/description on left, input on right (desktop two-column layout)
- `useSettingsForm` — generic hook: loads data → `form.reset()` on mount, wraps save with toast
- `SaveBar` — sticky bottom bar that only appears when form is dirty; disappears on save

**4 settings pages:**
- **General** — business name, GST, address, support email/phone, timezone, currency
- **Operations** — turnaround days, rush order cap, printing capacity, artwork timeout, auto-approve toggle
- **Payments** — Razorpay enable + key ID (shown conditionally), Paytm enable, COD enable + min order (shown conditionally)
- **Notifications** — customer notifications (order confirmed, dispatched, artwork) each with Email + SMS toggles; admin alerts (new order, failed payment)

`tsc --noEmit` ✓ | `next build` ✓

---

## Step 14 (next): System Health

Build ServiceHealthCards, JobQueueMonitor, ErrorLog. Assemble system health page.

---

## Step 14 Complete: System Health

**`ServiceHealthCards`** — 8 service cards in responsive grid (1→2→3→4 col breakpoints). Each card:
- Animated pulse dot (green ping for healthy, static amber/red for degraded/down)
- Status badge coloured per level
- Response time with colour warning (amber >500ms)
- Error rate with colour warning (red >1%)
- Last check time-ago
- Error message banner (amber) if service reports an issue
- `motion/react` stagger animation on mount

**`JobQueueMonitor`** — DataTable of Celery jobs with queued/processing/failed counts in a summary bar above. `Badge` (shared) for status, retry count coloured amber when >0, error message truncated inline. 15-second polling.

**`ErrorLog`** — Grouped entry list (critical/error/warning) with summary count bar, colour-coded left-border cards per level using `motion/react` slide-in animation. Endpoint shown as `<code>` pill, user ID shown if present. 60-second polling.

**System page** — Three sections (Service Status, Background Jobs, Error Log) assembled on one page. All queries use `refetchInterval` (30s health, 15s jobs, 60s errors). Single "Refresh" button invalidates all three queries simultaneously.

`tsc --noEmit` ✓ | `next build` ✓ — 16 admin route groups

---

## Step 15 (next): Polish & Connect to Real Backend

Replace all mock API functions with real backend calls. Test every flow end to end. Fix any type mismatches. Test all role-based permission restrictions. Deploy to Vercel as a separate project.
