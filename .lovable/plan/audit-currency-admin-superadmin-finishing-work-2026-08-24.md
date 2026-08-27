# Audit: currency + admin/superadmin finishing work

Evidence below comes from reading `public/hap/app.js` (1077 lines), `public/hap/ops.js` (483), `public/hap/styles.css` (433). Headline result: the currency **engine** in `app.js` is real and mostly correct; the currency **UI is completely unmounted and unstyled**, and `ops.js` (superadmin + the settings screen that actually renders) received none of the work.

## A. Current-state audit matrix

| Requirement | Status | Evidence | Problem / gap | Action |
| --- | --- | --- | --- | --- |
| `CURRENCIES` table | Complete | `app.js:228-237`, 8 codes with symbol/decimals/position | — | Do not touch |
| Currency-aware `money()` | Complete | `app.js:294` `money(v)=formatCurrency(v,currencyOf().primary)` | — | Do not touch |
| `platformMoney()` always ALL | Partial | `app.js:296` + `PLATFORM_CURRENCY='ALL'` (239). Used in `billingPage` only | `ops.js:8` defines its own `const money = v => €${v.toFixed(2)}` and uses it for **every** platform value (plans 119, restaurant KPI 153, next invoice/revenue 170, plans page 220) | Delete `ops.js` local `money`; route platform values through `ctx.platformMoney` |
| `restaurant.currency` state | Complete | `app.js:141` `currency:defaultCurrency()`, `defaultCurrency()` 243-249 (primary ALL, EUR/USD/GBP rates) | — | Keep |
| Decimal-safe conversion | Complete | `roundHalfUp` 259, `formatCurrency` 260, `convertFromPrimary` 269-275 (`base/rate` scaled by target decimals) | Rate itself parsed as float; adequate for a prototype, precision only limited by input | Keep; no change |
| Normalised rate direction | Complete | `1 <code> = rate <primary>` everywhere; equation label renders `cur.primary` (`app.js:590`) | Not ALL-anchored | Keep |
| One source price per item | Complete | Items carry a single `price` (`app.js:158-184`); conversions computed, never stored | — | Keep |
| v9 → v10 migration | Partial | `migrateV9toV10` 197-208, loader 210-211 | Migration sets primary **EUR** with a single ALL rate of `0.0102` — that is the wrong direction for the `1 code = rate primary` convention (1 ALL ≈ 0.0102 EUR is a *from-primary* number). Any v9 user gets a broken rate | Fix the migrated rate to the normalised form (`{code:'ALL', rate:~0.0102}` reversed → `rate` must be ALL-per-EUR ≈ 0.0102 is correct only as EUR-per-ALL; use `rate: 98` semantics reversed, i.e. store `1 ALL = 0.0102 EUR`) — verify by rendering, then keep numeric prices untouched |
| Demo prices in ALL | Complete | 500-1750 integer prices, primary ALL | — | Keep |
| Single Hap plan 2,500 ALL | Partial | `HAP_PLAN` `app.js:482` (2500/ALL), `PLAN_LABELS`/`PLAN_PRICES` collapse all legacy ids to Hap (483-484) | `ops.js:25-28` still holds Starter/Growth/Scale at 19/49/129; `ops.js:76` its own 3-tier `PLAN_LABELS`; plans page 214-228 and overview breakdown 119 render three tiers in € | Collapse `ops.js` plan data + UI to one Hap plan at 2,500 ALL |
| Menu Currency settings card | **Missing (dead code)** | `currencyCard()` defined `app.js:594-620`, exported at 125 — **never called**. Worse: `/admin/settings` renders `HapOps.adminSubpages.opsSettings` (`app.js:464`), and `app.js:552 settingsPage()` is itself dead | Mount the currency card inside `ops.js adminSettings`; delete the orphaned `settingsPage()` |
| Primary selector / toggle / add / remove / reorder | Complete-but-unreachable | markup 594-620, handlers `app.js:961-975` (`toggle-conversions`, `add-rate`, `remove-rate`, `move-rate`, `set-primary-currency`) | Only unreachable because the card never renders | No logic change |
| Validation | Needs verification | `handleRateInput` 626, `setPrimaryCurrency` 644, `addGuestCurrency` 653 | Must confirm: zero/negative/NaN/Infinity rejected, duplicates blocked, >5 blocked, and the EUR-secondary-becomes-primary collision handled | Read + fix these three functions, then browser-test |
| Live conversion preview | Complete | `conversionPreviewText` 572, `refreshCurrencyPreview` 622-624 called from `handleRateInput` 642 | Unreachable until card is mounted | — |
| Stale-rate reminder | Complete | `RATE_STALE_DAYS=30`, `ratesAreStale` 288, rendered 618, admin-only | — | Keep |
| Public fx chip | Partial | `app.js:706` renders `.fx-chip` `≈ ALL ▾` only when `guestRates().length` | **No CSS for `.fx-chip`** → unstyled inline button next to the price; label `≈ ALL` shows the *primary* code, which the brief flags as confusing | Add styles; change label to a bare `≈` |
| Approximate price sheet | Partial | `app.js:742-745`, action wired at 965 | **No CSS for `.fx-list` / `.fx-row`**; also needs the "approximate" disclaimer verified | Add styles |
| Currency CSS | **Missing** | grep of `styles.css`: `fx-chip`, `fx-list`, `fx-row`, `rate-row`, `rate-head`, `rate-code`, `rate-tools`, `rate-equation`, `rate-preview`, `rate-stale` — all absent | Every new currency surface is unstyled | Add one currency block to `styles.css` |
| Promote spark icon removed | Complete | `app.js:412` Promote button is text-only | — | Do not touch |
| Restock all → Share | Complete-but-duplicated | `app.js:402` toolbar `Share menu`; `app.js:376` status card `Share`; both call `sharePreview()` (966/936) | Two identical Share actions two screens apart, plus QR page Share (440) | Keep one; see section C |
| Insights range selector | Partial | `INSIGHT_RANGES` 528, `INSIGHT_DATA` 529-534, chips 544, handler 967 | Switches between four **hardcoded synthetic constants**; hour chart, top dishes, languages and promo cards ignore the range entirely | Make the whole page react to range (still prototype data, clearly labelled) |
| Real analytics events | **Missing** | No event collection anywhere; `ops.js:24` platform metrics and `r.views` are literals | Nothing is measured | Keep as labelled prototype data; do not fake production analytics |
| Superadmin scroll | **Incorrect** | `app.js:712` `<div class="super-shell"><div class="content-scroll">…`; `styles.css:65` `.content-scroll{height:calc(100% - var(--proto-h) - var(--safe-top))}`; `styles.css:115` `.super-shell{min-height:100%}` inside `.phone-app{height:100%;overflow:hidden}` | Root cause: in restaurant admin `.content-scroll` is a direct child of the phone frame, so its `100%` maths lines up. In superadmin the extra `.super-shell` wrapper is `min-height:100%` — a full phone height *below* the prototype bar — so shell + bar exceed the frame and the clipped overflow eats the bottom of the page and the nav | `.super-shell{height:calc(100% - var(--proto-h) - var(--safe-top));display:flex;flex-direction:column}` and `.super-shell .content-scroll{height:auto;flex:1;min-height:0}` — verify in browser at 462px and 365px |
| Maintenance mode toggle | Present | `ops.js:38` `maintenance:false`, `ops.js:234` toggle row | Must be removed from product UI | Remove toggle + state key; `signupsOpen` stays |
| Staff roles + permissions + activity | Partial | `ops.js:15` two staff records with role strings; `staff()` 253-258 list; sheet `opsStaff` | No Owner/Manager slot model, no permissions, no per-person activity | Add role/person model + permissions + per-person recent activity (prototype data, labelled) |
| Audit log | **Missing** | No mutation logging in `app.js` handlers | Accountability cannot be real without an event store | Model the event shape and record it in local state for the mutations that matter; label as prototype |
| Superadmin read-only currency view | **Missing** | `restaurantDetail` `ops.js:147-183` has no currency block | — | Add read-only Menu currency section |
| Billing vs Restaurants duplication | Partial | `restaurantDetail` 147-183 mixes profile + billing rows (170); `plans()` 214-228 is plan-tier centric | Same restaurant billing info in two places | Re-split per section F |

