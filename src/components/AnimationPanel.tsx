import { AppWindow, Maximize2 } from "lucide-react";
import {
  getAlgorithmDemo,
  type AlgorithmId,
  type MockDsuGraphViz,
  type MockVizModel,
  type MockStep,
} from "../lib/mockTrace";
import type { StepDirection } from "../lib/executionReducer";
import { shouldPlayTransitions } from "../lib/motionDirectionGate";
import {
  getAlgorithmEnvelopeTraces,
  getAlgorithmSpec,
} from "../lib/algorithmSpecs";
import {
  layoutPointerOverlayCenters,
  resolveArrayPointers,
} from "../lib/parseArrayPointers";
import { barToneForIndex } from "../lib/vizBarTone";
import {
  barClassNameForTone,
  pointerToneClassForTone,
} from "../lib/visualToneClassMap";
import { getAnimationDurationMs } from "../lib/speedPresets";
import { formatVizCaptionForDisplay } from "../lib/formatVizCaptionForDisplay";
import {
  applyPointerEnterAnimation,
  clearPointerEnterAnimation,
  clearPointerExiting,
  getPointerEnterCleanupDelayMs,
  getPointerEnterDurationMs,
  markPointerExiting,
  POINTER_EXIT_CLASS,
  setPointerAnimationDuration,
} from "../lib/pointerLifecycleAnimation";
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
import {
  planPointerStage,
  type PointerTargetMap,
} from "../lib/pointerStagePlan";
import {
  playPointerMoveFlip,
  primePointerMoveFlip,
  settlePointerMoveAtRest,
} from "../lib/pointerMoveAnimation";
import {
  finishBarAssignAnimation,
  getBarAssignCleanupDelayMs,
  getBarHeightPercent,
  playBarAssignAnimation,
  playBarFlip,
  primeBarAssignAnimation,
  primeBarFlip,
  resetBarFlipStyles,
  shouldAnimateBarFlip,
} from "../lib/barAnimationPolicy";
import {
  animateDsuTreeStep,
  easeOutEmphasized,
  snapDsuTree,
  type DsuEdgeDescriptor,
} from "../lib/dsuTreeAnimation";
import {
  beginAnimationRun,
  createAnimationRunGuard,
  isAnimationRunCurrent,
} from "../lib/animationRunGuard";
import {
  ARRAY_POINTER_KEYS,
  createPointerVisibilityMap,
  type PointerKey,
  type PointerMetaMap,
} from "../lib/pointerRegistry";
import {
  deriveVisualBars,
  type VisualBar,
} from "../lib/visualBars";
import {
  DSU_NODE_RADIUS_PX,
  type DsuPoint,
} from "../lib/dsuGraphLayout";
import { strings } from "../strings";
import { PanelSkeleton } from "./LoadingState";
import { stripCaptionBackticks } from "../lib/captionUtils";
import { IconButton, Switch } from "@visualizer-ui";
import { DsuGraph } from "./animation/DsuGraph";
import { CaptionLine } from "./animation/CaptionLine";
import {
  buildDsuGraphAriaLabel,
  buildVizAriaLabel,
} from "./animation/animationAriaHelpers";
import {
  dsuEdgeKey,
  quickUnionEdgeRefKey,
} from "./animation/dsuEdgeHelpers";
import { buildQuickUnionTreePositions } from "./animation/quickUnionTreeLayout";
import type { CSSProperties, MouseEvent } from "react";
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
  viz: MockVizModel;
  variables: Record<string, string>;
  algorithmId: AlgorithmId;
  stepLine: number;
  /** Current step index; used to detect step boundaries for one-shot effects. */
  stepIndex: number;
  lastStepDirection: StepDirection;
  replayAnimationsOnStepBack: boolean;
  showArrayIndices: boolean;
  enableAnimationScroll: boolean;
  /** No-scroll fit mode: if false, fit never scales above 1 (intrinsic size cap). */
  animationFitAllowUpscale: boolean;
  displayConnections: boolean;
  onDisplayConnectionsChange?: (value: boolean) => void;
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

