import type { AlgorithmId } from "./mockTrace";

/**
 * Selection sort keeps `j` visible on the swap step after inner-loop scanning.
 * De-emphasize it until the next outer-loop header step begins.
 */
export function isSelectionJInactivePhase(
  algorithmId: AlgorithmId,
  stepLine: number,
  jIndex: number | undefined
): boolean {
  return (
    algorithmId === "selection" &&
    stepLine === 10 &&
    typeof jIndex === "number"
  );
}
