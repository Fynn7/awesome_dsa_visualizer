import { describe, expect, it } from "vitest";

import { getAlgorithmDemo, getAlgorithmIds } from "./mockTrace";

describe("quick union demos pre-union cue", () => {
  it("registers quick-union demos", () => {
    expect(getAlgorithmIds()).toContain("quick-union");
    expect(getAlgorithmIds()).toContain("quick-union-full");
  });

  it("adds one pre-union cue step before each quick-union coarse step", () => {
    const { trace } = getAlgorithmDemo("quick-union");
    const unionCount = 8;
    expect(trace.length).toBe(1 + unionCount * 2 + 1);

    const cueSteps = trace.filter(
      (step) =>
        step.viz.kind === "dsuGraph" && step.viz.transitionKind === "pre-union"
    );
    expect(cueSteps).toHaveLength(unionCount);
    for (const step of cueSteps) {
      expect(step.viz.transitionEffect).toBe("pulse");
      expect(step.variables.array_accesses).toBe("0");
      expect(step.viz.caption).toContain("Watch these!");
      expect(step.consoleAppend).toBeUndefined();
    }
  });

  it("adds one pre-union cue step before each quick-union full union entry", () => {
    const { trace } = getAlgorithmDemo("quick-union-full");
    const cueSteps = trace.filter(
      (step) =>
        step.viz.kind === "dsuGraph" && step.viz.transitionKind === "pre-union"
    );
    expect(cueSteps).toHaveLength(8);
    for (const step of cueSteps) {
      expect(step.viz.transitionEffect).toBe("pulse");
      expect(step.variables.array_accesses).toBe("0");
      expect(step.viz.caption).toContain("Watch these!");
      expect(step.viz.highlightIndices.length).toBeGreaterThan(0);
    }
  });
});
