import { describe, expect, it } from "vitest";

import { createPointerVisibilityMap } from "./pointerRegistry";
import {
  planPointerStage,
  type PointerTargetMap,
} from "./pointerStagePlan";

function createTargets(
  overrides: Partial<PointerTargetMap>
): PointerTargetMap {
  return {
    i: { index: undefined, center: undefined },
    j: { index: undefined, center: undefined },
    jMinus1: { index: undefined, center: undefined },
    min: { index: undefined, center: undefined },
    ...overrides,
  };
}

describe("pointerStagePlan", () => {
  it("hides pointers with missing target index or center", () => {
    const plan = planPointerStage({
      targets: createTargets({ i: { index: 0, center: undefined } }),
      prevVisible: createPointerVisibilityMap(),
      prevMeta: {},
      preClearRects: {},
      trackLeft: undefined,
      layoutScale: 1,
      shouldAnimateFlip: () => true,
    });

    expect(plan.decisions.i.shouldHide).toBe(true);
    expect(plan.nextVisible.i).toBe(false);
    expect(plan.nextMeta.i).toBeUndefined();
  });

  it("enters on first visibility without FLIP", () => {
    const plan = planPointerStage({
      targets: createTargets({ i: { index: 2, center: 120 } }),
      prevVisible: createPointerVisibilityMap(false),
      prevMeta: {},
      preClearRects: {},
      trackLeft: 0,
      layoutScale: 1,
      shouldAnimateFlip: () => true,
    });

    expect(plan.decisions.i.shouldHide).toBe(false);
    expect(plan.decisions.i.shouldEnter).toBe(true);
    expect(plan.decisions.i.shouldFlip).toBe(false);
    expect(plan.nextVisible.i).toBe(true);
    expect(plan.nextMeta.i).toEqual({ idx: 2, center: 120 });
  });

  it("computes FLIP delta from measured pre-clear visual rect", () => {
    const prevVisible = createPointerVisibilityMap(true);
    const plan = planPointerStage({
      targets: createTargets({ i: { index: 2, center: 120 } }),
      prevVisible,
      prevMeta: { i: { idx: 1, center: 100 } },
      preClearRects: {
        i: { left: 208, width: 24 },
      },
      trackLeft: 100,
      layoutScale: 2,
      shouldAnimateFlip: () => true,
    });

    // visualCenter = ((208 + 12) - 100) / 2 = 60; delta = 60 - 120 = -60
    expect(plan.decisions.i.shouldEnter).toBe(false);
    expect(plan.decisions.i.shouldFlip).toBe(true);
    expect(plan.decisions.i.deltaX).toBe(-60);
  });

  it("falls back to previous logical center when rect is unavailable", () => {
    const prevVisible = createPointerVisibilityMap(true);
    const plan = planPointerStage({
      targets: createTargets({ i: { index: 3, center: 150 } }),
      prevVisible,
      prevMeta: { i: { idx: 2, center: 132 } },
      preClearRects: {},
      trackLeft: undefined,
      layoutScale: 1,
      shouldAnimateFlip: () => true,
    });

    expect(plan.decisions.i.shouldFlip).toBe(true);
    expect(plan.decisions.i.deltaX).toBe(-18);
  });
});