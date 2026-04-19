/**
 * Mock execution trace - independent of a real Python runtime.
 * Line numbers are 1-based, matching the default editor document.
 */

export type MockViz = {
  kind?: undefined;
  caption: string;
  values: number[];
  /** Indices into values to emphasize (e.g. key, j). */
  highlightIndices: number[];
  /** Optional index to render with the dedicated min-tracker color. */
  minIndex?: number;
};

export type DsuGraphNode = {
  id: number;
  group: number;
};

export type DsuGraphEdge = {
  from: number;
  to: number;
};

export type MockDsuGraphViz = {
  kind: "dsuGraph";
  caption: string;
  values: number[];
  highlightIndices: number[];
  nodes: DsuGraphNode[];
  edges: DsuGraphEdge[];
  activeEdge?: DsuGraphEdge;
  /** When true, render all DSU edges with the same base tone (no active/muted variants). */
  uniformEdgeColor?: boolean;
};

export type MockVizModel = MockViz | MockDsuGraphViz;

export type MockStep = {
  line: number;
  variables: Record<string, string>;
  consoleAppend?: string[];
  viz: MockVizModel;
};

/** When the trace jumps from the loop body's last line back to the loop header, pulse this inclusive line range. */
export type LoopPulseRestartRule = {
  /** Trace line before the pulse transition. */
  bodyEndLine: number;
  /** Trace line after the pulse transition. */
  headerLine: number;
  regionStartLine: number;
  regionEndLine: number;
  kind: "restart" | "not-entered-loop" | "not-entered-if";
};

export type LoopPulseRange = {
  startLine: number;
  endLine: number;
  kind: "restart" | "not-entered-loop" | "not-entered-if";
};

/**
 * Matches INSERTION_SORT_SOURCE line numbers:
 * - Inner `for j`: body ends at 8 (exch) or 10 (break); header is line 6.
 * - Outer `for i`: body region lines 5–10; header is line 5.
 */
export const insertionSortLoopPulseRules: LoopPulseRestartRule[] = [
  {
    bodyEndLine: 7,
    headerLine: 9,
    regionStartLine: 7,
    regionEndLine: 7,
    kind: "not-entered-if",
  },
  {
    bodyEndLine: 8,
    headerLine: 6,
    regionStartLine: 6,
    regionEndLine: 10,
    kind: "restart",
  },
  {
    bodyEndLine: 10,
    headerLine: 5,
    regionStartLine: 5,
    regionEndLine: 10,
    kind: "restart",
  },
  {
    bodyEndLine: 8,
    headerLine: 5,
    regionStartLine: 5,
    regionEndLine: 10,
    kind: "restart",
  },
  {
    bodyEndLine: 6,
    headerLine: 5,
    regionStartLine: 6,
    regionEndLine: 6,
    kind: "not-entered-loop",
  },
];

export function getLoopPulseRange(
  trace: MockStep[],
  stepIndex: number,
  rules: LoopPulseRestartRule[] = insertionSortLoopPulseRules
): LoopPulseRange | null {
  if (stepIndex <= 0 || stepIndex >= trace.length) return null;
  const prevLine = trace[stepIndex - 1]!.line;
  const currLine = trace[stepIndex]!.line;
  for (const r of rules) {
    if (prevLine === r.bodyEndLine && currLine === r.headerLine) {
      return {
        startLine: r.regionStartLine,
        endLine: r.regionEndLine,
        kind: r.kind,
      };
    }
  }
  return null;
}

export const INSERTION_SORT_SOURCE = `from DSA import intArray, exch

def insertion_sort(arr):
    N = len(arr)
    for i in range(N):
        for j in range(i, 0, -1):
            if arr[j] < arr[j - 1]:
                exch(arr, j, j - 1)
            else:
                break


data = intArray(4)
data[0] = 7
data[1] = 3
data[2] = 5
data[3] = 2
insertion_sort(data)
`;

/** Two blank lines before `data` (insertion_sort: line 13; selection_sort: line 13). */
export const SELECTION_SORT_SOURCE = `from DSA import intArray, exch

def selection_sort(arr):
    N = len(arr)
    for i in range(N):
        min_idx = i
        for j in range(i + 1, N):
            if arr[j] < arr[min_idx]:
                min_idx = j
        exch(arr, i, min_idx)


data = intArray(4)
data[0] = 7
data[1] = 3
data[2] = 5
data[3] = 2
selection_sort(data)
`;

export const QUICK_FIND_SOURCE = `from DSA import intArray, stdReadInt, stdIsEmpty

class QuickFindUF:
    def __init__(self, n):
        self.id = intArray(n)
        for i in range(len(self.id)):
            self.id[i] = i

    def find(self, p):
        return self.id[p]

    def union(self, p, q):
        pid = self.id[p]
        qid = self.id[q]
        for i in range(len(self.id)):
            if self.id[i] == pid:
                self.id[i] = qid

    def connected(self, p, q):
        return self.find(p) == self.find(q)


n = stdReadInt()
uf = QuickFindUF(n)

while not stdIsEmpty():
    p = stdReadInt()
    q = stdReadInt()

    if not uf.connected(p, q):
        uf.union(p, q)
        print(p, q)
`;

