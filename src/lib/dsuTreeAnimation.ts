/**
 * Quick Union tree step-transition animation driver.
 *
 * Single responsibility: given the previous and next node layout positions
 * for a Quick Union tree, drive a unified per-frame interpolation that
 * writes both:
 *   - Node slot `style.left` / `style.top` (absolute anchor positions), and
 *   - Edge `<line>` endpoint attributes `x1` / `y1` / `x2` / `y2`,
 * so nodes and their edges glide together in lock-step. This avoids the
 * timing mismatch of a two-pipeline design (CSS transform FLIP for nodes +
 * CSS attribute transition for edges).
 *
 * Direction contract for edges (consumed by the draw-in keyframe and the
 * resting visual alike): `x1,y1` is on the `edge.to` circle (the receiver /
 * parent side), `x2,y2` is on the `edge.from` circle (the joiner / child
 * side). The browser's native `stroke-dashoffset: 1 → 0` animation therefore
 * reveals the stroke starting from the parent side, matching user
 * expectations.
 */
import { pointOnCircleToward, type DsuPoint } from "./dsuGraphLayout";

export type { DsuPoint } from "./dsuGraphLayout";

export type DsuEdgeDescriptor = {
  /** Stable registry key that matches the <line> ref callback. */
  key: string;
  /** Child index in Quick Union tree semantics. */
  from: number;
  /** Parent index in Quick Union tree semantics. */
  to: number;
};

export type DsuTreeAnimationTargets = {
  nodeSlots: ReadonlyMap<number, HTMLElement>;
  edgeLines: ReadonlyMap<string, SVGLineElement>;
};

export type DsuTreeAnimationStep = {
  prevPositions: ReadonlyMap<number, DsuPoint>;
  nextPositions: ReadonlyMap<number, DsuPoint>;
  edges: readonly DsuEdgeDescriptor[];
  durationMs: number;
  nodeRadiusPx: number;
  /** Defaults to {@link easeOutEmphasized}. */
  ease?: (t: number) => number;
};

/**
 * Evaluate the CSS `cubic-bezier(x1, y1, x2, y2)` timing function at a given
 * input time. Uses Newton-Raphson on the x component to invert the bezier
 * parameter, then evaluates y at that parameter.
 */
function makeBezierEase(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): (t: number) => number {
  const bezier = (t: number, p1: number, p2: number): number => {
    const u = 1 - t;
    return 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t;
  };
  const bezierDeriv = (t: number, p1: number, p2: number): number => {
    const u = 1 - t;
    return 3 * u * u * p1 + 6 * u * t * (p2 - p1) + 3 * t * t * (1 - p2);
  };
  return (time: number) => {
    if (time <= 0) return 0;
    if (time >= 1) return 1;
    let t = time;
    for (let i = 0; i < 8; i += 1) {
      const x = bezier(t, x1, x2);
      const diff = x - time;
      if (Math.abs(diff) < 1e-6) break;
      const dx = bezierDeriv(t, x1, x2);
      if (Math.abs(dx) < 1e-9) break;
      t -= diff / dx;
      if (t < 0) t = 0;
      else if (t > 1) t = 1;
    }
    return bezier(t, y1, y2);
  };
}

/** Matches `--motion-easing-emphasized: cubic-bezier(0.22, 1, 0.36, 1)`. */
export const easeOutEmphasized: (t: number) => number = makeBezierEase(
  0.22,
  1,
  0.36,
  1
);

