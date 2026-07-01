# Slice 1 — Payment→Tracking handoff + timeline spine

**Type:** AFK · **Blocked by:** None — can start immediately
**Source:** `docs/sdd-live-order-tracking.md`

## What to build

The end-to-end walking skeleton for live order tracking. After a successful
payment, hand the user from the checkout modal to a full-screen tracking view
driven by a single source of truth.

- `PaymentModal` builds an **order object** on success and hands it up via
  `onSuccess(order)`:
  ```js
  { orderNumber, orderTime, items: cart, subtotal, tax, total, etaMinutes }
  ```
  The success step shows a visible, **cancelable "See my order (Ns)"** button
  with a draining countdown. Clicking OR the 5s timer fires `onSuccess(order)`
  **exactly once** (a ref/guard flag prevents click + timer double-fire). The
  old "Start New Order" button is removed from the modal.
- `App` gains `view` (`"shop" | "tracking"`, default `"shop"`) and `activeOrder`
  state, plus `handleOrderPlaced(order)` which sets `activeOrder`, switches
  `view` to `"tracking"`, clears the cart, and closes the modal. `view === "shop"`
  renders the existing Menu + Cart; `view === "tracking"` renders `OrderTracking`.
- New `orderStages.js` owns the 5 stages, `TOTAL_DURATION_MS` (~25000), and pure
  helpers `stageForProgress(p)` and `etaMinutesForProgress(p, etaSeed)`. All
  pacing lives here so demo speed is a one-line change.
- New `OrderTracking.jsx` owns a single continuous `progress` (0→1) advanced by a
  `requestAnimationFrame` loop, from which the **stage** and **ETA** are derived.
  It renders the header (order number + live ETA "Arriving in ~N min"), the
  5-stage `StageTimeline` (semantic ordered list; completed = ticked, current =
  highlighted with `aria-current="step"`), and a footer **"Start New Order"**
  button wired to `onNewOrder()` which clears `activeOrder` and returns to `shop`.

No map, rider card, or confetti in this slice — those are added by later slices.

## Acceptance criteria

- [ ] Paying → success step shows a receipt with a "See my order (5s)" button and a visible draining countdown.
- [ ] Clicking the button OR waiting 5s opens the tracking screen — never both, never twice.
- [ ] Tracking screen shows the order number, a live ETA countdown, and the 5-stage timeline.
- [ ] The timeline's current stage advances in sync with the derived ETA as progress increases.
- [ ] ETA lives in an `aria-live="polite"` region; the current step has `aria-current="step"`; the timeline is a semantic ordered list.
- [ ] "Start New Order" returns to the menu with an empty cart and `activeOrder` cleared.
- [ ] Pacing constants (stages, total duration, thresholds) live in `orderStages.js`.

## Blocked by

None — can start immediately.
