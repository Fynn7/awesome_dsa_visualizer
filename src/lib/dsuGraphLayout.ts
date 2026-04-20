/**
 * DSU graph node layout and edge routing for the Animation panel.
 * Keypoints follow orthogonal detours (gutters) when a straight segment would
 * cross unrelated nodes; edges are drawn as SVG paths with small rounded corners
 * along that guide polyline (no long floating cubic tangents).
 */

/** Matches `.viz-dsu-graph` layout in AnimationPanel / CSS (viewBox coords). */
export const DSU_GRID_ORIGIN_X = 70;
export const DSU_GRID_ORIGIN_Y = 62;
export const DSU_COL_STEP = 84;
export const DSU_ROW_STEP = 112;

/** Horizontal channel between the two node rows (midline between row centers). */
export const DSU_ROW_GUTTER_Y = DSU_GRID_ORIGIN_Y + DSU_ROW_STEP / 2;

/** Y of node centers on the first row (index 0..4). */
export const DSU_ROW0_CENTER_Y = DSU_GRID_ORIGIN_Y;

/** Y of node centers on the second row (index 5..9). */
export const DSU_ROW1_CENTER_Y = DSU_GRID_ORIGIN_Y + DSU_ROW_STEP;

/**
 * Base Y for long same-row edges on row 0 (nodes 0–4): strictly between the top row centers
 * ({@link DSU_ROW0_CENTER_Y}) and the cross-row mid gutter ({@link DSU_ROW_GUTTER_Y}), so they
 * do not share the horizontal segment used by cross-row edges at y = {@link DSU_ROW_GUTTER_Y}
 * (e.g. 0–3 and 2–4 vs 0–9).
 */
export const DSU_ROW0_LONG_EDGE_BASE_Y = DSU_ROW_GUTTER_Y - 28;

/**
 * Base Y for long same-row edges on row 1 (nodes 5–9): between the cross-row mid gutter
 * ({@link DSU_ROW_GUTTER_Y}) and the top of row-1 circles, so they sit above the bottom row
 * and do not share the horizontal segment used by cross-row edges at y = {@link DSU_ROW_GUTTER_Y}.
 */
export const DSU_ROW1_LONG_EDGE_UPPER_BASE_Y = DSU_ROW_GUTTER_Y + 10;

/** Vertical spacing between stacked row-1 long-edge lanes (wider spans use a larger lane index). */
export const DSU_ROW1_LONG_EDGE_LANE_GAP = 14;

/**
 * When a shorter row-1 long edge appears together with a wider one (e.g. 5–7 vs 5–8), nudge the
 * shorter edge downward so it sits closer to the bottom row without changing the wider edge’s y.
 */
export const DSU_ROW1_LONG_EDGE_NARROW_NUDGE_PX = 1;

/** @deprecated Use {@link DSU_ROW1_LONG_EDGE_LANE_GAP}. */
export const DSU_BELOW_ROW_LANE_GAP = DSU_ROW1_LONG_EDGE_LANE_GAP;

/** SVG viewBox width/height (layout coords). */
export const DSU_SVG_VIEW_WIDTH = 480;
export const DSU_SVG_VIEW_HEIGHT = 256;

/** Half of `.viz-dsu-node` width/height (1.2rem); matches 16px root with viewBox coords. */
export const DSU_NODE_RADIUS_PX = 19.2;

/** Euclidean distance above which a non-active edge is visually de-emphasized. */
export const DSU_LONG_EDGE_THRESHOLD_PX = 130;

export function getDsuNodePosition(nodeId: number): { x: number; y: number } {
  const col = nodeId % 5;
  const row = Math.floor(nodeId / 5);
  return {
    x: DSU_GRID_ORIGIN_X + col * DSU_COL_STEP,
    y: DSU_GRID_ORIGIN_Y + row * DSU_ROW_STEP,
  };
}

export type DsuPoint = { x: number; y: number };

export type DsuGraphEdgeLike = { from: number; to: number };

/** True when this edge uses the auxiliary channel for long same-row pairs on row 0. */
export function usesDsuRow0LongGutterRoute(fromId: number, toId: number): boolean {
  const a = getDsuNodePosition(fromId);
  const b = getDsuNodePosition(toId);
  if (a.y !== b.y) return false;
  if (Math.abs(b.x - a.x) <= DSU_COL_STEP) return false;
  return a.y === DSU_ROW0_CENTER_Y && b.y === DSU_ROW0_CENTER_Y;
}

/** True when this edge uses the upper auxiliary channel for long same-row pairs on row 1. */
export function usesDsuBelowRow1GutterRoute(fromId: number, toId: number): boolean {
  const a = getDsuNodePosition(fromId);
  const b = getDsuNodePosition(toId);
  if (a.y !== b.y) return false;
  if (Math.abs(b.x - a.x) <= DSU_COL_STEP) return false;
  return a.y === DSU_ROW1_CENTER_Y && b.y === DSU_ROW1_CENTER_Y;
}

