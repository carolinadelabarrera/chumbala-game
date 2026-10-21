# Phase 7 — mobile polish (manual acceptance pending)

No gameplay rules, physics, enemies, levels, save schema, or companion AI changed.
Phase 8 is not started.

## Layout and presentation

- The logical canvas remains 1280×720, with Phaser FIT / CENTER_BOTH. Phone zoom
  remains 1.3. DOM controls use CSS pixels independently of world scaling.
- Canvas, HUD, controls, and choice panels now share `#game`, which applies the
  four native safe-area insets once. UI uses consistent inner gutters and choice
  panels center within this safe rectangle, including asymmetric notches.
- The container uses `100dvh` with a percentage-height fallback. It follows usable
  viewport height as Safari chrome changes. Phone control height stays 72 CSS px
  (80 on taller viewports); toolbar motion does not resize thumb targets.
- Movement targets remain at least 64 CSS px wide. JUMP/GIVE are at least 104 wide,
  with different silhouettes and icons. Press feedback is immediate. Rest/end/menu
  buttons are 72 high with 18px labels and large icons; choices retain equal weight.
- A measured short-screen rest overlap required camera-only bottom overscan of
  40 logical units. This lifts the ground presentation to keep feet/sitting Xolo
  above the panel. World dimensions, collisions, jump physics, speed, and timing
  are unchanged. Tablet/desktop framing is unchanged; no look-ahead was added.
- HUD remains pointer-transparent and uses fixed heart slots.

## Input and interruption handling

Each pointer owns one abstract action. Releasing it does not release another
pointer or a second finger on the same action. Capture is explicitly released on
cancel, blur, rest, portrait and shutdown. Window release handling is a fallback
for rejected capture; stale capture loss from another button is ignored.

Portrait, direct landscape flips, and visibility interruptions clear held actions
and queued input. Scene orientation handling also clears buffered jump history.
Hidden/disabled controls reject new presses. A choice press carried through an
orientation change or blur cannot select a button on its later pointer click;
the player makes a fresh press. Duplicate clicks remain blocked immediately.

Scoped `touch-action: none` and the Safari gesture fallback are retained. Browser
viewport zoom metadata remains unrestricted. Gesture ownership clears on page
interruptions, preventing stale game touches from suppressing unrelated gestures.

## Runtime work

Resize notifications are coalesced to one scale refresh per animation frame. A
ResizeObserver catches settled safe-area/container changes; observers, callbacks
and pending frames are cleaned up. Media queries are cached, repeated button
availability writes are avoided, and input snapshots no longer allocate a Set.
No telemetry, performance service or unbounded visual effect was added.

## Validation boundaries

Browser checks cover 568×320, 740×360, 852×393, 1024×768 and 1280×720. CSS safe-area
inputs are simulated left/right; this verifies layout math, not a physical notch.
Tests cover target size, spacing, HUD pass-through, world clearance, height changes,
pointer ownership/cancellation, interrupted jump/chase/hints/rest/ending, EndScene,
single replay transitions and existing save/continue behavior. Native multi-touch
injection uses Chromium; deterministic pointer and layout checks run in WebKit too.

Headless timing is not an iPhone FPS benchmark. Safari chrome animation, physical
thumb comfort, native pinch/double-tap behavior, hardware safe areas, real storage
persistence, and sustained performance still require an iPhone playthrough.

## Real iPhone acceptance

1. Test both landscape orientations, including a direct flip. Check HUD, all
   controls, character feet, Xolo sitting, rest and ending choices against the notch.
2. Hold LEFT/RIGHT and tap JUMP/GIVE; release either finger first. Check pressed
   feedback, no stuck movement, and no ghost jump/offer.
3. Try pinch, double-tap and drag on game/controls/choices. No page zoom or scrolling.
4. Expand/collapse Safari chrome. Targets should keep their size and remain usable;
   world framing should recover without losing a held action on mere height change.
5. Interrupt movement, jumping, chase, GIVE, hints, rest and ending with portrait.
   Return to landscape: no stale action, automatic choice, duplicate UI or skipped beat.
6. Evade and cure the zombie, inspect Pan transfer, Xolo walking/guidance, and both
   rest choices. Save/reload/CONTINUE, finish, and PLAY AGAIN repeatedly.

Only the owner can accept real-device comfort and Phase 7 after this review.