/** Inner `for j` (lines 7–9); outer `for i` (lines 5–10). */
export const selectionSortLoopPulseRules: LoopPulseRestartRule[] = [
  {
    bodyEndLine: 9,
    headerLine: 7,
    regionStartLine: 7,
    regionEndLine: 9,
    kind: "restart",
  },
  {
    bodyEndLine: 10,
    headerLine: 5,
    regionStartLine: 5,
    regionEndLine: 10,
    kind: "restart",
  },
  {
    bodyEndLine: 7,
    headerLine: 10,
    regionStartLine: 7,
    regionEndLine: 7,
    kind: "not-entered-loop",
  },
  {
    bodyEndLine: 8,
    headerLine: 7,
    regionStartLine: 8,
    regionEndLine: 8,
    kind: "not-entered-if",
  },
  {
    bodyEndLine: 8,
    headerLine: 10,
    regionStartLine: 8,
    regionEndLine: 8,
    kind: "not-entered-if",
  },
];

/** Pre-recorded steps for INSERTION_SORT_SOURCE (swap-based, intArray + exch). */
export const insertionSortTrace: MockStep[] = [
  {
    line: 13,
    variables: { data: "intArray(4)" },
    consoleAppend: ["Starting demo: insertion_sort on intArray [7, 3, 5, 2]"],
    viz: {
      caption: "Allocate `intArray(4)`",
      values: [0, 0, 0, 0],
      highlightIndices: [],
    },
  },
  {
    line: 14,
    variables: { data: "[7, 0, 0, 0]" },
    viz: {
      caption: "`data[0] = 7`",
      values: [7, 0, 0, 0],
      highlightIndices: [0],
    },
  },
  {
    line: 15,
    variables: { data: "[7, 3, 0, 0]" },
    viz: {
      caption: "`data[1] = 3`",
      values: [7, 3, 0, 0],
      highlightIndices: [1],
    },
  },
  {
    line: 16,
    variables: { data: "[7, 3, 5, 0]" },
    viz: {
      caption: "`data[2] = 5`",
      values: [7, 3, 5, 0],
      highlightIndices: [2],
    },
  },
  {
    line: 17,
    variables: { data: "[7, 3, 5, 2]" },
    viz: {
      caption: "`data[3] = 2`",
      values: [7, 3, 5, 2],
      highlightIndices: [3],
    },
  },
  {
    line: 18,
    variables: { data: "[7, 3, 5, 2]" },
    viz: {
      caption: "Call `insertion_sort(data)`",
      values: [7, 3, 5, 2],
      highlightIndices: [],
    },
  },
  {
    line: 4,
    variables: { arr: "[7, 3, 5, 2]", N: "4", i: "--", j: "--" },
    viz: {
      caption: "`N = 4`",
      values: [7, 3, 5, 2],
      highlightIndices: [],
    },
  },
  {
    line: 5,
    variables: { arr: "[7, 3, 5, 2]", N: "4", i: "0", j: "--" },
    viz: {
      caption: "Enter outer loop `i = 0`",
      values: [7, 3, 5, 2],
      highlightIndices: [0],
    },
  },
  {
    line: 6,
    variables: { arr: "[7, 3, 5, 2]", N: "4", i: "0", j: "--" },
    viz: {
      caption: "Enter inner loop empty `range(0, 0, -1)` (no `j`)",
      values: [7, 3, 5, 2],
      highlightIndices: [],
    },
  },
  {
    line: 5,
    variables: { arr: "[7, 3, 5, 2]", N: "4", i: "1", j: "--" },
    viz: {
      caption: "Continue outer loop `i = 1`",
      values: [7, 3, 5, 2],
      highlightIndices: [1],
    },
  },
  {
    line: 6,
    variables: { arr: "[7, 3, 5, 2]", N: "4", i: "1", j: "1" },
    viz: {
      caption: "Enter inner loop `j = 1`",
      values: [7, 3, 5, 2],
      highlightIndices: [0, 1],
    },
  },
  {
    line: 7,
    variables: { arr: "[7, 3, 5, 2]", N: "4", i: "1", j: "1" },
    viz: {
      caption: "If `arr[1] < arr[0]`",
      values: [7, 3, 5, 2],
      highlightIndices: [0, 1],
    },
  },
  {
    line: 8,
    variables: { arr: "[7, 3, 5, 2]", N: "4", i: "1", j: "1" },
    consoleAppend: ["exch(arr, 1, 0): swap 3 and 7"],
    viz: {
      caption: "Swap `arr[0]` and `arr[1]`",
      values: [3, 7, 5, 2],
      highlightIndices: [0, 1],
    },
  },
  {
    line: 5,
    variables: { arr: "[3, 7, 5, 2]", N: "4", i: "2", j: "--" },
    viz: {
      caption: "Continue outer loop `i = 2`",
      values: [3, 7, 5, 2],
      highlightIndices: [2],
    },
  },
  {
    line: 6,
    variables: { arr: "[3, 7, 5, 2]", N: "4", i: "2", j: "2" },
    viz: {
      caption: "Enter inner loop `j = 2`",
      values: [3, 7, 5, 2],
      highlightIndices: [1, 2],
    },
  },
  {
    line: 7,
    variables: { arr: "[3, 7, 5, 2]", N: "4", i: "2", j: "2" },
    viz: {
      caption: "If `arr[2] < arr[1]`",
      values: [3, 7, 5, 2],
      highlightIndices: [1, 2],
    },
  },
  {
    line: 8,
    variables: { arr: "[3, 7, 5, 2]", N: "4", i: "2", j: "2" },
    consoleAppend: ["exch(arr, 2, 1): swap 5 and 7"],
    viz: {
      caption: "Swap `arr[1]` and `arr[2]`",
      values: [3, 5, 7, 2],
      highlightIndices: [1, 2],
    },
  },
  {
    line: 6,
    variables: { arr: "[3, 5, 7, 2]", N: "4", i: "2", j: "1" },
    viz: {
      caption: "Continue inner loop `j = 1`",
      values: [3, 5, 7, 2],
      highlightIndices: [0, 1],
    },
  },
  {
    line: 7,
    variables: { arr: "[3, 5, 7, 2]", N: "4", i: "2", j: "1" },
    viz: {
      caption: "Skip swap: 5 ≮ 3",
      values: [3, 5, 7, 2],
      highlightIndices: [0, 1],
    },
  },
  {
    line: 9,
    variables: { arr: "[3, 5, 7, 2]", N: "4", i: "2", j: "1" },
    viz: {
      caption: "Early exit from inner `for` (no further compares required)",
      values: [3, 5, 7, 2],
      highlightIndices: [],
    },
  },
  {
    line: 10,
    variables: { arr: "[3, 5, 7, 2]", N: "4", i: "2", j: "1" },
    viz: {
      caption: "Early exit from inner `for` (no further compares required)",
      values: [3, 5, 7, 2],
      highlightIndices: [],
    },
  },
  {
    line: 5,
    variables: { arr: "[3, 5, 7, 2]", N: "4", i: "3", j: "--" },
    viz: {
      caption: "Continue outer loop `i = 3`",
      values: [3, 5, 7, 2],
      highlightIndices: [3],
    },
  },
  {
    line: 6,
    variables: { arr: "[3, 5, 7, 2]", N: "4", i: "3", j: "3" },
    viz: {
      caption: "Enter inner loop `j = 3`",
      values: [3, 5, 7, 2],
      highlightIndices: [2, 3],
    },
  },
  {
    line: 7,
    variables: { arr: "[3, 5, 7, 2]", N: "4", i: "3", j: "3" },
    viz: {
      caption: "If `arr[3] < arr[2]`",
      values: [3, 5, 7, 2],
      highlightIndices: [2, 3],
    },
  },
  {
    line: 8,
    variables: { arr: "[3, 5, 7, 2]", N: "4", i: "3", j: "3" },
    consoleAppend: ["exch(arr, 3, 2): swap 2 and 7"],
    viz: {
      caption: "Swap `arr[2]` and `arr[3]`",
      values: [3, 5, 2, 7],
      highlightIndices: [2, 3],
    },
  },
  {
    line: 6,
    variables: { arr: "[3, 5, 2, 7]", N: "4", i: "3", j: "2" },
    viz: {
      caption: "Continue inner loop `j = 2`",
      values: [3, 5, 2, 7],
      highlightIndices: [1, 2],
    },
  },
  {
    line: 7,
    variables: { arr: "[3, 5, 2, 7]", N: "4", i: "3", j: "2" },
    viz: {
      caption: "If `arr[2] < arr[1]`",
      values: [3, 5, 2, 7],
      highlightIndices: [1, 2],
    },
  },
  {
    line: 8,
    variables: { arr: "[3, 5, 2, 7]", N: "4", i: "3", j: "2" },
    consoleAppend: ["exch(arr, 2, 1): swap 2 and 5"],
    viz: {
      caption: "Swap `arr[1]` and `arr[2]`",
      values: [3, 2, 5, 7],
      highlightIndices: [1, 2],
    },
  },
  {
    line: 6,
    variables: { arr: "[3, 2, 5, 7]", N: "4", i: "3", j: "1" },
    viz: {
      caption: "Continue inner loop `j = 1`",
      values: [3, 2, 5, 7],
      highlightIndices: [0, 1],
    },
  },
  {
    line: 7,
    variables: { arr: "[3, 2, 5, 7]", N: "4", i: "3", j: "1" },
    viz: {
      caption: "If `arr[1] < arr[0]`",
      values: [3, 2, 5, 7],
      highlightIndices: [0, 1],
    },
  },
  {
    line: 8,
    variables: { arr: "[3, 2, 5, 7]", N: "4", i: "3", j: "1" },
    consoleAppend: ["exch(arr, 1, 0): swap 2 and 3"],
    viz: {
      caption: "Swap `arr[0]` and `arr[1]`",
      values: [2, 3, 5, 7],
      highlightIndices: [0, 1],
    },
  },
  {
    line: 6,
    variables: { arr: "[2, 3, 5, 7]", N: "4", i: "3", j: "--" },
    viz: {
      caption: "Exit inner: no `j` left for outer `i = 3`",
      values: [2, 3, 5, 7],
      highlightIndices: [],
    },
  },
  {
    line: 18,
    variables: { arr: "[2, 3, 5, 7]", data: "[2, 3, 5, 7]" },
    consoleAppend: ["Sorted: [2, 3, 5, 7]", "Process finished (mock)."],
    viz: {
      caption: "`insertion_sort` returned → data sorted",
      values: [2, 3, 5, 7],
      highlightIndices: [],
    },
  },
];