/**
 * Lane index for row-0 long same-row routes from horizontal span only (stable across steps).
 * Wider horizontal spans use a larger lane index (larger y, closer to the mid gutter) so edges
 * such as 0–3 and 2–4 do not overlap, and 0–3 keeps a fixed lane even when 2–4 appears/disappears.
 */
export function dsuRow0LaneIndex(
  edges: readonly DsuGraphEdgeLike[],
  edgeIndex: number
): number {
  const e = edges[edgeIndex];
  if (!e || !usesDsuRow0LongGutterRoute(e.from, e.to)) {
    return 0;
  }
  const spanCols = Math.round(
    Math.abs(getDsuNodePosition(e.to).x - getDsuNodePosition(e.from).x) /
      DSU_COL_STEP
  );
  return Math.max(0, spanCols - 2);
}

/**
 * Lane index for row-1 long same-row routes from horizontal span only (stable across steps).
 * Larger spans always use larger indices (larger y, closer to the bottom row), so 5–8 keeps a
 * fixed lane even when 5–7 appears/disappears in different trace frames.
 */
export function dsuBelowRow1LaneIndex(
  edges: readonly DsuGraphEdgeLike[],
  edgeIndex: number
): number {
  const e = edges[edgeIndex];
  if (!e || !usesDsuBelowRow1GutterRoute(e.from, e.to)) {
    return 0;
  }
  const spanCols = Math.round(
    Math.abs(getDsuNodePosition(e.to).x - getDsuNodePosition(e.from).x) /
      DSU_COL_STEP
  );
  // Keep the widest spans on the highest lane so 5–8 stays above 5–7 across steps.
  // With the current vertical budget between the mid gutter and row-1 circles, we support
  // two stable lanes: span=3 (e.g. 5–8) at lane 0, span=2 (e.g. 5–7) at lane 1.
  return Math.max(0, 4 - spanCols);
}

/**
 * Final horizontal gutter Y for a row-1 long same-row edge: lane stacking plus an optional nudge so
 * the narrower of two such edges (e.g. 5–7) sits lower while the wider one (e.g. 5–8) keeps its lane y.
 */
export function dsuRow1LongEdgeGutterY(
  edges: readonly DsuGraphEdgeLike[],
  edgeIndex: number
): number {
  const e = edges[edgeIndex];
  if (!e || !usesDsuBelowRow1GutterRoute(e.from, e.to)) {
    return DSU_ROW1_LONG_EDGE_UPPER_BASE_Y;
  }
  const lane = dsuBelowRow1LaneIndex(edges, edgeIndex);
  let y =
    DSU_ROW1_LONG_EDGE_UPPER_BASE_Y + lane * DSU_ROW1_LONG_EDGE_LANE_GAP;

  const mySpan = Math.abs(
    getDsuNodePosition(e.to).x - getDsuNodePosition(e.from).x
  );
  for (let i = 0; i < edges.length; i += 1) {
    if (i === edgeIndex) continue;
    const o = edges[i]!;
    if (!usesDsuBelowRow1GutterRoute(o.from, o.to)) continue;
    const ospan = Math.abs(
      getDsuNodePosition(o.to).x - getDsuNodePosition(o.from).x
    );
    if (ospan > mySpan) {
      y += DSU_ROW1_LONG_EDGE_NARROW_NUDGE_PX;
      break;
    }
  }
  return y;
}

function signNonZero(n: number): number {
  if (n === 0) return 0;
  return n > 0 ? 1 : -1;
}

/** Point where the ray `center → toward` meets the circle around `center` with given radius. */
function pointOnCircleToward(
  center: DsuPoint,
  toward: DsuPoint,
  radius: number
): DsuPoint {
  const vx = toward.x - center.x;
  const vy = toward.y - center.y;
  const len = Math.hypot(vx, vy);
  if (len < 1e-9) return center;
  return {
    x: center.x + (vx / len) * radius,
    y: center.y + (vy / len) * radius,
  };
}

/** Four-point orthogonal path with horizontal leg at `gutterY` between columns `a.x` and `b.x`. */
function buildGutterOrthogonalRoute(
  a: DsuPoint,
  b: DsuPoint,
  radius: number,
  gutterY: number
): DsuPoint[] {
  const g1: DsuPoint = { x: a.x, y: gutterY };
  const g2: DsuPoint = { x: b.x, y: gutterY };
  return [
    pointOnCircleToward(a, g1, radius),
    g1,
    g2,
    pointOnCircleToward(b, g2, radius),
  ];
}

export type DsuPolylineLayoutOpts = {
  /** Stacked lanes for top-row long edges; wider spans use larger indices (closer to the mid gutter). */
  row0LaneIndex?: number;
  /**
   * Final gutter Y for row-1 long same-row edges; from {@link dsuRow1LongEdgeGutterY}. When set,
   * overrides {@link belowRowLaneIndex} for that case.
   */
  row1LongEdgeGutterY?: number;
  /** Stacked lanes for bottom-row long edges; wider spans use larger indices (lower on screen). */
  belowRowLaneIndex?: number;
};

