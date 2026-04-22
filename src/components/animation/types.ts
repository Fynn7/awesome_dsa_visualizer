import type { DsuGraphNode, DsuGraphEdge } from "../../lib/mockTrace";

/** Ref registration callback for DSU node slot elements. */
export type DsuNodeSlotRefCallback = (
  nodeId: number,
  el: HTMLDivElement | null
) => void;

/**
 * Registers a DSU edge `<line>` element by its stable key with the animation
 * driver (see `dsuTreeAnimation.ts`). The driver writes endpoint attributes
 * during the unified interpolation loop.
 */
export type DsuEdgeRefCallback = (
  key: string,
  el: SVGLineElement | null
) => void;

/**
 * Render-time view of a DSU graph. Deliberately trimmed from `MockDsuGraphViz`
 * to the fields the pure renderer needs, so view components cannot reach
 * into step semantics (caption, transition kind, etc.) that belong to the
 * orchestrator layer.
 */
export type DsuGraphRenderModel = {
  nodes: readonly DsuGraphNode[];
  edges: readonly DsuGraphEdge[];
  uniformEdgeColor?: boolean;
  activeEdge?: DsuGraphEdge;
  highlightIndices?: readonly number[];
};
