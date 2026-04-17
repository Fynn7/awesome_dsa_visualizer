import { AppWindow, Maximize2 } from "lucide-react";
import type {
  AlgorithmId,
  MockStackNodeViz,
  MockStackLinkedListViz,
  MockStep,
  MockViz,
} from "../lib/mockTrace";
import { selectionSortedExclusiveEnd } from "../lib/selectionSortedPrefix";
import { isSelectionJInactivePhase } from "../lib/selectionPointerPhase";
import {
  layoutPointerOverlayCenters,
  resolveArrayPointers,
  type ResolvedArrayPointers,
} from "../lib/parseArrayPointers";
import type { BarTone } from "../lib/vizBarTone";
import { barToneForIndex } from "../lib/vizBarTone";
import { getAnimationDurationMs } from "../lib/speedPresets";
import { formatVizCaptionForDisplay } from "../lib/formatVizCaptionForDisplay";
import {
  beginPointerExit,
  completePointerExit,
  createPointerTransitionMap,
  showPointer,
} from "../lib/pointerTransitionState";
import {
  schedulePointerPlayback,
  shouldAnimatePointerFlip,
} from "../lib/pointerAnimationScheduler";
import { strings } from "../strings";
import { PanelSkeleton } from "./LoadingState";
import {
  splitCaptionByBackticks,
  stripCaptionBackticks,
} from "@visualizer-ui";
import type { MouseEvent } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type StepPointerNavigation = {
  canStepForward: boolean;
  canStepBack: boolean;
  onStepForward: () => void;
  onStepBack: () => void;
};

type Props = {
  trace: MockStep[];
  viz: MockViz;
  variables: Record<string, string>;
  algorithmId: AlgorithmId;
  stepLine: number;
  showArrayIndices: boolean;
  enableAnimationScroll: boolean;
  /** No-scroll fit mode: if false, fit never scales above 1 (intrinsic size cap). */
  animationFitAllowUpscale: boolean;
  speedMs: number;
  isAutoPlayingStep: boolean;
  onPresentNative?: () => void;
  onPresentOverlay?: () => void;
  stepPointerNavigation?: StepPointerNavigation;
  onReadyChange?: (ready: boolean) => void;
};

const PRESENT_ICON = { size: 16, strokeWidth: 2 } as const;

/** Caps viz zoom when the panel is large and the diagram is tiny (rem-based layout). */
const MAX_VIZ_UPSCALE = 6;

type VisualBar = {
  id: string;
  value: number;
};

type PointerKey = "i" | "j" | "jMinus1" | "min";
type StackPointerKey = "first" | "oldfirst";
const ARRAY_POINTER_KEYS: readonly PointerKey[] = ["i", "j", "jMinus1", "min"];
const STACK_POINTER_KEYS: readonly StackPointerKey[] = ["first", "oldfirst"];

type StackPointerLayout = {
  layerHeightRem: number;
  bottomById: Partial<Record<StackPointerKey, number>>;
};

function pointerToneClass(tone: BarTone): string {
  switch (tone) {
    case "key":
      return "viz-pointer--toneKey";
    case "hl":
      return "viz-pointer--toneHl";
    case "min":
      return "viz-pointer--toneMin";
    case "sorted":
      return "viz-pointer--toneSorted";
    default:
      return "viz-pointer--toneNeutral";
  }
}

function buildVizAriaLabel(
  caption: string,
  pointers: ResolvedArrayPointers,
  length: number,
  minIndex?: number
): string {
  const parts = [caption];
  if (pointers.i !== undefined) parts.push(`i at index ${pointers.i}`);
  if (pointers.j !== undefined) parts.push(`j at index ${pointers.j}`);
  if (pointers.jMinus1 !== undefined) {
    parts.push(`j minus 1 at index ${pointers.jMinus1}`);
  }
  if (typeof minIndex === "number" && minIndex >= 0) {
    parts.push(`min at index ${minIndex}`);
  }
  if (length > 0) {
    parts.push(`length ${length}, indices 0 to ${length - 1}`);
  }
  return parts.join(". ");
}

function buildStackVizAriaLabel(
  caption: string,
  linkedList: MockStackLinkedListViz
): string {
  const parts = [caption, `linked list nodes ${linkedList.nodes.length}`];
  for (const ptr of linkedList.pointers) {
    if (ptr.nodeId === null) {
      parts.push(`${ptr.id} is None`);
    } else {
      const node = linkedList.nodes.find((n) => n.id === ptr.nodeId);
      if (node) {
        parts.push(`${ptr.id} at value ${node.value}`);
      }
    }
  }
  return parts.join(". ");
}

function computeStackPointerLayout(
  linkedList: MockStackLinkedListViz | undefined,
  minLevelCount = 0
): StackPointerLayout {
  if (!linkedList) {
    return {
      layerHeightRem: 2.35,
      bottomById: {},
    };
  }
  const visible = linkedList.pointers.filter((ptr) => ptr.nodeId !== null);
  if (visible.length === 0) {
    return {
      layerHeightRem: 2.35,
      bottomById: {},
    };
  }

  // Keep a single visible pointer visually closest to the node top.
  const baseBottom = -0.28;
  // Each additional pointer stacks upward with enough clearance to avoid overlap.
  const stepRem = visible.length > 3 ? 1.4 : 1.55;
  const bottomById: Partial<Record<StackPointerKey, number>> = {};
  const byNodeId = new Map<string, StackPointerKey[]>();
  for (const ptr of visible) {
    const nodeId = ptr.nodeId as string;
    const group = byNodeId.get(nodeId);
    if (group) {
      group.push(ptr.id);
    } else {
      byNodeId.set(nodeId, [ptr.id]);
    }
  }

  let maxLevel = Math.max(0, minLevelCount - 1);
  for (const ids of byNodeId.values()) {
    for (let i = 0; i < ids.length; i += 1) {
      bottomById[ids[i]!] = baseBottom + i * stepRem;
      if (i > maxLevel) {
        maxLevel = i;
      }
    }
  }

  // Include label + arrow headroom so the top row won't clip.
  const layerHeightRem = Math.max(2.1, baseBottom + maxLevel * stepRem + 2.25);
  return {
    layerHeightRem,
    bottomById,
  };
}

function maxStackPointerOverlapLevelCount(trace: MockStep[]): number {
  let maxCount = 0;
  for (const step of trace) {
    const linkedList = step.viz.stackLinkedList;
    if (!linkedList) continue;
    const byNode = new Map<string, number>();
    for (const ptr of linkedList.pointers) {
      if (!ptr.nodeId) continue;
      byNode.set(ptr.nodeId, (byNode.get(ptr.nodeId) ?? 0) + 1);
    }
    for (const count of byNode.values()) {
      if (count > maxCount) {
        maxCount = count;
      }
    }
  }
  return maxCount;
}

function parseStackLinkKey(
  key: string
): { fromNodeId: string; toNodeId: string } | null {
  const sep = key.indexOf("->");
  if (sep <= 0 || sep >= key.length - 2) return null;
  return {
    fromNodeId: key.slice(0, sep),
    toNodeId: key.slice(sep + 2),
  };
}