/**
 * Orthogonal polyline between node rims. Same row, adjacent columns: one horizontal
 * segment. Same row with columns farther apart, or cross-row: gutter route.
 * Same column: one vertical segment.
 */
export function buildDsuOrthogonalPolylinePoints(
  fromId: number,
  toId: number,
  radius: number = DSU_NODE_RADIUS_PX,
  opts?: DsuPolylineLayoutOpts
): DsuPoint[] {
  const a = getDsuNodePosition(fromId);
  const b = getDsuNodePosition(toId);
  const ax = a.x;
  const ay = a.y;
  const bx = b.x;
  const by = b.y;
  const dx = bx - ax;
  const dy = by - ay;

  if (dx === 0 && dy === 0) {
    return [a];
  }

  if (dy === 0) {
    const sx = signNonZero(dx);
    if (Math.abs(dx) > DSU_COL_STEP) {
      const laneR0 = opts?.row0LaneIndex ?? 0;
      const laneR1 = opts?.belowRowLaneIndex ?? 0;
      const gutterY =
        ay === DSU_ROW0_CENTER_Y && by === DSU_ROW0_CENTER_Y
          ? DSU_ROW0_LONG_EDGE_BASE_Y + laneR0 * DSU_ROW1_LONG_EDGE_LANE_GAP
          : ay === DSU_ROW1_CENTER_Y && by === DSU_ROW1_CENTER_Y
            ? opts?.row1LongEdgeGutterY ??
              DSU_ROW1_LONG_EDGE_UPPER_BASE_Y +
                laneR1 * DSU_ROW1_LONG_EDGE_LANE_GAP
            : DSU_ROW_GUTTER_Y;
      return buildGutterOrthogonalRoute(a, b, radius, gutterY);
    }
    return [
      { x: ax + sx * radius, y: ay },
      { x: bx - sx * radius, y: by },
    ];
  }

  if (dx === 0) {
    const sy = signNonZero(dy);
    return [
      { x: ax, y: ay + sy * radius },
      { x: bx, y: by - sy * radius },
    ];
  }

  return buildGutterOrthogonalRoute(a, b, radius, DSU_ROW_GUTTER_Y);
}

export function dsuPolylinePointsAttr(points: DsuPoint[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

/**
 * Corner rounding radius (viewBox px) when building {@link dsuPointsToSmoothPathD}.
 * Small so paths stay close to the orthogonal guide polyline (avoids “floaty” arcs).
 */
export const DSU_EDGE_CORNER_RADIUS_PX = 11;

/**
 * SVG path `d` that follows the polyline `points` with light rounding at interior corners
 * (quadratic bezels) and straight segments elsewhere — no long cardinal tangents.
 */
export function dsuPointsToSmoothPathD(points: readonly DsuPoint[]): string {
  const n = points.length;
  if (n === 0) {
    return "";
  }
  const first = points[0]!;
  if (n === 1) {
    return `M ${first.x} ${first.y}`;
  }
  if (n === 2) {
    const last = points[1]!;
    return `M ${first.x} ${first.y} L ${last.x} ${last.y}`;
  }

  const r = DSU_EDGE_CORNER_RADIUS_PX;
  let d = `M ${first.x} ${first.y}`;

  for (let i = 1; i < n - 1; i += 1) {
    const prev = points[i - 1]!;
    const corner = points[i]!;
    const next = points[i + 1]!;
    const vinx = corner.x - prev.x;
    const viny = corner.y - prev.y;
    const voutx = next.x - corner.x;
    const vouty = next.y - corner.y;
    const lenIn = Math.hypot(vinx, viny);
    const lenOut = Math.hypot(voutx, vouty);
    if (lenIn < 1e-6 || lenOut < 1e-6) {
      d += ` L ${corner.x} ${corner.y}`;
      continue;
    }
    const cross = vinx * vouty - viny * voutx;
    if (Math.abs(cross) < 1e-3 * lenIn * lenOut) {
      d += ` L ${corner.x} ${corner.y}`;
      continue;
    }
    const rin = Math.min(r, lenIn * 0.42);
    const rout = Math.min(r, lenOut * 0.42);
    const ax = corner.x - (vinx / lenIn) * rin;
    const ay = corner.y - (viny / lenIn) * rin;
    const bx = corner.x + (voutx / lenOut) * rout;
    const by = corner.y + (vouty / lenOut) * rout;
    d += ` L ${ax} ${ay} Q ${corner.x} ${corner.y} ${bx} ${by}`;
  }

  const last = points[n - 1]!;
  d += ` L ${last.x} ${last.y}`;
  return d;
}

export function dsuEdgeEuclideanLength(fromId: number, toId: number): number {
  const a = getDsuNodePosition(fromId);
  const b = getDsuNodePosition(toId);
  return Math.hypot(b.x - a.x, b.y - a.y);
}
