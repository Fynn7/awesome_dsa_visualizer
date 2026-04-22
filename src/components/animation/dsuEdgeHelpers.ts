/**
 * Pure helpers for DSU edge presentation: class name selection, stable ref
 * keys, and node group color-class mapping.
 * Extracted from AnimationPanel to keep the orchestrator thin and make these
 * decisions unit-testable.
 */

export function dsuEdgeClassName(
  forceUniform: boolean,
  isActive: boolean,
  isLong: boolean,
  emphasizeActiveEdge: boolean,
  extraClass?: string
): string {
  let base: string;
  if (forceUniform) {
    base = "viz-dsu-edge";
  } else if (emphasizeActiveEdge && isActive) {
    base = "viz-dsu-edge viz-dsu-edge--active";
  } else if (isLong) {
    base = "viz-dsu-edge viz-dsu-edge--muted";
  } else {
    base = "viz-dsu-edge";
  }
  return extraClass ? `${base} ${extraClass}` : base;
}

/** Key for diffing edges between steps; must match activeEdge key format. */
export function dsuEdgeKey(edge: { from: number; to: number }): string {
  return `${edge.from}->${edge.to}`;
}

/** Stable React / ref key for a Quick Union tree edge; child id is unique. */
export function quickUnionEdgeRefKey(edge: { from: number }): string {
  return `qu-edge-${edge.from}`;
}

/** Stable React / ref key for a Quick Find union edge. */
export function quickFindEdgeRefKey(edge: { from: number; to: number }): string {
  return `qf-edge-${edge.from}-${edge.to}`;
}

/**
 * Maps a DSU group id to one of 10 palette slots (`viz-dsu-node--group-N`).
 * Negative group ids wrap via double-modulo to stay in range.
 */
export function dsuGroupClass(group: number): string {
  const paletteSlots = 10;
  const normalized = ((group % paletteSlots) + paletteSlots) % paletteSlots;
  return `viz-dsu-node--group-${normalized}`;
}
