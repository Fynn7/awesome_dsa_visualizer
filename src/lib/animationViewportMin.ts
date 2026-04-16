/** When `viz-fit-viewport` is at or below these sizes, the workspace may auto-hide the Animation panel. */
export const MIN_ANIMATION_VIEWPORT_WIDTH_PX = 140;
export const MIN_ANIMATION_VIEWPORT_HEIGHT_PX = 100;

/** Panel chrome above the viewport (title bar, borders, padding slack). */
export const ANIMATION_PANEL_VERTICAL_CHROME_PX = 44;
/** Horizontal slack so the viewport can still reach `MIN_ANIMATION_VIEWPORT_WIDTH_PX`. */
export const ANIMATION_PANEL_HORIZONTAL_CHROME_PX = 10;

/** Minimum outer `Panel` size for the Animation column (matches auto-close thresholds). */
export const ANIMATION_PANEL_MIN_OUTER_HEIGHT_PX =
  MIN_ANIMATION_VIEWPORT_HEIGHT_PX + ANIMATION_PANEL_VERTICAL_CHROME_PX;
export const ANIMATION_PANEL_MIN_OUTER_WIDTH_PX =
  MIN_ANIMATION_VIEWPORT_WIDTH_PX + ANIMATION_PANEL_HORIZONTAL_CHROME_PX;

/**
 * Maps a minimum outer size in px to a `react-resizable-panels` `minSize` percentage.
 * @param fallbackPct used when `containerPx` is unknown or invalid
 */
export function panelMinPercentFromOuterPx(
  minOuterPx: number,
  containerPx: number,
  fallbackPct: number,
  maxPct: number
): number {
  if (
    !Number.isFinite(minOuterPx) ||
    minOuterPx <= 0 ||
    !Number.isFinite(containerPx) ||
    containerPx <= 0
  ) {
    return fallbackPct;
  }
  const pct = (minOuterPx / containerPx) * 100;
  return Math.min(maxPct, Math.max(fallbackPct, pct));
}
