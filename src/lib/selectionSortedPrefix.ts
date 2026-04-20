import { parseNonNegativeIndex } from "./parseArrayPointers";
import { resolveAlgorithmAnchorLine } from "./algorithmLineAnchors";

/**
 * Exclusive end index of the sorted prefix for selection sort
 * (from semantic anchors: outer-loop header through swap step). Indices in
 * `[0, i)` are already in final positions for the current outer `i`.
 *
 * After `selection_sort(data)` returns, this function yields `valuesLength` so the full
 * array can render with the sorted bar tone when highlights are cleared.
 */
export function selectionSortedExclusiveEnd(
  line: number,
  variables: Record<string, string>,
  valuesLength: number
): number | undefined {
  const completionLine = resolveAlgorithmAnchorLine("selection", "callSort");
  const outerForLine = resolveAlgorithmAnchorLine("selection", "outerFor");
  const swapLine = resolveAlgorithmAnchorLine("selection", "swap");
  if (line === completionLine) return valuesLength;
  if (line < outerForLine || line > swapLine) return undefined;
  const i = parseNonNegativeIndex(variables.i, valuesLength);
  if (i === undefined) return undefined;
  return i;
}