export const selectionSortTrace: MockStep[] = [
  {
    line: 13,
    variables: { data: "intArray(4)" },
    consoleAppend: ["Starting demo: selection_sort on intArray [7, 3, 5, 2]"],
    viz: {
      caption: "Allocate `intArray(4)`",
      values: [0, 0, 0, 0],
      highlightIndices: [],
    },
  },
  {
    line: 14,
    variables: { data: "[7, 0, 0, 0]" },
    viz: {
      caption: "`data[0] = 7`",
      values: [7, 0, 0, 0],
      highlightIndices: [0],
    },
  },
  {
    line: 15,
    variables: { data: "[7, 3, 0, 0]" },
    viz: {
      caption: "`data[1] = 3`",
      values: [7, 3, 0, 0],
      highlightIndices: [1],
    },
  },
  {
    line: 16,
    variables: { data: "[7, 3, 5, 0]" },
    viz: {
      caption: "`data[2] = 5`",
      values: [7, 3, 5, 0],
      highlightIndices: [2],
    },
  },
  {
    line: 17,
    variables: { data: "[7, 3, 5, 2]" },
    viz: {
      caption: "`data[3] = 2`",
      values: [7, 3, 5, 2],
      highlightIndices: [3],
    },
  },
  {
    line: 18,
    variables: { data: "[7, 3, 5, 2]" },
    viz: {
      caption: "Call `selection_sort(data)`",
      values: [7, 3, 5, 2],
      highlightIndices: [],
    },
  },
  {
    line: 4,
    variables: { arr: "[7, 3, 5, 2]", N: "4", i: "--", j: "--", min_idx: "--" },
    viz: {
      caption: "`N = 4`",
      values: [7, 3, 5, 2],
      highlightIndices: [],
    },
  },
  {
    line: 5,
    variables: { arr: "[7, 3, 5, 2]", N: "4", i: "0", j: "--", min_idx: "--" },
    viz: {
      caption: "Enter outer loop `i = 0`",
      values: [7, 3, 5, 2],
      highlightIndices: [0],
    },
  },
  {
    line: 6,
    variables: { arr: "[7, 3, 5, 2]", N: "4", i: "0", j: "--", min_idx: "0" },
    viz: {
      caption: "`min_idx = 0`",
      values: [7, 3, 5, 2],
      highlightIndices: [0],
      minIndex: 0,
    },
  },
  {
    line: 7,
    variables: { arr: "[7, 3, 5, 2]", N: "4", i: "0", j: "1", min_idx: "0" },
    viz: {
      caption: "Enter inner loop `j = 1`",
      values: [7, 3, 5, 2],
      highlightIndices: [0, 1],
      minIndex: 0,
    },
  },
  {
    line: 8,
    variables: { arr: "[7, 3, 5, 2]", N: "4", i: "0", j: "1", min_idx: "0" },
    viz: {
      caption: "If `arr[1] < arr[0]`",
      values: [7, 3, 5, 2],
      highlightIndices: [0, 1],
      minIndex: 0,
    },
  },
  {
    line: 9,
    variables: { arr: "[7, 3, 5, 2]", N: "4", i: "0", j: "1", min_idx: "1" },
    consoleAppend: ["New minimum at index 1 (value 3)"],
    viz: {
      caption: "`min_idx = 1`",
      values: [7, 3, 5, 2],
      highlightIndices: [1],
      minIndex: 1,
    },
  },
  {
    line: 7,
    variables: { arr: "[7, 3, 5, 2]", N: "4", i: "0", j: "2", min_idx: "1" },
    viz: {
      caption: "Continue inner loop `j = 2`",
      values: [7, 3, 5, 2],
      highlightIndices: [1, 2],
      minIndex: 1,
    },
  },
  {
    line: 8,
    variables: { arr: "[7, 3, 5, 2]", N: "4", i: "0", j: "2", min_idx: "1" },
    viz: {
      caption: "Skip update: 5 ≮ 3",
      values: [7, 3, 5, 2],
      highlightIndices: [1, 2],
      minIndex: 1,
    },
  },
  {
    line: 7,
    variables: { arr: "[7, 3, 5, 2]", N: "4", i: "0", j: "3", min_idx: "1" },
    viz: {
      caption: "Continue inner loop `j = 3`",
      values: [7, 3, 5, 2],
      highlightIndices: [1, 3],
      minIndex: 1,
    },
  },
  {
    line: 8,
    variables: { arr: "[7, 3, 5, 2]", N: "4", i: "0", j: "3", min_idx: "1" },
    viz: {
      caption: "If `arr[3] < arr[1]`",
      values: [7, 3, 5, 2],
      highlightIndices: [1, 3],
      minIndex: 1,
    },
  },
  {
    line: 9,
    variables: { arr: "[7, 3, 5, 2]", N: "4", i: "0", j: "3", min_idx: "3" },
    consoleAppend: ["New minimum at index 3 (value 2)"],
    viz: {
      caption: "`min_idx = 3`",
      values: [7, 3, 5, 2],
      highlightIndices: [3],
      minIndex: 3,
    },
  },
  {
    line: 10,
    variables: { arr: "[7, 3, 5, 2]", N: "4", i: "0", j: "3", min_idx: "3" },
    consoleAppend: ["exch(arr, 0, 3): swap 7 and 2"],
    viz: {
      caption: "Swap `arr[0]` and `arr[3]`",
      values: [2, 3, 5, 7],
      highlightIndices: [0, 3],
      minIndex: 3,
    },
  },
  {
    line: 5,
    variables: { arr: "[2, 3, 5, 7]", N: "4", i: "1", j: "--", min_idx: "--" },
    viz: {
      caption: "Continue outer loop `i = 1`",
      values: [2, 3, 5, 7],
      highlightIndices: [1],
    },
  },
  {
    line: 6,
    variables: { arr: "[2, 3, 5, 7]", N: "4", i: "1", j: "--", min_idx: "1" },
    viz: {
      caption: "`min_idx = 1`",
      values: [2, 3, 5, 7],
      highlightIndices: [1],
      minIndex: 1,
    },
  },
  {
    line: 7,
    variables: { arr: "[2, 3, 5, 7]", N: "4", i: "1", j: "2", min_idx: "1" },
    viz: {
      caption: "Enter inner loop `j = 2`",
      values: [2, 3, 5, 7],
      highlightIndices: [1, 2],
      minIndex: 1,
    },
  },
  {
    line: 8,
    variables: { arr: "[2, 3, 5, 7]", N: "4", i: "1", j: "2", min_idx: "1" },
    viz: {
      caption: "Skip update: 5 ≮ 3",
      values: [2, 3, 5, 7],
      highlightIndices: [1, 2],
      minIndex: 1,
    },
  },
  {
    line: 7,
    variables: { arr: "[2, 3, 5, 7]", N: "4", i: "1", j: "3", min_idx: "1" },
    viz: {
      caption: "Continue inner loop `j = 3`",
      values: [2, 3, 5, 7],
      highlightIndices: [1, 3],
      minIndex: 1,
    },
  },
  {
    line: 8,
    variables: { arr: "[2, 3, 5, 7]", N: "4", i: "1", j: "3", min_idx: "1" },
    viz: {
      caption: "Skip update: 7 ≮ 3",
      values: [2, 3, 5, 7],
      highlightIndices: [1, 3],
      minIndex: 1,
    },
  },
  {
    line: 10,
    variables: { arr: "[2, 3, 5, 7]", N: "4", i: "1", j: "3", min_idx: "1" },
    consoleAppend: ["exch(arr, 1, 1): minimum already at i"],
    viz: {
      caption: "`exch(arr, 1, 1)` (no-op)",
      values: [2, 3, 5, 7],
      highlightIndices: [1],
      minIndex: 1,
    },
  },
  {
    line: 5,
    variables: { arr: "[2, 3, 5, 7]", N: "4", i: "2", j: "--", min_idx: "--" },
    viz: {
      caption: "Continue outer loop `i = 2`",
      values: [2, 3, 5, 7],
      highlightIndices: [2],
    },
  },
  {
    line: 6,
    variables: { arr: "[2, 3, 5, 7]", N: "4", i: "2", j: "--", min_idx: "2" },
    viz: {
      caption: "`min_idx = 2`",
      values: [2, 3, 5, 7],
      highlightIndices: [2],
      minIndex: 2,
    },
  },
  {
    line: 7,
    variables: { arr: "[2, 3, 5, 7]", N: "4", i: "2", j: "3", min_idx: "2" },
    viz: {
      caption: "Enter inner loop `j = 3`",
      values: [2, 3, 5, 7],
      highlightIndices: [2, 3],
      minIndex: 2,
    },
  },
  {
    line: 8,
    variables: { arr: "[2, 3, 5, 7]", N: "4", i: "2", j: "3", min_idx: "2" },
    viz: {
      caption: "Skip update: 7 ≮ 5",
      values: [2, 3, 5, 7],
      highlightIndices: [2, 3],
      minIndex: 2,
    },
  },
  {
    line: 10,
    variables: { arr: "[2, 3, 5, 7]", N: "4", i: "2", j: "3", min_idx: "2" },
    consoleAppend: ["exch(arr, 2, 2): minimum already at i"],
    viz: {
      caption: "`exch(arr, 2, 2)` (no-op)",
      values: [2, 3, 5, 7],
      highlightIndices: [2],
      minIndex: 2,
    },
  },
  {
    line: 5,
    variables: { arr: "[2, 3, 5, 7]", N: "4", i: "3", j: "--", min_idx: "--" },
    viz: {
      caption: "Continue outer loop `i = 3`",
      values: [2, 3, 5, 7],
      highlightIndices: [3],
    },
  },
  {
    line: 6,
    variables: { arr: "[2, 3, 5, 7]", N: "4", i: "3", j: "--", min_idx: "3" },
    viz: {
      caption: "`min_idx = 3`",
      values: [2, 3, 5, 7],
      highlightIndices: [3],
      minIndex: 3,
    },
  },
  {
    line: 7,
    variables: { arr: "[2, 3, 5, 7]", N: "4", i: "3", j: "--", min_idx: "3" },
    viz: {
      caption: "Enter inner loop empty `range(4, 4)` (no `j`)",
      values: [2, 3, 5, 7],
      highlightIndices: [],
      minIndex: 3,
    },
  },
  {
    line: 10,
    variables: { arr: "[2, 3, 5, 7]", N: "4", i: "3", j: "--", min_idx: "3" },
    consoleAppend: ["exch(arr, 3, 3): minimum already at i"],
    viz: {
      caption: "`exch(arr, 3, 3)` (no-op)",
      values: [2, 3, 5, 7],
      highlightIndices: [3],
      minIndex: 3,
    },
  },
  {
    line: 18,
    variables: { arr: "[2, 3, 5, 7]", data: "[2, 3, 5, 7]" },
    consoleAppend: ["Sorted: [2, 3, 5, 7]", "Process finished (mock)."],
    viz: {
      caption: "`selection_sort` returned → data sorted",
      values: [2, 3, 5, 7],
      highlightIndices: [],
    },
  },
];

