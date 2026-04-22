import {
  type AlgorithmId,
  type MockStep,
} from "./mockTrace";
import {
  resolveAlgorithmAnchorLine,
  resolveAlgorithmAnchorOffset,
} from "./algorithmLineAnchors";
import { selectionSortedExclusiveEnd } from "./selectionSortedPrefix";
import { isSelectionJInactivePhase } from "./selectionPointerPhase";

type SortedRangeContext = {
  stepLine: number;
  variables: Record<string, string>;
  valuesLength: number;
};

type JInactiveContext = {
  stepLine: number;
  jIndex: number | undefined;
};

/**
 * Per-algorithm line anchors that drive DSU cue animations in AnimationPanel:
 * - `scanLine`        Quick Find - Full: the `for i in range(n)` scan pass;
 *                     a "scan" pulse highlights the current `i`.
 * - `findWhileLine`   Quick Union - Full: the `while i != self.id[i]` check;
 *                     a "trace" pulse highlights the current `i`.
 * - `findAdvanceLine` Quick Union - Full: the `i = self.id[i]` advance step;
 *                     a "trace" pulse highlights both endpoints and the edge.
 * Undefined keys mean the algorithm has no cue of that kind (default).
 */
export type DsuCueLines = {
  scanLine?: number;
  findWhileLine?: number;
  findAdvanceLine?: number;
};

export type AlgorithmVisualSpec = {
  inferJMinus1FromHighlights: boolean;
  getSortedExclusiveEnd: (ctx: SortedRangeContext) => number | undefined;
  isJInactivePhase: (ctx: JInactiveContext) => boolean;
  /** Which traces should define fit-envelope measurement for this algorithm. */
  envelopeTraceIds: readonly AlgorithmId[];
  /**
   * When true, Quick Union tree layout applies: node slots take part in the
   * FLIP reflow, and edges render as `<line>` with transitioning endpoints.
   */
  usesQuickUnionTreeLayout: boolean;
  /** See {@link DsuCueLines}. Omitted (undefined) when there are no DSU cues. */
  dsuCueLines?: DsuCueLines;
};

export type AlgorithmIconKey =
  | "sort"
  | "quickFind"
  | "quickFindFull"
  | "quickUnion"
  | "quickUnionFull";

export type AlgorithmSpec = {
  id: AlgorithmId;
  title: string;
  /** Lowercase searchable aliases in addition to the display title. */
  searchBlob: string;
  iconKey: AlgorithmIconKey;
  visual: AlgorithmVisualSpec;
};

const noJInactivePhase = () => false;
const BAR_SORT_PAIR_ENVELOPE_IDS = ["insertion", "selection"] as const;
const SINGLE_TRACE_ENVELOPE_IDS = [] as const;

