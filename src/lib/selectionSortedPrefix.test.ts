import { describe, expect, it } from "vitest";
import { barToneForIndex } from "./vizBarTone";
import { resolveAlgorithmAnchorLine } from "./algorithmLineAnchors";
import { selectionSortedExclusiveEnd } from "./selectionSortedPrefix";

const len = 4;

const outerForLine = resolveAlgorithmAnchorLine("selection", "outerFor");
const minAssignLine = resolveAlgorithmAnchorLine("selection", "minAssign");
const innerForLine = resolveAlgorithmAnchorLine("selection", "innerFor");
const swapLine = resolveAlgorithmAnchorLine("selection", "swap");
const completionLine = resolveAlgorithmAnchorLine("selection", "callSort");

describe("selectionSortedExclusiveEnd", () => {
  it("returns undefined when i is not a valid index string", () => {
    expect(
      selectionSortedExclusiveEnd(5, { i: "--", j: "--" }, len)
    ).toBeUndefined();
  });

  it("lines 5–10: exclusive end equals current outer i", () => {
    expect(
      selectionSortedExclusiveEnd(
        outerForLine,
        { arr: "[]", N: "4", i: "1", j: "--" },
        len
      )
    ).toBe(1);
    expect(
      selectionSortedExclusiveEnd(
        minAssignLine,
        { arr: "[]", N: "4", i: "2", j: "--" },
        len
      )
    ).toBe(2);
    expect(
      selectionSortedExclusiveEnd(
        innerForLine,
        { arr: "[]", N: "4", i: "0", j: "1" },
        len
      )
    ).toBe(0);
    expect(
      selectionSortedExclusiveEnd(
        swapLine,
        { arr: "[]", N: "4", i: "3", j: "--" },
        len
      )
    ).toBe(3);
  });

  it("returns undefined for lines outside sort body except completion", () => {
    expect(
      selectionSortedExclusiveEnd(outerForLine - 1, { i: "0", j: "--" }, len)
    ).toBeUndefined();
  });

  it("line 18: full length so every bar can use sorted tone without highlights", () => {
    expect(
      selectionSortedExclusiveEnd(
        completionLine,
        { arr: "[2, 3, 5, 7]", data: "[2, 3, 5, 7]" },
        len
      )
    ).toBe(len);
    const v = {
      caption: "",
      values: [2, 3, 5, 7],
      highlightIndices: [] as number[],
    };
    const end = len;
    expect(barToneForIndex(0, v, end)).toBe("sorted");
    expect(barToneForIndex(3, v, end)).toBe("sorted");
  });

  it("aligns with selection trace: i=1 → index 0 is sorted tone when not highlighted", () => {
    const end = selectionSortedExclusiveEnd(
      outerForLine,
      { arr: "[2, 3, 5, 7]", N: "4", i: "1", j: "--", min_idx: "--" },
      len
    );
    expect(end).toBe(1);
    const v = {
      caption: "",
      values: [2, 3, 5, 7],
      highlightIndices: [1] as number[],
    };
    expect(barToneForIndex(0, v, end)).toBe("sorted");
    expect(barToneForIndex(1, v, end)).toBe("key");
  });
});
