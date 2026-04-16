import { describe, expect, it } from "vitest";

import {
  getLoopPulseRange,
  SELECTION_SORT_SOURCE,
  selectionSortLoopPulseRules,
  selectionSortTrace,
} from "./mockTrace";

describe("selection sort demo (DSA exch + intArray)", () => {
  it("keeps SELECTION_SORT_SOURCE line numbers aligned with trace (data on line 18)", () => {
    const lines = SELECTION_SORT_SOURCE.split("\n");
    expect(lines[0]).toMatch(/^from DSA import intArray, exch$/);
    expect(lines[12]).toBe("data = intArray(4)");
    expect(lines[17]).toBe("selection_sort(data)");
    expect(lines[18]).toBe("");
    expect(lines.length).toBe(19);
  });

  it("exercises selection if/loop pulse rules", () => {
    const trace = selectionSortTrace;
    const rules = selectionSortLoopPulseRules;

    const at = (step: number) => getLoopPulseRange(trace, step, rules);

    expect(at(1)).toBeNull();

    // line 9 -> line 7: updated minimum, continue scanning
    expect(at(12)).toEqual({
      startLine: 7,
      endLine: 9,
      kind: "restart",
    });

    // line 8 -> line 7: failed if condition, continue scanning
    expect(at(14)).toEqual({
      startLine: 8,
      endLine: 8,
      kind: "not-entered-if",
    });
    expect(at(22)).toEqual({
      startLine: 8,
      endLine: 8,
      kind: "not-entered-if",
    });

    // line 8 -> line 10: failed if condition at last inner iteration
    expect(at(24)).toEqual({
      startLine: 8,
      endLine: 8,
      kind: "not-entered-if",
    });
    expect(at(29)).toEqual({
      startLine: 8,
      endLine: 8,
      kind: "not-entered-if",
    });

    // line 10 -> line 5: swap complete, next outer pass
    expect(at(18)).toEqual({
      startLine: 5,
      endLine: 10,
      kind: "restart",
    });
    expect(at(25)).toEqual({
      startLine: 5,
      endLine: 10,
      kind: "restart",
    });
    expect(at(30)).toEqual({
      startLine: 5,
      endLine: 10,
      kind: "restart",
    });

    // line 7 -> line 10: inner loop gets no j values (for not entered)
    expect(at(33)).toEqual({
      startLine: 7,
      endLine: 7,
      kind: "not-entered-loop",
    });
  });

  it("ends with sorted array and matching line 18", () => {
    const last = selectionSortTrace[selectionSortTrace.length - 1]!;
    expect(last.line).toBe(18);
    expect(last.viz.values).toEqual([2, 3, 5, 7]);
  });

  it("keeps selection minIndex in sync with min_idx variables", () => {
    const withMin = selectionSortTrace.filter((step) => {
      return "min_idx" in step.variables && step.variables.min_idx !== "--";
    });
    const withoutMin = selectionSortTrace.filter((step) => {
      return !("min_idx" in step.variables) || step.variables.min_idx === "--";
    });

    expect(withMin.length).toBeGreaterThan(0);
    for (const step of withMin) {
      expect(step.viz.minIndex).toBe(Number(step.variables.min_idx));
    }
    for (const step of withoutMin) {
      expect(step.viz.minIndex).toBeUndefined();
    }
  });
});
