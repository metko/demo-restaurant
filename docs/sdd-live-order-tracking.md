# SDD — Live Order Tracking Screen

**Status:** Draft · **Date:** 2026-07-01 · **App:** roofood (Deliveroo-style React/Vite prototype)

## 1. Summary

After a successful payment, hand the user off from the checkout modal to a
full-screen **live order tracking** experience: a compressed, animated journey
through five delivery stages, a stylized SVG map with a rider marker moving from
the restaurant to the customer's home, a live ETA countdown, and a celebratory
confetti burst on delivery.

This is a prototype/demo feature — no backend, no real geolocation, no
persistence. All motion is client-side and self-contained so it cannot fail in a
live demo.

## 2. Goals / Non-goals

**Goals**
- A believable "your order is on its way" screen with a moving rider.
- Everything (map, timeline, ETA) driven by one source of truth, perfectly in sync.
- Compressed wall-clock (~25s end-to-end) with a real-looking minute countdown.
- A satisfying "Delivered 🎉" terminal moment with confetti.

**Non-goals**
- Real maps / tiles / geolocation / API keys / network calls.
- Persistence across refresh (localStorage) — deferred to the order-history feature.
- Real rider contact, routing, or multiple concurrent orders.
- A router — stays single-page with an app-level `view` switch.

## 3. UX Flow

```
Menu + Cart
   │ checkout
   ▼
PaymentModal: summary → card → processing → success
   │  success step shows receipt + "See my order (5s)" button
   │  • click, OR 5s auto-timer  →  onSuccess(order)
   ▼
App: view = "tracking", cart cleared, activeOrder = order
   ▼
OrderTracking (full screen)
   Confirmed → Preparing → Rider assigned → On its way → Delivered 🎉
   │ "Start New Order"
   ▼
App: view = "shop", activeOrder = null   (back to Menu + Cart)
```

## 4. Key Decisions (resolved in design review)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Surface | Full-screen **view** in `App.jsx` state (`"shop" \| "tracking"`); order snapshot lifted to App. Not a modal step, not a router. |
| 2 | Stages & timing | Five stages, **compressed demo timers** (~4–6s each, ~25s total). ETA header still *reads* in real-world minutes. |
| 3 | Map | **Stylized SVG map** — CSS/SVG only, restaurant pin + home pin + animated rider. No tiles/deps/network. |
| 4 | Motion driver | **Single continuous `progress` (0→1) via `requestAnimationFrame`**; stage, ETA, and rider position all derived from it. |
| 5 | Layout | Full layout: header ETA · map · timeline · rider card · order summary · footer button. |
| 6 | Data handoff | `PaymentModal` builds an **order object**, hands up via `onSuccess(order)`; App stores as `activeOrder`. |
| 6b | Auto-advance | Success step has a **visible, cancelable 5s countdown** on "See my order"; guarded against double-fire. |
| 7 | End state | **Celebratory terminal state**, user-driven reset (no auto-return). |
| 8 | Confetti | **`canvas-confetti`** (catdad), single guarded burst on delivery, skipped under reduced-motion. |
| 9 | Guards / a11y | rAF cleanup + clamp at 1; respect `prefers-reduced-motion`; `aria-live` ETA + `aria-current` stage; durations as named constants. |
| 10 | Files | New `OrderTracking.jsx` (+ in-file sub-components) and `orderStages.js` helper module. |

## 5. Architecture

### 5.1 App state (`src/App.jsx`)
- New state: `view` (`"shop" | "tracking"`, default `"shop"`) and `activeOrder` (order object or `null`).
- New handler `handleOrderPlaced(order)`: `setActiveOrder(order)`, `setView("tracking")`, `setCart([])`, `setShowPayment(false)`.
- `PaymentModal`'s `onSuccess` is wired to `handleOrderPlaced`.
- Render: `view === "shop"` → existing `Menu` + `Cart`; `view === "tracking"` → `<OrderTracking order={activeOrder} onNewOrder={() => { setActiveOrder(null); setView("shop"); }} />`.
- Header stays; the delivery-ETA pill may be hidden on the tracking view (the tracking header owns the live ETA).

### 5.2 Order object (built in `PaymentModal`, consumed by `OrderTracking`)
```js
{
  orderNumber,   // "DL-XXXXX" (already generated in modal)
  orderTime,     // Date
  items: cart,   // snapshot of cart lines (id, name, emoji, price, quantity)
  subtotal, tax, total,
  etaMinutes,    // seed from deliveryInfo, e.g. random in [etaMin, etaMax] or etaMax
}
```

### 5.3 `PaymentModal` success step changes
- Primary button label: **"See my order (Ns)"** with a draining thin progress bar (or live count).
- `useEffect` on `step === "success"`: `setTimeout(fire, 5000)`, cleared on unmount / early click.
- `fire()` calls `onSuccess(order)` exactly once (a `useRef` / guard flag prevents click + timer double-fire).
- "Start New Order" button is **removed** from the modal (moves to tracking footer).

