import { describe, expect, it } from "vitest";

import {
  getLoopPulseRange,
  INSERTION_SORT_SOURCE,
  insertionSortLoopPulseRules,
  insertionSortTrace,
} from "./mockTrace";

describe("insertion sort demo (DSA swap + intArray)", () => {
  it("keeps INSERTION_SORT_SOURCE line numbers aligned with trace (data on line 18)", () => {
    const lines = INSERTION_SORT_SOURCE.split("\n");
    expect(lines[0]).toMatch(/^from DSA import intArray, exch$/);
    expect(lines[12]).toBe("data = intArray(4)");
    expect(lines[17]).toBe("insertion_sort(data)");
    expect(lines[18]).toBe("");
    expect(lines.length).toBe(19);
  });

  it("exercises loop pulse rules on if/loop transitions", () => {
    const trace = insertionSortTrace;
    const rules = insertionSortLoopPulseRules;

    const at = (step: number) =>
      getLoopPulseRange(trace, step, rules);

    expect(at(1)).toBeNull();

    // Empty inner (i = 0): line 6 → line 5
    expect(at(9)).toEqual({
      startLine: 6,
      endLine: 6,
      kind: "not-entered-loop",
    });

    // One exch then next i: line 8 → line 5
    expect(at(13)).toEqual({
      startLine: 5,
      endLine: 10,
      kind: "restart",
    });

    // More inner j: line 8 → line 6
    expect(at(17)).toEqual({
      startLine: 6,
      endLine: 10,
      kind: "restart",
    });

    // if false: line 7 -> line 9 (only if header should flash red)
    expect(at(19)).toEqual({
      startLine: 7,
      endLine: 7,
      kind: "not-entered-if",
    });

    // break → next i: line 10 → line 5
    expect(at(21)).toEqual({
      startLine: 5,
      endLine: 10,
      kind: "restart",
    });

    // i = 3 exch chain: line 8 → line 6
    expect(at(25)).toEqual({
      startLine: 6,
      endLine: 10,
      kind: "restart",
    });
    expect(at(28)).toEqual({
      startLine: 6,
      endLine: 10,
      kind: "restart",
    });
    expect(at(31)).toEqual({
      startLine: 6,
      endLine: 10,
      kind: "restart",
    });
  });

  it("ends with sorted array and matching line 18", () => {
    const last = insertionSortTrace[insertionSortTrace.length - 1]!;
    expect(last.line).toBe(18);
    expect(last.viz.values).toEqual([2, 3, 5, 7]);
  });
});
