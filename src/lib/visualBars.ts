export type VisualBar = {
  id: string;
  value: number;
};

type DeriveVisualBarsResult = {
  bars: VisualBar[];
  nextSeed: number;
};

/**
 * Preserve bar identity across steps so FLIP can animate movement instead of remounting.
 */
export function deriveVisualBars(
  prevBars: readonly VisualBar[],
  values: readonly number[],
  seed: number
): DeriveVisualBarsResult {
  let nextSeed = seed;
  const nextBars: VisualBar[] = new Array(values.length);
  const usedPrevIds = new Set<string>();

  // Pass 1: keep identity stable when same index keeps same value.
  for (let i = 0; i < values.length; i += 1) {
    const prevBarAtIndex = prevBars[i];
    if (!prevBarAtIndex) continue;
    const value = values[i]!;
    if (prevBarAtIndex.value !== value) continue;
    nextBars[i] = { id: prevBarAtIndex.id, value };
    usedPrevIds.add(prevBarAtIndex.id);
  }

  // Build remaining reusable ids by value (excluding already reserved ids).
  const reusableByValue = new Map<number, string[]>();
  for (const prevBar of prevBars) {
    if (usedPrevIds.has(prevBar.id)) continue;
    const queue = reusableByValue.get(prevBar.value);
    if (queue) {
      queue.push(prevBar.id);
    } else {
      reusableByValue.set(prevBar.value, [prevBar.id]);
    }
  }

  // Pass 2: reuse same-value ids from other indexes (for swap/shift), else mint.
  for (let i = 0; i < values.length; i += 1) {
    if (nextBars[i]) continue;
    const value = values[i]!;
    const queue = reusableByValue.get(value);
    if (queue && queue.length > 0) {
      nextBars[i] = { id: queue.shift()!, value };
      continue;
    }
    nextSeed += 1;
    nextBars[i] = { id: `bar-${nextSeed}`, value };
  }

  return { bars: nextBars, nextSeed };
}