type QuickFindStepInput = {
  op: string;
  before: number[];
  after: number[];
  accesses: number;
  edge: DsuGraphEdge;
};

const QUICK_FIND_STEP_INPUTS: QuickFindStepInput[] = [
  {
    op: "union(9,0)",
    before: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    after: [0, 1, 2, 3, 4, 5, 6, 7, 8, 0],
    accesses: 13,
    edge: { from: 9, to: 0 },
  },
  {
    op: "union(3,4)",
    before: [0, 1, 2, 3, 4, 5, 6, 7, 8, 0],
    after: [0, 1, 2, 4, 4, 5, 6, 7, 8, 0],
    accesses: 13,
    edge: { from: 3, to: 4 },
  },
  {
    op: "union(5,8)",
    before: [0, 1, 2, 4, 4, 5, 6, 7, 8, 0],
    after: [0, 1, 2, 4, 4, 8, 6, 7, 8, 0],
    accesses: 13,
    edge: { from: 5, to: 8 },
  },
  {
    op: "union(7,2)",
    before: [0, 1, 2, 4, 4, 8, 6, 7, 8, 0],
    after: [0, 1, 2, 4, 4, 8, 6, 2, 8, 0],
    accesses: 13,
    edge: { from: 7, to: 2 },
  },
  {
    op: "union(2,1)",
    before: [0, 1, 2, 4, 4, 8, 6, 2, 8, 0],
    after: [0, 1, 1, 4, 4, 8, 6, 1, 8, 0],
    accesses: 14,
    edge: { from: 2, to: 1 },
  },
  {
    op: "union(5,7)",
    before: [0, 1, 1, 4, 4, 8, 6, 1, 8, 0],
    after: [0, 1, 1, 4, 4, 1, 6, 1, 1, 0],
    accesses: 14,
    edge: { from: 5, to: 7 },
  },
  {
    op: "union(0,3)",
    before: [0, 1, 1, 4, 4, 1, 6, 1, 1, 0],
    after: [4, 1, 1, 4, 4, 1, 6, 1, 1, 4],
    accesses: 14,
    edge: { from: 0, to: 3 },
  },
  {
    op: "union(4,2)",
    before: [4, 1, 1, 4, 4, 1, 6, 1, 1, 4],
    after: [1, 1, 1, 1, 1, 1, 6, 1, 1, 1],
    accesses: 16,
    edge: { from: 4, to: 2 },
  },
];

