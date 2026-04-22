import {
  buildDsuOrthogonalPolylinePoints,
  dsuRow0LaneIndex,
  dsuRow1LongEdgeGutterY,
  dsuEdgeEuclideanLength,
  dsuPointsToSmoothPathD,
  DSU_LONG_EDGE_THRESHOLD_PX,
  DSU_NODE_RADIUS_PX,
  DSU_SVG_VIEW_HEIGHT,
  DSU_SVG_VIEW_WIDTH,
  getDsuNodePosition,
  pointOnCircleToward,
  type DsuPoint,
} from "../../lib/dsuGraphLayout";
import { DsuNodeSlot } from "./DsuNodeSlot";
import {
  dsuEdgeClassName,
  dsuEdgeKey,
  dsuGroupClass,
  quickFindEdgeRefKey,
  quickUnionEdgeRefKey,
} from "./dsuEdgeHelpers";
import type {
  DsuEdgeRefCallback,
  DsuGraphRenderModel,
  DsuNodeSlotRefCallback,
} from "./types";

/**
 * DSU graph view — renders both the edge SVG layer and the node slot layer.
 * Supports two layout modes:
 *   - Quick Find / default row layout (uses row gutter routing via polylines).
 *   - Quick Union tree layout (uses straight `<line>` elements whose endpoints
 *     are rewritten per frame by `dsuTreeAnimation.ts`).
 *
 * All animation state (new edges, active edge entering, scan / trace cues,
 * previous group map) is injected from the orchestrator; this component is
 * a pure view.
 */
export type DsuGraphProps = {
  viz: DsuGraphRenderModel;
  nodePositions?: Map<number, DsuPoint> | null;
  showConnections: boolean;
  useQuickUnionTreeLayout: boolean;
  emphasizeActiveEdge: boolean;
  preUnionPulse: boolean;
  shouldPlay: boolean;
  newEdgeKeys?: ReadonlySet<string>;
  activeEdgeEntering?: boolean;
  traceEdgeKeys?: ReadonlySet<string>;
  scanNodeIds?: ReadonlySet<number>;
  traceNodeIds?: ReadonlySet<number>;
  previousGroupById?: ReadonlyMap<number, number> | null;
  numberFlipKey: string;
  slotRefCallback?: DsuNodeSlotRefCallback;
  edgeRefCallback?: DsuEdgeRefCallback;
};

export function DsuGraph({
  viz,
  nodePositions,
  showConnections,
  useQuickUnionTreeLayout,
  emphasizeActiveEdge,
  preUnionPulse,
  shouldPlay,
  newEdgeKeys,
  activeEdgeEntering,
  traceEdgeKeys,
  scanNodeIds,
  traceNodeIds,
  previousGroupById,
  numberFlipKey,
  slotRefCallback,
  edgeRefCallback,
}: DsuGraphProps) {
  const highlightedNodeIds = new Set(viz.highlightIndices ?? []);
  return (
    <>
      {showConnections ? (
        <svg
          className="viz-dsu-edges"
          viewBox={`0 0 ${DSU_SVG_VIEW_WIDTH} ${DSU_SVG_VIEW_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          {viz.edges.map((edge, idx) => {
            const fromPos =
              nodePositions?.get(edge.from) ?? getDsuNodePosition(edge.from);
            const toPos =
              nodePositions?.get(edge.to) ?? getDsuNodePosition(edge.to);
            const isActive =
              viz.activeEdge?.from === edge.from &&
              viz.activeEdge?.to === edge.to;
            const isLong =
              dsuEdgeEuclideanLength(edge.from, edge.to) >
              DSU_LONG_EDGE_THRESHOLD_PX;
            const forceUniform = viz.uniformEdgeColor === true;
            const edgeKeyStr = dsuEdgeKey(edge);
            const isNew =
              shouldPlay &&
              newEdgeKeys !== undefined &&
              newEdgeKeys.has(edgeKeyStr);
            const isActiveEnter =
              shouldPlay && activeEdgeEntering === true && isActive;
            const isTrace =
              shouldPlay &&
              traceEdgeKeys !== undefined &&
              traceEdgeKeys.has(edgeKeyStr);
            if (useQuickUnionTreeLayout) {
              // Direction contract (also enforced by dsuTreeAnimation): x1/y1
              // lands on the parent (edge.to) circle, x2/y2 on the child
              // (edge.from) circle, so the stroke-dashoffset draw-in reveals
              // the line from parent toward child.
              const parentSide = pointOnCircleToward(
                toPos,
                fromPos,
                DSU_NODE_RADIUS_PX
              );
              const childSide = pointOnCircleToward(
                fromPos,
                toPos,
                DSU_NODE_RADIUS_PX
              );
              const refKey = quickUnionEdgeRefKey(edge);
              return (
                <line
                  key={refKey}
                  ref={(el) => edgeRefCallback?.(refKey, el)}
                  x1={parentSide.x}
                  y1={parentSide.y}
                  x2={childSide.x}
                  y2={childSide.y}
                  pathLength={1}
                  className={dsuEdgeClassName(
                    forceUniform,
                    isActive,
                    isLong,
                    emphasizeActiveEdge,
                    "viz-dsu-edge--qu-tree"
                  )}
                  data-edge-new={isNew ? "true" : undefined}
                  data-edge-active-enter={isActiveEnter ? "true" : undefined}
                  data-edge-trace={isTrace ? "true" : undefined}
                />
              );
            }
            // Quick Find <path>: reverse polyline arg order so the path's M
            // start point lands at edge.to (the q-side / receiver) and its
            // tail ends at edge.from (the p-side / joiner). stroke-dashoffset
            // 1 -> 0 then reveals the stroke from q toward p.
            const points = buildDsuOrthogonalPolylinePoints(
              edge.to,
              edge.from,
              undefined,
              {
                row0LaneIndex: dsuRow0LaneIndex(viz.edges, idx),
                row1LongEdgeGutterY: dsuRow1LongEdgeGutterY(viz.edges, idx),
              }
            );
            return (
              <path
                key={quickFindEdgeRefKey(edge)}
                d={dsuPointsToSmoothPathD(points)}
                fill="none"
                pathLength={1}
                className={dsuEdgeClassName(
                  forceUniform,
                  isActive,
                  isLong,
                  emphasizeActiveEdge
                )}
                data-edge-new={isNew ? "true" : undefined}
                data-edge-active-enter={isActiveEnter ? "true" : undefined}
                data-edge-trace={isTrace ? "true" : undefined}
              />
            );
          })}
        </svg>
      ) : null}
      {viz.nodes.map((node) => {
        const isHighlighted = highlightedNodeIds.has(node.id);
        const prevGroup = shouldPlay
          ? previousGroupById?.get(node.id)
          : undefined;
        return (
          <DsuNodeSlot
            key={node.id}
            node={node}
            active={isHighlighted}
            preUnionPulse={preUnionPulse && isHighlighted}
            scanCue={
              shouldPlay &&
              scanNodeIds !== undefined &&
              scanNodeIds.has(node.id)
            }
            traceCue={
              shouldPlay &&
              traceNodeIds !== undefined &&
              traceNodeIds.has(node.id)
            }
            groupClass={dsuGroupClass(node.group)}
            position={nodePositions?.get(node.id)}
            previousGroup={prevGroup}
            numberFlipKey={numberFlipKey}
            slotRefCallback={slotRefCallback}
          />
        );
      })}
    </>
  );
}
