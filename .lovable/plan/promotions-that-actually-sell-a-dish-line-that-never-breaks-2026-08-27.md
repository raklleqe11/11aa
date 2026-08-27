# Promotions that actually sell, a dish line that never breaks, and an admin Menu built for service

I re-read the code and pushed back on my first draft. Three things in it were wrong or too weak, and the corrections change the shape of the work.

## What was wrong with the first version

1. **"Allergens 3" was a downgrade.** Replacing "Contains gluten +3" with a bare count removes the one word a diner scans for. The real defect is not the wording, it is that a wrapping text row and a two-line price block fight for the same horizontal space. Fix the layout, keep the information.
2. **It ignored a hard limit in the code.** `savePromotion` (app.js:1765) switches off every other promotion, and `getPromoted()` returns the first one it finds. One promotion at a time. A restaurant with a lunch deal and a dessert special cannot express that today. No amount of new card styling fixes that — the data model has to change first.
3. **It left two competing promotion surfaces.** The Promote tab and the per-item Promote button are separate mental models. Adding a third entry point on the Menu page would make it worse.

## 1. The dish row — fix the geometry, keep the words

The card becomes a strict three-part grid: image · copy (`min-w-0`) · price column (`shrink-0`).

- **Price column** owns its own vertical space: primary price on the first line, `≈ €6.12` beneath it in muted small type, right-aligned. It never sits inline with the badges again.
- **Badge row** is one line, `overflow: hidden`, `flex-wrap: nowrap`. Priority: diet pill → spice pill → allergen pill. Allergen pill keeps the readable form ("Contains gluten") and appends `+3` only when there are more.
- Anything that does not fit collapses into a single **`See details`** chip at the end of the row. That chip and the badges all open the existing dish-details sheet, where the full allergen list, every diet tag and the spice level are laid out properly.
- Verified at 430 / 390 / 365px and in dark mode.

## 2. Promotions — a real model, then real presentation

### Data model first (the unlock)

- **Multiple item promotions allowed.** Remove the "switch everything else off" line. Instead the admin sees a live count and a soft warning past three: *"4 promotions active — the menu stops feeling special."* Guidance, not a hard block.
- **Category promotions become first-class**, stored per category (`promotion: {active, label, tint, style}`) rather than the single global `categoryTakeover` slot, so two sections can be styled differently.
- Each item promotion gains **`wasPrice`** and **`terms`** (e.g. "Today only · 2 plates minimum"), plus honest **scheduling**: `until` = tonight / a date / no end. "Tonight" currently claims to expire and does not; it will, and expired promotions fall off automatically.
- All of it lands through the existing versioned migration, preserving saved data.

### Public presentation — five genuinely different cards

Not one card with a recoloured border. Each style is a different composition, each keeps the price in a protected block, each works on light and dark:

1. **Framed** — brand border with the label notched into the top edge. The quiet option.
2. **Filled** — solid brand card, inverted text, price large in the serif face.
3. **Offer strip** — normal card plus a footer band: "Offer includes · <terms>" left, `was €12.50` struck through with the new price large on the right.
4. **Ribbon** — diagonal corner ribbon carrying the promo label; copy layout untouched.
5. **Editorial** — full-bleed image on top, copy below, price in its own block underneath.

**Category promotion** is a different treatment entirely: the whole section sits on a tinted band with rounded ends, gets a kicker label above the heading ("Featured tonight"), a coloured heading, and its chip in the sticky bar is highlighted. Scrolling past it, the eye lands on the block, not on individual borders.

### Admin — one promotions surface, two entry points

The **Promote tab becomes the promotions manager**: a list of everything currently live (item or category), each row showing style, label, and when it ends, with edit / end actions, plus "New promotion" → choose *an item* or *a category*.

The Menu page gets **entry points, not a second manager**: a "Promote" action in each item's row menu, and a small "Promote this category" action in the category header. Both open the same editor sheet the Promote tab uses.

The editor sheet is rebuilt so the style gallery shows the **actual card the guest will see** with that dish's real name, image and price — currently it shows an abstract swatch, which is why nobody can predict the result.

The reference screenshots inform the offer-strip and ribbon treatments only; nothing is copied verbatim, and no "keep this style" chrome from those mockups enters the guest menu.

## 3. Admin Menu — ordered by what happens during service

1. **Head** — "Menu", counts, one primary **`+`** button opening the existing "Add item / Add category" chooser.
2. **Quick actions** — three, not five. More than three stops being quick:
   - **Mark sold out** — opens a bulk availability picker (tap dishes, one Save). This is the single most frequent job in a service and today it takes one tap per dish, buried in a row.
   - **Update prices** — a flat list of every dish with an inline price field.
   - **Promote** — the chooser above.
   Reorder stays where it belongs, inside each category. Design/translations/currency stay off this page.
3. **Search + filters** — filter chips carry live counts (`Sold out 2`, `Promoted 3`) so the state is visible before tapping.
4. **Category list** — promoted categories carry a badge; promoted items show a small brand dot; sold-out items dim. Each item row collapses its six controls into name · status · price and a single **`…`** menu (Edit, Availability, Promote, Move, Delete), so a row is one clean line at 365px.

## Technical notes

All work stays in `public/hap/app.js` and `public/hap/styles.css`. Touched: `itemBadges`, `renderPublicItem`, `renderPublicCategory`, `menuPrice`/`approxPrice` markup, `adminMenu`, `renderAdminCategory`, `renderAdminItem`, `adminPromote`, the promote sheet, `savePromotion`, `getPromoted` (becomes `getPromotions()`), and the state migration. `categoryTakeover` is migrated into per-category promotions and its old key retired. No backend, no schema, no new dependencies.

Verification: browser pass at 430 / 390 / 365px, light and dark, covering — badge row never wraps and never hides the price · each of the five item styles plus the category band render correctly · two simultaneous promotions coexist · a "tonight" promotion expires · bulk sold-out and bulk price editing round-trip and persist.