## B. Currency architecture verdict

1. **Platform billing isolated in ALL?** No — correct in `app.js` (`platformMoney`), broken in `ops.js`, which prints every platform figure as `€x.xx` from its own local `money`.
2. **Arbitrary primary currency?** Yes. `currencyOf()` reads `restaurant.currency.primary` and `money()` follows it.
3. **Conversions anchored to primary, not ALL?** Anchored to **primary**, correctly. Equations render `cur.primary`.
4. **One source price?** Yes, single `item.price`.
5. **Money maths safe?** Yes — integer minor units, `roundHalfUp`, no `toFixed` drift on display.
6. **Rate precision/rounding?** Sufficient for a prototype; result rounded to target-currency decimals, so no `€10.6382978723`.
7. **Primary change?** `setPrimaryCurrency` exists but is unreachable and unverified — this is the dangerous case (`1000 ALL` silently reread as `1000 EUR`), and it must show an explicit confirmation and resolve the "EUR is now both primary and secondary" collision.
8. **v9 → v10 migration safe?** Prices are safely untouched, but the injected ALL rate is stored in the wrong direction.
9. **Settings UI mounted?** No — dead code, and it was written into a `settingsPage()` that itself never renders.
10. **Public conversion UX mounted/styled?** Mounted, entirely unstyled.

