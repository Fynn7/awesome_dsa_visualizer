/**
 * Single source of truth for motion tokens (durations, easing, thresholds).
 *
 * Consumed by:
 *   - Animation policy modules in `src/lib/*Animation*.ts` (FLIP, pointer lifecycle, etc.)
 *   - The Vite design-tokens plugin (mirrors a subset to `:root` CSS variables)
 *   - UI primitive components in `shared/visualizer-ui/primitives/*`
 *
 * Do not reintroduce duration/easing literals in CSS or components.
 */

/** Emphasized ease-out curve used by all step-transition animations. */
export const MOTION_EASING_EMPHASIZED = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Min delta (px) below which FLIP translation is skipped (no visible movement). */
export const MOTION_MIN_DELTA_PX = 0.5;

/** Buffer added to an animation duration before cleaning up one-shot class toggles. */
export const MOTION_CLEANUP_BUFFER_MS = 120;

/** Base FLIP duration at 1x playback speed; scaled by speedPresets at runtime. */
export const FLIP_BASE_DURATION_MS = 1200;
export const FLIP_MIN_DURATION_MS = 120;
export const FLIP_MAX_DURATION_MS = 1600;

/** Pointer enter animation duration: ratio of FLIP, clamped. */
export const POINTER_ENTER_DURATION_RATIO = 0.4;
export const POINTER_ENTER_MIN_DURATION_MS = 120;
export const POINTER_ENTER_MAX_DURATION_MS = 480;

/**
 * UI primitive transition durations.
 * These are for non-algorithm UI motion (Switch toggle, Dialog fade, Toast slide, etc.);
 * algorithm animations use FLIP_* tokens via speedPresets.
 */
export const UI_TRANSITION_FAST_MS = 140;
export const UI_TRANSITION_BASE_MS = 240;
export const UI_TRANSITION_SLOW_MS = 360;
export const UI_TRANSITION_POINTER_MS = 420;
export const UI_LOOP_PULSE_MS = 450;
export const UI_LOADING_SPIN_MS = 750;
export const UI_PRESENTATION_HINT_MS = 1200;
export const UI_LOADING_SKELETON_MS = 1250;

/** Reduced-motion: slow down spinner to near-static breathing. */
export const UI_REDUCED_MOTION_SPIN_MS = 2200;

/**
 * Subset of motion tokens mirrored to `:root` CSS variables by the Vite plugin.
 * Keep synchronized with any new `var(--motion-*)` usage in `index.css`.
 */
export const MOTION_CSS_VAR_ENTRIES: Record<string, string> = {
  "motion-easing-emphasized": MOTION_EASING_EMPHASIZED,
  "motion-ui-fast": `${UI_TRANSITION_FAST_MS}ms`,
  "motion-ui-base": `${UI_TRANSITION_BASE_MS}ms`,
  "motion-ui-slow": `${UI_TRANSITION_SLOW_MS}ms`,
  "motion-ui-pointer": `${UI_TRANSITION_POINTER_MS}ms`,
  "motion-ui-loop-pulse": `${UI_LOOP_PULSE_MS}ms`,
  "motion-ui-loading-spin": `${UI_LOADING_SPIN_MS}ms`,
  "motion-ui-loading-skeleton": `${UI_LOADING_SKELETON_MS}ms`,
  "motion-ui-presentation-hint": `${UI_PRESENTATION_HINT_MS}ms`,
  "motion-ui-reduced-motion-spin": `${UI_REDUCED_MOTION_SPIN_MS}ms`,
};
