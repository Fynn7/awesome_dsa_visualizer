import { describe, expect, it } from "vitest";
import {
  layoutPointerOverlayCenters,
  resolveArrayPointers,
} from "./parseArrayPointers";
import { barToneForIndex } from "./vizBarTone";
import type { MockViz } from "./mockTrace";

function viz(
  partial: Partial<MockViz> & Pick<MockViz, "values" | "highlightIndices">
): MockViz {
  return {
    caption: "",
    values: partial.values,
    highlightIndices: partial.highlightIndices,
    minIndex: partial.minIndex,
  };
}

describe("resolveArrayPointers", () => {
  it("adds jMinus1 when j and j-1 are both highlighted (insertion inference on)", () => {
    const v = viz({ values: [1, 2, 3], highlightIndices: [0, 1] });
    expect(
      resolveArrayPointers({ i: "1", j: "1", N: "3" }, v, true).jMinus1
    ).toBe(0);
  });

  it("omits jMinus1 for same highlights when insertion inference is off (e.g. selection sort)", () => {
    const v = viz({ values: [1, 2, 3], highlightIndices: [0, 1] });
    expect(
      resolveArrayPointers({ i: "1", j: "1", N: "3" }, v, false).jMinus1
    ).toBeUndefined();
  });

  it("omits jMinus1 when only j is highlighted", () => {
    const v = viz({ values: [1, 2, 3], highlightIndices: [1] });
    expect(
      resolveArrayPointers({ i: "1", j: "1", N: "3" }, v, true).jMinus1
    ).toBeUndefined();
  });

  it("omits jMinus1 when j is 0", () => {
    const v = viz({ values: [1, 2, 3], highlightIndices: [0] });
    expect(
      resolveArrayPointers({ j: "0", N: "3" }, v, true).jMinus1
    ).toBeUndefined();
  });
});

describe("layoutPointerOverlayCenters", () => {
  it("offsets i and j when they share an index", () => {
    const c = layoutPointerOverlayCenters(
      { i: 1, j: 1 },
      () => 100,
      11
    );
    expect(c.i).toBe(89);
    expect(c.j).toBe(111);
  });

  it("uses separate column centers when indices differ", () => {
    const c = layoutPointerOverlayCenters(
      { j: 1, jMinus1: 0 },
      (idx) => (idx === 0 ? 10 : 90),
      11
    );
    expect(c.jMinus1).toBe(10);
    expect(c.j).toBe(90);
  });

  it("offsets i and jMinus1 when they share an index", () => {
    const c = layoutPointerOverlayCenters(
      { i: 0, j: 1, jMinus1: 0 },
      (idx) => (idx === 0 ? 50 : 200),
      11
    );
    expect(c.j).toBe(200);
    expect(c.i).toBe(39);
    expect(c.jMinus1).toBe(61);
  });

  it("offsets i and min when they share an index", () => {
    const c = layoutPointerOverlayCenters(
      { i: 0, j: 1 },
      (idx) => (idx === 0 ? 100 : 200),
      11,
      0
    );
    expect(c.j).toBe(200);
    expect(c.i).toBe(89);
    expect(c.min).toBe(111);
  });

  it("places min at column center when it is the only overlay", () => {
    const c = layoutPointerOverlayCenters({}, () => 50, 11, 2);
    expect(c.min).toBe(50);
  });

  it("does not shift i/j when min is on a different index", () => {
    const c = layoutPointerOverlayCenters(
      { i: 0, j: 1 },
      (idx) => (idx === 0 ? 40 : 120),
      11,
      2
    );
    expect(c.i).toBe(40);
    expect(c.j).toBe(120);
    expect(c.min).toBe(120);
  });
});

describe("barToneForIndex", () => {
  it("prefers min over highlight", () => {
    const v = viz({
      values: [1, 2, 3],
      highlightIndices: [0, 1],
      minIndex: 1,
    });
    expect(barToneForIndex(1, v)).toBe("min");
  });

  it("marks last highlight as key", () => {
    const v = viz({ values: [1, 2, 3], highlightIndices: [0, 1] });
    expect(barToneForIndex(1, v)).toBe("key");
    expect(barToneForIndex(0, v)).toBe("hl");
  });

  it("uses sorted tone inside sortedExclusiveEnd when not highlighted", () => {
    const v = viz({ values: [1, 2, 3, 4], highlightIndices: [] });
    expect(barToneForIndex(0, v, 2)).toBe("sorted");
    expect(barToneForIndex(1, v, 2)).toBe("sorted");
    expect(barToneForIndex(2, v, 2)).toBe("neutral");
  });

  it("prefers highlight over sorted on the same index", () => {
    const v = viz({ values: [1, 2, 3, 4], highlightIndices: [0, 1] });
    expect(barToneForIndex(0, v, 3)).toBe("hl");
    expect(barToneForIndex(1, v, 3)).toBe("key");
    expect(barToneForIndex(2, v, 3)).toBe("sorted");
  });

  it("prefers min over sorted", () => {
    const v = viz({
      values: [1, 2, 3],
      highlightIndices: [],
      minIndex: 0,
    });
    expect(barToneForIndex(0, v, 3)).toBe("min");
  });
});
