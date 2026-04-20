export type ResolvedLineAnchors<AnchorKey extends string> = Record<AnchorKey, number>;

export function resolveExactTextLine(
  source: string,
  expectedLineText: string,
  contextLabel: string
): number {
  const lines = source.split("\n");
  const matchedIndexes: number[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i] === expectedLineText) {
      matchedIndexes.push(i + 1);
    }
  }
  if (matchedIndexes.length === 1) {
    return matchedIndexes[0]!;
  }
  if (matchedIndexes.length === 0) {
    throw new Error(
      `[line-anchors] Missing exact anchor "${contextLabel}" => "${expectedLineText}"`
    );
  }
  throw new Error(
    `[line-anchors] Anchor "${contextLabel}" is ambiguous (${matchedIndexes.length} matches) => "${expectedLineText}"`
  );
}

export function resolveSourceLineAnchors<AnchorKey extends string>(
  source: string,
  sourceLabel: string,
  anchorDefs: Record<AnchorKey, string>
): ResolvedLineAnchors<AnchorKey> {
  const resolved = {} as ResolvedLineAnchors<AnchorKey>;
  const keys = Object.keys(anchorDefs) as AnchorKey[];
  for (const key of keys) {
    resolved[key] = resolveExactTextLine(
      source,
      anchorDefs[key],
      `${sourceLabel}.${key}`
    );
  }
  return resolved;
}

export function resolveLineOffset(
  baseLine: number,
  offset: number,
  contextLabel: string
): number {
  const line = baseLine + offset;
  if (line < 1) {
    throw new Error(
      `[line-anchors] Invalid line offset for "${contextLabel}": ${baseLine} + ${offset} < 1`
    );
  }
  return line;
}
