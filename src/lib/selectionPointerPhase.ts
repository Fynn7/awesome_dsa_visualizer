import type { AlgorithmId } from "./mockTrace";
import { resolveAlgorithmAnchorLine } from "./algorithmLineAnchors";

/**
 * Selection sort keeps `j` visible on the swap step after inner-loop scanning.
 * De-emphasize it until the next outer-loop header step begins.
 */
export function isSelectionJInactivePhase(
  algorithmId: AlgorithmId,
  stepLine: number,
  jIndex: number | undefined
): boolean {
  const swapLine = resolveAlgorithmAnchorLine("selection", "swap");
  return (
    algorithmId === "selection" &&
    stepLine === swapLine &&
    typeof jIndex === "number"
  );
}