## C. Duplicate-action audit

Current occurrences: global Admin/Preview segment (`app.js:321-322`) · Home status card `Share` (376) · Home quick-action QR card (381) · Menu toolbar `Share menu` (402) · Design "See it live" → preview mode (430) · QR `Share` + `Open preview` with eye icon (440) · More "Open as new customer" eye row (454) · superadmin restaurant detail "Public menu" eye row (`ops.js:174` area).

Recommended final set:
- **Keep** the global Admin/Preview segment as the only generic mode switch.
- **Keep** Design "See it live" (contextual: previews the chosen template).
- **Remove** QR page "Open preview" (pure duplicate of the global switch) and keep QR's Download + Share.
- **Keep exactly one Share**: the Home status card. Remove `Share menu` from the Menu toolbar (leaves `+ Category`, which is the screen's real action) — no invented replacement.
- **Keep** More → "Open as new customer" (contextual: replays first-visit flow), reworded so it does not read as another preview button.

## D. Analytics capability audit

| Metric | UI exists? | Real data? | Source | Range filtering | Missing work |
| --- | ---: | ---: | --- | ---: | --- |
| Menu visits | Yes (`analyticsPage` stat grid) | No | `INSIGHT_DATA` literals | Yes (value swap only) | Event collection |
| Item views / most viewed | Yes (bar list) | No | derived from item order | No | Event collection + range aggregation |
| Avg. session duration | Yes | No | literal | Yes | Session boundary model |
| Section engagement | No | No | — | — | Whole feature |
| Views by hour | Yes | No | literal array | No | Range-aware series |
| 24h / 7d / 30d / all-time | Yes (chips) | n/a | `ui.insightsRange` | Partial | Wire every card, not just the stat grid |

Decision: **do not fabricate production analytics.** Keep prototype values, make all of them respond to the range, and keep the "Prototype data" footnote. A minimal event model (`menu_view`, `item_detail_open`, `section_dwell`, session id) is documented for later but implemented only if you want it now — it needs real persistence to be meaningful.

## E. Staff / accountability

Today: a flat `ops.state.ops.staff` array with `role` as free text, no permissions, no attribution, no mutation log. To reach "who changed the sea bass price" the prototype needs (a) staff as Owner / Manager slots with real person names, only as many managers as exist; (b) a permission set per person; (c) an `activity` array of `{restaurantId, actorId, actorRole, action, entityType, entityId, entityName, from, to, at}` appended by the existing mutation handlers (price edit, availability cycle, item add/delete, promotion, currency setting, publish). Per-person recent activity lives in the staff detail sheet; the platform-wide feed stays in superadmin.

## F. Superadmin information architecture

- **Restaurants → detail** = the operational profile: overview (name, status, signup date, template, public status), performance summary, staff + recent actions, subscription block, and **read-only** menu currency (primary, guest rates, last updated).
- **Billing / Plan** = platform-level only: the single Hap plan at 2,500 ALL/month, counts of subscribed / active / inactive restaurants, MRR in ALL, and a filterable list that links into restaurant detail. No full restaurant profile here.
- **Settings** = platform switches: Open sign-ups, trial length, AI translations, languages, email templates. No maintenance mode.

## G. Remaining implementation tasks, by dependency

**Phase 1 — finish the currency wiring (highest value, lowest risk)**
1. `styles.css`: add the currency block (`.fx-chip`, `.fx-list`, `.fx-row`, `.rate-row`, `.rate-head`, `.rate-code`, `.rate-name`, `.rate-tools`, `.rate-equation`, `.rate-preview`, `.rate-stale`), mobile-first: equation wraps, rate input ~72px, tools 28px targets, tested at 365px.
2. `ops.js adminSettings`: mount `ctx.currencyCard()` as a card after "Public menu". Delete the orphaned `app.js settingsPage()`.
3. `app.js`: read and harden `handleRateInput` / `setPrimaryCurrency` / `addGuestCurrency` — reject 0, negative, NaN, Infinity, non-numeric, duplicates, >5, unsupported codes; on primary change require confirmation stating numeric prices stay unchanged, and drop the new primary from the secondary list.
4. `app.js:202` migration: store the ALL rate in the `1 ALL = x EUR` normalised direction.
5. `app.js:706`: fx chip label becomes a bare `≈` (drop `ALL`); confirm the sheet's approximate disclaimer.

**Phase 2 — platform currency + plan correctness**
6. `ops.js`: delete local `money`; use `ctx.platformMoney` for MRR, plan price, invoices, revenue, KPIs.
7. `ops.js:25-28,76,214-228`: one plan — Hap, 2,500 ALL/month; overview breakdown becomes subscribed/active/inactive counts instead of a tier breakdown.
8. `ops.js:38,234`: remove maintenance mode state + toggle; keep Open sign-ups.
9. `ops.js restaurantDetail`: add read-only Menu currency section; move billing detail per section F.

**Phase 3 — layout, actions, insights**
10. `styles.css:115`: superadmin scroll fix as diagnosed; verify no nested-scroll trap and nav visible.
11. Duplicate-action cleanup per section C.
12. `analyticsPage`: make hour series, top dishes, languages and promo card all derive from `ui.insightsRange`; "All time" labelled from signup date.

**Phase 4 — accountability (needs a data model, not just UI)**
13. Staff role/person/permission model + activity events appended by existing mutation handlers; per-person activity in the staff sheet. Clearly prototype-persisted (localStorage), no backend.

**Phase 5 — browser verification**
`/admin/settings` (card renders, styled, validation, live preview) · public menu chip + Approximate price sheet · primary ALL vs primary EUR restaurants · `/admin/billing` shows 2,500 Lek · `/super`, `/super/plans`, `/super/restaurants` scroll and show ALL · 462px and 365px widths.

## H. Files to change

| File | Responsibility | Required change | Risk |
| --- | --- | --- | --- |
| `public/hap/styles.css` | all prototype styling | currency block; `.super-shell` height fix | Low; scoped selectors |
| `public/hap/ops.js` | superadmin + real `/admin/settings` | mount currency card, drop local `money`, one plan, remove maintenance, restaurant-detail currency | Medium; touches most superadmin screens |
| `public/hap/app.js` | state, currency engine, admin screens | validation hardening, migration rate fix, chip label, delete dead `settingsPage`, insights range wiring, duplicate actions, activity events | Medium |

## I. Verified complete — do not rebuild

`CURRENCIES` table · `formatCurrency` / `roundHalfUp` / `convertFromPrimary` / `guestRates` / `conversionsFor` · `money` vs `platformMoney` split in `app.js` · one source price per item · ALL demo pricing · stale-rate rule · `currencyCard` markup and its five action handlers · Promote button (already icon-free) · `billingPage` single-plan ALL rendering · pathname routing.

## J. Acceptance checklist

Primary ALL menu renders Lek · primary EUR menu renders € and rate equations say `= EUR` · rate edit updates conversions and never rewrites `item.price` · 0/negative/NaN/duplicate/6th currency all rejected with a message · changing primary asks for confirmation and cannot leave a currency both primary and secondary · fx chip only when conversions enabled and rates valid · Approximate price sheet styled and labelled approximate · every platform figure in ALL, `/admin/billing` shows 2,500 Lek · exactly one Hap plan visible · maintenance toggle gone, Open sign-ups present · superadmin pages scroll with nav visible at 462px and 365px · only one generic preview control and one Share · insights range changes every card · staff actions attributable to a named person.
