# Finish the Hap audit plan (P1–P6)

I re-read the prototype. Confirmed current state: `public/hap/app.js` calls a set of helpers that do not exist yet (`ALLERGENS`, `DIETS`, `DIET_FILTERS`, `itemAllergens`, `itemDiets`, `tItem`, `tCategory`, `track`, `analyticsOf`, `seedAnalytics`, `startGuestSession`, `endGuestSession`, `toastUndo`, `handleTranslationInput`, `toggleMenuLanguage`, `autoTranslate`, `seenItems`, `visibleItemsOf`'s `dietMatches`), `loadState` still strips `dietary`/`spice`/`energy`/`portion` (line 225), `analyticsPage()` still reads the hardcoded `INSIGHT_DATA` constants (line 549), and `ops.js` still carries seeded platform metrics and its own copy of the plan constant. So the app is in a broken intermediate state and must be repaired first.

## Step 1 — Make the prototype run again

Add every missing helper and the data it needs:

- `ALLERGENS` (EU 14), `DIETS`, `DIET_FILTERS` constants; `itemAllergens()`, `itemDiets()`, `dietMatches()`.
- `state.analytics = { events: [], seeded: false }`, `restaurant.languages`, per-item/category `translations` maps in `defaultState()`, version bump 11 → 12 with a **preserving** migration.
- Remove the field-stripping loop in `loadState` so `dietary`/`spice` survive.
- `track()`, `analyticsOf()`, `seedAnalytics()`, `startGuestSession()`, `endGuestSession()`, `seenItems`.
- `tItem()`, `tCategory()`, `handleTranslationInput()`, `toggleMenuLanguage()`, `autoTranslate()`.
- `toastUndo()` plus its CSS.
- CSS for the new classes already emitted by the render code: `product-badges`, `diet-tag`, `spice-tag`, `allergen-bubbles`, `diet-row`, `filter-chip`, `chip-check`/`check-chip`, `fx-list` reuse, undo toast, translation rows.

Verification: load `/`, `/admin`, `/preview` in the browser and confirm no console errors before moving on.

## Step 2 — P1 Real analytics

Rewrite `analyticsPage()` to derive every figure from `state.analytics.events`: menu opens, unique guest sessions, most-viewed dishes, language mix, promo taps, hour-of-day buckets, range filter (24h / 7d / 30d). True empty state ("No guest visits yet") with a "Seed demo data" button and a "Clear analytics" action (both already wired in the click handler). Superadmin `views` per restaurant derives from the same log for the active restaurant.

## Step 3 — P2 Real languages

New `/admin/translations` screen (added to `ADMIN_SCREENS` in `src/lib/hap-routes.ts` and to the admin router in `app.js`): pick the restaurant's active languages, per-language coverage bar, and an editable list of every category and item name/ingredients. Public menu renders the selected language through `tItem`/`tCategory` with fallback to the default. The Home card's hardcoded "Missing translations · 3" becomes a real count.

## Step 4 — P3 Allergens & dietary (finish)

Form blocks and public badges already exist; once Step 1 lands, verify the add/edit round-trip persists, the diner filter chips filter, and the allergen key sheet lists the 14 allergens.

## Step 5 — P4 Superadmin control room (`ops.js`)

- Derive MRR, active restaurants, trials and churn from the real restaurant/subscription records instead of seeded `platform.metrics`; drop the static "API latency" figure or label it as a demo value.
- One shared `HAP_PLAN` / `PLAN_LABELS` source, imported by both files (module-level constant in `app.js`, referenced by `ops.js`) so they can't drift.
- Manual subscription editor: plan, status, start date, end date, interval, note, "granted by" — alongside the existing quick-grant buttons.
- Per-restaurant notes/contact log, "open as this restaurant" impersonation, CSV export of restaurants and users (reusing `src/lib/download.ts` patterns inside the prototype).

## Step 6 — P5 Honest billing

Replace the dead billing buttons with a real read-out of the manually-set subscription: plan, price, status, access source, start/end dates, days remaining, who granted it. Fake invoice rows and the payment-method card are removed; automatic subscribing becomes one clearly-labelled "Coming soon" block.

## Step 7 — P6 Consistency pass

Confirm dialog on every destructive action, undo-in-toast for deletes, focus trap + Escape close on sheets/modals, uniform `role="switch"` toggles, inline field-level validation, empty states for every list that can be emptied.

## Decisions I'm taking unless you say otherwise

- **One plan for everyone** — plan feature toggles stay display-only, they don't gate features.
- **Notification toggles** stay, but marked "Coming soon" like billing rather than faked.
- **Item photos** keep the preset gallery (no base64 uploads in localStorage).

## Technical notes

All work stays in `public/hap/app.js`, `public/hap/ops.js`, `public/hap/styles.css`, plus `src/lib/hap-routes.ts` for the new translations screen. No backend, no payment gateway; state remains localStorage with a version-12 migration that preserves existing data.
