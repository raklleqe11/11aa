# Hap product & UX audit — findings and prioritized fixes

On skills: the only skill active here is a **redesign** skill (picks visual direction). There is no UX-audit skill, so this is a one-off audit, done by reading the real app (`public/hap/app.js`, `ops.js`) which runs as a localStorage prototype inside the React shell. Everything below stays prototype-only — no backend, no payment gateway.

## What actually works today

Real, wired-up, persisted: menu CRUD + reorder + sold-out/hidden + promote, promotions with category takeover, design/appearance (12 templates, brand color, dark mode, backgrounds), QR generation + download, settings (profile, hours, currency with guest conversion rates), staff invite/edit/suspend with an activity log, superadmin restaurant/user CRUD, access grants (7d → lifetime), suspend/restore, per-restaurant menu editing, onboarding tour.

## The honest gaps (owner's view)

**1. Analytics is entirely fake.** Every number on the Insights screen is a hand-written constant (`app.js:549-574`); "most viewed dishes" is `90 - i*14`, guest languages are fixed percentages. No event is recorded anywhere in the codebase. Superadmin `views` per restaurant never increments. This is the single biggest credibility risk — it's the screen that justifies the subscription.

**2. Language switching is theater.** The picker offers 23 languages, but selecting one only changes a 2-letter badge; no dish name is ever translated. Home even hardcodes "Missing translations: Italian + German need review · 3". For a tourist market (Saranda), translation is the core value prop and it currently does not exist in the data model.

**3. Allergens/dietary were deleted.** A migration strips `dietary`, `spice`, `portion`, `energy` (`app.js:225`), leaving free-text ingredients. Diners can't filter, and this is a legal expectation in the EU.

**4. Superadmin numbers are hardcoded and contradict each other.** Overview MRR/restaurants/churn/trials are seed constants (`ops.js:45`); Plans computes its own MRR from a fake `accounts` number. Platform health ("API latency 132 ms") is static. Two separate copies of `HAP_PLAN` exist (app.js and ops.js) and can drift.

**5. Plan model is half-collapsed.** Only one plan ("Hap") exists, but seeded restaurants still carry old tier strings (Growth/Starter/Scale) and plan feature toggles (analytics/promotions on/off) gate nothing anywhere.

**6. Dead ends that toast "not connected".** All billing buttons and invoice rows, "send password reset", email-template editing, notification toggles, superadmin "supported languages" list. Some of these should stay coming-soon; others are cheap to make real.

**7. Superadmin can't do enough to support a customer.** No impersonation / "view as this restaurant", no plan start/end date editing in the UI (only preset grant buttons), no notes/contact log per restaurant, no export.

**8. UX/a11y inconsistencies.** Item delete in the owner's menu has no confirm while the same action in superadmin does; no undo anywhere; modals/sheets restore focus but have no focus trap and no Escape-to-close; some toggles use `role="switch"` and some don't; validation is split between native `required` and manual toast checks.

## Proposed work, in priority order

**P1 — Make analytics real (prototype-real).** Add a lightweight event recorder in state: menu opens, QR scans, per-item views, language selections, promo taps, hour-of-day buckets. Public menu emits them; the Insights screen derives every number from recorded events, with a genuine empty state ("No guest visits yet") and a "seed demo data" button so the screen still demos well. Superadmin restaurant `views` derives from the same source.

**P2 — Make languages real.** Per-item and per-category translation fields for the restaurant's chosen languages, an admin translation screen showing coverage per language (this makes the "missing translations" card truthful), and a public menu that actually renders the selected language with fallback to the default.

**P3 — Bring back allergens & dietary.** Restore structured fields (allergens multi-select, vegetarian/vegan/gluten-free, spice level) on the item form, badges on the public menu, and diner-side filter chips.

**P4 — Superadmin becomes a real control room.** Derive MRR, active restaurants, trials, churn from actual restaurant/subscription data; single shared plan constant; manual subscription editor with explicit start date, end date, interval and note (your stated workflow) alongside the quick-grant buttons; per-restaurant notes/contact log; "open as this restaurant" impersonation; CSV export of restaurants and users.

**P5 — Billing screen, honest version.** Keep automatic subscribing as an explicit "Coming soon" block. Above it, show the real current state: plan, status, access source, start date, end date, days remaining, renewal expectation, and who granted it — all read from the subscription the superadmin sets manually. Remove or clearly disable the fake invoice rows and payment-method card rather than leaving buttons that toast nothing.

**P6 — Consistency and polish pass.** Confirm dialog on every destructive action, undo-in-toast for deletes, focus trap + Escape close on sheets/modals, uniform `role="switch"` toggles, inline field-level validation, and empty states for every list that can be emptied.

## Open choices I'd like your call on

- Should plan feature toggles actually gate features (e.g. analytics hidden on a lower plan), or is one plan for everyone the model?
- Notification toggles: make them real in-app notifications, or mark coming-soon like billing?
- Item photos: keep the fixed preset gallery, or add real uploads (prototype = base64 in localStorage, size-limited)?

## Technical notes

All changes land in `public/hap/app.js` / `ops.js` / `styles.css` plus `src/lib/hap-routes.ts` if new screens (e.g. `/admin/translations`) are added. Event recording and translations extend `defaultState()` with a state `version` bump and a migration that preserves existing localStorage data instead of stripping fields. Duplicate `HAP_PLAN` / `PLAN_LABELS` definitions get consolidated into one module-level source.
