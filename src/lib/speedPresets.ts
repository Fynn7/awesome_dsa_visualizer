/** Base step interval at 1× playback (ms between mock steps). */
export const SPEED_BASE_MS = 650;
export const FLIP_BASE_DURATION_MS = 1200;
export const FLIP_MIN_DURATION_MS = 120;
export const FLIP_MAX_DURATION_MS = 1600;

/**
 * Playback rate multipliers from 0.25× to 2× (mostly +0.25× per step; 1.5× → 2× is +0.5×).
 * Delay per step ≈ round(SPEED_BASE_MS / rate).
 */
export const SPEED_RATE_MULTIPLIERS = [
  0.25, 0.5, 0.75, 1, 1.25, 1.5, 2,
] as const;

export const SPEED_PRESETS_MS = [
  ...SPEED_RATE_MULTIPLIERS.map((m) => Math.round(SPEED_BASE_MS / m)),
] as const;

export type SpeedPresetMs = (typeof SPEED_PRESETS_MS)[number];

export function nearestSpeedPresetMs(ms: number): SpeedPresetMs {
  let best: SpeedPresetMs = SPEED_PRESETS_MS[3];
  let bestDiff = Infinity;
  for (const v of SPEED_PRESETS_MS) {
    const d = Math.abs(v - ms);
    if (d < bestDiff) {
      bestDiff = d;
      best = v;
    }
  }
  return best;
}

/** e.g. 0.25x, 1x, 1.25x; for UI ticks and aria-valuetext. */
export function speedRateLabelAtIndex(index: number): string {
  const m = SPEED_RATE_MULTIPLIERS[index];
  if (m === undefined) return "1x";
  return `${m}x`;
}

export function speedRateFromMs(speedMs: number): number {
  return SPEED_BASE_MS / speedMs;
}

export function getFlipDurationMs(
  speedMs: number,
  isAutoPlayingStep: boolean
): number {
  if (!isAutoPlayingStep) {
    return FLIP_BASE_DURATION_MS;
  }
  const rate = speedRateFromMs(speedMs);
  const raw = FLIP_BASE_DURATION_MS / rate;
  return Math.round(
    Math.max(FLIP_MIN_DURATION_MS, Math.min(FLIP_MAX_DURATION_MS, raw))
  );
}

/** Same duration rule as FLIP; use for assignment / value-replace animations. */
export const getAnimationDurationMs = getFlipDurationMs;
