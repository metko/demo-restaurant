# Slice 4 — Delivery confetti celebration

**Type:** AFK · **Blocked by:** Slice 1 (`01-handoff-timeline-spine.md`)
**Source:** `docs/sdd-live-order-tracking.md`

## What to build

A satisfying terminal moment when the order is delivered.

- Add the `canvas-confetti` (catdad) dependency: `pnpm add canvas-confetti`.
- Fire a **single guarded burst** (optionally a double-pop) exactly when the
  stage becomes `delivered`; a guard flag prevents re-firing.
- The terminal state reads "Delivered 🎉" and the "Start New Order" footer
  button is emphasized once delivered.

Reduced-motion handling for confetti is covered by Slice 5.

## Acceptance criteria

- [ ] `canvas-confetti` is added as a dependency and imported in the tracking screen.
- [ ] Reaching the delivered stage fires a confetti burst exactly once (never re-fires on re-render).
- [ ] The header flips to "Delivered 🎉" and the "Start New Order" button is visually emphasized at the terminal state.

## Blocked by

- Slice 1 — Payment→Tracking handoff + timeline spine (`01-handoff-timeline-spine.md`)
