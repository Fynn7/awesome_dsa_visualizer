import { describe, expect, it } from "vitest";

import { resolveAlgorithmAnchorLine } from "./algorithmLineAnchors";
import { selectionSortTrace } from "./mockTrace";
import { isSelectionJInactivePhase } from "./selectionPointerPhase";

const swapLine = resolveAlgorithmAnchorLine("selection", "swap");
const outerForLine = resolveAlgorithmAnchorLine("selection", "outerFor");

describe("isSelectionJInactivePhase", () => {
  it("marks selection swap step with visible j as inactive", () => {
    const firstSwap = selectionSortTrace.find(
      (step) => step.line === swapLine && step.variables.j !== "--"
    );
    expect(firstSwap).toBeDefined();
    expect(
      isSelectionJInactivePhase(
        "selection",
        firstSwap!.line,
        Number(firstSwap!.variables.j)
      )
    ).toBe(true);
  });

  it("clears inactive state on next outer-loop step", () => {
    const nextOuter = selectionSortTrace.find(
      (step) => step.line === outerForLine && step.variables.i === "1"
    );
    expect(nextOuter).toBeDefined();
    expect(
      isSelectionJInactivePhase("selection", nextOuter!.line, undefined)
    ).toBe(false);
  });

  it("does not activate for no-j swap or non-selection algorithms", () => {
    const noJSwap = selectionSortTrace.find(
      (step) => step.line === swapLine && step.variables.j === "--"
    );
    expect(noJSwap).toBeDefined();
    expect(
      isSelectionJInactivePhase("selection", noJSwap!.line, undefined)
    ).toBe(false);
    expect(
      isSelectionJInactivePhase("insertion", swapLine, 3)
    ).toBe(false);
  });
});
