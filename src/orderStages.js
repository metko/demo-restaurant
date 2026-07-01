// Single source of truth for delivery-tracking pacing.
// All demo timing/thresholds live here so speed is a one-line change.

export const STAGES = [
  { key: "confirmed", label: "Order confirmed" },
  { key: "preparing", label: "Preparing your food" },
  { key: "assigned", label: "Rider assigned" },
  { key: "enroute", label: "On its way" },
  { key: "delivered", label: "Delivered" },
];

// Compressed demo wall-clock: the whole journey plays out in ~25s.
export const TOTAL_DURATION_MS = 25000;

// Progress (0→1) boundaries at which each stage BEGINS. The first stage starts
// at 0; `delivered` is only reached when progress clamps to 1.
// Early stages are given more of the timeline so the rider visibly idles near
// the restaurant before setting off.
const STAGE_START = [0, 0.15, 0.4, 0.55, 1];

/**
 * Map a continuous progress value (0→1) to a stage index (0–4).
 */
export function stageForProgress(p) {
  const progress = Math.min(1, Math.max(0, p));
  let index = 0;
  for (let i = 0; i < STAGE_START.length; i++) {
    if (progress >= STAGE_START[i]) index = i;
  }
  return index;
}

/**
 * Waypoints (0→1) the rider snaps to under reduced motion — one per stage.
 * Chosen so the rider idles near the restaurant early and lands on home at the end.
 */
export const STAGE_WAYPOINTS = [0, 0.08, 0.2, 0.6, 1];

/**
 * Integer minutes remaining, derived from progress and an ETA seed (minutes).
 * Counts down toward 0 and reads 0 once delivered.
 */
export function etaMinutesForProgress(p, etaSeed) {
  const progress = Math.min(1, Math.max(0, p));
  if (progress >= 1) return 0;
  return Math.max(1, Math.ceil(etaSeed * (1 - progress)));
}
