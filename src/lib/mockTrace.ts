/**
 * Mock execution trace - independent of a real Python runtime.
 * Line numbers are 1-based, matching the default editor document.
 */

export type MockViz = {
  caption: string;
  values: number[];
  /** Indices into values to emphasize (e.g. key, j). */
  highlightIndices: number[];
  /** Optional index to render with the dedicated min-tracker color. */
  minIndex?: number;
};

export type MockStep = {
  line: number;
  variables: Record<string, string>;
  consoleAppend?: string[];
  viz: MockViz;
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

export type AlgorithmId = "insertion" | "selection";

export function getAlgorithmDemo(id: AlgorithmId): {
  source: string;
  trace: MockStep[];
  loopPulseRules: LoopPulseRestartRule[];
} {
  switch (id) {
    case "insertion":
      return {
        source: INSERTION_SORT_SOURCE,
        trace: insertionSortTrace,
        loopPulseRules: insertionSortLoopPulseRules,
      };
    case "selection":
      return {
        source: SELECTION_SORT_SOURCE,
        trace: selectionSortTrace,
        loopPulseRules: selectionSortLoopPulseRules,
      };
  }
}
