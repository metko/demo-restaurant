# Slice 5 — Reduced-motion & lifecycle hardening

**Type:** AFK · **Blocked by:** Slice 1 (`01-handoff-timeline-spine.md`), Slice 2 (`02-svg-map-moving-rider.md`), Slice 4 (`04-delivery-confetti.md`)
**Source:** `docs/sdd-live-order-tracking.md`

## What to build

Make the tracking experience robust and accessible, and prove it cannot leak
timers in a live demo.

- Respect `prefers-reduced-motion: reduce`:
  - Skip the confetti burst entirely.
  - Snap the rider between stage waypoints instead of continuous motion.
  - Freeze the pulsing `.eta-dot`.
  - The timeline and ETA still advance so the feature still works.
- Lifecycle guards: the `requestAnimationFrame` handle is stored in a ref and
  cancelled on unmount; the loop stops and clamps at `progress = 1`; no runaway
  timers or rAF callbacks fire after unmount.

## Acceptance criteria

- [ ] Under `prefers-reduced-motion`, no confetti fires and there is no continuous motion (rider snaps between waypoints, pulsing dot frozen).
- [ ] Under `prefers-reduced-motion`, the timeline and ETA still complete the journey.
- [ ] The rAF loop stops and clamps at `progress = 1` (no overshoot).
- [ ] The rAF handle is cancelled on unmount — no timers/rAF callbacks fire after the tracking screen is left.
- [ ] No console errors during or after the journey.

## Blocked by

- Slice 1 — Payment→Tracking handoff + timeline spine (`01-handoff-timeline-spine.md`)
- Slice 2 — Stylized SVG delivery map with moving rider (`02-svg-map-moving-rider.md`)
- Slice 4 — Delivery confetti celebration (`04-delivery-confetti.md`)