function buildDsuNodes(values: number[]): DsuGraphNode[] {
  return values.map((group, id) => ({ id, group }));
}

function formatIdArray(values: number[]): string {
  return `[${values.join(", ")}]`;
}

function parseUnionOperation(op: string): { p: number; q: number } {
  const matched = op.match(/^union\((\d+),(\d+)\)$/);
  if (!matched) {
    throw new Error(`Invalid quick-find operation: ${op}`);
  }
  return { p: Number(matched[1]), q: Number(matched[2]) };
}

/** `union(p,q)` wrapped in backticks for caption inline-code segments (see `splitCaptionByBackticks`). */
function quickFindCaptionUnion(op: string): string {
  return `\`${op}\``;
}

/** 1-based line index of `def union(self, p, q):` inside {@link QUICK_FIND_SOURCE}. */
function findQuickFindUnionDefOneBasedLine(): number {
  const lines = QUICK_FIND_SOURCE.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    if (/^\s*def union\(self,\s*p,\s*q\)\s*:/.test(lines[i]!)) {
      return i + 1;
    }
  }
  throw new Error("QUICK_FIND_SOURCE: union method definition line not found");
}

function buildQuickFindTrace(): MockStep[] {
  const trace: MockStep[] = [];
  const edges: DsuGraphEdge[] = [];
  const initial = QUICK_FIND_STEP_INPUTS[0]!.before;
  trace.push({
    line: 1,
    variables: {
      operation: "init",
      id_before: formatIdArray(initial),
      id_after: formatIdArray(initial),
      array_accesses: "0",
    },
    consoleAppend: [
      "Exercise 1: Analysis of quick-find",
      "Initial id[]: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]",
    ],
    viz: {
      kind: "dsuGraph",
      caption: "Initialize id[] = [0..9]",
      values: initial,
      highlightIndices: [],
      nodes: buildDsuNodes(initial),
      // Snapshot: `edges` is mutated across the build; do not store the same reference.
      edges: [...edges],
    },
  });

  for (const unionStep of QUICK_FIND_STEP_INPUTS) {
    const { p, q } = parseUnionOperation(unionStep.op);
    const idBefore = [...unionStep.before];
    const running = [...unionStep.before];
    const pid = running[p]!;
    const qid = running[q]!;
    const unionEdges = [...edges, unionStep.edge];
    let accesses = 0;
    /** Union edge appears only after `if self.id[i] == pid` is true (matches code semantics). */
    let unionEdgeVisible = false;

    const pushStep = (args: {
      line: number;
      caption: string;
      highlightIndices: number[];
      i?: number;
      consoleAppend?: string[];
    }) => {
      const vizEdges = unionEdgeVisible ? unionEdges : [...edges];
      trace.push({
        line: args.line,
        variables: {
          operation: unionStep.op,
          p: String(p),
          q: String(q),
          pid: String(pid),
          qid: String(qid),
          i: args.i === undefined ? "--" : String(args.i),
          id_before: formatIdArray(idBefore),
          id_after: formatIdArray(running),
          array_accesses: String(accesses),
        },
        consoleAppend: args.consoleAppend,
        viz: {
          kind: "dsuGraph",
          caption: args.caption,
          values: [...running],
          highlightIndices: args.highlightIndices,
          nodes: buildDsuNodes(running),
          edges: vizEdges,
          activeEdge: unionEdgeVisible ? unionStep.edge : undefined,
        },
      });
    };

    pushStep({
      line: 19,
      caption: `${quickFindCaptionUnion(unionStep.op)}: enter union(p, q)`,
      highlightIndices: [p, q],
    });

    accesses += 1;
    pushStep({
      line: 20,
      caption: `${quickFindCaptionUnion(unionStep.op)}: read pid = id[p]`,
      highlightIndices: [p],
    });

    accesses += 1;
    pushStep({
      line: 21,
      caption: `${quickFindCaptionUnion(unionStep.op)}: read qid = id[q]`,
      highlightIndices: [q],
    });

    for (let i = 0; i < running.length; i += 1) {
      pushStep({
        line: 22,
        caption: `${quickFindCaptionUnion(unionStep.op)}: scan i = ${i}`,
        highlightIndices: [i],
        i,
      });

      accesses += 1;
      const matches = running[i] === pid;
      if (matches) {
        unionEdgeVisible = true;
      }
      pushStep({
        line: 23,
        caption: matches
          ? `${quickFindCaptionUnion(unionStep.op)}: id[${i}] == pid (match)`
          : `${quickFindCaptionUnion(unionStep.op)}: id[${i}] != pid (skip)`,
        highlightIndices: matches ? [i, p, q] : [i],
        i,
      });

      if (matches) {
        running[i] = qid;
        accesses += 1;
        pushStep({
          line: 24,
          caption: `${quickFindCaptionUnion(unionStep.op)}: set id[${i}] = qid`,
          highlightIndices: [i, q],
          i,
        });
      }
    }

    if (accesses !== unionStep.accesses) {
      throw new Error(
        `Access mismatch for ${unionStep.op}: got ${accesses}, expected ${unionStep.accesses}`
      );
    }
    if (formatIdArray(running) !== formatIdArray(unionStep.after)) {
      throw new Error(`State mismatch for ${unionStep.op}`);
    }

    trace.push({
      line: 22,
      variables: {
        operation: unionStep.op,
        p: String(p),
        q: String(q),
        pid: String(pid),
        qid: String(qid),
        i: "--",
        id_before: formatIdArray(idBefore),
        id_after: formatIdArray(running),
        array_accesses: String(accesses),
      },
      consoleAppend: [
        `${unionStep.op}: accesses=${accesses}`,
        `id[] -> ${formatIdArray(running)}`,
      ],
      viz: {
        kind: "dsuGraph",
        caption: `${quickFindCaptionUnion(unionStep.op)} complete -> ${accesses} array accesses`,
        values: [...running],
        highlightIndices: [p, q],
        nodes: buildDsuNodes(running),
        edges: unionEdges,
        activeEdge: unionStep.edge,
      },
    });

    edges.push(unionStep.edge);
  }

  const finalValues = QUICK_FIND_STEP_INPUTS[QUICK_FIND_STEP_INPUTS.length - 1]!.after;
  trace.push({
    line: 25,
    variables: {
      operation: "finished",
      p: "--",
      q: "--",
      pid: "--",
      qid: "--",
      i: "--",
      id_before: formatIdArray(finalValues),
      id_after: formatIdArray(finalValues),
      array_accesses: "0",
    },
    viz: {
      kind: "dsuGraph",
      caption: "Finished",
      values: [...finalValues],
      highlightIndices: [],
      nodes: buildDsuNodes(finalValues),
      edges: [...edges],
      uniformEdgeColor: true,
    },
  });

  return trace;
}

