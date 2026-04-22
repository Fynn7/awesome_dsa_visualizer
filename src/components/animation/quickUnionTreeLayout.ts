import {
  DSU_NODE_RADIUS_PX,
  DSU_SVG_VIEW_HEIGHT,
  DSU_SVG_VIEW_WIDTH,
  type DsuPoint,
} from "../../lib/dsuGraphLayout";

/**
 * Local compaction for unary vertical chains in quick-union tree layout.
 * Keep enough separation to avoid overlap while preventing overlong links.
 */
const QUICK_UNION_UNARY_TARGET_GAP_PX = DSU_NODE_RADIUS_PX * 3.1;
const QUICK_UNION_UNARY_MIN_GAP_PX = DSU_NODE_RADIUS_PX * 2.45;
const QUICK_UNION_TREE_HORIZONTAL_PADDING_PX = 26;
const QUICK_UNION_TREE_TOP_PADDING_PX = 38;
const QUICK_UNION_TREE_BOTTOM_PADDING_PX = 30;

/**
 * Computes tree-style x/y positions for Quick Union forest layout.
 * Accepts the parent-pointer `id[]` array and returns a map of
 * `node id -> { x, y }` in SVG user units. Pure — no React dependencies.
 */
export function buildQuickUnionTreePositions(
  values: readonly number[]
): Map<number, DsuPoint> {
  const n = values.length;
  const children = new Map<number, number[]>();
  const roots: number[] = [];
  for (let i = 0; i < n; i += 1) {
    children.set(i, []);
  }
  for (let i = 0; i < n; i += 1) {
    const parent = values[i]!;
    if (parent === i) {
      roots.push(i);
    } else {
      children.get(parent)?.push(i);
    }
  }
  roots.sort((a, b) => a - b);
  for (const entry of children.values()) {
    entry.sort((a, b) => a - b);
  }

  const subtreeWidth = new Map<number, number>();
  const depthMap = new Map<number, number>();
  let maxDepth = 0;
  const calcWidth = (node: number, depth: number): number => {
    depthMap.set(node, depth);
    if (depth > maxDepth) maxDepth = depth;
    const kids = children.get(node) ?? [];
    if (kids.length === 0) {
      subtreeWidth.set(node, 1);
      return 1;
    }
    let sum = 0;
    for (const kid of kids) {
      sum += calcWidth(kid, depth + 1);
    }
    const w = Math.max(1, sum);
    subtreeWidth.set(node, w);
    return w;
  };

  let totalUnits = 0;
  for (const root of roots) {
    totalUnits += calcWidth(root, 0);
  }
  const units = Math.max(totalUnits, 1);
  const padX = QUICK_UNION_TREE_HORIZONTAL_PADDING_PX;
  const usableW = DSU_SVG_VIEW_WIDTH - padX * 2;
  const unitW = usableW / units;

  const depthLevels = Math.max(maxDepth + 1, 1);
  const topY = QUICK_UNION_TREE_TOP_PADDING_PX;
  const bottomY = DSU_SVG_VIEW_HEIGHT - QUICK_UNION_TREE_BOTTOM_PADDING_PX;
  const levelGap = depthLevels === 1 ? 0 : (bottomY - topY) / (depthLevels - 1);
  const positions = new Map<number, DsuPoint>();

  const place = (node: number, startUnit: number) => {
    const kids = children.get(node) ?? [];
    const width = subtreeWidth.get(node) ?? 1;
    const centerUnit = startUnit + width / 2;
    const depth = depthMap.get(node) ?? 0;
    positions.set(node, {
      x: padX + centerUnit * unitW,
      y: topY + depth * levelGap,
    });
    let cursor = startUnit;
    for (const kid of kids) {
      const kidWidth = subtreeWidth.get(kid) ?? 1;
      place(kid, cursor);
      cursor += kidWidth;
    }
  };

  let cursor = 0;
  for (const root of roots) {
    const width = subtreeWidth.get(root) ?? 1;
    place(root, cursor);
    cursor += width;
  }

  const nextGap = Math.max(
    QUICK_UNION_UNARY_MIN_GAP_PX,
    QUICK_UNION_UNARY_TARGET_GAP_PX
  );
  // Iterate to convergence so unary-chain compaction is stable regardless of id order.
  for (let pass = 0; pass < n; pass += 1) {
    let changed = false;
    for (let parent = 0; parent < n; parent += 1) {
      const kids = children.get(parent) ?? [];
      if (kids.length !== 1) continue;
      const onlyChild = kids[0]!;
      const parentPos = positions.get(parent);
      const childPos = positions.get(onlyChild);
      if (!parentPos || !childPos) continue;
      const currentGap = childPos.y - parentPos.y;
      if (currentGap <= QUICK_UNION_UNARY_TARGET_GAP_PX) continue;
      const nextY = parentPos.y + nextGap;
      if (Math.abs(nextY - childPos.y) < 0.01) continue;
      positions.set(onlyChild, {
        x: childPos.x,
        y: nextY,
      });
      changed = true;
    }
    if (!changed) break;
  }

  return positions;
}
