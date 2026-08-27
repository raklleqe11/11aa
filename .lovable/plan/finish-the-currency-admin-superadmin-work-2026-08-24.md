# Finish the currency + admin/superadmin work

I re-checked the three prototype files. The previous session's CSS and guest-chip work is in place; everything in `ops.js` is still untouched.

## Verified current state

Already done (leave alone):
- `styles.css` has the currency block (`.rate-row`, `.rate-equation`, `.rate-preview`, `.rate-stale`, `.fx-chip`, `.fx-list`, `.fx-row`), staff/permission/log rows, and the superadmin scroll fix (`.super-shell` now has an explicit height with a flexible `.content-scroll`).
- `app.js` guest price chip shows a real converted amount (`≈ €0.60`), not a repeated currency code.
- `app.js` billing page already prints the single Hap plan through `platformMoney`.

Still outstanding (confirmed by reading the files):
- `ops.js:8` still defines `const money = v => €${v.toFixed(2)}` and uses it for every platform figure (MRR 113, plan bars 119, restaurant KPI 153, invoice/revenue 170, plans page 218-220) and for other restaurants' menu item prices (194).
- `ops.js:25-28, 76, 214-228` still model three tiers (Starter/Growth/Scale in EUR).
- `ops.js:38, 234` still carry the maintenance-mode state and toggle.
- `ops.js:260 adminSettings` — the screen that actually renders at `/admin/settings` — does not mount `ctx.currencyCard()`, so the whole currency UI remains unreachable.
- `ops.js` restaurant detail has a plan picker and no read-only menu currency block.
- `app.js:756, 758` hardcode `Price (€)` in the edit/add item sheets.
- `app.js:402` "Share menu" and `app.js:440` "Open preview" are still duplicate actions.
- No staff activity log yet.

## What I'll do

### 1. Mount the currency settings card (highest value)
Add `ctx.currencyCard()` as a card in `ops.js adminSettings`, placed after the "Public menu" block, so primary-currency selection, guest rates, live preview and the stale-rate reminder become reachable at `/admin/settings`. Delete the orphaned `settingsPage()` in `app.js`.

### 2. Platform money in Lek
Remove the local `money()` in `ops.js` and route every platform figure through `ctx.platformMoney` (MRR, plan price, invoices, lifetime revenue, KPIs). Other restaurants' menu item prices render in that restaurant's own primary currency via `ctx.formatCurrency`.

### 3. One Hap plan
Collapse the three tiers into the single Hap plan at 2,500 ALL/month: recompute MRR from it, retitle the plans page "Plan and billing", and replace the tier-breakdown bars on the overview with a paid / trial / manual-grant breakdown. In restaurant detail, the plan picker becomes a static "Hap" row plus a read-only Menu currency section (primary, guest rates, last updated).

### 4. Settings cleanup
Remove the maintenance-mode toggle and its state key; keep Open sign-ups, trial length, AI translations, languages, email templates.

### 5. Admin polish
- Item add/edit sheets label price with the restaurant's primary currency instead of `(€)`.
- Remove the duplicate "Share menu" from the Menu toolbar (Home status card keeps the single Share) and the duplicate "Open preview" on the QR page (the global Admin/Preview switch covers it). Design's "See it live" and More's "Open as new customer" stay.

### 6. Staff activity log
Give staff real Owner/Manager records with a permission set, and append `{actor, action, entity, from, to, at}` events from the existing mutation handlers (price edit, availability change, item add/delete, promotion, currency change, publish). Per-person recent activity shows in the staff sheet; the platform-wide feed stays in superadmin. Clearly labelled prototype data in localStorage.

### 7. Verify in the browser
`/admin/settings` currency card renders, is styled, validates (0 / negative / NaN / duplicate / 6th currency rejected) and confirms a primary change · public menu chip and Approximate price sheet · `/admin/billing` shows 2,500 Lek · `/super`, `/super/plans`, `/super/restaurants` scroll with nav visible · widths 462px and 365px.

## Technical notes

Changes are confined to `public/hap/ops.js` and `public/hap/app.js` (plus small `styles.css` additions if a new surface needs them). No backend, no schema, no new dependencies. Validation hardening in `handleRateInput` / `setPrimaryCurrency` / `addGuestCurrency` will be read and confirmed against the acceptance list before I call it done. Analytics stays prototype data; I will not fabricate production event collection.