function clamp01(v: number): number {
  if (v <= 0) return 0;
  if (v >= 1) return 1;
  return v;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpPoint(a: DsuPoint, b: DsuPoint, t: number): DsuPoint {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

function writeNodeSlot(el: HTMLElement, pos: DsuPoint): void {
  el.style.left = `${pos.x}px`;
  el.style.top = `${pos.y}px`;
}

/**
 * Writes endpoint attributes on a <line> following the direction contract:
 * `x1,y1` lands on the parent (`edge.to`) circle, `x2,y2` on the child
 * (`edge.from`) circle. When either endpoint lacks a resolved position the
 * line is left untouched (the renderer is responsible for the fallback).
 */
function writeEdgeLine(
  line: SVGLineElement,
  fromPos: DsuPoint | undefined,
  toPos: DsuPoint | undefined,
  radiusPx: number
): void {
  if (!fromPos || !toPos) return;
  const parentSide = pointOnCircleToward(toPos, fromPos, radiusPx);
  const childSide = pointOnCircleToward(fromPos, toPos, radiusPx);
  line.setAttribute("x1", String(parentSide.x));
  line.setAttribute("y1", String(parentSide.y));
  line.setAttribute("x2", String(childSide.x));
  line.setAttribute("y2", String(childSide.y));
}

/**
 * Immediately writes the given positions to node slots and the corresponding
 * edge endpoints. Used for the `shouldPlay === false` path (Step Back snap,
 * initial mount, algorithm switch) and as the final frame of the animation.
 */
export function snapDsuTree(
  targets: DsuTreeAnimationTargets,
  positions: ReadonlyMap<number, DsuPoint>,
  edges: readonly DsuEdgeDescriptor[],
  nodeRadiusPx: number
): void {
  for (const [id, pos] of positions) {
    const el = targets.nodeSlots.get(id);
    if (!el) continue;
    writeNodeSlot(el, pos);
  }
  for (const edge of edges) {
    const line = targets.edgeLines.get(edge.key);
    if (!line) continue;
    writeEdgeLine(
      line,
      positions.get(edge.from),
      positions.get(edge.to),
      nodeRadiusPx
    );
  }
}

/**
 * Drives the animation from `prevPositions` to `nextPositions` over
 * `durationMs`. Returns a cancel handle that aborts the RAF loop;
 * callers should invoke it on unmount or when a new step supersedes
 * this one. When `durationMs <= 0` the targets snap to `nextPositions`
 * synchronously and the returned handle is a no-op.
 */
export function animateDsuTreeStep(
  targets: DsuTreeAnimationTargets,
  step: DsuTreeAnimationStep
): () => void {
  const ease = step.ease ?? easeOutEmphasized;
  if (step.durationMs <= 0) {
    snapDsuTree(
      targets,
      step.nextPositions,
      step.edges,
      step.nodeRadiusPx
    );
    return () => {};
  }

  let rafId: number | null = null;
  let cancelled = false;
  let start: number | null = null;

  const writeAt = (eased: number): void => {
    for (const id of step.nextPositions.keys()) {
      const el = targets.nodeSlots.get(id);
      if (!el) continue;
      const next = step.nextPositions.get(id)!;
      const prev = step.prevPositions.get(id) ?? next;
      writeNodeSlot(el, lerpPoint(prev, next, eased));
    }

    for (const edge of step.edges) {
      const line = targets.edgeLines.get(edge.key);
      if (!line) continue;
      const nextFrom = step.nextPositions.get(edge.from);
      const nextTo = step.nextPositions.get(edge.to);
      if (!nextFrom || !nextTo) continue;
      const prevFrom = step.prevPositions.get(edge.from) ?? nextFrom;
      const prevTo = step.prevPositions.get(edge.to) ?? nextTo;
      const fromNow = lerpPoint(prevFrom, nextFrom, eased);
      const toNow = lerpPoint(prevTo, nextTo, eased);
      writeEdgeLine(line, fromNow, toNow, step.nodeRadiusPx);
    }
  };

  // Synchronously paint the t=0 frame before React's committed NEW values
  // get a chance to render. Without this, there would be a 1-frame flash at
  // the target positions before the RAF loop primes the animation at the
  // previous positions.
  writeAt(ease(0));

  const tick = (nowMs: number) => {
    if (cancelled) return;
    if (start === null) start = nowMs;
    const t = clamp01((nowMs - start) / step.durationMs);
    writeAt(ease(t));

    if (t < 1) {
      rafId = requestAnimationFrame(tick);
    } else {
      // Ensure perfectly settled final values (avoids cumulative float drift).
      snapDsuTree(
        targets,
        step.nextPositions,
        step.edges,
        step.nodeRadiusPx
      );
      rafId = null;
    }
  };

  rafId = requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
}