export function AnimationPanel({
  trace,
  viz,
  variables,
  algorithmId,
  stepLine,
  showArrayIndices,
  enableAnimationScroll,
  animationFitAllowUpscale,
  speedMs,
  isAutoPlayingStep,
  onPresentNative,
  onPresentOverlay,
  stepPointerNavigation,
  onReadyChange,
}: Props) {
  const barIdSeedRef = useRef(0);
  const prevBarsRef = useRef<VisualBar[]>([]);
  const barRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const barInnerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prevRectsRef = useRef<Map<string, number>>(new Map());
  const prevValuesRef = useRef<number[] | null>(null);
  const rafRef = useRef<number | null>(null);
  const pointerFlipRafRef = useRef<number | null>(null);
  const barsTrackRef = useRef<HTMLDivElement | null>(null);
  const pointerIRef = useRef<HTMLSpanElement | null>(null);
  const pointerJRef = useRef<HTMLSpanElement | null>(null);
  const pointerJMinus1Ref = useRef<HTMLSpanElement | null>(null);
  const pointerMinRef = useRef<HTMLSpanElement | null>(null);
  const stackTrackRef = useRef<HTMLDivElement | null>(null);
  const stackItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const stackNodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const stackLinkRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const stackFirstPointerRef = useRef<HTMLSpanElement | null>(null);
  const stackOldFirstPointerRef = useRef<HTMLSpanElement | null>(null);
  const prevStackRectsRef = useRef<Map<string, number>>(new Map());
  const prevStackPointerVisibleRef = useRef<Record<StackPointerKey, boolean>>({
    first: false,
    oldfirst: false,
  });
  const prevStackPointerMetaRef = useRef<{
    first?: { nodeId: string; center: number };
    oldfirst?: { nodeId: string; center: number };
  }>({});
  const stackRafRef = useRef<number | null>(null);
  const stackPointerFlipRafRef = useRef<number | null>(null);
  const pointerEnterTimersRef = useRef<number[]>([]);
  const pointerExitTimerByKeyRef = useRef<
    Partial<Record<PointerKey, number>>
  >({});
  const stackPointerExitTimerByKeyRef = useRef<
    Partial<Record<StackPointerKey, number>>
  >({});
  const stackNodeEnterTimersRef = useRef<number[]>([]);
  const stackNodeExitTimerByKeyRef = useRef<Record<string, number>>({});
  const stackLinkEnterTimersRef = useRef<number[]>([]);
  const stackLinkExitTimerByKeyRef = useRef<Record<string, number>>({});
  const stackAnimationGenerationRef = useRef(0);
  const pointerTransitionStateRef = useRef(
    createPointerTransitionMap(ARRAY_POINTER_KEYS)
  );
  const stackPointerTransitionStateRef = useRef(
    createPointerTransitionMap(STACK_POINTER_KEYS)
  );
  const stackNodeTransitionStateRef = useRef<
    Record<string, { mounted: boolean; exiting: boolean }>
  >({});
  const stackLinkTransitionStateRef = useRef<
    Record<string, { mounted: boolean; exiting: boolean }>
  >({});
  const stackLinkSnapshotRef = useRef<
    Record<string, { fromNodeId: string; toNodeId: string }>
  >({});
  const stackNodeSnapshotRef = useRef<Record<string, MockStackNodeViz>>({});
  const [, setPointerTransitionRevision] = useState(0);
  const prevPointerVisibleRef = useRef<Record<PointerKey, boolean>>({
    i: false,
    j: false,
    jMinus1: false,
    min: false,
  });
  const prevPointerMetaRef = useRef<{
    i?: { idx: number; center: number };
    j?: { idx: number; center: number };
    jMinus1?: { idx: number; center: number };
    min?: { idx: number; center: number };
  }>({});
  const fitViewportRef = useRef<HTMLDivElement | null>(null);
  const graphSlotRef = useRef<HTMLDivElement | null>(null);
  const graphFitRef = useRef<HTMLDivElement | null>(null);
  const envelopeMeasureRef = useRef<HTMLDivElement | null>(null);
  /** Caption + bars; never receives explicit height so scrollWidth/Height stay natural. */
  const fitMeasureRef = useRef<HTMLDivElement | null>(null);
  const fitRafRef = useRef<number | null>(null);
  const [fitScale, setFitScale] = useState(1);
  const [fitHeightPx, setFitHeightPx] = useState<number | null>(null);
  const [fitEnvelopeSize, setFitEnvelopeSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [isPanelReady, setIsPanelReady] = useState(false);

  useEffect(() => {
    setIsPanelReady(false);
    const rafId = window.requestAnimationFrame(() => setIsPanelReady(true));
    return () => window.cancelAnimationFrame(rafId);
  }, [algorithmId, trace]);

  useEffect(() => {
    onReadyChange?.(isPanelReady);
  }, [isPanelReady, onReadyChange]);

  const isStackLinkedList =
    algorithmId === "stack" && !!viz.stackLinkedList;
  const stackLinkedList = viz.stackLinkedList;
  const shouldShowArrayIndices = showArrayIndices && !isStackLinkedList;
  const stackStableLevelCount = useMemo(
    () => maxStackPointerOverlapLevelCount(trace),
    [trace]
  );
  const stackPointerLayout = useMemo(
    () => computeStackPointerLayout(stackLinkedList, stackStableLevelCount),
    [stackLinkedList, stackStableLevelCount]
  );
  const visibleStackNodes = (() => {
    if (!stackLinkedList) return [] as MockStackNodeViz[];
    const map = stackNodeSnapshotRef.current;
    for (const node of stackLinkedList.nodes) {
      map[node.id] = node;
    }
    const ordered: MockStackNodeViz[] = [];
    const seen = new Set<string>();
    for (const node of stackLinkedList.nodes) {
      ordered.push(node);
      seen.add(node.id);
    }
    for (const [id, state] of Object.entries(stackNodeTransitionStateRef.current)) {
      if (!state.mounted || seen.has(id)) continue;
      const snap = map[id];
      if (snap) {
        ordered.push(snap);
      }
    }
    return ordered;
  })();
  const mountedStackLinkKeyByFromNode = (() => {
    const byFrom: Record<string, string> = {};
    const snapshots = stackLinkSnapshotRef.current;
    for (const [key, state] of Object.entries(stackLinkTransitionStateRef.current)) {
      if (!state.mounted) continue;
      const snap = snapshots[key] ?? parseStackLinkKey(key);
      if (!snap) continue;
      if (!byFrom[snap.fromNodeId]) {
        byFrom[snap.fromNodeId] = key;
      }
    }
    return byFrom;
  })();

  const bars = useMemo(() => {
    const prevBars = prevBarsRef.current;
    const nextBars: VisualBar[] = new Array(viz.values.length);
    const usedPrevIds = new Set<string>();

    // Pass 1: keep identity stable when same index keeps same value.
    for (let i = 0; i < viz.values.length; i += 1) {
      const prevBarAtIndex = prevBars[i];
      if (!prevBarAtIndex) continue;
      if (prevBarAtIndex.value !== viz.values[i]) continue;
      nextBars[i] = { id: prevBarAtIndex.id, value: viz.values[i]! };
      usedPrevIds.add(prevBarAtIndex.id);
    }

    // Build remaining reusable ids by value (excluding already reserved ids).
    const reusableByValue = new Map<number, string[]>();
    for (const prevBar of prevBars) {
      if (usedPrevIds.has(prevBar.id)) continue;
      const queue = reusableByValue.get(prevBar.value);
      if (queue) {
        queue.push(prevBar.id);
      } else {
        reusableByValue.set(prevBar.value, [prevBar.id]);
      }
    }

    // Pass 2: reuse same-value ids from other indexes (for swap/shift), else mint.
    for (let i = 0; i < viz.values.length; i += 1) {
      if (nextBars[i]) continue;
      const value = viz.values[i]!;
      const queue = reusableByValue.get(value);
      if (queue && queue.length > 0) {
        nextBars[i] = { id: queue.shift()!, value };
      } else {
        barIdSeedRef.current += 1;
        nextBars[i] = { id: `bar-${barIdSeedRef.current}`, value };
      }
    }

    return nextBars;
  }, [viz.values]);

  const flipDurationMs = getAnimationDurationMs(speedMs, isAutoPlayingStep);
  const pointerEnterDurationMs = Math.max(
    120,
    Math.min(480, Math.round(flipDurationMs * 0.4))
  );
  const bumpPointerTransitionRevision = useCallback(() => {
    setPointerTransitionRevision((v) => v + 1);
  }, []);
  const pointers = useMemo(
    () => {
      if (isStackLinkedList) {
        return {} as ResolvedArrayPointers;
      }
      return resolveArrayPointers(
        variables,
        viz,
        algorithmId === "insertion"
      );
    },
    [algorithmId, isStackLinkedList, variables, viz]
  );
  const sortedExclusiveEnd = useMemo(() => {
    if (isStackLinkedList) return undefined;
    if (algorithmId !== "selection") return undefined;
    return selectionSortedExclusiveEnd(
      stepLine,
      variables,
      viz.values.length
    );
  }, [algorithmId, isStackLinkedList, stepLine, variables, viz.values.length]);
  const isSelectionJInactive = useMemo(
    () => isSelectionJInactivePhase(algorithmId, stepLine, pointers.j),
    [algorithmId, stepLine, pointers.j]
  );
  const displayCaption = useMemo(
    () => formatVizCaptionForDisplay(viz.caption, variables),
    [viz.caption, variables]
  );
  const captionParts = useMemo(
    () => splitCaptionByBackticks(displayCaption),
    [displayCaption]
  );
  const maxVal = Math.max(1, ...viz.values);
  const showMinRow =
    typeof viz.minIndex === "number" && viz.minIndex >= 0;
  const traceEnvelopeSteps = useMemo(
    () =>
      trace.map((step) => {
        const displayStepCaption = formatVizCaptionForDisplay(
          step.viz.caption,
          step.variables
        );
        return {
          captionParts: splitCaptionByBackticks(displayStepCaption),
          stackLinkedList: step.viz.stackLinkedList,
          values: step.viz.values,
          maxVal: Math.max(1, ...step.viz.values),
          showMinSlot:
            typeof step.viz.minIndex === "number" && step.viz.minIndex >= 0,
        };
      }),
    [trace]
  );

  useLayoutEffect(() => {
    if (!isPanelReady) return;
    if (enableAnimationScroll) {
      setFitEnvelopeSize(null);
      return;
    }
    const host = envelopeMeasureRef.current;
    if (!host) return;
    let maxWidth = 0;
    let maxHeight = 0;
    const children = host.children;
    for (let i = 0; i < children.length; i += 1) {
      const el = children[i] as HTMLElement;
      maxWidth = Math.max(maxWidth, el.scrollWidth);
      maxHeight = Math.max(maxHeight, el.scrollHeight);
    }
    if (maxWidth > 0 && maxHeight > 0) {
      setFitEnvelopeSize((prev) => {
        if (
          prev &&
          Math.abs(prev.width - maxWidth) < 0.5 &&
          Math.abs(prev.height - maxHeight) < 0.5
        ) {
          return prev;
        }
        return { width: maxWidth, height: maxHeight };
      });
    }
  }, [
    enableAnimationScroll,
    traceEnvelopeSteps,
    shouldShowArrayIndices,
    isPanelReady,
  ]);

  useLayoutEffect(() => {
    if (isStackLinkedList) {
      prevBarsRef.current = [];
      prevRectsRef.current = new Map();
      prevValuesRef.current = null;
      prevPointerMetaRef.current = {};
      prevPointerVisibleRef.current = {
        i: false,
        j: false,
        jMinus1: false,
        min: false,
      };
      pointerTransitionStateRef.current = createPointerTransitionMap(
        ARRAY_POINTER_KEYS
      );
      for (const key of ARRAY_POINTER_KEYS) {
        const timer = pointerExitTimerByKeyRef.current[key];
        if (typeof timer === "number") {
          window.clearTimeout(timer);
        }
      }
      pointerExitTimerByKeyRef.current = {};
      return;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (pointerFlipRafRef.current !== null) {
      cancelAnimationFrame(pointerFlipRafRef.current);
      pointerFlipRafRef.current = null;
    }
    for (const timer of pointerEnterTimersRef.current) {
      window.clearTimeout(timer);
    }
    pointerEnterTimersRef.current = [];
    for (const key of ARRAY_POINTER_KEYS) {
      const timer = pointerExitTimerByKeyRef.current[key];
      if (typeof timer === "number") {
        window.clearTimeout(timer);
      }
    }
    pointerExitTimerByKeyRef.current = {};

    const layoutScale =
      enableAnimationScroll || fitScale <= 0 ? 1 : fitScale;

    const prevIndexById = new Map<string, number>();
    for (let idx = 0; idx < prevBarsRef.current.length; idx += 1) {
      prevIndexById.set(prevBarsRef.current[idx]!.id, idx);
    }

    const preClearPointers = {
      i: pointerIRef.current?.getBoundingClientRect(),
      j: pointerJRef.current?.getBoundingClientRect(),
      jMinus1: pointerJMinus1Ref.current?.getBoundingClientRect(),
      min: pointerMinRef.current?.getBoundingClientRect(),
    };

    const visualRects = new Map<string, number>();
    for (const bar of bars) {
      const el = barRefs.current[bar.id];
      if (!el) continue;
      visualRects.set(bar.id, el.getBoundingClientRect().left);
    }

    for (const bar of bars) {
      const el = barRefs.current[bar.id];
      if (!el) continue;
      el.style.transition = "";
      el.style.transform = "";
      el.style.willChange = "";
    }

    const currentRects = new Map<string, number>();
    for (const bar of bars) {
      const el = barRefs.current[bar.id];
      if (!el) continue;
      currentRects.set(bar.id, el.getBoundingClientRect().left);
    }

    const SPLIT_OFFSET = 11;
    const trackEl = barsTrackRef.current;
    let iCenter: number | undefined;
    let jCenter: number | undefined;
    let jm1Center: number | undefined;
    let minCenter: number | undefined;
    // Pointers must read geometry here, before bar FLIP applies translateX
    // invert on columns, otherwise rects are shifted and step-back looks wrong.
    if (trackEl && bars.length > 0) {
      const trackRect = trackEl.getBoundingClientRect();
      const colCenterInTrackAtRest = (idx: number) => {
        const bar = bars[idx];
        if (!bar) return undefined;
        const col = barRefs.current[bar.id];
        if (!col) return undefined;
        const r = col.getBoundingClientRect();
        return (
          (r.left + r.width / 2 - trackRect.left) / layoutScale
        );
      };
      const ptrCenters = layoutPointerOverlayCenters(
        pointers,
        colCenterInTrackAtRest,
        SPLIT_OFFSET,
        showMinRow ? viz.minIndex : undefined
      );
      iCenter = ptrCenters.i;
      jCenter = ptrCenters.j;
      jm1Center = ptrCenters.jMinus1;
      minCenter = ptrCenters.min;
    }

    const movedBarIds = new Set<string>();

    if (prevRectsRef.current.size > 0) {
      const moved: Array<{ el: HTMLDivElement; delta: number; barId: string }> =
        [];
      for (let idx = 0; idx < bars.length; idx += 1) {
        const bar = bars[idx]!;
        if (!prevRectsRef.current.has(bar.id)) continue;
        const visualLeft = visualRects.get(bar.id);
        const nextLeft = currentRects.get(bar.id);
        const prevIdx = prevIndexById.get(bar.id);
        if (
          visualLeft === undefined ||
          nextLeft === undefined ||
          prevIdx === undefined ||
          prevIdx === idx
        ) {
          continue;
        }
        const delta = visualLeft - nextLeft;
        if (Math.abs(delta) < 0.5) continue;
        const el = barRefs.current[bar.id];
        if (!el) continue;
        moved.push({ el, delta, barId: bar.id });
        movedBarIds.add(bar.id);
      }

      if (moved.length > 0) {
        for (const { el, delta } of moved) {
          el.style.willChange = "transform";
          el.style.transition = "none";
          el.style.transform = `translateX(${delta / layoutScale}px)`;
          // Ensure transform inversion is committed before playback.
          el.getBoundingClientRect();
        }

        rafRef.current = requestAnimationFrame(() => {
          for (const { el } of moved) {
            el.style.transition = `transform ${flipDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`;
            el.style.transform = "translateX(0)";
          }
          rafRef.current = null;
        });
      }
    }

    const prevVals = prevValuesRef.current;
    const maxVal = Math.max(1, ...viz.values);
    if (prevVals && prevVals.length === viz.values.length) {
      const prevMax = Math.max(1, ...prevVals);
      for (let i = 0; i < bars.length; i += 1) {
        const bar = bars[i]!;
        if (prevVals[i] === viz.values[i]) continue;
        if (movedBarIds.has(bar.id)) continue;
        const innerEl = barInnerRefs.current[bar.id];
        if (!innerEl) continue;
        const oldPct = `${Math.round((prevVals[i]! / prevMax) * 100)}%`;
        const newPct = `${Math.round((viz.values[i]! / maxVal) * 100)}%`;
        const duration = flipDurationMs;
        innerEl.style.setProperty("--viz-assign-duration", `${duration}ms`);
        innerEl.style.height = oldPct;
        innerEl.style.transition = "none";
        innerEl.classList.remove("viz-bar--assigning");
        void innerEl.offsetHeight;
        requestAnimationFrame(() => {
          innerEl.style.transition = `height ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
          innerEl.style.height = newPct;
          innerEl.classList.add("viz-bar--assigning");
          let done = false;
          const cleanup = () => {
            if (done) return;
            done = true;
            innerEl.removeEventListener("transitionend", cleanup);
            innerEl.removeEventListener("transitioncancel", cleanup);
            innerEl.style.transition = "";
            innerEl.classList.remove("viz-bar--assigning");
            innerEl.style.height = newPct;
          };
          innerEl.addEventListener("transitionend", cleanup);
          innerEl.addEventListener("transitioncancel", cleanup);
          window.setTimeout(cleanup, duration + 120);
        });
      }
    }

    const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
    const duration = flipDurationMs;

    const prevPtr = prevPointerMetaRef.current;
    const prevVisible = prevPointerVisibleRef.current;
    const nextVisible: Record<PointerKey, boolean> = {
      i: false,
      j: false,
      jMinus1: false,
      min: false,
    };
    const flipEls: HTMLSpanElement[] = [];
    const enterEls: HTMLSpanElement[] = [];

    const stagePointer = (
      key: PointerKey,
      el: HTMLSpanElement | null,
      newCenter: number | undefined,
      prevEntry: { idx: number; center: number } | undefined,
      newIdx: number | undefined
    ) => {
      const transitionState = pointerTransitionStateRef.current[key];
      const wasExiting = transitionState.exiting;
      const pendingExitTimer = pointerExitTimerByKeyRef.current[key];
      if (!el || newCenter === undefined || newIdx === undefined) {
        nextVisible[key] = false;
        if (el) {
          el.classList.remove("viz-pointer--entering");
          if (beginPointerExit(pointerTransitionStateRef.current, key)) {
            el.classList.add("viz-pointer--exiting");
            const timer = window.setTimeout(() => {
              completePointerExit(pointerTransitionStateRef.current, key);
              delete pointerExitTimerByKeyRef.current[key];
              bumpPointerTransitionRevision();
            }, pointerEnterDurationMs);
            pointerExitTimerByKeyRef.current[key] = timer;
          }
        }
        return;
      }
      if (typeof pendingExitTimer === "number") {
        window.clearTimeout(pendingExitTimer);
        delete pointerExitTimerByKeyRef.current[key];
      }
      const hadExitingClassBefore = el.classList.contains("viz-pointer--exiting");
      showPointer(pointerTransitionStateRef.current, key);
      if (wasExiting || hadExitingClassBefore) {
        el.classList.remove("viz-pointer--exiting");
      }
      el.style.left = `${newCenter}px`;
      const shouldEnter = !prevVisible[key];
      const shouldFlip =
        !shouldEnter && shouldAnimatePointerFlip(prevEntry?.center, newCenter);

      if (shouldFlip) {
        let visualCenter = prevEntry?.center ?? newCenter;
        const rectBefore = preClearPointers[key];
        const trackRect = barsTrackRef.current?.getBoundingClientRect();
        if (rectBefore && trackRect) {
           visualCenter = (rectBefore.left + rectBefore.width / 2 - trackRect.left) / layoutScale;
        }
        const deltaX = visualCenter - newCenter;
        
        el.style.willChange = "transform";
        el.style.transition = "none";
        el.style.transform = `translate(calc(-50% + ${deltaX}px), 0)`;
        el.getBoundingClientRect();
        flipEls.push(el);
      } else {
        el.style.willChange = "";
        el.style.transition = "";
        el.style.transform = "translate(-50%, 0)";
      }
      if (shouldEnter) {
        enterEls.push(el);
      }
      nextVisible[key] = true;
    };

    stagePointer("i", pointerIRef.current, iCenter, prevPtr.i, pointers.i);
    stagePointer("j", pointerJRef.current, jCenter, prevPtr.j, pointers.j);
    stagePointer(
      "jMinus1",
      pointerJMinus1Ref.current,
      jm1Center,
      prevPtr.jMinus1,
      pointers.jMinus1
    );
    const minIdx =
      showMinRow && typeof viz.minIndex === "number" && viz.minIndex >= 0
        ? viz.minIndex
        : undefined;
    stagePointer("min", pointerMinRef.current, minCenter, prevPtr.min, minIdx);

    const playPointerEnter = () => {
      for (const el of enterEls) {
        el.style.setProperty(
          "--viz-pointer-enter-duration",
          `${pointerEnterDurationMs}ms`
        );
        el.classList.remove("viz-pointer--entering");
        void el.offsetHeight;
        el.classList.add("viz-pointer--entering");
        const timer = window.setTimeout(() => {
          el.classList.remove("viz-pointer--entering");
        }, pointerEnterDurationMs + 120);
        pointerEnterTimersRef.current.push(timer);
      }
    };

    pointerFlipRafRef.current = schedulePointerPlayback({
      hasFlip: flipEls.length > 0,
      hasEnter: enterEls.length > 0,
      scheduleFrame: requestAnimationFrame,
      startFlip: () => {
        for (const el of flipEls) {
          el.style.transition = `transform ${duration}ms ${ease}`;
          el.style.transform = "translate(-50%, 0)";
        }
        pointerFlipRafRef.current = null;
      },
      playEnter: playPointerEnter,
    });

    const nextPtr: {
      i?: { idx: number; center: number };
      j?: { idx: number; center: number };
      jMinus1?: { idx: number; center: number };
      min?: { idx: number; center: number };
    } = {};
    if (typeof pointers.i === "number" && iCenter !== undefined) {
      nextPtr.i = { idx: pointers.i, center: iCenter };
    }
    if (typeof pointers.j === "number" && jCenter !== undefined) {
      nextPtr.j = { idx: pointers.j, center: jCenter };
    }
    if (typeof pointers.jMinus1 === "number" && jm1Center !== undefined) {
      nextPtr.jMinus1 = { idx: pointers.jMinus1, center: jm1Center };
    }
    if (typeof minIdx === "number" && minCenter !== undefined) {
      nextPtr.min = { idx: minIdx, center: minCenter };
    }
    prevPointerMetaRef.current = nextPtr;
    prevPointerVisibleRef.current = nextVisible;

    prevValuesRef.current = [...viz.values];
    prevRectsRef.current = currentRects;
    prevBarsRef.current = bars;

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (pointerFlipRafRef.current !== null) {
        cancelAnimationFrame(pointerFlipRafRef.current);
        pointerFlipRafRef.current = null;
      }
      for (const timer of pointerEnterTimersRef.current) {
        window.clearTimeout(timer);
      }
      pointerEnterTimersRef.current = [];
      for (const key of ARRAY_POINTER_KEYS) {
        const timer = pointerExitTimerByKeyRef.current[key];
        if (typeof timer === "number") {
          window.clearTimeout(timer);
        }
      }
      pointerExitTimerByKeyRef.current = {};
    };
  }, [
    bars,
    flipDurationMs,
    viz.values,
    pointers,
    viz.minIndex,
    showMinRow,
    shouldShowArrayIndices,
    fitScale,
    enableAnimationScroll,
    pointerEnterDurationMs,
    isStackLinkedList,
    bumpPointerTransitionRevision,
  ]);

  useLayoutEffect(() => {
    if (!isStackLinkedList || !stackLinkedList) {
      stackAnimationGenerationRef.current += 1;
      if (stackRafRef.current !== null) {
        cancelAnimationFrame(stackRafRef.current);
        stackRafRef.current = null;
      }
      if (stackPointerFlipRafRef.current !== null) {
        cancelAnimationFrame(stackPointerFlipRafRef.current);
        stackPointerFlipRafRef.current = null;
      }
      prevStackRectsRef.current = new Map();
      prevStackPointerMetaRef.current = {};
      prevStackPointerVisibleRef.current = { first: false, oldfirst: false };
      stackPointerTransitionStateRef.current = createPointerTransitionMap(
        STACK_POINTER_KEYS
      );
      for (const key of STACK_POINTER_KEYS) {
        const timer = stackPointerExitTimerByKeyRef.current[key];
        if (typeof timer === "number") {
          window.clearTimeout(timer);
        }
      }
      stackPointerExitTimerByKeyRef.current = {};
      for (const timer of stackNodeEnterTimersRef.current) {
        window.clearTimeout(timer);
      }
      stackNodeEnterTimersRef.current = [];
      for (const timer of Object.values(stackNodeExitTimerByKeyRef.current)) {
        window.clearTimeout(timer);
      }
      stackNodeExitTimerByKeyRef.current = {};
      for (const timer of stackLinkEnterTimersRef.current) {
        window.clearTimeout(timer);
      }
      stackLinkEnterTimersRef.current = [];
      for (const timer of Object.values(stackLinkExitTimerByKeyRef.current)) {
        window.clearTimeout(timer);
      }
      stackLinkExitTimerByKeyRef.current = {};
      stackNodeTransitionStateRef.current = {};
      stackLinkTransitionStateRef.current = {};
      stackLinkSnapshotRef.current = {};
      stackNodeSnapshotRef.current = {};
      return;
    }

    const stackAnimationGeneration = stackAnimationGenerationRef.current + 1;
    stackAnimationGenerationRef.current = stackAnimationGeneration;

    if (stackRafRef.current !== null) {
      cancelAnimationFrame(stackRafRef.current);
      stackRafRef.current = null;
    }
    if (stackPointerFlipRafRef.current !== null) {
      cancelAnimationFrame(stackPointerFlipRafRef.current);
      stackPointerFlipRafRef.current = null;
    }
    for (const timer of pointerEnterTimersRef.current) {
      window.clearTimeout(timer);
    }
    pointerEnterTimersRef.current = [];
    for (const timer of stackNodeEnterTimersRef.current) {
      window.clearTimeout(timer);
    }
    stackNodeEnterTimersRef.current = [];
    for (const timer of stackLinkEnterTimersRef.current) {
      window.clearTimeout(timer);
    }
    stackLinkEnterTimersRef.current = [];

    const layoutScale =
      enableAnimationScroll || fitScale <= 0 ? 1 : fitScale;
    const currentNodeIdSet = new Set(stackLinkedList.nodes.map((node) => node.id));
    const collapseNonCurrentNodes = stackLinkedList.nodes.length <= 1;

    // Nodes that become current again must be measurable in this frame.
    for (const node of stackLinkedList.nodes) {
      const el = stackItemRefs.current[node.id];
      if (!el) continue;
      if (el.style.display === "none") {
        el.style.display = "";
      }
    }

    // Pass 1: READ pointers
    const preClearStackPointers = {
      first: stackFirstPointerRef.current?.getBoundingClientRect(),
      oldfirst: stackOldFirstPointerRef.current?.getBoundingClientRect(),
    };

    // Pass 2: READ bounds
    const visualStackRects = new Map<string, number>();
    for (const node of visibleStackNodes) {
      const el = stackItemRefs.current[node.id];
      if (!el) continue;
      visualStackRects.set(node.id, el.getBoundingClientRect().left);
    }

    // For 2->1 collapses, stale nodes must not affect rest-layout measurements.
    if (collapseNonCurrentNodes) {
      for (const node of visibleStackNodes) {
        if (currentNodeIdSet.has(node.id)) continue;
        const key = node.id;
        const transitionState = stackNodeTransitionStateRef.current[key];
        if (transitionState) {
          transitionState.mounted = false;
          transitionState.exiting = false;
        }
        const pendingExit = stackNodeExitTimerByKeyRef.current[key];
        if (typeof pendingExit === "number") {
          window.clearTimeout(pendingExit);
          delete stackNodeExitTimerByKeyRef.current[key];
        }
        const el = stackItemRefs.current[key];
        if (!el) continue;
        el.classList.remove("viz-stack-item--entering");
        el.classList.remove("viz-stack-item--exiting");
        el.style.transition = "";
        el.style.transform = "translateX(0)";
        el.style.willChange = "";
        el.style.display = "none";
      }

      for (const [key, state] of Object.entries(stackLinkTransitionStateRef.current)) {
        const snap = stackLinkSnapshotRef.current[key] ?? parseStackLinkKey(key);
        if (!snap || currentNodeIdSet.has(snap.fromNodeId)) continue;
        state.mounted = false;
        state.exiting = false;
        const pendingExit = stackLinkExitTimerByKeyRef.current[key];
        if (typeof pendingExit === "number") {
          window.clearTimeout(pendingExit);
          delete stackLinkExitTimerByKeyRef.current[key];
        }
        delete stackLinkSnapshotRef.current[key];
      }
    }

    // Pass 3: WRITE clear styles
    for (const node of visibleStackNodes) {
      if (collapseNonCurrentNodes && !currentNodeIdSet.has(node.id)) {
        continue;
      }
      const el = stackItemRefs.current[node.id];
      if (!el) continue;
      el.style.display = "";
      el.style.transition = "";
      el.style.transform = "";
      el.style.willChange = "";
    }

    // Pass 4: READ correct rest geometry
    const currentRects = new Map<string, number>();
    for (const node of visibleStackNodes) {
      if (collapseNonCurrentNodes && !currentNodeIdSet.has(node.id)) {
        continue;
      }
      const el = stackItemRefs.current[node.id];
      if (!el) continue;
      currentRects.set(node.id, el.getBoundingClientRect().left);
    }

    const pointerById = new Map(
      stackLinkedList.pointers.map((ptr) => [ptr.id, ptr.nodeId] as const)
    );
    const hasAnyActiveStackPointer = stackLinkedList.pointers.some(
      (ptr) => ptr.nodeId !== null
    );
    const firstNodeId = pointerById.get("first");
    const oldfirstNodeId = pointerById.get("oldfirst");
    const trackEl = stackTrackRef.current;

    let firstCenter: number | undefined;
    let oldfirstCenter: number | undefined;
    if (trackEl) {
      const prevFirstMeta = prevStackPointerMetaRef.current.first;
      const prevOldFirstMeta = prevStackPointerMetaRef.current.oldfirst;
      const trackRect = trackEl.getBoundingClientRect();
      const fallbackNodeWidthPx = (() => {
        for (const node of stackLinkedList.nodes) {
          const nodeEl = stackNodeRefs.current[node.id];
          if (nodeEl) {
            return nodeEl.getBoundingClientRect().width;
          }
        }
        for (const nodeEl of Object.values(stackNodeRefs.current)) {
          if (nodeEl) {
            return nodeEl.getBoundingClientRect().width;
          }
        }
        return undefined;
      })();
      const centerFromItemRect = (nodeId: string) => {
        const left = currentRects.get(nodeId);
        if (left === undefined || fallbackNodeWidthPx === undefined) {
          return undefined;
        }
        return (left + fallbackNodeWidthPx / 2 - trackRect.left) / layoutScale;
      };
      const centerOfNode = (
        nodeId: string | null | undefined,
        fallback: number | undefined
      ) => {
        if (!nodeId) return undefined;
        const nodeEl = stackNodeRefs.current[nodeId];
        if (nodeEl) {
          const r = nodeEl.getBoundingClientRect();
          return (r.left + r.width / 2 - trackRect.left) / layoutScale;
        }
        return centerFromItemRect(nodeId) ?? fallback;
      };
      firstCenter = centerOfNode(
        firstNodeId,
        prevFirstMeta?.nodeId === firstNodeId
          ? prevFirstMeta?.center
          : undefined
      );
      oldfirstCenter = centerOfNode(
        oldfirstNodeId,
        prevOldFirstMeta?.nodeId === oldfirstNodeId
          ? prevOldFirstMeta?.center
          : undefined
      );
    }

    const moved: Array<{ el: HTMLDivElement; delta: number }> = [];
    if (prevStackRectsRef.current.size > 0) {
      for (const node of stackLinkedList.nodes) {
        const prevLeft = prevStackRectsRef.current.get(node.id);
        const nextLeft = currentRects.get(node.id);
        if (prevLeft === undefined || nextLeft === undefined) continue;
        const visualLeft = visualStackRects.get(node.id);
        const visualWithinPrevNextSegment =
          visualLeft !== undefined &&
          visualLeft >= Math.min(prevLeft, nextLeft) - 1 &&
          visualLeft <= Math.max(prevLeft, nextLeft) + 1;
        // Default origin is the previous rest-layout position so each step keeps
        // deterministic direction. Visual origin is only trusted when it is a
        // plausible in-flight position between prev and next.
        const fromLeft =
          visualWithinPrevNextSegment &&
          Math.abs((visualLeft as number) - nextLeft) >= 0.5
            ? visualLeft
            : prevLeft;
        const delta = fromLeft - nextLeft;
        if (Math.abs(delta) < 0.5) continue;
        const el = stackItemRefs.current[node.id];
        if (!el) continue;
        moved.push({ el, delta });
      }
    }

    const stageStackNode = (node: MockStackNodeViz) => {
      const key = node.id;
      const transitionState =
        stackNodeTransitionStateRef.current[key] ??
        (stackNodeTransitionStateRef.current[key] = {
          mounted: false,
          exiting: false,
        });
      const pendingExit = stackNodeExitTimerByKeyRef.current[key];
      const el = stackItemRefs.current[key];
      if (currentNodeIdSet.has(key)) {
        if (typeof pendingExit === "number") {
          window.clearTimeout(pendingExit);
          delete stackNodeExitTimerByKeyRef.current[key];
        }
        const shouldEnter = !transitionState.mounted;
        const wasExiting = transitionState.exiting;
        transitionState.mounted = true;
        transitionState.exiting = false;
        if (!el) return;
        el.style.display = "";
        if (wasExiting) {
          el.classList.remove("viz-stack-item--exiting");
        }
        if (shouldEnter) {
          el.style.setProperty(
            "--viz-pointer-enter-duration",
            `${pointerEnterDurationMs}ms`
          );
          el.classList.remove("viz-stack-item--entering");
          void el.offsetHeight;
          el.classList.add("viz-stack-item--entering");
          const timer = window.setTimeout(() => {
            if (stackAnimationGenerationRef.current !== stackAnimationGeneration) {
              return;
            }
            el.classList.remove("viz-stack-item--entering");
          }, pointerEnterDurationMs + 120);
          stackNodeEnterTimersRef.current.push(timer);
        }
      } else if (el && transitionState.mounted && !transitionState.exiting) {
        // In rapid step-back (2->1) or drain-to-empty paths, lingering exits keep
        // the remaining layout offset. Complete non-current exits immediately.
        if (stackLinkedList.nodes.length <= 1) {
          transitionState.mounted = false;
          transitionState.exiting = false;
          el.classList.remove("viz-stack-item--entering");
          el.classList.remove("viz-stack-item--exiting");
          el.style.transition = "";
          el.style.transform = "translateX(0)";
          el.style.willChange = "";
          bumpPointerTransitionRevision();
          return;
        }
        transitionState.exiting = true;
        el.style.setProperty(
          "--viz-pointer-enter-duration",
          `${pointerEnterDurationMs}ms`
        );
        el.classList.remove("viz-stack-item--entering");
        el.classList.add("viz-stack-item--exiting");
        const timer = window.setTimeout(() => {
          transitionState.mounted = false;
          transitionState.exiting = false;
          delete stackNodeExitTimerByKeyRef.current[key];
          bumpPointerTransitionRevision();
        }, pointerEnterDurationMs);
        stackNodeExitTimerByKeyRef.current[key] = timer;
      }
    };

    const allNodeIds = new Set<string>([
      ...Object.keys(stackNodeTransitionStateRef.current),
      ...visibleStackNodes.map((n) => n.id),
      ...stackLinkedList.nodes.map((n) => n.id),
    ]);
    for (const id of allNodeIds) {
      const node = stackNodeSnapshotRef.current[id];
      if (node) {
        stageStackNode(node);
      }
    }

    const currentLinkEntries = stackLinkedList.nodes
      .filter((node) => node.nextId)
      .map((node) => ({
        key: `${node.id}->${node.nextId}`,
        fromNodeId: node.id,
        toNodeId: node.nextId as string,
      }));
    const currentLinkKeys = new Set(currentLinkEntries.map((entry) => entry.key));
    for (const entry of currentLinkEntries) {
      stackLinkSnapshotRef.current[entry.key] = {
        fromNodeId: entry.fromNodeId,
        toNodeId: entry.toNodeId,
      };
    }
    const allLinkKeys = new Set<string>([
      ...Object.keys(stackLinkTransitionStateRef.current),
      ...currentLinkKeys,
    ]);
    for (const key of allLinkKeys) {
      const transitionState =
        stackLinkTransitionStateRef.current[key] ??
        (stackLinkTransitionStateRef.current[key] = {
          mounted: false,
          exiting: false,
        });
      const pendingExit = stackLinkExitTimerByKeyRef.current[key];
      const linkEl = stackLinkRefs.current[key];
      if (currentLinkKeys.has(key)) {
        const wasExiting = transitionState.exiting;
        if (typeof pendingExit === "number") {
          window.clearTimeout(pendingExit);
          delete stackLinkExitTimerByKeyRef.current[key];
        }
        const shouldEnter = !transitionState.mounted || wasExiting;
        transitionState.mounted = true;
        transitionState.exiting = false;
        if (!linkEl) continue;
        if (wasExiting || linkEl.classList.contains("viz-stack-link--exiting")) {
          linkEl.classList.remove("viz-stack-link--exiting");
        }
        if (shouldEnter) {
          linkEl.style.setProperty(
            "--viz-pointer-enter-duration",
            `${pointerEnterDurationMs}ms`
          );
          linkEl.classList.remove("viz-stack-link--entering");
          void linkEl.offsetHeight;
          linkEl.classList.add("viz-stack-link--entering");
          const timer = window.setTimeout(() => {
            if (stackAnimationGenerationRef.current !== stackAnimationGeneration) {
              return;
            }
            linkEl.classList.remove("viz-stack-link--entering");
          }, pointerEnterDurationMs + 120);
          stackLinkEnterTimersRef.current.push(timer);
        }
      } else if (linkEl && transitionState.mounted && !transitionState.exiting) {
        transitionState.exiting = true;
        linkEl.style.setProperty(
          "--viz-pointer-enter-duration",
          `${pointerEnterDurationMs}ms`
        );
        linkEl.classList.remove("viz-stack-link--entering");
        linkEl.classList.add("viz-stack-link--exiting");
        const timer = window.setTimeout(() => {
          transitionState.mounted = false;
          transitionState.exiting = false;
          delete stackLinkExitTimerByKeyRef.current[key];
          delete stackLinkSnapshotRef.current[key];
          bumpPointerTransitionRevision();
        }, pointerEnterDurationMs);
        stackLinkExitTimerByKeyRef.current[key] = timer;
      } else if (!currentLinkKeys.has(key) && !linkEl && transitionState.mounted) {
        transitionState.mounted = false;
        transitionState.exiting = false;
        delete stackLinkExitTimerByKeyRef.current[key];
        delete stackLinkSnapshotRef.current[key];
      }
    }

    if (moved.length > 0) {
      for (const { el, delta } of moved) {
        el.style.willChange = "transform";
        el.style.transition = "none";
        el.style.transform = `translateX(${delta / layoutScale}px)`;
        el.getBoundingClientRect();
      }

      stackRafRef.current = requestAnimationFrame(() => {
        if (stackAnimationGenerationRef.current !== stackAnimationGeneration) {
          stackRafRef.current = null;
          return;
        }
        for (const { el } of moved) {
          el.style.transition = `transform ${flipDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`;
          el.style.transform = "translateX(0)";
        }
        stackRafRef.current = null;
      });
    }

    const prevPtr = prevStackPointerMetaRef.current;
    const prevVisible = prevStackPointerVisibleRef.current;
    const nextVisible: Record<StackPointerKey, boolean> = {
      first: false,
      oldfirst: false,
    };
    const flipEls: HTMLSpanElement[] = [];
    const enterEls: HTMLSpanElement[] = [];

    const stageStackPointer = (
      key: StackPointerKey,
      el: HTMLSpanElement | null,
      nodeId: string | null | undefined,
      center: number | undefined,
      prevEntry: { nodeId: string; center: number } | undefined,
      bottomRem: number | undefined
    ) => {
      const transitionState = stackPointerTransitionStateRef.current[key];
      const pendingExitTimer = stackPointerExitTimerByKeyRef.current[key];
      if (!el || !nodeId) {
        nextVisible[key] = false;
        if (el) {
          el.classList.remove("viz-pointer--entering");
          // When the step has no stack pointers at all (e.g. empty stack frames),
          // pointer overlays should disappear immediately without a trailing exit animation.
          if (!hasAnyActiveStackPointer) {
            el.classList.remove("viz-pointer--exiting");
            completePointerExit(stackPointerTransitionStateRef.current, key);
            bumpPointerTransitionRevision();
            return;
          }
          if (beginPointerExit(stackPointerTransitionStateRef.current, key)) {
            el.style.setProperty(
              "--viz-pointer-enter-duration",
              `${pointerEnterDurationMs}ms`
            );
            el.classList.add("viz-pointer--exiting");
            const timer = window.setTimeout(() => {
              completePointerExit(stackPointerTransitionStateRef.current, key);
              delete stackPointerExitTimerByKeyRef.current[key];
              bumpPointerTransitionRevision();
            }, pointerEnterDurationMs);
            stackPointerExitTimerByKeyRef.current[key] = timer;
          }
        }
        return;
      }

      if (typeof pendingExitTimer === "number") {
        window.clearTimeout(pendingExitTimer);
        delete stackPointerExitTimerByKeyRef.current[key];
      }

      const wasExiting = transitionState.exiting;
      const hadExitingClassBefore = el.classList.contains("viz-pointer--exiting");
      showPointer(stackPointerTransitionStateRef.current, key);
      if (wasExiting || hadExitingClassBefore) {
        el.classList.remove("viz-pointer--exiting");
      }
      if (center === undefined) {
        nextVisible[key] = true;
        return;
      }
      el.style.left = `${center}px`;
      if (bottomRem !== undefined) {
        el.style.bottom = `${bottomRem}rem`;
      }
      const hasPrevCenter = prevEntry?.center !== undefined;
      const shouldEnter = !prevVisible[key] && !hasPrevCenter;
      const rectBefore = preClearStackPointers[key];
      const trackRect = stackTrackRef.current?.getBoundingClientRect();
      const rectAfter = el.getBoundingClientRect();
      const currentCenter = trackRect
        ? (rectAfter.left + rectAfter.width / 2 - trackRect.left) / layoutScale
        : center;
      const visualCenter =
        rectBefore && trackRect
          ? (rectBefore.left + rectBefore.width / 2 - trackRect.left) /
            layoutScale
          : prevEntry?.center ?? currentCenter;
      const deltaX = visualCenter - currentCenter;
      const deltaY =
        rectBefore === undefined ? 0 : (rectBefore.top - rectAfter.top) / layoutScale;
      const hasCoordinateDelta =
        Math.abs(deltaY) >= 0.5 ||
        shouldAnimatePointerFlip(visualCenter, currentCenter);
      const shouldFlip = !shouldEnter && hasCoordinateDelta;
      if (shouldFlip) {
        el.style.willChange = "transform";
        el.style.transition = "none";
        el.style.transform = `translate(calc(-50% + ${deltaX}px), ${deltaY}px)`;
        el.getBoundingClientRect();
        flipEls.push(el);
      } else {
        el.style.willChange = "";
        el.style.transition = "";
        el.style.transform = "translate(-50%, 0)";
      }
      if (shouldEnter) {
        enterEls.push(el);
      }
      nextVisible[key] = true;
    };

    stageStackPointer(
      "first",
      stackFirstPointerRef.current,
      firstNodeId,
      firstCenter,
      prevPtr.first,
      stackPointerLayout.bottomById.first
    );
    stageStackPointer(
      "oldfirst",
      stackOldFirstPointerRef.current,
      oldfirstNodeId,
      oldfirstCenter,
      prevPtr.oldfirst,
      stackPointerLayout.bottomById.oldfirst
    );

    const playPointerEnter = () => {
      if (stackAnimationGenerationRef.current !== stackAnimationGeneration) {
        return;
      }
      for (const el of enterEls) {
        el.style.setProperty(
          "--viz-pointer-enter-duration",
          `${pointerEnterDurationMs}ms`
        );
        el.classList.remove("viz-pointer--entering");
        void el.offsetHeight;
        el.classList.add("viz-pointer--entering");
        const timer = window.setTimeout(() => {
          if (stackAnimationGenerationRef.current !== stackAnimationGeneration) {
            return;
          }
          el.classList.remove("viz-pointer--entering");
        }, pointerEnterDurationMs + 120);
        pointerEnterTimersRef.current.push(timer);
      }
    };

    stackPointerFlipRafRef.current = schedulePointerPlayback({
      hasFlip: flipEls.length > 0,
      hasEnter: enterEls.length > 0,
      scheduleFrame: requestAnimationFrame,
      startFlip: () => {
        if (stackAnimationGenerationRef.current !== stackAnimationGeneration) {
          stackPointerFlipRafRef.current = null;
          return;
        }
        for (const el of flipEls) {
          el.style.transition = `transform ${flipDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`;
          el.style.transform = "translate(-50%, 0)";
        }
        stackPointerFlipRafRef.current = null;
      },
      playEnter: playPointerEnter,
    });

    const nextPtr: {
      first?: { nodeId: string; center: number };
      oldfirst?: { nodeId: string; center: number };
    } = {};
    if (firstNodeId && firstCenter !== undefined) {
      nextPtr.first = { nodeId: firstNodeId, center: firstCenter };
    }
    if (oldfirstNodeId && oldfirstCenter !== undefined) {
      nextPtr.oldfirst = { nodeId: oldfirstNodeId, center: oldfirstCenter };
    }
    prevStackPointerMetaRef.current = nextPtr;
    prevStackPointerVisibleRef.current = nextVisible;
    prevStackRectsRef.current = currentRects;

    return () => {
      if (stackAnimationGenerationRef.current === stackAnimationGeneration) {
        stackAnimationGenerationRef.current += 1;
      }
      if (stackRafRef.current !== null) {
        cancelAnimationFrame(stackRafRef.current);
        stackRafRef.current = null;
      }
      if (stackPointerFlipRafRef.current !== null) {
        cancelAnimationFrame(stackPointerFlipRafRef.current);
        stackPointerFlipRafRef.current = null;
      }
      for (const timer of pointerEnterTimersRef.current) {
        window.clearTimeout(timer);
      }
      pointerEnterTimersRef.current = [];
      for (const timer of stackNodeEnterTimersRef.current) {
        window.clearTimeout(timer);
      }
      stackNodeEnterTimersRef.current = [];
      for (const timer of stackLinkEnterTimersRef.current) {
        window.clearTimeout(timer);
      }
      stackLinkEnterTimersRef.current = [];
    };
  }, [
    enableAnimationScroll,
    fitScale,
    flipDurationMs,
    isStackLinkedList,
    pointerEnterDurationMs,
    stackPointerLayout.bottomById.first,
    stackPointerLayout.bottomById.oldfirst,
    stackLinkedList,
    visibleStackNodes,
    bumpPointerTransitionRevision,
  ]);

  useEffect(() => {
    if (!isPanelReady) return;
    if (enableAnimationScroll) {
      setFitScale(1);
      setFitHeightPx(null);
      return;
    }

    const viewport = fitViewportRef.current;
    const slot = graphSlotRef.current;
    const graph = graphFitRef.current;
    const inner = fitMeasureRef.current;
    if (!viewport || !slot || !graph || !inner) return;

    const recomputeScale = () => {
      const availableW = slot.clientWidth;
      const availableH = slot.clientHeight;
      const contentW = fitEnvelopeSize?.width ?? inner.scrollWidth;
      const contentH = fitEnvelopeSize?.height ?? inner.scrollHeight;
      if (
        availableW <= 0 ||
        availableH <= 0 ||
        contentW <= 0 ||
        contentH <= 0
      ) {
        return;
      }
      const rawScale = Math.min(
        availableW / contentW,
        availableH / contentH
      );
      const nextScale = animationFitAllowUpscale
        ? Math.min(MAX_VIZ_UPSCALE, rawScale)
        : Math.min(1, rawScale);
      setFitScale(nextScale);
      setFitHeightPx(contentH * nextScale);
    };

    const scheduleRecompute = () => {
      if (fitRafRef.current !== null) return;
      fitRafRef.current = requestAnimationFrame(() => {
        fitRafRef.current = null;
        recomputeScale();
      });
    };

    const observer = new ResizeObserver(() => {
      scheduleRecompute();
    });
    observer.observe(viewport);
    observer.observe(slot);
    observer.observe(graph);
    observer.observe(inner);
    scheduleRecompute();

    return () => {
      observer.disconnect();
      if (fitRafRef.current !== null) {
        cancelAnimationFrame(fitRafRef.current);
        fitRafRef.current = null;
      }
    };
  }, [
    enableAnimationScroll,
    animationFitAllowUpscale,
    fitEnvelopeSize,
    isPanelReady,
  ]);

  const ariaLabel = isStackLinkedList && stackLinkedList
    ? buildStackVizAriaLabel(
        stripCaptionBackticks(displayCaption),
        stackLinkedList
      )
    : buildVizAriaLabel(
        stripCaptionBackticks(displayCaption),
        pointers,
        viz.values.length,
        viz.minIndex
      );
  const fixedBundleStyle =
    !enableAnimationScroll && fitEnvelopeSize
      ? { width: `${fitEnvelopeSize.width}px` }
      : undefined;

  const handleStepPointerClick = useCallback(() => {
    if (!stepPointerNavigation?.canStepForward) return;
    stepPointerNavigation.onStepForward();
  }, [stepPointerNavigation]);

  const handleStepPointerContextMenu = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!stepPointerNavigation?.canStepBack) return;
      e.preventDefault();
      stepPointerNavigation.onStepBack();
    },
    [stepPointerNavigation]
  );

  return (
    <div className="panel panel-full">
      <div className="panel-head">
        <span className="panel-head-title">{strings.panels.animation}</span>
        {onPresentNative || onPresentOverlay ? (
          <div className="panel-head-actions">
            {onPresentNative ? (
              <button
                type="button"
                className="btn btn-icon panel-head-present"
                aria-label={strings.presentation.presentNative}
                onClick={(e) => {
                  e.stopPropagation();
                  onPresentNative();
                }}
              >
                <Maximize2 {...PRESENT_ICON} aria-hidden />
              </button>
            ) : null}
            {onPresentOverlay ? (
              <button
                type="button"
                className="btn btn-icon panel-head-present"
                aria-label={strings.presentation.presentOverlay}
                onClick={(e) => {
                  e.stopPropagation();
                  onPresentOverlay();
                }}
              >
                <AppWindow {...PRESENT_ICON} aria-hidden />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <div
        className={`panel-body${!enableAnimationScroll ? " panel-body--no-scroll" : ""}`}
        aria-busy={!isPanelReady}
      >
        {!isPanelReady ? (
          <PanelSkeleton label={strings.loading.animationInit} rows={5} />
        ) : (
          <div
          className={`viz-fit-viewport${!enableAnimationScroll ? " viz-fit-viewport--fit" : ""}`}
          ref={fitViewportRef}
          onClick={
            stepPointerNavigation ? handleStepPointerClick : undefined
          }
          onContextMenu={
            stepPointerNavigation
              ? handleStepPointerContextMenu
              : undefined
          }
        >
          <div
            className={`viz-fit-content${!enableAnimationScroll ? " viz-fit-content--column" : ""}`}
          >
            <div
              className={`viz-wrap${!enableAnimationScroll ? " viz-wrap--fit-fill" : ""}`}
            >
              <div
                className={!enableAnimationScroll ? "viz-graph-slot" : undefined}
                ref={graphSlotRef}
              >
                <div
                  className={
                    !enableAnimationScroll
                      ? "viz-fit-graph viz-fit-graph--fit"
                      : "viz-fit-graph"
                  }
                  ref={graphFitRef}
                  style={
                    !enableAnimationScroll
                      ? {
                          transform: `scale(${fitScale})`,
                          height:
                            fitHeightPx === null
                              ? undefined
                              : `${fitHeightPx}px`,
                        }
                      : undefined
                  }
                >
                  <div
                    className="viz-fit-scaled-bundle"
                    ref={fitMeasureRef}
                    style={fixedBundleStyle}
                  >
                    <p
                      className={`viz-caption${!enableAnimationScroll ? " viz-caption--fit" : ""}`}
                    >
                      {captionParts.map((seg, idx) =>
                        seg.code ? (
                          <code key={idx} className="viz-caption-code">
                            {seg.text}
                          </code>
                        ) : (
                          <span key={idx}>{seg.text}</span>
                        )
                      )}
                    </p>
                    {isStackLinkedList && stackLinkedList ? (
                      <div
                        className="viz-stack"
                        ref={stackTrackRef}
                        style={{
                          ["--viz-stack-pointer-layer-height" as string]: `${stackPointerLayout.layerHeightRem}rem`,
                        }}
                        role="img"
                        aria-label={ariaLabel}
                      >
                        <div className="viz-pointers-layer" aria-hidden>
                          {stackLinkedList.pointers.some(
                            (ptr) => ptr.id === "first" && ptr.nodeId !== null
                          ) ||
                          stackPointerTransitionStateRef.current.first.mounted ? (
                            <span
                              ref={stackFirstPointerRef}
                              className={`viz-pointer viz-pointer--stack-first viz-pointer--overlay viz-pointer--toneKey${
                                stackPointerTransitionStateRef.current.first
                                  .exiting
                                  ? " viz-pointer--exiting"
                                  : ""
                              }`}
                            >
                              first<span className="viz-pointer-arrow">↓</span>
                            </span>
                          ) : null}
                          {stackLinkedList.pointers.some(
                            (ptr) => ptr.id === "oldfirst" && ptr.nodeId !== null
                          ) ||
                          stackPointerTransitionStateRef.current.oldfirst
                            .mounted ? (
                            <span
                              ref={stackOldFirstPointerRef}
                              className={`viz-pointer viz-pointer--stack-oldfirst viz-pointer--overlay viz-pointer--toneHl${
                                stackPointerTransitionStateRef.current.oldfirst
                                  .exiting
                                  ? " viz-pointer--exiting"
                                  : ""
                              }`}
                            >
                              oldfirst
                              <span className="viz-pointer-arrow">↓</span>
                            </span>
                          ) : null}
                        </div>
                        {stackLinkedList.nodes.length === 0 ? (
                          <div className="viz-stack-empty">Empty stack</div>
                        ) : (
                          <div className="viz-stack-row">
                            {visibleStackNodes.map((node) => (
                              <div
                                key={node.id}
                                className={`viz-stack-item${
                                  stackNodeTransitionStateRef.current[node.id]
                                    ?.exiting
                                    ? " viz-stack-item--exiting"
                                    : ""
                                }`}
                                ref={(el) => {
                                  stackItemRefs.current[node.id] = el;
                                }}
                              >
                                <div
                                  className="viz-stack-node"
                                  ref={(el) => {
                                    stackNodeRefs.current[node.id] = el;
                                  }}
                                >
                                  {node.value}
                                </div>
                                {(() => {
                                  const currentLinkKey = node.nextId
                                    ? `${node.id}->${node.nextId}`
                                    : undefined;
                                  const fallbackLinkKey = !currentLinkKey
                                    ? mountedStackLinkKeyByFromNode[node.id]
                                    : undefined;
                                  const renderLinkKey = currentLinkKey ?? fallbackLinkKey;
                                  if (!renderLinkKey) {
                                    return null;
                                  }
                                  const linkState =
                                    stackLinkTransitionStateRef.current[renderLinkKey];
                                  return (
                                  <div
                                    className={`viz-stack-link${
                                      linkState?.exiting
                                        ? " viz-stack-link--exiting"
                                        : ""
                                    }`}
                                    aria-hidden
                                    ref={(el) => {
                                      if (el) {
                                        stackLinkRefs.current[renderLinkKey] = el;
                                      } else {
                                        delete stackLinkRefs.current[renderLinkKey];
                                      }
                                    }}
                                  >
                                    <span className="viz-stack-next">⟶</span>
                                  </div>
                                  );
                                })()}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className="viz-bars"
                        ref={barsTrackRef}
                        role="img"
                        aria-label={ariaLabel}
                      >
                        <div className="viz-pointers-layer" aria-hidden>
                        {pointers.i !== undefined ||
                        pointerTransitionStateRef.current.i.mounted ? (
                          <span
                            ref={pointerIRef}
                            className={`viz-pointer viz-pointer--i viz-pointer--overlay${
                              pointerTransitionStateRef.current.i.exiting
                                ? " viz-pointer--exiting"
                                : ""
                            }`}
                          >
                            i<span className="viz-pointer-arrow">↓</span>
                          </span>
                        ) : null}
                        {pointers.j !== undefined ||
                        pointerTransitionStateRef.current.j.mounted ? (
                          <span
                            ref={pointerJRef}
                            className={`viz-pointer viz-pointer--j viz-pointer--overlay ${pointerToneClass(
                              pointers.j === undefined
                                ? "neutral"
                                : barToneForIndex(
                                    pointers.j,
                                    viz,
                                    sortedExclusiveEnd
                                  )
                            )}${
                              isSelectionJInactive ? " viz-pointer--inactive" : ""
                            }${
                              pointerTransitionStateRef.current.j.exiting
                                ? " viz-pointer--exiting"
                                : ""
                            }`}
                          >
                            j<span className="viz-pointer-arrow">↓</span>
                          </span>
                        ) : null}
                        {pointers.jMinus1 !== undefined ||
                        pointerTransitionStateRef.current.jMinus1.mounted ? (
                          <span
                            ref={pointerJMinus1Ref}
                            className={`viz-pointer viz-pointer--jminus1 viz-pointer--overlay ${pointerToneClass(
                              pointers.jMinus1 === undefined
                                ? "neutral"
                                : barToneForIndex(
                                    pointers.jMinus1,
                                    viz,
                                    sortedExclusiveEnd
                                  )
                            )}${
                              pointerTransitionStateRef.current.jMinus1.exiting
                                ? " viz-pointer--exiting"
                                : ""
                            }`}
                          >
                            <span className="viz-pointer-lbl">j-1</span>
                            <span className="viz-pointer-arrow">↓</span>
                          </span>
                        ) : null}
                        {showMinRow ||
                        pointerTransitionStateRef.current.min.mounted ? (
                          <span
                            ref={pointerMinRef}
                            className={`viz-pointer viz-pointer--min viz-pointer--overlay viz-pointer--toneMin${
                              pointerTransitionStateRef.current.min.exiting
                                ? " viz-pointer--exiting"
                                : ""
                            }`}
                          >
                            min<span className="viz-pointer-arrow">↓</span>
                          </span>
                        ) : null}
                        </div>
                        {bars.map((bar, idx) => {
                        const n = bar.value;
                        const h = `${Math.round((n / maxVal) * 100)}%`;
                        const tone = barToneForIndex(idx, viz, sortedExclusiveEnd);
                        let cls = "viz-bar";
                        if (tone === "min") cls += " viz-bar--min";
                        else if (tone === "key") cls += " viz-bar--key";
                        else if (tone === "hl") cls += " viz-bar--hl";
                        else if (tone === "sorted") cls += " viz-bar--sorted";

                        return (
                          <div
                            key={bar.id}
                            className="viz-bar-col"
                            ref={(el) => {
                              barRefs.current[bar.id] = el;
                            }}
                          >
                            <div className="viz-pointers" aria-hidden />
                            <div className="viz-bar-track">
                              <div
                                className={cls}
                                ref={(el) => {
                                  barInnerRefs.current[bar.id] = el;
                                }}
                                style={{ height: h }}
                              >
                                {n}
                              </div>
                            </div>
                            {shouldShowArrayIndices ? (
                              <div className="viz-index" aria-hidden>
                                {idx}
                              </div>
                            ) : null}
                          </div>
                        );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}
        {isPanelReady && !enableAnimationScroll ? (
          <div
            className="viz-envelope-measure"
            ref={envelopeMeasureRef}
            aria-hidden
          >
            {traceEnvelopeSteps.map((step, stepIdx) => (
              <div key={stepIdx} className="viz-fit-scaled-bundle">
                <p className="viz-caption viz-caption--fit">
                  {step.captionParts.map((seg, idx) =>
                    seg.code ? (
                      <code key={idx} className="viz-caption-code">
                        {seg.text}
                      </code>
                    ) : (
                      <span key={idx}>{seg.text}</span>
                    )
                  )}
                </p>
                <div className="viz-bars" aria-hidden>
                  {step.stackLinkedList ? (
                    <div
                      className="viz-stack"
                      style={{
                        ["--viz-stack-pointer-layer-height" as string]: `${computeStackPointerLayout(step.stackLinkedList, stackStableLevelCount).layerHeightRem}rem`,
                      }}
                      aria-hidden
                    >
                      {step.stackLinkedList.nodes.length === 0 ? (
                        <div className="viz-stack-empty">Empty stack</div>
                      ) : (
                        <div className="viz-stack-row">
                          {step.stackLinkedList.nodes.map((node) => (
                            <div key={node.id} className="viz-stack-item">
                              <div className="viz-stack-node">{node.value}</div>
                              {node.nextId ? (
                                <div className="viz-stack-link" aria-hidden>
                                  <span className="viz-stack-next">⟶</span>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    step.values.map((n, idx) => {
                      const h = `${Math.round((n / step.maxVal) * 100)}%`;
                      return (
                        <div key={idx} className="viz-bar-col">
                          <div className="viz-pointers" aria-hidden />
                          {step.showMinSlot ? (
                            <div className="viz-min-slot" aria-hidden />
                          ) : null}
                          <div className="viz-bar-track">
                            <div className="viz-bar" style={{ height: h }}>
                              {n}
                            </div>
                          </div>
                          {shouldShowArrayIndices ? (
                            <div className="viz-index" aria-hidden>
                              {idx}
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
