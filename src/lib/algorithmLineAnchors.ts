import {
  INSERTION_SORT_SOURCE,
  QUICK_FIND_SOURCE,
  QUICK_UNION_SOURCE,
  SELECTION_SORT_SOURCE,
} from "./algorithmSources";
import { resolveLineOffset, resolveSourceLineAnchors } from "./lineAnchors";

type InsertionAnchorKey =
  | "sourceStart"
  | "functionDef"
  | "nAssign"
  | "outerFor"
  | "innerFor"
  | "ifCompare"
  | "swap"
  | "elseBranch"
  | "breakBranch"
  | "dataAlloc"
  | "data0"
  | "data1"
  | "data2"
  | "data3"
  | "callSort";

type SelectionAnchorKey =
  | "sourceStart"
  | "functionDef"
  | "nAssign"
  | "outerFor"
  | "minAssign"
  | "innerFor"
  | "ifCompare"
  | "minUpdate"
  | "swap"
  | "dataAlloc"
  | "data0"
  | "data1"
  | "data2"
  | "data3"
  | "callSort";

type QuickFindAnchorKey =
  | "sourceStart"
  | "unionDef"
  | "unionPid"
  | "unionQid"
  | "connectedDef";

type QuickUnionAnchorKey =
  | "sourceStart"
  | "findDef"
  | "findWhile"
  | "findAdvance"
  | "findReturn"
  | "unionDef"
  | "unionFindP"
  | "unionFindQ"
  | "unionAssign"
  | "connectedDef";

type BarSortAlgorithmId = "insertion" | "selection";
export type SourceAnchoredAlgorithmId =
  | BarSortAlgorithmId
  | "quick-find"
  | "quick-union";

const insertion = resolveSourceLineAnchors<InsertionAnchorKey>(
  INSERTION_SORT_SOURCE,
  "insertion",
  {
    sourceStart: "from DSA import intArray, exch",
    functionDef: "def insertion_sort(arr):",
    nAssign: "    N = len(arr)",
    outerFor: "    for i in range(N):",
    innerFor: "        for j in range(i, 0, -1):",
    ifCompare: "            if arr[j] < arr[j - 1]:",
    swap: "                exch(arr, j, j - 1)",
    elseBranch: "            else:",
    breakBranch: "                break",
    dataAlloc: "data = intArray(4)",
    data0: "data[0] = 7",
    data1: "data[1] = 3",
    data2: "data[2] = 5",
    data3: "data[3] = 2",
    callSort: "insertion_sort(data)",
  }
);

const selection = resolveSourceLineAnchors<SelectionAnchorKey>(
  SELECTION_SORT_SOURCE,
  "selection",
  {
    sourceStart: "from DSA import intArray, exch",
    functionDef: "def selection_sort(arr):",
    nAssign: "    N = len(arr)",
    outerFor: "    for i in range(N):",
    minAssign: "        min_idx = i",
    innerFor: "        for j in range(i + 1, N):",
    ifCompare: "            if arr[j] < arr[min_idx]:",
    minUpdate: "                min_idx = j",
    swap: "        exch(arr, i, min_idx)",
    dataAlloc: "data = intArray(4)",
    data0: "data[0] = 7",
    data1: "data[1] = 3",
    data2: "data[2] = 5",
    data3: "data[3] = 2",
    callSort: "selection_sort(data)",
  }
);

const quickFind = resolveSourceLineAnchors<QuickFindAnchorKey>(
  QUICK_FIND_SOURCE,
  "quick-find",
  {
    sourceStart: "from DSA import intArray, stdReadInt, stdIsEmpty",
    unionDef: "    def union(self, p, q):",
    unionPid: "        pid = self.id[p]",
    unionQid: "        qid = self.id[q]",
    connectedDef: "    def connected(self, p, q):",
  }
);

const quickUnion = resolveSourceLineAnchors<QuickUnionAnchorKey>(
  QUICK_UNION_SOURCE,
  "quick-union",
  {
    sourceStart: "from DSA import intArray, stdReadInt, stdIsEmpty",
    findDef: "    def find(self, i):",
    findWhile: "        while i != self.id[i]:",
    findAdvance: "            i = self.id[i]",
    findReturn: "        return i",
    unionDef: "    def union(self, p, q):",
    unionFindP: "        i = self.find(p)",
    unionFindQ: "        j = self.find(q)",
    unionAssign: "        self.id[i] = j",
    connectedDef: "    def connected(self, p, q):",
  }
);

export const ALGORITHM_LINE_ANCHORS = {
  insertion,
  selection,
  "quick-find": quickFind,
  "quick-union": quickUnion,
} as const;

type AnchorKeyByAlgorithm = {
  insertion: InsertionAnchorKey;
  selection: SelectionAnchorKey;
  "quick-find": QuickFindAnchorKey;
  "quick-union": QuickUnionAnchorKey;
};

export function resolveAlgorithmAnchorLine<Algo extends SourceAnchoredAlgorithmId>(
  algorithmId: Algo,
  anchor: AnchorKeyByAlgorithm[Algo]
): number {
  const anchors = ALGORITHM_LINE_ANCHORS[algorithmId] as Record<
    AnchorKeyByAlgorithm[Algo],
    number
  >;
  return anchors[anchor];
}

export function resolveAlgorithmAnchorOffset<
  Algo extends SourceAnchoredAlgorithmId,
>(
  algorithmId: Algo,
  anchor: AnchorKeyByAlgorithm[Algo],
  offset: number
): number {
  return resolveLineOffset(
    resolveAlgorithmAnchorLine(algorithmId, anchor),
    offset,
    `${algorithmId}.${String(anchor)}`
  );
}

const insertionLegacyLineMap: Record<number, InsertionAnchorKey> = {
  1: "sourceStart",
  4: "nAssign",
  5: "outerFor",
  6: "innerFor",
  7: "ifCompare",
  8: "swap",
  9: "elseBranch",
  10: "breakBranch",
  13: "dataAlloc",
  14: "data0",
  15: "data1",
  16: "data2",
  17: "data3",
  18: "callSort",
};

const selectionLegacyLineMap: Record<number, SelectionAnchorKey> = {
  1: "sourceStart",
  4: "nAssign",
  5: "outerFor",
  6: "minAssign",
  7: "innerFor",
  8: "ifCompare",
  9: "minUpdate",
  10: "swap",
  13: "dataAlloc",
  14: "data0",
  15: "data1",
  16: "data2",
  17: "data3",
  18: "callSort",
};

export function resolveLegacyBarSortLine(
  algorithmId: BarSortAlgorithmId,
  legacyLine: number
): number {
  if (algorithmId === "insertion") {
    const anchor = insertionLegacyLineMap[legacyLine];
    if (!anchor) {
      throw new Error(
        `[line-anchors] Missing insertion legacy line mapping for ${legacyLine}`
      );
    }
    return resolveAlgorithmAnchorLine("insertion", anchor);
  }
  const anchor = selectionLegacyLineMap[legacyLine];
  if (!anchor) {
    throw new Error(
      `[line-anchors] Missing selection legacy line mapping for ${legacyLine}`
    );
  }
  return resolveAlgorithmAnchorLine("selection", anchor);
}
