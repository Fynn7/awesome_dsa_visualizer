import type { DsuGraphNode } from "../../lib/mockTrace";
import { getDsuNodePosition, type DsuPoint } from "../../lib/dsuGraphLayout";
import type { DsuNodeSlotRefCallback } from "./types";

/**
 * Single DSU node rendered at an absolute position inside `.viz-dsu-graph`.
 * Owns the node circle + current-group color, the optional highlight /
 * pre-union / scan / trace animation classes, and the `id[i]` value label
 * (incoming + outgoing pair on group changes for the crossfade effect).
 *
 * Stateless and pure — all animation effects are driven from the orchestrator
 * via class toggles and the shared `numberFlipKey` that remounts the idval
 * spans so CSS keyframes restart.
 */
export type DsuNodeSlotProps = {
  node: DsuGraphNode;
  active: boolean;
  preUnionPulse: boolean;
  scanCue: boolean;
  traceCue: boolean;
  groupClass: string;
  position?: DsuPoint;
  /**
   * When the id[i] value changed between steps and animations should play,
   * we render an "outgoing" previous-value label alongside the new one so
   * they crossfade. When undefined, only the current value is rendered.
   */
  previousGroup?: number;
  /** Key to remount the idval spans per step so the keyframes restart. */
  numberFlipKey: string;
  slotRefCallback?: DsuNodeSlotRefCallback;
};

export function DsuNodeSlot({
  node,
  active,
  preUnionPulse,
  scanCue,
  traceCue,
  groupClass,
  position,
  previousGroup,
  numberFlipKey,
  slotRefCallback,
}: DsuNodeSlotProps) {
  const pos = position ?? getDsuNodePosition(node.id);
  const showOutgoing =
    previousGroup !== undefined && previousGroup !== node.group;
  return (
    <div
      className="viz-dsu-node-slot"
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      ref={(el) => slotRefCallback?.(node.id, el)}
    >
      <div
        className={`viz-dsu-node ${groupClass}${active ? " viz-dsu-node--active" : ""}${
          preUnionPulse ? " viz-dsu-node--pre-union-pulse" : ""
        }${scanCue ? " viz-dsu-node--scan" : ""}${
          traceCue ? " viz-dsu-node--trace" : ""
        }`}
      >
        {node.id}
      </div>
      {showOutgoing ? (
        <span
          key={`${numberFlipKey}-out`}
          className="viz-dsu-node-idval viz-dsu-node-idval--outgoing"
          aria-hidden
        >
          {previousGroup}
        </span>
      ) : null}
      <span
        key={`${numberFlipKey}-in`}
        className={`viz-dsu-node-idval${showOutgoing ? " viz-dsu-node-idval--incoming" : ""}`}
        aria-hidden
      >
        {node.group}
      </span>
    </div>
  );
}
