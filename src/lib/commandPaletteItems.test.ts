import { describe, expect, it } from "vitest";

import {
  getFilteredPaletteItems,
  getTitleMatchIndices,
  type PaletteItem,
} from "./commandPaletteItems";

const insertionItem: PaletteItem = {
  id: "insertion",
  title: "Insertion sort",
  searchBlob: "sorting ins demo algorithm array stable online o n2",
};

function queryIds(query: string): string[] {
  return getFilteredPaletteItems(query).map(({ item }) => item.id);
}

describe("getFilteredPaletteItems", () => {
  it("matches VS Code style non-contiguous queries", () => {
    expect(queryIds("insrtn")).toEqual(["insertion"]);
    expect(queryIds("isrto")).toEqual(["insertion"]);
    expect(queryIds("isrtt")).toEqual(["insertion"]);
  });

  it("rejects queries with characters that cannot be matched in order", () => {
    expect(queryIds("isrttt")).toEqual([]);
  });

  it("rejects weak first-character matches in strict mode", () => {
    expect(queryIds("nser")).toEqual([]);
    expect(queryIds("tion")).toEqual([]);
  });

  it("requires every space-separated piece to match", () => {
    expect(queryIds("ins sort")).toEqual(["insertion"]);
  });
});

describe("getTitleMatchIndices", () => {
  it("returns indices in the display title when the title wins scoring", () => {
    expect(getTitleMatchIndices("ins", insertionItem).sort((a, b) => a - b)).toEqual([0, 1, 2]);
    expect(getTitleMatchIndices("isrto", insertionItem).sort((a, b) => a - b)).toEqual(
      [0, 2, 4, 5, 7]
    );
  });

  it("returns empty when query is empty or the title does not fuzzy-match a piece", () => {
    expect(getTitleMatchIndices("", insertionItem)).toEqual([]);
    expect(getTitleMatchIndices("nser", insertionItem)).toEqual([]);
  });
});
