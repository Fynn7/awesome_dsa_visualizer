import { MOTION_CLEANUP_BUFFER_MS } from "./motionTokens";

export const POINTER_ENTER_DURATION_RATIO = 0.4;
export const POINTER_ENTER_MIN_DURATION_MS = 120;
export const POINTER_ENTER_MAX_DURATION_MS = 480;

export const POINTER_ENTER_CLASS = "viz-pointer--entering";
export const POINTER_EXIT_CLASS = "viz-pointer--exiting";

const POINTER_ENTER_DURATION_CSS_VAR = "--viz-pointer-enter-duration";

export function getPointerEnterDurationMs(flipDurationMs: number): number {
  return Math.max(
    POINTER_ENTER_MIN_DURATION_MS,
    Math.min(
      POINTER_ENTER_MAX_DURATION_MS,
      Math.round(flipDurationMs * POINTER_ENTER_DURATION_RATIO)
    )
  );
}

export function getPointerEnterCleanupDelayMs(enterDurationMs: number): number {
  return enterDurationMs + MOTION_CLEANUP_BUFFER_MS;
}

export function setPointerAnimationDuration(
  el: HTMLElement,
  durationMs: number
): void {
  el.style.setProperty(POINTER_ENTER_DURATION_CSS_VAR, `${durationMs}ms`);
}

export function applyPointerEnterAnimation(
  el: HTMLElement,
  durationMs: number
): void {
  setPointerAnimationDuration(el, durationMs);
  el.classList.remove(POINTER_ENTER_CLASS);
  void el.offsetHeight;
  el.classList.add(POINTER_ENTER_CLASS);
}

export function clearPointerEnterAnimation(el: HTMLElement): void {
  el.classList.remove(POINTER_ENTER_CLASS);
}

export function markPointerExiting(el: HTMLElement): void {
  el.classList.add(POINTER_EXIT_CLASS);
}

export function clearPointerExiting(el: HTMLElement): void {
  el.classList.remove(POINTER_EXIT_CLASS);
}
