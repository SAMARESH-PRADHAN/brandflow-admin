# Arreniux Admin Panel — Full Rebuild Plan

Rebuild the existing ERP shell into a **premium, frontend-only Admin Panel** for Arreniux, powered entirely by **Local Storage** with realistic seeded demo data. Every button works, every CRUD writes to storage, every chart re-renders on change.

## 1. Design System (white + black + red)

Replace the current "Deep Slate & Copper" tokens in `src/styles.css`:
- Background: pure white (`#FFFFFF`) / muted `#F7F7F8`
- Foreground: near-black (`#0A0A0A`)
- **Primary / Accent: red** (`#E11D2E` with hover/soft variants)
- Borders: subtle grey, soft shadows, rounded-2xl cards
- Full **dark mode** via `.dark` class + theme toggle (persisted in localStorage)
- Typography: Plus Jakarta Sans (already loaded)
- Loading skeletons, toasts (sonner), confirm modals (AlertDialog)

## 2. Local Storage Data Layer

New `src/lib/store.ts`:
- Seeded PRNG generator produces: 50 products, 20 B2B products, 15 new collection, 10 welcome kits, 100 orders, 25 sample orders, 50 customers, 20 B2B agents, 120 payments, 80 reviews, settings.
- Keys: `arreniux:products`, `arreniux:b2bProducts`, `arreniux:newCollection`, `arreniux:welcomeKits`, `arreniux:orders`, `arreniux:sampleOrders`, `arreniux:customers`, `arreniux:agents`, `arreniux:payments`, `arreniux:reviews`, `arreniux:settings`, `arreniux:theme`.
- `useCollection(key)` hook: subscribes via `storage` event + custom `arreniux:change` event, exposes `list / add / update / remove / bulk`.
- Seed only if key is empty; expose `resetDemoData()` in Settings.

## 3. Shell (sidebar + topbar + layout)

Rebuild `_admin.tsx` layout:
- **Left sidebar** with grouped menu (Dashboard / Product Management ▸ / Orders ▸ / Users ▸ / Payments / Reviews / Analytics / Settings), active-route highlighting, collapsible groups, mobile drawer.
- **Top navbar**: breadcrumbs, global search input (context-filtered), theme toggle, notifications popover, user menu with demo Logout (toast).
- Move `/` to render the dashboard directly (remove placeholder).

## 4. Route Map (TanStack file-based)

Replace/add:
- `src/routes/index.tsx` → dashboard
- `_admin.tsx` layout wraps everything (keep pattern)
- Products: `/products`, `/products/new-collection`, `/products/b2b`, `/products/welcome-kits`
- Orders: `/orders`, `/orders/samples`, `/orders/status` (Kanban), `/orders/$id` (details + invoice)
- Users: `/customers`, `/agents`
- `/payments`, `/reviews`, `/analytics`, `/settings`

Each page: PageShell with breadcrumbs, title, search, filters, table + modal forms.

## 5. Dashboard

KPI cards (Revenue, Orders, Pending, Completed, Sample, Customers, Products, Reviews) computed live from stores. Charts (Recharts): revenue line, monthly sales bar, orders trend area, order-type pie, category sales bar, top products bar, revenue-by-category, weekly orders. Widgets: latest orders, recent reviews, low stock, recent customers, today's sales, pending payments, top categories, activity feed.

## 6. Product Management

**Main Products** — full CRUD modal form with all required fields (code, name, category, type Regular/Premium/Others, sub-category, material, description, sample price, original price, status, demo image upload → base64 in LS, color variants array). Each color has two toggles: **Show in Category** and **Show in Bulk** — editable inline in a variant sub-table.

**B2B Products** and **New Collection** — simpler CRUD with their own fields.

**Welcome Kits** — one category, list of kit items (t-shirt, notebook, bottle…) with price + enable/disable toggle + CRUD.

All pages: search, sort, paginate, action buttons (view/edit/delete with confirm).

## 7. Orders

- **All Orders**: tabs (Normal / Bulk / B2B / New Collection / All), table with all columns, row → details page.
- **Order details (`/orders/$id`)**: customer block, product block (all fields including print type/location, uploaded logo demo image, sizes S–XXL breakdown), totals with GST + shipping + grand total, timeline (Placed → Delivered), invoice preview, Download PDF (via `window.print()` on styled invoice view — no extra deps) and Print buttons, Excel export via a tiny CSV/xlsx writer (use `xlsx` package).
- **Sample Orders**: same UI, qty forced to 1, tabs by sample type.
- **Order Updation (Kanban)**: 5 columns (Placed / Confirmed / In Production / Shipped / Delivered) with the specified colors, click arrow button on card to advance status (updates timeline + LS). Drag optional — click buttons required.

## 8. Users, Payments, Reviews, Analytics, Settings

- Customers + B2B Agents: CRUD, search, filters, detail drawer.
- Payments: KPI cards (Total, Pending, Completed, Refunded, COD, Online, Success Rate), filters (Daily/Weekly/Monthly/Yearly), table with search.
- Reviews: filter by status/product, avg rating card, rating distribution chart, latest reviews, approve/reject/reply actions.
- Analytics: date-range filter, all requested charts, "Download Report" → CSV.
- Settings: theme, brand info (demo), **Reset Demo Data** button, logout (toast).

## 9. Interactivity guarantees

- Every button wired (view/edit/delete/export/print/status/toggle/reset).
- Every modal opens; forms use `react-hook-form` + `zod`.
- Delete → AlertDialog confirm.
- Global search bar in topbar routes to a `/search?q=` results page across products/orders/customers.
- Any CRUD triggers `arreniux:change` → dashboard, analytics, charts recompute.

## 10. Technical notes

- Keep TanStack Start structure. All logic client-side; loaders unused.
- Add deps: `xlsx` (Excel export), `react-hook-form` (already?), `date-fns`.
- Delete legacy files that no longer match (`_admin.products.tsx` etc. get rewritten in place).
- No auth, no backend, no Lovable Cloud.

## Deliverables

~30 files created/rewritten: theme, store, hooks, sidebar/topbar, dashboard, 4 product pages, 4 order pages, 2 user pages, payments, reviews, analytics, settings, shared UI (DataTable, ConfirmDialog, FormModal, EmptyState, Skeletons, KpiCard, ChartCard).

Approve to build.