### 5.4 `src/orderStages.js`
```js
export const STAGES = [
  { key: "confirmed",  label: "Order confirmed" },
  { key: "preparing",  label: "Preparing your food" },
  { key: "assigned",   label: "Rider assigned" },
  { key: "enroute",    label: "On its way" },
  { key: "delivered",  label: "Delivered" },
];

export const TOTAL_DURATION_MS = 25000;   // compressed demo wall-clock
// progress thresholds per stage, path-shaping constants, etc.

export function stageForProgress(p) { /* → stage index/key */ }
export function etaMinutesForProgress(p, etaSeed) { /* → integer minutes remaining */ }
```
All pacing lives here so the demo speed is a one-line change.

### 5.5 `src/components/OrderTracking.jsx`
- Owns `progress` state, advanced by a `requestAnimationFrame` loop from mount until `progress >= 1` (then clamps and stops).
- Derives: `stageIndex = stageForProgress(progress)`, `etaMin = etaMinutesForProgress(...)`, rider point via `pathRef.current.getPointAtLength(progress * totalLength)`.
- In-file sub-components (promote to own files only if they grow):
  - **`DeliveryMap`** — SVG with a defined `<path>` (restaurant → home), the two pins, and the rider marker (🛵) positioned at the interpolated point. Path is shaped so the rider visually idles near the restaurant during early stages.
  - **`StageTimeline`** — ordered list of the 5 stages; completed = ticked, current = highlighted + `aria-current="step"`.
  - **`RiderCard`** — fake rider name + emoji avatar; renders once `stage >= "assigned"`. No contact actions.
- Header: order number + `aria-live="polite"` ETA reading "Arriving in ~N min", flipping to "Delivered 🎉" at the end; reuses the pulsing `.eta-dot`.
- Order summary: reuse the receipt markup from `PaymentModal` success (extract a shared `OrderItemList` only if the lift is clean; otherwise duplicate ~8 lines).
- Footer: **"Start New Order"** → `onNewOrder()`; emphasized once delivered.

### 5.6 Confetti
- `pnpm add canvas-confetti`; `import confetti from "canvas-confetti"`.
- Fire once when stage becomes `delivered` (guard flag). Optionally a double-pop.
- Skipped entirely under `prefers-reduced-motion`.

## 6. Motion & Accessibility Guardrails
- rAF handle stored in a ref; cancelled on unmount; loop stops at `progress = 1`.
- `prefers-reduced-motion: reduce`: skip confetti, snap rider between stage waypoints instead of continuous motion, freeze the pulsing dot — timeline + ETA still advance so the feature still works.
- Timeline is a semantic ordered list; active step has `aria-current`.
- ETA lives in an `aria-live="polite"` region.
- All durations/thresholds are named constants in `orderStages.js`.

## 7. Files Touched
| File | Change |
|------|--------|
| `src/App.jsx` | Add `view` + `activeOrder` state, `handleOrderPlaced`, conditional render. |
| `src/components/PaymentModal.jsx` | Build order object; "See my order (5s)" button + guarded auto-timer; remove "Start New Order". |
| `src/components/OrderTracking.jsx` | **New** — full tracking screen + in-file `DeliveryMap`, `StageTimeline`, `RiderCard`. |
| `src/orderStages.js` | **New** — stages, duration constants, `progress → stage/eta` helpers. |
| `src/App.css` (or new css) | Tracking screen + map + timeline + rider card styles (Deliveroo teal). |
| `package.json` | Add `canvas-confetti`. |
| `src/components/OrderItemList.jsx` | **New (optional)** — shared receipt list, only if a clean extraction. |

## 8. Acceptance Criteria
1. Paying → success step shows a receipt with "See my order (5s)"; clicking OR waiting 5s opens the tracking screen (never both / never twice).
2. Tracking screen shows order number, live ETA countdown, SVG map, 5-stage timeline, rider card (after "assigned"), order summary, footer button.
3. The rider marker moves smoothly along the path; map, timeline highlight, and ETA stay in sync throughout.
4. Journey completes in ~25s; at the end: stage = "Delivered 🎉", rider on home pin, confetti fires once, rAF stops.
5. "Start New Order" returns to the menu with an empty cart and `activeOrder` cleared.
6. Under `prefers-reduced-motion`, no confetti and no continuous motion, but the timeline/ETA still complete.
7. No console errors, no runaway timers/rAF after unmount.

## 9. Out of Scope / Follow-ups
- Persist `activeOrder` + push to an order-history array (feeds idea #6, "Reorder").
- Real rider contact / chat.
- Kiosk/loop mode (auto-reset after delivery) — one-line addition later.
