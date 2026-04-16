export type FrameScheduler = (callback: FrameRequestCallback) => number;

type PointerPlaybackOptions = {
  hasFlip: boolean;
  hasEnter: boolean;
  scheduleFrame: FrameScheduler;
  startFlip: () => void;
  playEnter: () => void;
};

/**
 * Play pointer FLIP/enter transitions in one shared timing path.
 * FLIP still starts first; enter runs in the same frame window to avoid a delayed "pop in".
 */
export function schedulePointerPlayback({
  hasFlip,
  hasEnter,
  scheduleFrame,
  startFlip,
  playEnter,
}: PointerPlaybackOptions): number | null {
  if (!hasFlip && !hasEnter) return null;
  if (hasFlip) {
    return scheduleFrame(() => {
      startFlip();
      if (hasEnter) {
        playEnter();
      }
    });
  }
  playEnter();
  return null;
}

export function shouldAnimatePointerFlip(
  prevCenter: number | undefined,
  newCenter: number | undefined,
  threshold = 0.5
): boolean {
  if (prevCenter === undefined || newCenter === undefined) return false;
  return Math.abs(newCenter - prevCenter) >= threshold;
}