/** Line-by-line trace inside `QuickFindUF.union` (one animation step per source line). */
export const quickFindFullTrace: MockStep[] = buildQuickFindTrace();

/**
 * One animation step per `union()` (plus init and Finished). Console logs are union summaries only.
 * Code highlight uses the `def union` line for each union step.
 */
function buildQuickFindUnionTrace(): MockStep[] {
  const trace: MockStep[] = [];
  const edges: DsuGraphEdge[] = [];
  const initial = QUICK_FIND_STEP_INPUTS[0]!.before;
  const unionDefLine = findQuickFindUnionDefOneBasedLine();

  trace.push({
    line: 1,
    variables: {
      operation: "init",
      id_before: formatIdArray(initial),
      id_after: formatIdArray(initial),
      array_accesses: "0",
    },
    consoleAppend: [
      "Exercise 1: Analysis of quick-find",
      "Initial id[]: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]",
    ],
    viz: {
      kind: "dsuGraph",
      caption: "Initialize id[] = [0..9]",
      values: initial,
      highlightIndices: [],
      nodes: buildDsuNodes(initial),
      edges: [...edges],
    },
  });

  for (const unionStep of QUICK_FIND_STEP_INPUTS) {
    const { p, q } = parseUnionOperation(unionStep.op);
    const idBefore = [...unionStep.before];
    const running = [...unionStep.after];
    const pid = idBefore[p]!;
    const qid = idBefore[q]!;
    const accesses = unionStep.accesses;
    const unionEdges = [...edges, unionStep.edge];

    trace.push({
      line: unionDefLine,
      variables: {
        operation: unionStep.op,
        p: String(p),
        q: String(q),
        pid: String(pid),
        qid: String(qid),
        i: "--",
        id_before: formatIdArray(idBefore),
        id_after: formatIdArray(running),
        array_accesses: String(accesses),
      },
      consoleAppend: [
        `${unionStep.op}: accesses=${accesses}`,
        `id[] -> ${formatIdArray(running)}`,
      ],
      viz: {
        kind: "dsuGraph",
        caption: quickFindCaptionUnion(unionStep.op),
        values: [...running],
        highlightIndices: [p, q],
        nodes: buildDsuNodes(running),
        edges: unionEdges,
        activeEdge: unionStep.edge,
      },
    });

    edges.push(unionStep.edge);
  }

  const finalValues = QUICK_FIND_STEP_INPUTS[QUICK_FIND_STEP_INPUTS.length - 1]!.after;
  trace.push({
    line: 25,
    variables: {
      operation: "finished",
      p: "--",
      q: "--",
      pid: "--",
      qid: "--",
      i: "--",
      id_before: formatIdArray(finalValues),
      id_after: formatIdArray(finalValues),
      array_accesses: "0",
    },
    viz: {
      kind: "dsuGraph",
      caption: "Finished",
      values: [...finalValues],
      highlightIndices: [],
      nodes: buildDsuNodes(finalValues),
      edges: [...edges],
      uniformEdgeColor: true,
    },
  });

  return trace;
}

