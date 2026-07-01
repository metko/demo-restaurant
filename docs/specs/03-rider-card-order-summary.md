# Slice 3 — Rider card + order summary receipt

**Type:** AFK · **Blocked by:** Slice 1 (`01-handoff-timeline-spine.md`)
**Source:** `docs/sdd-live-order-tracking.md`

## What to build

Flesh out the tracking screen with the rider card and the order summary receipt.

- An in-file `RiderCard` sub-component: a fake rider name + emoji avatar. It
  renders **only once `stage >= "assigned"`**. No contact/chat actions.
- An order summary on the tracking screen showing the items, quantities, and
  total from `activeOrder`. Reuse the receipt markup from the `PaymentModal`
  success step — extract a shared `OrderItemList` component only if the lift is
  clean; otherwise duplicate the small amount of markup.

## Acceptance criteria

- [ ] The rider card is hidden until the stage reaches "Rider assigned", then appears with a name + emoji avatar.
- [ ] The rider card exposes no contact/chat actions.
- [ ] The tracking screen shows an order summary (items, quantities, total) matching the placed order.
- [ ] The receipt presentation is consistent with the `PaymentModal` success step (shared or faithfully duplicated markup).

## Blocked by

- Slice 1 — Payment→Tracking handoff + timeline spine (`01-handoff-timeline-spine.md`)
