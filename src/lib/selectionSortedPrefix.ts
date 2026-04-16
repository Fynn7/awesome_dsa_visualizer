import { parseNonNegativeIndex } from "./parseArrayPointers";

/**
 * Exclusive end index of the sorted prefix for selection sort
 * (`SELECTION_SORT_SOURCE`: outer 5, min 6, inner 7–9, exch 10). Indices in
 * `[0, i)` are already in final positions for the current outer `i`.
 *
 * After `selection_sort(data)` (line 18), returns `valuesLength` so the full
 * array can render with the sorted bar tone when highlights are cleared.
 */
export function selectionSortedExclusiveEnd(
  line: number,
  variables: Record<string, string>,
  valuesLength: number
): number | undefined {
  if (line === 18) return valuesLength;
  if (line < 5 || line > 10) return undefined;
  const i = parseNonNegativeIndex(variables.i, valuesLength);
  if (i === undefined) return undefined;
  return i;
}