const ALGORITHM_SPECS: Record<AlgorithmId, AlgorithmSpec> = {
  insertion: {
    id: "insertion",
    title: "Insertion sort",
    searchBlob: "sorting ins demo algorithm array stable online o n2",
    iconKey: "sort",
    visual: {
      inferJMinus1FromHighlights: true,
      getSortedExclusiveEnd: ({ stepLine, valuesLength }) => {
        return stepLine === resolveAlgorithmAnchorLine("insertion", "callSort")
          ? valuesLength
          : undefined;
      },
      isJInactivePhase: noJInactivePhase,
      envelopeTraceIds: BAR_SORT_PAIR_ENVELOPE_IDS,
      usesQuickUnionTreeLayout: false,
    },
  },
  selection: {
    id: "selection",
    title: "Selection sort",
    searchBlob: "sorting sel demo algorithm in-place o n2 minimum swap",
    iconKey: "sort",
    visual: {
      inferJMinus1FromHighlights: false,
      getSortedExclusiveEnd: ({ stepLine, variables, valuesLength }) => {
        return selectionSortedExclusiveEnd(stepLine, variables, valuesLength);
      },
      isJInactivePhase: ({ stepLine, jIndex }) => {
        return isSelectionJInactivePhase("selection", stepLine, jIndex);
      },
      envelopeTraceIds: BAR_SORT_PAIR_ENVELOPE_IDS,
      usesQuickUnionTreeLayout: false,
    },
  },
  "quick-find": {
    id: "quick-find",
    title: "Quick Find",
    searchBlob:
      "exercise 1 quick find union-find dsu id array accesses union steps per union coarse",
    iconKey: "quickFind",
    visual: {
      inferJMinus1FromHighlights: false,
      getSortedExclusiveEnd: () => undefined,
      isJInactivePhase: noJInactivePhase,
      envelopeTraceIds: SINGLE_TRACE_ENVELOPE_IDS,
      usesQuickUnionTreeLayout: false,
    },
  },
  "quick-find-full": {
    id: "quick-find-full",
    title: "Quick Find - Full Trace",
    searchBlob:
      "exercise 1 quick find full line by line union-find dsu id array accesses fine grained",
    iconKey: "quickFindFull",
    visual: {
      inferJMinus1FromHighlights: false,
      getSortedExclusiveEnd: () => undefined,
      isJInactivePhase: noJInactivePhase,
      envelopeTraceIds: SINGLE_TRACE_ENVELOPE_IDS,
      usesQuickUnionTreeLayout: false,
      dsuCueLines: {
        scanLine: resolveAlgorithmAnchorOffset("quick-find", "unionDef", 3),
      },
    },
  },
  "quick-union": {
    id: "quick-union",
    title: "Quick Union",
    searchBlob:
      "exercise 2 quick union union-find dsu id array accesses union steps per union tree structure coarse",
    iconKey: "quickUnion",
    visual: {
      inferJMinus1FromHighlights: false,
      getSortedExclusiveEnd: () => undefined,
      isJInactivePhase: noJInactivePhase,
      envelopeTraceIds: SINGLE_TRACE_ENVELOPE_IDS,
      usesQuickUnionTreeLayout: true,
    },
  },
  "quick-union-full": {
    id: "quick-union-full",
    title: "Quick Union - Full Trace",
    searchBlob:
      "exercise 2 quick union full line by line union-find dsu id array accesses tree structure fine grained",
    iconKey: "quickUnionFull",
    visual: {
      inferJMinus1FromHighlights: false,
      getSortedExclusiveEnd: () => undefined,
      isJInactivePhase: noJInactivePhase,
      envelopeTraceIds: SINGLE_TRACE_ENVELOPE_IDS,
      usesQuickUnionTreeLayout: true,
      dsuCueLines: {
        findWhileLine: resolveAlgorithmAnchorLine("quick-union", "findWhile"),
        findAdvanceLine: resolveAlgorithmAnchorLine(
          "quick-union",
          "findAdvance"
        ),
      },
    },
  },
};

export type AlgorithmEnvelopeTrace = {
  id: AlgorithmId;
  trace: MockStep[];
};

export function getAlgorithmIds(): AlgorithmId[] {
  return Object.keys(ALGORITHM_SPECS) as AlgorithmId[];
}

export function getAlgorithmSpec(id: AlgorithmId): AlgorithmSpec {
  return ALGORITHM_SPECS[id];
}

export function getAlgorithmSpecs(): AlgorithmSpec[] {
  return Object.values(ALGORITHM_SPECS);
}

export function getAlgorithmEnvelopeTraces(
  id: AlgorithmId,
  fallbackTrace: MockStep[],
  getDemo: (traceId: AlgorithmId) => { trace: MockStep[] }
): AlgorithmEnvelopeTrace[] {
  const spec = getAlgorithmSpec(id);
  const ids = spec.visual.envelopeTraceIds;

  if (ids.length === 0) {
    return [{ id, trace: fallbackTrace }];
  }

  return ids.map((traceId) => ({
    id: traceId,
    trace: getDemo(traceId).trace,
  }));
}