export function AnimationPanel({
  trace,
  viz,
  variables,
  algorithmId,
  stepLine,
  stepIndex,
  lastStepDirection,
  replayAnimationsOnStepBack,
  showArrayIndices,
  enableAnimationScroll,
  animationFitAllowUpscale,
  displayConnections,
  onDisplayConnectionsChange,
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
  const pointerEnterTimersRef = useRef<number[]>([]);
  const pointerExitTimerByKeyRef = useRef<
    Partial<Record<PointerKey, number>>
  >({});
  const animationRunGuardRef = useRef(createAnimationRunGuard());
  const pointerTransitionStateRef = useRef(
    createPointerTransitionMap(ARRAY_POINTER_KEYS)
  );
  const [, setPointerTransitionRevision] = useState(0);
  const prevPointerVisibleRef = useRef(createPointerVisibilityMap());
  const prevPointerMetaRef = useRef<PointerMetaMap>({});
  const fitViewportRef = useRef<HTMLDivElement | null>(null);
  const graphSlotRef = useRef<HTMLDivElement | null>(null);
  const graphFitRef = useRef<HTMLDivElement | null>(null);
  const envelopeMeasureRef = useRef<HTMLDivElement | null>(null);
  /** Caption + bars; never receives explicit height so scrollWidth/Height stay natural. */
  const fitMeasureRef = useRef<HTMLDivElement | null>(null);
  const fitRafRef = useRef<number | null>(null);
  // DSU animation state (Quick Find / Quick Union):
  // - `prevDsuValuesRef`  previous id[] groups so we can diff per-node value changes.
  // - `prevDsuEdgeKeysRef` previous edge set for "draw-in" detection of new edges.
  // - `prevDsuActiveEdgeRef` previous active edge key for the one-shot pulse cue.
  // - `prevDsuPositionsRef` previous Quick Union tree positions for the unified driver.
  // - `dsuNodeSlotRefs` / `dsuEdgeLineRefs` handles used by
  //   `animateDsuTreeStep` to synchronously move nodes and edge endpoints.
  const prevDsuValuesRef = useRef<readonly number[] | null>(null);
  const prevDsuEdgeKeysRef = useRef<Set<string>>(new Set());
  const prevDsuActiveEdgeRef = useRef<string | null>(null);
  const prevDsuPositionsRef = useRef<Map<number, DsuPoint> | null>(null);
  const dsuNodeSlotRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const dsuEdgeLineRefs = useRef<Map<string, SVGLineElement>>(new Map());
  const dsuTreeAnimationCancelRef = useRef<(() => void) | null>(null);
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

  const shouldShowArrayIndices = showArrayIndices;

  const bars = useMemo(() => {
    const { bars: nextBars, nextSeed } = deriveVisualBars(
      prevBarsRef.current,
      viz.values,
      barIdSeedRef.current
    );
    barIdSeedRef.current = nextSeed;
    return nextBars;
  }, [viz.values]);

  const flipDurationMs = getAnimationDurationMs(speedMs, isAutoPlayingStep);
  const pointerEnterDurationMs = getPointerEnterDurationMs(flipDurationMs);
  const shouldPlay = shouldPlayTransitions(
    lastStepDirection,
    replayAnimationsOnStepBack
  );
  const effectiveDurationMs = shouldPlay ? flipDurationMs : 0;
  const bumpPointerTransitionRevision = useCallback(() => {
    setPointerTransitionRevision((v) => v + 1);
  }, []);
  const algorithmSpec = useMemo(
    () => getAlgorithmSpec(algorithmId),
    [algorithmId]
  );
  const pointers = useMemo(
    () =>
      resolveArrayPointers(
        variables,
        viz,
        algorithmSpec.visual.inferJMinus1FromHighlights
      ),
    [algorithmSpec, variables, viz]
  );
  const sortedExclusiveEnd = useMemo(() => {
    return algorithmSpec.visual.getSortedExclusiveEnd({
      stepLine,
      variables,
      valuesLength: viz.values.length,
    });
  }, [algorithmSpec, stepLine, variables, viz.values.length]);
  const isJInactive = useMemo(
    () =>
      algorithmSpec.visual.isJInactivePhase({
        stepLine,
        jIndex: pointers.j,
      }),
    [algorithmSpec, stepLine, pointers.j]
  );
  const displayCaption = useMemo(
    () => formatVizCaptionForDisplay(viz.caption, variables),
    [viz.caption, variables]
  );
  const vizMinIndex = "minIndex" in viz ? viz.minIndex : undefined;
  const maxVal = Math.max(1, ...viz.values);
  const showMinRow = typeof vizMinIndex === "number" && vizMinIndex >= 0;
  const envelopeTraces = useMemo(
    () => getAlgorithmEnvelopeTraces(algorithmId, trace, getAlgorithmDemo),
    [algorithmId, trace]
  );
  const traceEnvelopeSteps = useMemo(() => {
    const mapStep = (step: MockStep) => {
      const displayStepCaption = formatVizCaptionForDisplay(
        step.viz.caption,
        step.variables
      );
      if (step.viz.kind === "dsuGraph") {
        return {
          kind: "dsuGraph" as const,
          captionText: displayStepCaption,
          values: step.viz.values,
          nodes: step.viz.nodes,
          edges: step.viz.edges,
          uniformEdgeColor: step.viz.uniformEdgeColor,
        };
      }
      return {
        kind: "bars" as const,
        captionText: displayStepCaption,
        values: step.viz.values,
        maxVal: Math.max(1, ...step.viz.values),
        showMinSlot:
          "minIndex" in step.viz &&
          typeof step.viz.minIndex === "number" &&
          step.viz.minIndex >= 0,
      };
    };

    return envelopeTraces.flatMap((entry) => {
      return entry.trace.map((step, stepIdx) => ({
        envelopeKey: `${entry.id}-${stepIdx}`,
        ...mapStep(step),
      }));
    });
  }, [envelopeTraces]);

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

    const animationRunGuard = animationRunGuardRef.current;
    const animationRunId = beginAnimationRun(animationRunGuard);

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
      resetBarFlipStyles(el);
    }

    const currentRects = new Map<string, number>();
    for (const bar of bars) {
      const el = barRefs.current[bar.id];
      if (!el) continue;
      currentRects.set(bar.id, el.getBoundingClientRect().left);
    }

    const SPLIT_OFFSET = 11;
    const trackEl = barsTrackRef.current;
    let trackLeft: number | undefined;
    let iCenter: number | undefined;
    let jCenter: number | undefined;
    let jm1Center: number | undefined;
    let minCenter: number | undefined;
    // Pointers must read geometry here, before bar FLIP applies translateX
    // invert on columns, otherwise rects are shifted and step-back looks wrong.
    if (trackEl && bars.length > 0) {
      const trackRect = trackEl.getBoundingClientRect();
      trackLeft = trackRect.left;
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
        showMinRow ? vizMinIndex : undefined
      );
      iCenter = ptrCenters.i;
      jCenter = ptrCenters.j;
      jm1Center = ptrCenters.jMinus1;
      minCenter = ptrCenters.min;
    }

    const movedBarIds = new Set<string>();

    if (shouldPlay && prevRectsRef.current.size > 0) {
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
        if (!shouldAnimateBarFlip(delta)) continue;
        const el = barRefs.current[bar.id];
        if (!el) continue;
        moved.push({ el, delta, barId: bar.id });
        movedBarIds.add(bar.id);
      }

      if (moved.length > 0) {
        for (const { el, delta } of moved) {
          primeBarFlip(el, delta, layoutScale);
          // Ensure transform inversion is committed before playback.
          el.getBoundingClientRect();
        }

        rafRef.current = requestAnimationFrame(() => {
          if (
            !isAnimationRunCurrent(animationRunGuard, animationRunId)
          ) {
            rafRef.current = null;
            return;
          }
          for (const { el } of moved) {
            playBarFlip(el, flipDurationMs);
          }
          rafRef.current = null;
        });
      }
    }

    const prevVals = prevValuesRef.current;
    const maxVal = Math.max(1, ...viz.values);
    if (shouldPlay && prevVals && prevVals.length === viz.values.length) {
      const prevMax = Math.max(1, ...prevVals);
      for (let i = 0; i < bars.length; i += 1) {
        const bar = bars[i]!;
        if (prevVals[i] === viz.values[i]) continue;
        if (movedBarIds.has(bar.id)) continue;
        const innerEl = barInnerRefs.current[bar.id];
        if (!innerEl) continue;
        const oldPct = getBarHeightPercent(prevVals[i]!, prevMax);
        const newPct = getBarHeightPercent(viz.values[i]!, maxVal);
        const duration = flipDurationMs;
        primeBarAssignAnimation(innerEl, oldPct, duration);
        void innerEl.offsetHeight;
        requestAnimationFrame(() => {
          if (
            !isAnimationRunCurrent(animationRunGuard, animationRunId)
          ) {
            return;
          }
          playBarAssignAnimation(innerEl, newPct, duration);
          let done = false;
          const cleanup = () => {
            if (done) return;
            done = true;
            innerEl.removeEventListener("transitionend", cleanup);
            innerEl.removeEventListener("transitioncancel", cleanup);
            if (
              !isAnimationRunCurrent(animationRunGuard, animationRunId)
            ) {
              return;
            }
            finishBarAssignAnimation(innerEl, newPct);
          };
          innerEl.addEventListener("transitionend", cleanup);
          innerEl.addEventListener("transitioncancel", cleanup);
          window.setTimeout(cleanup, getBarAssignCleanupDelayMs(duration));
        });
      }
    }

    const duration = flipDurationMs;

    const prevPtr = prevPointerMetaRef.current;
    const prevVisible = prevPointerVisibleRef.current;
    const flipEls: HTMLSpanElement[] = [];
    const enterEls: HTMLSpanElement[] = [];

    const minIdx =
      showMinRow && typeof vizMinIndex === "number" && vizMinIndex >= 0
        ? vizMinIndex
        : undefined;

    const pointerTargets: PointerTargetMap = {
      i: { index: pointers.i, center: iCenter },
      j: { index: pointers.j, center: jCenter },
      jMinus1: { index: pointers.jMinus1, center: jm1Center },
      min: { index: minIdx, center: minCenter },
    };

    const pointerPlan = planPointerStage({
      targets: pointerTargets,
      prevVisible,
      prevMeta: prevPtr,
      preClearRects: preClearPointers,
      trackLeft,
      layoutScale,
      shouldAnimateFlip: shouldAnimatePointerFlip,
    });

    const pointerElements: Record<PointerKey, HTMLSpanElement | null> = {
      i: pointerIRef.current,
      j: pointerJRef.current,
      jMinus1: pointerJMinus1Ref.current,
      min: pointerMinRef.current,
    };

    for (const key of ARRAY_POINTER_KEYS) {
      const el = pointerElements[key];
      const decision = pointerPlan.decisions[key];
      const transitionState = pointerTransitionStateRef.current[key];
      const wasExiting = transitionState.exiting;
      const pendingExitTimer = pointerExitTimerByKeyRef.current[key];

      if (!el) {
        pointerPlan.nextVisible[key] = false;
        delete pointerPlan.nextMeta[key];
        continue;
      }

      if (decision.shouldHide) {
        clearPointerEnterAnimation(el);
        setPointerAnimationDuration(el, pointerEnterDurationMs);
        if (beginPointerExit(pointerTransitionStateRef.current, key)) {
          if (shouldPlay) {
            markPointerExiting(el);
            const timer = window.setTimeout(() => {
              const isCurrentRun = isAnimationRunCurrent(
                animationRunGuard,
                animationRunId,
              );
              completePointerExit(pointerTransitionStateRef.current, key);
              delete pointerExitTimerByKeyRef.current[key];
              bumpPointerTransitionRevision();
              if (!isCurrentRun) {
                return;
              }
            }, pointerEnterDurationMs);
            pointerExitTimerByKeyRef.current[key] = timer;
          } else {
            // Snap: immediately resolve the exit transition without playing it.
            clearPointerExiting(el);
            completePointerExit(pointerTransitionStateRef.current, key);
            bumpPointerTransitionRevision();
          }
        }
        continue;
      }

      if (typeof pendingExitTimer === "number") {
        window.clearTimeout(pendingExitTimer);
        delete pointerExitTimerByKeyRef.current[key];
      }
      const hadExitingClassBefore = el.classList.contains(POINTER_EXIT_CLASS);
      showPointer(pointerTransitionStateRef.current, key);
      if (wasExiting || hadExitingClassBefore) {
        clearPointerExiting(el);
      }

      if (decision.targetCenter !== undefined) {
        el.style.left = `${decision.targetCenter}px`;
      }

      if (shouldPlay && decision.shouldFlip && decision.deltaX !== undefined) {
        primePointerMoveFlip(el, decision.deltaX);
        el.getBoundingClientRect();
        flipEls.push(el);
      } else {
        settlePointerMoveAtRest(el);
      }

      if (shouldPlay && decision.shouldEnter) {
        enterEls.push(el);
      }
    }

    const playPointerEnter = () => {
      for (const el of enterEls) {
        applyPointerEnterAnimation(el, pointerEnterDurationMs);
        const timer = window.setTimeout(() => {
          if (
            !isAnimationRunCurrent(animationRunGuard, animationRunId)
          ) {
            return;
          }
          clearPointerEnterAnimation(el);
        }, getPointerEnterCleanupDelayMs(pointerEnterDurationMs));
        pointerEnterTimersRef.current.push(timer);
      }
    };

    pointerFlipRafRef.current = schedulePointerPlayback({
      hasFlip: flipEls.length > 0,
      hasEnter: enterEls.length > 0,
      scheduleFrame: requestAnimationFrame,
      startFlip: () => {
        if (
          !isAnimationRunCurrent(animationRunGuard, animationRunId)
        ) {
          pointerFlipRafRef.current = null;
          return;
        }
        for (const el of flipEls) {
          playPointerMoveFlip(el, duration);
        }
        pointerFlipRafRef.current = null;
      },
      playEnter: () => {
        if (
          !isAnimationRunCurrent(animationRunGuard, animationRunId)
        ) {
          return;
        }
        playPointerEnter();
      },
    });

    prevPointerMetaRef.current = pointerPlan.nextMeta;
    prevPointerVisibleRef.current = pointerPlan.nextVisible;

    prevValuesRef.current = [...viz.values];
    prevRectsRef.current = currentRects;
    prevBarsRef.current = bars;

    return () => {
      beginAnimationRun(animationRunGuard);
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
    vizMinIndex,
    showMinRow,
    shouldShowArrayIndices,
    fitScale,
    enableAnimationScroll,
    pointerEnterDurationMs,
    bumpPointerTransitionRevision,
    shouldPlay,
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

  const ariaLabel = buildVizAriaLabel(
    stripCaptionBackticks(displayCaption),
    pointers,
    viz.values.length,
    vizMinIndex
  );
  const isDsuGraph = viz.kind === "dsuGraph";
  const dsuViz = isDsuGraph ? (viz as MockDsuGraphViz) : null;
  const isPreUnionCue =
    dsuViz?.transitionKind === "pre-union" && dsuViz.transitionEffect === "pulse";
  const preUnionCueDurationMs = Math.max(180, Math.round(flipDurationMs * 0.75));
  const dsuCueStyle: CSSProperties | undefined = dsuViz
    ? ({
        ["--viz-dsu-duration" as const]: `${effectiveDurationMs}ms`,
        ...(isPreUnionCue
          ? {
              ["--viz-dsu-pre-union-duration" as const]: `${preUnionCueDurationMs}ms`,
            }
          : {}),
      } as CSSProperties)
    : undefined;
  const useQuickUnionTreeLayout = algorithmSpec.visual.usesQuickUnionTreeLayout;
  const supportsDisplayConnections = isDsuGraph && !useQuickUnionTreeLayout;
  const dsuNodePositions = useMemo(() => {
    if (!dsuViz || !useQuickUnionTreeLayout) return null;
    return buildQuickUnionTreePositions(dsuViz.values);
  }, [dsuViz, useQuickUnionTreeLayout]);
  const showDsuConnections = !supportsDisplayConnections || displayConnections;
  const vizAriaLabel = dsuViz ? buildDsuGraphAriaLabel(dsuViz) : ariaLabel;
  const fixedBundleStyle =
    !enableAnimationScroll && fitEnvelopeSize
      ? { width: `${fitEnvelopeSize.width}px` }
      : undefined;

  /**
   * DSU step-to-step diff used by the animation layer:
   *  - previousGroupById: indices whose id[i] changed -> their PREVIOUS value.
   *    Empty map when shouldPlay is false or the previous length does not match.
   *  - newEdgeKeys: edge keys present now but absent in the previous frame
   *    (drives the "draw-in" stroke-dashoffset keyframe).
   *  - activeEdgeEntering: the activeEdge key changed since the previous frame
   *    (drives the one-shot stroke-width pulse on the current union edge).
   * Diff is computed against refs that are updated AFTER commit, so during
   * render these refs still reflect the previous step.
   */
  const dsuDiff = useMemo(() => {
    const emptyGroupMap: Map<number, number> = new Map();
    const emptyEdgeSet: Set<string> = new Set();
    if (!dsuViz || !shouldPlay) {
      return {
        previousGroupById: emptyGroupMap,
        newEdgeKeys: emptyEdgeSet,
        activeEdgeEntering: false,
      };
    }
    const currentValues = dsuViz.values;
    const prevValues = prevDsuValuesRef.current;
    const previousGroupById = new Map<number, number>();
    if (prevValues && prevValues.length === currentValues.length) {
      for (let i = 0; i < prevValues.length; i += 1) {
        if (prevValues[i] !== currentValues[i]) {
          previousGroupById.set(i, prevValues[i]!);
        }
      }
    }
    const prevEdgeKeys = prevDsuEdgeKeysRef.current;
    const newEdgeKeys = new Set<string>();
    for (const edge of dsuViz.edges) {
      const key = dsuEdgeKey(edge);
      if (!prevEdgeKeys.has(key)) newEdgeKeys.add(key);
    }
    const currentActiveKey = dsuViz.activeEdge
      ? dsuEdgeKey(dsuViz.activeEdge)
      : null;
    const activeEdgeEntering =
      currentActiveKey !== null &&
      currentActiveKey !== prevDsuActiveEdgeRef.current;
    return { previousGroupById, newEdgeKeys, activeEdgeEntering };
    // `dsuViz` identity changes per step (fresh viz object in the trace), so
    // this memo re-runs on every step boundary even without `stepIndex`.
  }, [dsuViz, shouldPlay]);

  /**
   * Scan (Quick Find - Full) and trace (Quick Union - Full) cues. These are
   * derived from the active code line + the highlightIndices in the viz so
   * no new trace data is needed. The animation is a short one-shot pulse.
   * Per-algorithm line anchors live on `algorithmSpec.visual.dsuCueLines`.
   */
  const dsuCueSets = useMemo(() => {
    const scanNodeIds = new Set<number>();
    const traceNodeIds = new Set<number>();
    const traceEdgeKeys = new Set<string>();
    const cueLines = algorithmSpec.visual.dsuCueLines;
    if (!dsuViz || !cueLines) {
      return { scanNodeIds, traceNodeIds, traceEdgeKeys };
    }
    if (cueLines.scanLine !== undefined && stepLine === cueLines.scanLine) {
      for (const idx of dsuViz.highlightIndices) scanNodeIds.add(idx);
    }
    if (
      cueLines.findWhileLine !== undefined &&
      stepLine === cueLines.findWhileLine
    ) {
      for (const idx of dsuViz.highlightIndices) traceNodeIds.add(idx);
    } else if (
      cueLines.findAdvanceLine !== undefined &&
      stepLine === cueLines.findAdvanceLine
    ) {
      for (const idx of dsuViz.highlightIndices) traceNodeIds.add(idx);
      // highlightIndices shape on advance is [i, next] - see mockTrace.
      if (dsuViz.highlightIndices.length >= 2) {
        const from = dsuViz.highlightIndices[0]!;
        const to = dsuViz.highlightIndices[1]!;
        traceEdgeKeys.add(dsuEdgeKey({ from, to }));
      }
    }
    return { scanNodeIds, traceNodeIds, traceEdgeKeys };
  }, [dsuViz, algorithmSpec, stepLine]);

  const dsuNumberFlipKey = `${algorithmId}:${stepIndex}`;

  const dsuSlotRefCallback = useCallback(
    (nodeId: number, el: HTMLDivElement | null) => {
      if (el) {
        dsuNodeSlotRefs.current.set(nodeId, el);
      } else {
        dsuNodeSlotRefs.current.delete(nodeId);
      }
    },
    []
  );

  const dsuEdgeRefCallback = useCallback(
    (key: string, el: SVGLineElement | null) => {
      if (el) {
        dsuEdgeLineRefs.current.set(key, el);
      } else {
        dsuEdgeLineRefs.current.delete(key);
      }
    },
    []
  );

  // Quick Union tree reparenting: drive a unified per-frame interpolation
  // over both node slot positions and edge endpoints so they glide together.
  // See `src/lib/dsuTreeAnimation.ts` for the contract (direction, snap,
  // cancel semantics).
  useLayoutEffect(() => {
    if (dsuTreeAnimationCancelRef.current) {
      dsuTreeAnimationCancelRef.current();
      dsuTreeAnimationCancelRef.current = null;
    }

    if (!dsuViz || !useQuickUnionTreeLayout || !dsuNodePositions) {
      prevDsuPositionsRef.current = null;
      return;
    }

    const edgeDescriptors: DsuEdgeDescriptor[] = dsuViz.edges.map((edge) => ({
      key: quickUnionEdgeRefKey(edge),
      from: edge.from,
      to: edge.to,
    }));

    const targets = {
      nodeSlots: dsuNodeSlotRefs.current,
      edgeLines: dsuEdgeLineRefs.current,
    };

    const prevPositions = prevDsuPositionsRef.current;
    if (!shouldPlay || !prevPositions) {
      snapDsuTree(
        targets,
        dsuNodePositions,
        edgeDescriptors,
        DSU_NODE_RADIUS_PX
      );
      prevDsuPositionsRef.current = new Map(dsuNodePositions);
      return;
    }

    dsuTreeAnimationCancelRef.current = animateDsuTreeStep(targets, {
      prevPositions,
      nextPositions: dsuNodePositions,
      edges: edgeDescriptors,
      durationMs: flipDurationMs,
      nodeRadiusPx: DSU_NODE_RADIUS_PX,
      ease: easeOutEmphasized,
    });

    prevDsuPositionsRef.current = new Map(dsuNodePositions);

    return () => {
      if (dsuTreeAnimationCancelRef.current) {
        dsuTreeAnimationCancelRef.current();
        dsuTreeAnimationCancelRef.current = null;
      }
    };
  }, [
    dsuViz,
    useQuickUnionTreeLayout,
    dsuNodePositions,
    shouldPlay,
    flipDurationMs,
  ]);

  // Commit DSU diff baselines AFTER render so next render's memo diffs
  // against this step's values (snapshot semantics).
  useEffect(() => {
    if (!dsuViz) {
      prevDsuValuesRef.current = null;
      prevDsuEdgeKeysRef.current = new Set();
      prevDsuActiveEdgeRef.current = null;
      return;
    }
    prevDsuValuesRef.current = [...dsuViz.values];
    const keys = new Set<string>();
    for (const edge of dsuViz.edges) keys.add(dsuEdgeKey(edge));
    prevDsuEdgeKeysRef.current = keys;
    prevDsuActiveEdgeRef.current = dsuViz.activeEdge
      ? dsuEdgeKey(dsuViz.activeEdge)
      : null;
  }, [dsuViz]);

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
        {supportsDisplayConnections || onPresentNative || onPresentOverlay ? (
          <div className="panel-head-actions">
            {supportsDisplayConnections ? (
              <Switch
                size="sm"
                label={strings.panels.displayConnections}
                checked={displayConnections}
                onCheckedChange={(value) => onDisplayConnectionsChange?.(value)}
                ariaLabel={strings.panels.displayConnections}
              />
            ) : null}
            {onPresentNative ? (
              <IconButton
                className="panel-head-present"
                aria-label={strings.presentation.presentNative}
                onClick={(e) => {
                  e.stopPropagation();
                  onPresentNative();
                }}
              >
                <Maximize2 {...PRESENT_ICON} aria-hidden />
              </IconButton>
            ) : null}
            {onPresentOverlay ? (
              <IconButton
                className="panel-head-present"
                aria-label={strings.presentation.presentOverlay}
                onClick={(e) => {
                  e.stopPropagation();
                  onPresentOverlay();
                }}
              >
                <AppWindow {...PRESENT_ICON} aria-hidden />
              </IconButton>
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
                    <CaptionLine
                      caption={displayCaption}
                      fitMode={!enableAnimationScroll}
                    />
                    <div
                      className={dsuViz ? "viz-dsu-graph" : "viz-bars"}
                      ref={barsTrackRef}
                      role="img"
                      aria-label={vizAriaLabel}
                      style={dsuViz ? dsuCueStyle : undefined}
                    >
                      {dsuViz ? (
                        <DsuGraph
                          viz={dsuViz}
                          nodePositions={dsuNodePositions}
                          showConnections={showDsuConnections}
                          useQuickUnionTreeLayout={useQuickUnionTreeLayout}
                          emphasizeActiveEdge={true}
                          preUnionPulse={isPreUnionCue}
                          shouldPlay={shouldPlay}
                          newEdgeKeys={dsuDiff.newEdgeKeys}
                          activeEdgeEntering={dsuDiff.activeEdgeEntering}
                          traceEdgeKeys={dsuCueSets.traceEdgeKeys}
                          scanNodeIds={dsuCueSets.scanNodeIds}
                          traceNodeIds={dsuCueSets.traceNodeIds}
                          previousGroupById={dsuDiff.previousGroupById}
                          numberFlipKey={dsuNumberFlipKey}
                          slotRefCallback={dsuSlotRefCallback}
                          edgeRefCallback={dsuEdgeRefCallback}
                        />
                      ) : (
                        <>
                        <div className="viz-pointers-layer" aria-hidden>
                        {pointers.i !== undefined ||
                        pointerTransitionStateRef.current.i.mounted ? (
                          <span
                            ref={pointerIRef}
                            className={`viz-pointer viz-pointer--i viz-pointer--overlay${
                              pointerTransitionStateRef.current.i.exiting
                                ? ` ${POINTER_EXIT_CLASS}`
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
                            className={`viz-pointer viz-pointer--j viz-pointer--overlay ${pointerToneClassForTone(
                              pointers.j === undefined
                                ? "neutral"
                                : barToneForIndex(
                                    pointers.j,
                                    viz,
                                    sortedExclusiveEnd
                                  )
                            )}${
                              isJInactive ? " viz-pointer--inactive" : ""
                            }${
                              pointerTransitionStateRef.current.j.exiting
                                ? ` ${POINTER_EXIT_CLASS}`
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
                            className={`viz-pointer viz-pointer--jminus1 viz-pointer--overlay ${pointerToneClassForTone(
                              pointers.jMinus1 === undefined
                                ? "neutral"
                                : barToneForIndex(
                                    pointers.jMinus1,
                                    viz,
                                    sortedExclusiveEnd
                                  )
                            )}${
                              pointerTransitionStateRef.current.jMinus1.exiting
                                ? ` ${POINTER_EXIT_CLASS}`
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
                            className={`viz-pointer viz-pointer--min viz-pointer--overlay ${pointerToneClassForTone("min")}${
                              pointerTransitionStateRef.current.min.exiting
                                ? ` ${POINTER_EXIT_CLASS}`
                                : ""
                            }`}
                          >
                            min<span className="viz-pointer-arrow">↓</span>
                          </span>
                        ) : null}
                        </div>
                        {bars.map((bar, idx) => {
                        const n = bar.value;
                        const h = getBarHeightPercent(n, maxVal);
                        const tone = barToneForIndex(idx, viz, sortedExclusiveEnd);
                        const cls = barClassNameForTone("viz-bar", tone);

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
                        </>
                      )}
                      </div>
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
            {traceEnvelopeSteps.map((step) => (
              <div key={step.envelopeKey} className="viz-fit-scaled-bundle">
                <CaptionLine caption={step.captionText} fitMode />
                {step.kind === "dsuGraph" ? (
                  <div className="viz-dsu-graph" aria-hidden>
                    <DsuGraph
                      viz={step}
                      nodePositions={
                        useQuickUnionTreeLayout
                          ? buildQuickUnionTreePositions(step.values)
                          : null
                      }
                      showConnections={showDsuConnections}
                      useQuickUnionTreeLayout={useQuickUnionTreeLayout}
                      emphasizeActiveEdge={false}
                      preUnionPulse={false}
                      shouldPlay={false}
                      numberFlipKey={`envelope-${algorithmId}`}
                    />
                  </div>
                ) : (
                  <div className="viz-bars" aria-hidden>
                    {step.values.map((n, idx) => {
                      const h = getBarHeightPercent(n, step.maxVal);
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
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
