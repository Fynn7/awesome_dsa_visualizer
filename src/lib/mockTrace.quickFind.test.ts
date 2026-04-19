import { describe, expect, it } from "vitest";

import { getAlgorithmDemo, getAlgorithmIds } from "./mockTrace";

describe("quick find - full exercise demo", () => {
  it("is registered in algorithm ids", () => {
    expect(getAlgorithmIds()).toContain("quick-find-full");
  });

  it("uses dsuGraph sub-steps with line progression and running accesses", () => {
    const { trace } = getAlgorithmDemo("quick-find-full");
    expect(trace.length).toBeGreaterThan(80);

    const first = trace[0]!;
    expect(first.viz.kind).toBe("dsuGraph");
    expect(first.variables.array_accesses).toBe("0");
    if (first.viz.kind === "dsuGraph") {
      expect(first.viz.edges).toEqual([]);
    }

    const firstUnion = trace.find(
      (step) => step.variables.operation === "union(9,0)"
    );
    expect(firstUnion).toBeDefined();
    expect(firstUnion?.line).toBe(19);
  });

  it("draws the new union edge only after id[i] == pid matches (not during prior scans)", () => {
    const { trace } = getAlgorithmDemo("quick-find-full");
    const op = "union(9,0)";
    const enter = trace.find(
      (s) => s.variables.operation === op && s.line === 19
    );
    expect(enter?.viz.kind).toBe("dsuGraph");
    if (enter?.viz.kind === "dsuGraph") {
      expect(enter.viz.edges).toEqual([]);
      expect(enter.viz.activeEdge).toBeUndefined();
    }
    const scanI8 = trace.find(
      (s) =>
        s.variables.operation === op && s.line === 22 && s.variables.i === "8"
    );
    expect(scanI8?.viz.kind).toBe("dsuGraph");
    if (scanI8?.viz.kind === "dsuGraph") {
      expect(scanI8.viz.edges).toEqual([]);
      expect(scanI8.viz.activeEdge).toBeUndefined();
    }
    const firstMatch = trace.find(
      (s) =>
        s.variables.operation === op &&
        s.line === 23 &&
        s.variables.i === "9" &&
        s.viz.caption.includes("match")
    );
    expect(firstMatch?.viz.kind).toBe("dsuGraph");
    if (firstMatch?.viz.kind === "dsuGraph") {
      expect(firstMatch.viz.edges).toEqual([{ from: 9, to: 0 }]);
      expect(firstMatch.viz.activeEdge).toEqual({ from: 9, to: 0 });
    }
  });

  it("covers multi-line execution inside union", () => {
    const { trace } = getAlgorithmDemo("quick-find-full");
    const unionSteps = trace.filter(
      (step) => step.variables.operation === "union(9,0)"
    );
    const lines = new Set(unionSteps.map((step) => step.line));
    expect(lines.has(19)).toBe(true);
    expect(lines.has(20)).toBe(true);
    expect(lines.has(21)).toBe(true);
    expect(lines.has(22)).toBe(true);
    expect(lines.has(23)).toBe(true);
    expect(lines.has(24)).toBe(true);
  });

  it("matches official final accesses and id state per union", () => {
    const { trace } = getAlgorithmDemo("quick-find-full");
    const completed = trace.filter((step) =>
      step.viz.caption.includes("complete ->")
    );
    const byOp = new Map(completed.map((step) => [step.variables.operation, step]));

    const firstUnion = byOp.get("union(9,0)");
    expect(firstUnion?.variables.operation).toBe("union(9,0)");
    expect(firstUnion?.variables.array_accesses).toBe("13");
    expect(firstUnion?.variables.id_after).toBe("[0, 1, 2, 3, 4, 5, 6, 7, 8, 0]");

    const last = byOp.get("union(4,2)");
    expect(last?.variables.operation).toBe("union(4,2)");
    expect(last?.variables.array_accesses).toBe("16");
    expect(last?.viz.values).toEqual([1, 1, 1, 1, 1, 1, 6, 1, 1, 1]);
  });

  it("adds a final Finished frame with uniform edge color", () => {
    const { trace } = getAlgorithmDemo("quick-find-full");
    const finalStep = trace[trace.length - 1]!;
    expect(finalStep.viz.kind).toBe("dsuGraph");
    if (finalStep.viz.kind === "dsuGraph") {
      expect(finalStep.viz.caption).toBe("Finished");
      expect(finalStep.viz.activeEdge).toBeUndefined();
      expect(finalStep.viz.uniformEdgeColor).toBe(true);
      expect(finalStep.viz.highlightIndices).toEqual([]);
      expect(finalStep.viz.edges.length).toBeGreaterThan(0);
    }
  });
});
