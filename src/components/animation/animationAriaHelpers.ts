import type { MockDsuGraphViz } from "../../lib/mockTrace";
import type { ResolvedArrayPointers } from "../../lib/parseArrayPointers";
import { stripCaptionBackticks } from "../../lib/captionUtils";

/**
 * Builds an accessible label for bar-chart visualizations (insertion / selection).
 * Combines caption, pointer positions, and array length into a single string
 * consumable by `aria-label`.
 */
export function buildVizAriaLabel(
  caption: string,
  pointers: ResolvedArrayPointers,
  length: number,
  minIndex?: number
): string {
  const parts = [caption];
  if (pointers.i !== undefined) parts.push(`i at index ${pointers.i}`);
  if (pointers.j !== undefined) parts.push(`j at index ${pointers.j}`);
  if (pointers.jMinus1 !== undefined) {
    parts.push(`j minus 1 at index ${pointers.jMinus1}`);
  }
  if (typeof minIndex === "number" && minIndex >= 0) {
    parts.push(`min at index ${minIndex}`);
  }
  if (length > 0) {
    parts.push(`length ${length}, indices 0 to ${length - 1}`);
  }
  return parts.join(". ");
}

/** Builds an accessible label for DSU graph visualizations. */
export function buildDsuGraphAriaLabel(viz: MockDsuGraphViz): string {
  const active =
    viz.activeEdge !== undefined
      ? `Current union edge ${viz.activeEdge.from} to ${viz.activeEdge.to}. `
      : "";
  const idPart = viz.nodes.map((n) => `id[${n.id}]=${n.group}`).join(", ");
  const captionPlain = stripCaptionBackticks(viz.caption);
  return `${captionPlain}. ${active}${idPart}. ${viz.nodes.length} nodes, ${viz.edges.length} edges.`;
}
