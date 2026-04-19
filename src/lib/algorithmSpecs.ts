import {
  type AlgorithmId,
  type MockStep,
} from "./mockTrace";
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

export type AlgorithmVisualSpec = {
  inferJMinus1FromHighlights: boolean;
  getSortedExclusiveEnd: (ctx: SortedRangeContext) => number | undefined;
  isJInactivePhase: (ctx: JInactiveContext) => boolean;
  /** Which traces should define fit-envelope measurement for this algorithm. */
  envelopeTraceIds: readonly AlgorithmId[];
};

export type AlgorithmSpec = {
  id: AlgorithmId;
  title: string;
  /** Lowercase searchable aliases in addition to the display title. */
  searchBlob: string;
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
    visual: {
      inferJMinus1FromHighlights: true,
      getSortedExclusiveEnd: ({ stepLine, valuesLength }) => {
        return stepLine === 18 ? valuesLength : undefined;
      },
      isJInactivePhase: noJInactivePhase,
      envelopeTraceIds: BAR_SORT_PAIR_ENVELOPE_IDS,
    },
  },
  selection: {
    id: "selection",
    title: "Selection sort",
    searchBlob: "sorting sel demo algorithm in-place o n2 minimum swap",
    visual: {
      inferJMinus1FromHighlights: false,
      getSortedExclusiveEnd: ({ stepLine, variables, valuesLength }) => {
        return selectionSortedExclusiveEnd(stepLine, variables, valuesLength);
      },
      isJInactivePhase: ({ stepLine, jIndex }) => {
        return isSelectionJInactivePhase("selection", stepLine, jIndex);
      },
      envelopeTraceIds: BAR_SORT_PAIR_ENVELOPE_IDS,
    },
  },
  "quick-find": {
    id: "quick-find",
    title: "Quick Find",
    searchBlob:
      "exercise 1 quick find union-find dsu id array accesses union steps per union coarse",
    visual: {
      inferJMinus1FromHighlights: false,
      getSortedExclusiveEnd: () => undefined,
      isJInactivePhase: noJInactivePhase,
      envelopeTraceIds: SINGLE_TRACE_ENVELOPE_IDS,
    },
  },
  "quick-find-full": {
    id: "quick-find-full",
    title: "Quick Find - Full",
    searchBlob:
      "exercise 1 quick find full line by line union-find dsu id array accesses fine grained",
    visual: {
      inferJMinus1FromHighlights: false,
      getSortedExclusiveEnd: () => undefined,
      isJInactivePhase: noJInactivePhase,
      envelopeTraceIds: SINGLE_TRACE_ENVELOPE_IDS,
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