export const quickFindUnionTrace: MockStep[] = buildQuickFindUnionTrace();

export type AlgorithmDemo = {
  source: string;
  trace: MockStep[];
  loopPulseRules: LoopPulseRestartRule[];
};

export const ALGORITHM_DEMOS = {
  insertion: {
    source: INSERTION_SORT_SOURCE,
    trace: insertionSortTrace,
    loopPulseRules: insertionSortLoopPulseRules,
  },
  selection: {
    source: SELECTION_SORT_SOURCE,
    trace: selectionSortTrace,
    loopPulseRules: selectionSortLoopPulseRules,
  },
  "quick-find": {
    source: QUICK_FIND_SOURCE,
    trace: quickFindUnionTrace,
    loopPulseRules: [],
  },
  "quick-find-full": {
    source: QUICK_FIND_SOURCE,
    trace: quickFindFullTrace,
    loopPulseRules: [],
  },
} satisfies Record<string, AlgorithmDemo>;

export type AlgorithmId = keyof typeof ALGORITHM_DEMOS;

export function getAlgorithmDemo(id: AlgorithmId): AlgorithmDemo {
  return ALGORITHM_DEMOS[id];
}

export function getAlgorithmIds(): AlgorithmId[] {
  return Object.keys(ALGORITHM_DEMOS) as AlgorithmId[];
}
