import {
  ARRAY_POINTER_KEYS,
  createPointerVisibilityMap,
  type PointerKey,
  type PointerMetaMap,
  type PointerVisibilityMap,
} from "./pointerRegistry";

export type PointerRectLike = {
  left: number;
  width: number;
};

export type PointerTarget = {
  index: number | undefined;
  center: number | undefined;
};

export type PointerTargetMap = Record<PointerKey, PointerTarget>;

export type PointerStageDecision = {
  key: PointerKey;
  shouldHide: boolean;
  shouldEnter: boolean;
  shouldFlip: boolean;
  targetIndex: number | undefined;
  targetCenter: number | undefined;
  deltaX: number | undefined;
};

export type PointerStagePlan = {
  decisions: Record<PointerKey, PointerStageDecision>;
  nextVisible: PointerVisibilityMap;
  nextMeta: PointerMetaMap;
};

type PlanPointerStageOptions = {
  targets: PointerTargetMap;
  prevVisible: PointerVisibilityMap;
  prevMeta: PointerMetaMap;
  preClearRects: Partial<Record<PointerKey, PointerRectLike>>;
  trackLeft: number | undefined;
  layoutScale: number;
  shouldAnimateFlip: (
    prevCenter: number | undefined,
    newCenter: number | undefined
  ) => boolean;
};

export function planPointerStage({
  targets,
  prevVisible,
  prevMeta,
  preClearRects,
  trackLeft,
  layoutScale,
  shouldAnimateFlip,
}: PlanPointerStageOptions): PointerStagePlan {
  const decisions = {} as Record<PointerKey, PointerStageDecision>;
  const nextVisible = createPointerVisibilityMap();
  const nextMeta: PointerMetaMap = {};

  for (const key of ARRAY_POINTER_KEYS) {
    const target = targets[key];
    const prevEntry = prevMeta[key];
    const targetCenter = target.center;
    const targetIndex = target.index;

    if (targetCenter === undefined || targetIndex === undefined) {
      decisions[key] = {
        key,
        shouldHide: true,
        shouldEnter: false,
        shouldFlip: false,
        targetIndex,
        targetCenter,
        deltaX: undefined,
      };
      nextVisible[key] = false;
      continue;
    }

    const shouldEnter = !prevVisible[key];
    const shouldFlip =
      !shouldEnter && shouldAnimateFlip(prevEntry?.center, targetCenter);

    let deltaX: number | undefined;
    if (shouldFlip) {
      let visualCenter = prevEntry?.center ?? targetCenter;
      const rect = preClearRects[key];
      if (rect && trackLeft !== undefined) {
        visualCenter =
          (rect.left + rect.width / 2 - trackLeft) / layoutScale;
      }
      deltaX = visualCenter - targetCenter;
    }

    decisions[key] = {
      key,
      shouldHide: false,
      shouldEnter,
      shouldFlip,
      targetIndex,
      targetCenter,
      deltaX,
    };
    nextVisible[key] = true;
    nextMeta[key] = { idx: targetIndex, center: targetCenter };
  }

  return {
    decisions,
    nextVisible,
    nextMeta,
  };
}