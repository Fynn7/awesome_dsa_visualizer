import type { MockViz } from "./mockTrace";

/**
 * Bar emphasis in AnimationPanel (min > key/hl > sorted > neutral).
 * `sortedExclusiveEnd` is used for selection sort: indices `< sortedExclusiveEnd`
 * are the fixed left prefix `[0, i)` for the current outer `i`.
 */
export type BarTone = "key" | "hl" | "min" | "neutral" | "sorted";

export function barToneForIndex(
  idx: number,
  viz: MockViz,
  sortedExclusiveEnd?: number
): BarTone {
  const minIdx = viz.minIndex ?? -1;
  if (idx === minIdx) return "min";
  const hi = viz.highlightIndices;
  if (hi.includes(idx)) {
    const keyIdx = hi.length ? hi[hi.length - 1]! : -1;
    return idx === keyIdx ? "key" : "hl";
  }
  if (
    typeof sortedExclusiveEnd === "number" &&
    sortedExclusiveEnd > 0 &&
    idx < sortedExclusiveEnd
  ) {
    return "sorted";
  }
  return "neutral";
}
