import { describe, expect, it } from "vitest";

import {
  getAlgorithmDemo,
  getAlgorithmIds,
  type MockStep,
} from "./mockTrace";
import {
  getAlgorithmEnvelopeTraces,
  getAlgorithmSpec,
} from "./algorithmSpecs";
import {
  layoutPointerOverlayCenters,
  resolveArrayPointers,
} from "./parseArrayPointers";
import {
  createPointerVisibilityMap,
  ARRAY_POINTER_KEYS,
  type PointerMetaMap,
} from "./pointerRegistry";
import { planPointerStage, type PointerTargetMap } from "./pointerStagePlan";
import { shouldAnimatePointerFlip } from "./pointerAnimationScheduler";
import {
  getPointerEnterCleanupDelayMs,
  getPointerEnterDurationMs,
} from "./pointerLifecycleAnimation";
import {
  getBarAssignCleanupDelayMs,
  getBarHeightPercent,
  shouldAnimateBarFlip,
} from "./barAnimationPolicy";
import { barToneForIndex, type BarTone } from "./vizBarTone";
import { deriveVisualBars, type VisualBar } from "./visualBars";

const VALID_TONES = new Set<BarTone>([
  "key",
  "hl",
  "min",
  "neutral",
  "sorted",
]);

function buildPointerTargets(step: MockStep, inferJMinus1FromHighlights: boolean): PointerTargetMap {
  const pointers = resolveArrayPointers(
    step.variables,
    step.viz,
    inferJMinus1FromHighlights
  );
  const vizMinIndex = "minIndex" in step.viz ? step.viz.minIndex : undefined;
  const minIdx =
    typeof vizMinIndex === "number" && vizMinIndex >= 0
      ? vizMinIndex
      : undefined;
  const centers = layoutPointerOverlayCenters(
    pointers,
    (idx) => idx * 24 + 12,
    11,
    minIdx
  );

  return {
    i: { index: pointers.i, center: centers.i },
    j: { index: pointers.j, center: centers.j },
    jMinus1: { index: pointers.jMinus1, center: centers.jMinus1 },
    min: { index: minIdx, center: centers.min },
  };
}

describe("algorithm animation shared pipeline", () => {
  it("runs every algorithm through shared pointer/bar strategy modules", () => {
    const ids = getAlgorithmIds();
    expect(ids.length).toBeGreaterThan(0);

    for (const id of ids) {
      const { trace } = getAlgorithmDemo(id);
      const spec = getAlgorithmSpec(id);

      expect(trace.length).toBeGreaterThan(0);

      let prevBars: VisualBar[] = [];
      let seed = 0;
      let prevVisible = createPointerVisibilityMap();
      let prevMeta: PointerMetaMap = {};

      let pointerDecisionCount = 0;
      let barToneCheckCount = 0;
      let dsuGraphStepCount = 0;

      for (const step of trace) {
        if (step.viz.kind === "dsuGraph") {
          expect(step.viz.nodes.length).toBe(step.viz.values.length);
          dsuGraphStepCount += 1;
          continue;
        }
        // Algorithm-specific hooks are resolved by algorithmSpec, not by panel branching.
        const sortedExclusiveEnd = spec.visual.getSortedExclusiveEnd({
          stepLine: step.line,
          variables: step.variables,
          valuesLength: step.viz.values.length,
        });

        const { bars: nextBars, nextSeed } = deriveVisualBars(
          prevBars,
          step.viz.values,
          seed
        );

        const prevIndexById = new Map<string, number>();
        prevBars.forEach((bar, idx) => {
          prevIndexById.set(bar.id, idx);
        });

        const maxVal = Math.max(1, ...step.viz.values);
        nextBars.forEach((bar, idx) => {
          const tone = barToneForIndex(idx, step.viz, sortedExclusiveEnd);
          expect(VALID_TONES.has(tone)).toBe(true);
          barToneCheckCount += 1;

          const pct = getBarHeightPercent(bar.value, maxVal);
          expect(pct.endsWith("%")).toBe(true);

          const prevIdx = prevIndexById.get(bar.id);
          if (prevIdx === undefined) return;
          const deltaX = (prevIdx - idx) * 24;
          expect(shouldAnimateBarFlip(deltaX)).toBe(prevIdx !== idx);
        });

        const targets = buildPointerTargets(
          step,
          spec.visual.inferJMinus1FromHighlights
        );
        expect(
          typeof spec.visual.isJInactivePhase({
            stepLine: step.line,
            jIndex: targets.j.index,
          })
        ).toBe("boolean");
        const plan = planPointerStage({
          targets,
          prevVisible,
          prevMeta,
          preClearRects: {},
          trackLeft: undefined,
          layoutScale: 1,
          shouldAnimateFlip: shouldAnimatePointerFlip,
        });

        for (const key of ARRAY_POINTER_KEYS) {
          const decision = plan.decisions[key];
          const hidden =
            decision.targetCenter === undefined ||
            decision.targetIndex === undefined;
          expect(decision.shouldHide).toBe(hidden);

          if (decision.shouldHide) {
            expect(plan.nextVisible[key]).toBe(false);
            expect(plan.nextMeta[key]).toBeUndefined();
            continue;
          }

          expect(plan.nextVisible[key]).toBe(true);
          expect(plan.nextMeta[key]).toEqual({
            idx: decision.targetIndex,
            center: decision.targetCenter,
          });
          pointerDecisionCount += 1;
        }

        prevBars = nextBars;
        seed = nextSeed;
        prevVisible = plan.nextVisible;
        prevMeta = plan.nextMeta;
      }

      const enterDuration = getPointerEnterDurationMs(900);
      expect(getPointerEnterCleanupDelayMs(enterDuration)).toBeGreaterThan(
        enterDuration
      );
      expect(getBarAssignCleanupDelayMs(enterDuration)).toBeGreaterThan(
        enterDuration
      );

      const envelope = getAlgorithmEnvelopeTraces(id, trace, getAlgorithmDemo);
      expect(envelope.length).toBeGreaterThan(0);
      if (dsuGraphStepCount > 0) {
        expect(dsuGraphStepCount).toBe(trace.length);
      } else {
        expect(pointerDecisionCount).toBeGreaterThan(0);
        expect(barToneCheckCount).toBeGreaterThan(0);
      }
    }
  });
});