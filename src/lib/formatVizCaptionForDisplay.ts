/** Matches insertion-sort compare step in mock traces. */
export const COMPARE_J_MARKED = "Compare `arr[j]` and `arr[j - 1]`";

export function formatVizCaptionForDisplay(
  caption: string,
  variables: Record<string, string>
): string {
  if (caption !== COMPARE_J_MARKED) return caption;
  const jRaw = variables["j"];
  if (jRaw === undefined || jRaw === "--") return caption;
  const j = Number.parseInt(jRaw, 10);
  if (!Number.isFinite(j) || j < 1) return caption;
  return `Compare \`arr[${j}]\` and \`arr[${j - 1}]\``;
}
