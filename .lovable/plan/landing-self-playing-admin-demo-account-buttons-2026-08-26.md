# Landing: self-playing admin demo + account buttons

Rebuild the landing screen around a looping, scripted film of the real admin — same components, tokens and dish data the app already uses — plus prototype Sign up / Sign in entry points. Only the landing screen changes; admin, preview and guest menus stay exactly as they are.

## The demo panel

A phone-shaped panel sits between the hero paragraph and the CTA buttons. It plays a ~14s scripted sequence with a gliding cursor, then loops forever.

```text
1  Admin · Menu       cursor glides in, taps "Starters"
                      → category expands, item rows slide in
2  Admin · Edit item  cursor taps "Grilled octopus"
                      → edit sheet rises from the bottom
3  Admin · Price      price ticks 1,600 → 1,450, Save presses
                      → sheet drops, row shows new price, "Saved" toast
4  Switch to guest    cursor hits the Admin/Preview switch
                      → cross-fade to the guest menu, same dish, new price
5  Hold + loop        "Live for every table" caption, fade, restart
```

A caption under the panel names the current beat ("Edit the menu" → "Change a price" → "Guests see it instantly") and three dots show progress. Nothing inside is interactive: tapping anywhere stops the loop and opens the real demo at `/admin`, so the animation doubles as the largest CTA.

Beyond the brief, three touches make it read as product rather than graphic:
- The price ticks digit-by-digit rather than swapping, and the row's price flashes once when it lands.
- The cursor eases with a slight overshoot and a tap-pulse ring, so taps land with weight.
- The guest cross-fade carries the dish photo across, so beat 4 reads as the same dish, not a new screen.

## Behaviour

- Autoplays on load; the static first frame is in the DOM immediately, so there is never an empty box.
- Pauses when the tab is hidden or the panel scrolls out of view; resumes on return.
- `prefers-reduced-motion`: no cursor, no sliding — the same states cross-fade on a slower timer.
- The driver is torn down on every navigation away from the landing screen, so no timer survives.

## Sign up / Sign in

- A slim top row on the landing screen: `Sign in` (quiet) and `Sign up free` (primary), sitting in the prototype bar area above the hero.
- Both open a single sheet reusing the existing sheet shell and form styles: email + password fields, a tab toggle between the two modes, and a note that this is a prototype.
- Submitting (or "Continue as demo restaurant") drops straight into the admin demo. No accounts, no backend, nothing stored beyond the existing local prototype state.

## Technical notes

All inside the existing prototype files, no new dependencies.

- `public/hap/app.js`
  - `landingDemo()` renderer: emits the panel markup with all scene layers present in the DOM, toggled by a `data-scene` attribute on the wrapper.
  - `startLandingDemo()` driver: one timeline array of `{scene, cursor:{x,y}, caption, hold}` steps advanced by a single timer, held on a module-level handle so `render()` can cancel and restart cleanly. `stopLandingDemo()` is called from the `go-landing` / mode-switch / navigation paths.
  - Scene content is built from the same `state` dish data and the existing `money()` and item-row helpers, so demo prices follow the app's currency settings.
  - `authSheet()` reusing `sheetShell`, plus `open-auth` / `auth-submit` actions in the existing action dispatcher.
- `public/hap/styles.css`: `.landing-demo` (phone-ish frame, ~16:10, clipped), `.landing-demo-cursor` (transform-transitioned pointer with tap-pulse), `.landing-demo-scene` layers, `.landing-demo-caption`, `.landing-demo-dots`, `.landing-auth-row`, and a `@media (prefers-reduced-motion: reduce)` block.
- Hero copy and the existing CTAs stay as they are.

## Verification

Browser pass at 430px and 365px: all five beats run and restart, the cursor lands on the elements it appears to tap, the price actually changes in both admin and guest scenes, tapping the panel opens `/admin`, the auth sheet opens and closes, no console errors, and no timer keeps running after leaving the landing screen.
