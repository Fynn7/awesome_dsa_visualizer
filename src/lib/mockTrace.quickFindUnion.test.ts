import { describe, expect, it } from "vitest";

import { QUICK_FIND_SOURCE, getAlgorithmDemo, getAlgorithmIds } from "./mockTrace";

describe("quick find union-step demo", () => {
  it("is registered in algorithm ids", () => {
    expect(getAlgorithmIds()).toContain("quick-find");
  });

  it("has one step per union plus init and Finished", () => {
    const { trace } = getAlgorithmDemo("quick-find");
    const unionCount = 8;
    expect(trace.length).toBe(1 + unionCount + 1);
  });

  it("uses short union-only captions (no complete/accesses suffix)", () => {
    const { trace } = getAlgorithmDemo("quick-find");
    const unionSteps = trace.filter(
      (s) => s.variables.operation.startsWith("union(")
    );
    for (const s of unionSteps) {
      expect(s.viz.kind).toBe("dsuGraph");
      if (s.viz.kind === "dsuGraph") {
        expect(s.viz.caption).toBe(`\`${s.variables.operation}\``);
        expect(s.viz.caption).not.toContain("complete");
      }
    }
  });

  it("anchors code highlight to def union for each union step", () => {
    const lines = QUICK_FIND_SOURCE.split("\n");
    let unionDefLine = 0;
    for (let i = 0; i < lines.length; i += 1) {
      if (/^\s*def union\(self,\s*p,\s*q\)\s*:/.test(lines[i]!)) {
        unionDefLine = i + 1;
        break;
      }
    }
    expect(unionDefLine).toBeGreaterThan(0);

    const { trace } = getAlgorithmDemo("quick-find");
    const unionSteps = trace.filter(
      (s) => s.variables.operation.startsWith("union(")
    );
    expect(unionSteps.length).toBe(8);
    for (const s of unionSteps) {
      expect(s.line).toBe(unionDefLine);
    }
  });

  it("does not emit per-index scan console lines", () => {
    const { trace } = getAlgorithmDemo("quick-find");
    for (const step of trace) {
      if (!step.consoleAppend) continue;
      for (const line of step.consoleAppend) {
        expect(line).not.toMatch(/scan i =/);
      }
    }
  });

  it("ends with Finished and uniform edge color", () => {
    const { trace } = getAlgorithmDemo("quick-find");
    const finalStep = trace[trace.length - 1]!;
    expect(finalStep.viz.kind).toBe("dsuGraph");
    if (finalStep.viz.kind === "dsuGraph") {
      expect(finalStep.viz.caption).toBe("Finished");
      expect(finalStep.viz.uniformEdgeColor).toBe(true);
      expect(finalStep.viz.activeEdge).toBeUndefined();
    }
  });
});
