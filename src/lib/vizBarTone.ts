import type { MockVizModel } from "./mockTrace";

/**
 * Bar emphasis in AnimationPanel (min > key/hl > sorted > neutral).
 * `sortedExclusiveEnd` is used for selection sort: indices `< sortedExclusiveEnd`
 * are the fixed left prefix `[0, i)` for the current outer `i`.
 * For insertion sort, only the completion step (line 18) sets it to the array
 * length so every bar can use the sorted tone without highlights.
 */
export type BarTone = "key" | "hl" | "min" | "neutral" | "sorted";

export function barToneForIndex(
  idx: number,
  viz: Pick<MockVizModel, "highlightIndices"> & { minIndex?: number },
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
