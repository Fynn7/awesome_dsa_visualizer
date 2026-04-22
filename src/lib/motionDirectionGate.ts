/**
 * Global gate that decides whether step-transition animations should play.
 *
 * Design:
 * - "forward" steps (STEP / TICK) always animate.
 * - "back" steps (STEP_BACK) only animate when the user opted into
 *   reverse replay via the Settings toggle. The default snaps instantly so
 *   users can scrub backward without waiting for animations.
 * - "instant" transitions (RESET / JUMP_TO_END / SET_ALGORITHM / initial
 *   mount) always skip animations; the panel rebuilds from scratch.
 *
 * Applied globally across algorithms (sorts, union-find, etc.) so that the
 * Settings toggle controls one coherent behavior.
 */
import type { StepDirection } from "./executionReducer";

export function shouldPlayTransitions(
  direction: StepDirection,
  replayOnBack: boolean
): boolean {
  if (direction === "instant") return false;
  if (direction === "back") return replayOnBack;
  return true;
}
