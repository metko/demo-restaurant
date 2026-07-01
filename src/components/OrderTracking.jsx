import { useState, useEffect, useMemo, useRef } from "react";
import confetti from "canvas-confetti";
import {
  STAGES,
  TOTAL_DURATION_MS,
  STAGE_WAYPOINTS,
  stageForProgress,
  etaMinutesForProgress,
} from "../orderStages";
import OrderItemList from "./OrderItemList";

const RIDERS = [
  { name: "Marco R.", avatar: "🧑‍🦱" },
  { name: "Priya S.", avatar: "👩🏽" },
  { name: "Diego L.", avatar: "🧔🏻" },
  { name: "Aisha K.", avatar: "👩🏾‍🦱" },
  { name: "Tom H.", avatar: "🧑🏼" },
];

// Shaped so early arc-length clusters near the restaurant (rider idles) before
// sweeping across to the home pin — driven by getPointAtLength(progress).
const MAP_PATH =
  "M 48 128 c -14 -10 -6 -30 12 -26 c 16 4 8 26 -6 24 c -14 -2 -10 -20 8 -22 " +
  "c 20 -2 14 22 -2 26 C 120 150 210 122 258 92 C 292 72 302 66 314 56";
const RESTAURANT = { x: 48, y: 128 };
const HOME = { x: 314, y: 56 };

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

// A detached path element used purely for geometry (getPointAtLength), so we
// can derive the rider position during render without touching a rendered ref.
const geomPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
geomPath.setAttribute("d", MAP_PATH);
const PATH_TOTAL = geomPath.getTotalLength();

function DeliveryMap({ progress, stageIndex, reducedMotion }) {
  // Under reduced motion the rider snaps between per-stage waypoints instead of
  // gliding continuously.
  const effectiveProgress = reducedMotion ? STAGE_WAYPOINTS[stageIndex] : progress;
  const point = useMemo(() => {
    const p = geomPath.getPointAtLength(effectiveProgress * PATH_TOTAL);
    return { x: p.x, y: p.y };
  }, [effectiveProgress]);

  return (
    <div className="tracking-map">
      <svg viewBox="0 0 360 180" className="tracking-map-svg" role="img"
        aria-label="Map showing the rider travelling from the restaurant to your home">
        <rect x="0" y="0" width="360" height="180" rx="16" className="map-bg" />
        <path
          d={MAP_PATH}
          className="map-route"
          fill="none"
        />
        {/* restaurant pin */}
        <g transform={`translate(${RESTAURANT.x} ${RESTAURANT.y})`}>
          <circle r="13" className="map-pin map-pin--restaurant" />
          <text className="map-pin-emoji" dy="5">🏪</text>
        </g>
        {/* home pin */}
        <g transform={`translate(${HOME.x} ${HOME.y})`}>
          <circle r="13" className="map-pin map-pin--home" />
          <text className="map-pin-emoji" dy="5">🏠</text>
        </g>
        {/* rider */}
        <g
          transform={`translate(${point.x} ${point.y})`}
          className={reducedMotion ? "map-rider map-rider--snap" : "map-rider"}
        >
          <circle r="12" className="map-rider-halo" />
          <text className="map-rider-emoji" dy="5">🛵</text>
        </g>
      </svg>
    </div>
  );
}

function StageTimeline({ stageIndex }) {
  return (
    <ol className="stage-timeline">
      {STAGES.map((stage, i) => {
        const completed = i < stageIndex;
        const current = i === stageIndex;
        return (
          <li
            key={stage.key}
            className={
              "stage-item" +
              (completed ? " stage-item--done" : "") +
              (current ? " stage-item--current" : "")
            }
            aria-current={current ? "step" : undefined}
          >
            <span className="stage-marker" aria-hidden="true">
              {completed ? "✓" : ""}
            </span>
            <span className="stage-label">{stage.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function RiderCard({ rider }) {
  return (
    <div className="rider-card">
      <span className="rider-avatar" aria-hidden="true">{rider.avatar}</span>
      <div className="rider-meta">
        <span className="rider-name">{rider.name}</span>
        <span className="rider-role">Your rider · on the way 🛵</span>
      </div>
    </div>
  );
}

export default function OrderTracking({ order, onNewOrder }) {
  const reducedMotion = usePrefersReducedMotion();
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const confettiFiredRef = useRef(false);
  const [rider] = useState(() => RIDERS[Math.floor(Math.random() * RIDERS.length)]);

  // Single rAF loop: advances one continuous progress (0→1), clamps and stops.
  useEffect(() => {
    function tick(now) {
      if (startRef.current == null) startRef.current = now;
      const elapsed = now - startRef.current;
      const p = Math.min(1, elapsed / TOTAL_DURATION_MS);
      setProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null; // clamp at 1 and stop
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  const stageIndex = stageForProgress(progress);
  const stage = STAGES[stageIndex];
  const delivered = stage.key === "delivered";
  const riderAssigned = stageIndex >= STAGES.findIndex((s) => s.key === "assigned");
  const etaMinutes = etaMinutesForProgress(progress, order?.etaMinutes ?? 30);

  // Single guarded confetti burst when we hit "delivered"; skipped if reduced motion.
  useEffect(() => {
    if (!delivered || confettiFiredRef.current) return;
    confettiFiredRef.current = true;
    if (reducedMotion) return;
    confetti({
      particleCount: 120,
      spread: 72,
      origin: { y: 0.6 },
      colors: ["#00c1b2", "#1a271f", "#ffd166", "#ffffff"],
    });
    const t = setTimeout(() => {
      confetti({ particleCount: 80, spread: 110, startVelocity: 34, origin: { y: 0.5 } });
    }, 220);
    return () => clearTimeout(t);
  }, [delivered, reducedMotion]);

  if (!order) return null;

  return (
    <main className="tracking">
      <div className="tracking-panel">
        <header className="tracking-header">
          <div>
            <p className="tracking-order-no">Order {order.orderNumber}</p>
            <h2 className="tracking-title">
              {delivered ? "Delivered 🎉" : stage.label}
            </h2>
          </div>
          <div className="tracking-eta" aria-live="polite">
            <span className={"eta-dot" + (reducedMotion ? " eta-dot--static" : "")} />
            {delivered ? (
              <span className="tracking-eta-text">Enjoy your meal!</span>
            ) : (
              <span className="tracking-eta-text">Arriving in ~{etaMinutes} min</span>
            )}
          </div>
        </header>

        <DeliveryMap
          progress={progress}
          stageIndex={stageIndex}
          reducedMotion={reducedMotion}
        />

        <StageTimeline stageIndex={stageIndex} />

        {riderAssigned && <RiderCard rider={rider} />}

        <section className="tracking-summary">
          <h3 className="tracking-summary-title">Order summary</h3>
          <OrderItemList items={order.items} className="modal-item-list--receipt" />
          <div className="modal-totals">
            <div className="modal-totals-row modal-totals-total">
              <span>Total</span>
              <span>€{order.total.toFixed(2)}</span>
            </div>
          </div>
        </section>

        <button
          className={
            "modal-btn-primary modal-btn-full tracking-neworder" +
            (delivered ? " tracking-neworder--emphasized" : "")
          }
          onClick={onNewOrder}
        >
          Start New Order
        </button>
      </div>
    </main>
  );
}
