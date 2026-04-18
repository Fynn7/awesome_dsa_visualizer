import {
  MOTION_EASING_EMPHASIZED,
  MOTION_MIN_DELTA_PX,
} from "./motionTokens";

export const POINTER_MOVE_EASING = MOTION_EASING_EMPHASIZED;
export const POINTER_MOVE_MIN_DELTA_PX = MOTION_MIN_DELTA_PX;

const POINTER_REST_TRANSFORM = "translate(-50%, 0)";

/**
 * Single source of truth for pointer FLIP movement styles.
 * Update this file to change movement animation behavior for all algorithms.
 */
export function primePointerMoveFlip(
  el: HTMLElement,
  deltaX: number
): void {
  el.style.willChange = "transform";
  el.style.transition = "none";
  el.style.transform = `translate(calc(-50% + ${deltaX}px), 0)`;
}

export function playPointerMoveFlip(
  el: HTMLElement,
  durationMs: number
): void {
  el.style.transition = `transform ${durationMs}ms ${POINTER_MOVE_EASING}`;
  el.style.transform = POINTER_REST_TRANSFORM;
}

export function settlePointerMoveAtRest(el: HTMLElement): void {
  el.style.willChange = "";
  el.style.transition = "";
  el.style.transform = POINTER_REST_TRANSFORM;
}
