# Slice 2 — Stylized SVG delivery map with moving rider

**Type:** AFK · **Blocked by:** Slice 1 (`01-handoff-timeline-spine.md`)
**Source:** `docs/sdd-live-order-tracking.md`

## What to build

Add a stylized, dependency-free SVG map to the tracking screen, with a rider
marker that moves from the restaurant to the customer's home — driven by the
**same** `progress` value that already powers the timeline and ETA (single
source of truth, perfectly in sync).

- An in-file `DeliveryMap` sub-component: an SVG containing a defined `<path>`
  (restaurant → home), a restaurant pin, a home pin, and a rider marker (🛵).
- The rider is positioned via `pathRef.current.getPointAtLength(progress * totalLength)`.
- The path is shaped so the rider visually **idles near the restaurant** during
  the early stages and lands **on the home pin** at delivery.
- CSS/SVG only — no map tiles, no external deps, no network calls.

## Acceptance criteria

- [ ] The tracking screen shows an SVG map with a restaurant pin, a home pin, and a rider marker.
- [ ] The rider marker moves smoothly along the path as progress advances.
- [ ] Map position, timeline highlight, and ETA stay in sync throughout (all derived from one `progress`).
- [ ] The rider idles near the restaurant during early stages and rests on the home pin at delivery.
- [ ] No external map/tile dependencies or network calls are introduced.

## Blocked by

- Slice 1 — Payment→Tracking handoff + timeline spine (`01-handoff-timeline-spine.md`)
