import {
  MOTION_CLEANUP_BUFFER_MS,
  MOTION_EASING_EMPHASIZED,
  MOTION_MIN_DELTA_PX,
} from "./motionTokens";

const BAR_ASSIGNING_CLASS = "viz-bar--assigning";
const BAR_ASSIGN_DURATION_CSS_VAR = "--viz-assign-duration";

export function getBarHeightPercent(value: number, maxValue: number): string {
  return `${Math.round((value / maxValue) * 100)}%`;
}

export function shouldAnimateBarFlip(
  deltaX: number,
  threshold = MOTION_MIN_DELTA_PX
): boolean {
  return Math.abs(deltaX) >= threshold;
}

export function primeBarFlip(
  el: HTMLElement,
  deltaX: number,
  layoutScale: number
): void {
  el.style.willChange = "transform";
  el.style.transition = "none";
  el.style.transform = `translateX(${deltaX / layoutScale}px)`;
}

export function playBarFlip(el: HTMLElement, durationMs: number): void {
  el.style.transition = `transform ${durationMs}ms ${MOTION_EASING_EMPHASIZED}`;
  el.style.transform = "translateX(0)";
}

export function resetBarFlipStyles(el: HTMLElement): void {
  el.style.transition = "";
  el.style.transform = "";
  el.style.willChange = "";
}

export function primeBarAssignAnimation(
  el: HTMLElement,
  fromHeightPercent: string,
  durationMs: number
): void {
  el.style.setProperty(BAR_ASSIGN_DURATION_CSS_VAR, `${durationMs}ms`);
  el.style.height = fromHeightPercent;
  el.style.transition = "none";
  el.classList.remove(BAR_ASSIGNING_CLASS);
}

export function playBarAssignAnimation(
  el: HTMLElement,
  toHeightPercent: string,
  durationMs: number
): void {
  el.style.transition = `height ${durationMs}ms ${MOTION_EASING_EMPHASIZED}`;
  el.style.height = toHeightPercent;
  el.classList.add(BAR_ASSIGNING_CLASS);
}

export function finishBarAssignAnimation(
  el: HTMLElement,
  toHeightPercent: string
): void {
  el.style.transition = "";
  el.classList.remove(BAR_ASSIGNING_CLASS);
  el.style.height = toHeightPercent;
}

export function getBarAssignCleanupDelayMs(durationMs: number): number {
  return durationMs + MOTION_CLEANUP_BUFFER_MS;
}
