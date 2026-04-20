import { describe, expect, it } from "vitest";

import {
  ALGORITHM_LINE_ANCHORS,
  resolveAlgorithmAnchorLine,
  resolveLegacyBarSortLine,
} from "./algorithmLineAnchors";
import {
  INSERTION_SORT_SOURCE,
  QUICK_FIND_SOURCE,
  QUICK_UNION_SOURCE,
  SELECTION_SORT_SOURCE,
} from "./algorithmSources";

const SOURCE_BY_ALGORITHM = {
  insertion: INSERTION_SORT_SOURCE,
  selection: SELECTION_SORT_SOURCE,
  "quick-find": QUICK_FIND_SOURCE,
  "quick-union": QUICK_UNION_SOURCE,
} as const;

describe("line anchors contract", () => {
  it("resolves all anchors to exact source lines", () => {
    for (const algorithmId of Object.keys(ALGORITHM_LINE_ANCHORS) as Array<
      keyof typeof ALGORITHM_LINE_ANCHORS
    >) {
      const sourceLines = SOURCE_BY_ALGORITHM[algorithmId].split("\n");
      const anchors = ALGORITHM_LINE_ANCHORS[algorithmId];
      for (const [anchorKey, line] of Object.entries(anchors)) {
        const text = sourceLines[line - 1];
        expect(
          text,
          `${algorithmId}.${anchorKey} should resolve to an existing source line`
        ).toBeTypeOf("string");
        expect(text).not.toBe("");
      }
    }
  });

  it("keeps essential ordering constraints", () => {
    expect(
      resolveAlgorithmAnchorLine("insertion", "outerFor")
    ).toBeLessThan(resolveAlgorithmAnchorLine("insertion", "innerFor"));
    expect(resolveAlgorithmAnchorLine("selection", "outerFor")).toBeLessThan(
      resolveAlgorithmAnchorLine("selection", "swap")
    );
    expect(resolveAlgorithmAnchorLine("quick-find", "unionDef")).toBeLessThan(
      resolveAlgorithmAnchorLine("quick-find", "connectedDef")
    );
    expect(resolveAlgorithmAnchorLine("quick-union", "findDef")).toBeLessThan(
      resolveAlgorithmAnchorLine("quick-union", "unionDef")
    );
    expect(
      resolveAlgorithmAnchorLine("quick-union", "unionFindQ")
    ).toBeLessThan(resolveAlgorithmAnchorLine("quick-union", "unionAssign"));
  });

  it("covers every legacy bar-sort trace line mapping used today", () => {
    const insertionLegacyLines = [1, 4, 5, 6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 18];
    const selectionLegacyLines = [1, 4, 5, 6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 18];

    for (const line of insertionLegacyLines) {
      expect(resolveLegacyBarSortLine("insertion", line)).toBeGreaterThan(0);
    }
    for (const line of selectionLegacyLines) {
      expect(resolveLegacyBarSortLine("selection", line)).toBeGreaterThan(0);
    }
  });
});
