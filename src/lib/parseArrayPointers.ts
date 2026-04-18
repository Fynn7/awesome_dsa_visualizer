import type { MockVizModel } from "./mockTrace";

/** Non-negative integer string only (excludes "-1", "--", decimals). */
const NON_NEG_INT = /^\d+$/;

/** Parsed index in `0..len-1` from a variables cell (e.g. `i`, `j`). */
export function parseNonNegativeIndex(
  raw: string | undefined,
  len: number
): number | undefined {
  if (raw === undefined) return undefined;
  if (!NON_NEG_INT.test(raw)) return undefined;
  const n = Number(raw);
  if (n >= 0 && n < len) return n;
  return undefined;
}

/** Read loop indices `i` and `j` from a step's variables table for bar visualization. */
export function parseArrayPointers(
  variables: Record<string, string>,
  valuesLength: number
): { i?: number; j?: number } {
  const out: { i?: number; j?: number } = {};
  const pi = parseNonNegativeIndex(variables.i, valuesLength);
  const pj = parseNonNegativeIndex(variables.j, valuesLength);
  if (pi !== undefined) out.i = pi;
  if (pj !== undefined) out.j = pj;
  return out;
}

export type ResolvedArrayPointers = {
  i?: number;
  j?: number;
  /** Insertion sort only: j and j-1 both highlighted (compare / exch). */
  jMinus1?: number;
};

/**
 * Resolves i/j and optional j-1 overlay positions.
 * `inferJMinus1FromHighlights` must be true only for insertion sort: other algorithms
 * may highlight j with an unrelated adjacent index (e.g. selection sort min_idx next to j).
 */
export function resolveArrayPointers(
  variables: Record<string, string>,
  viz: Pick<MockVizModel, "values" | "highlightIndices">,
  inferJMinus1FromHighlights: boolean
): ResolvedArrayPointers {
  const base = parseArrayPointers(variables, viz.values.length);
  const out: ResolvedArrayPointers = { ...base };
  const pj = base.j;
  if (
    inferJMinus1FromHighlights &&
    pj !== undefined &&
    pj >= 1 &&
    viz.highlightIndices.includes(pj) &&
    viz.highlightIndices.includes(pj - 1)
  ) {
    out.jMinus1 = pj - 1;
  }
  return out;
}

export type PointerOverlayCenters = {
  i?: number;
  j?: number;
  jMinus1?: number;
  /** Selection sort: `min` tracker column center in track coordinates. */
  min?: number;
};

type PtrKind = "i" | "j" | "jm1" | "min";

const ptrKindOrder: Record<PtrKind, number> = { i: 0, j: 1, jm1: 2, min: 3 };

/**
 * Spread horizontal offsets when multiple pointers share one column index.
 * @param minIndex Optional bar index for the selection-sort minimum overlay.
 */
export function layoutPointerOverlayCenters(
  pointers: ResolvedArrayPointers,
  colCenter: (idx: number) => number | undefined,
  gap: number,
  minIndex?: number
): PointerOverlayCenters {
  const entries: Array<{ kind: PtrKind; idx: number }> = [];
  if (typeof pointers.i === "number") entries.push({ kind: "i", idx: pointers.i });
  if (typeof pointers.j === "number") entries.push({ kind: "j", idx: pointers.j });
  if (typeof pointers.jMinus1 === "number") {
    entries.push({ kind: "jm1", idx: pointers.jMinus1 });
  }
  if (
    typeof minIndex === "number" &&
    minIndex >= 0 &&
    Number.isInteger(minIndex)
  ) {
    entries.push({ kind: "min", idx: minIndex });
  }

  const byIdx = new Map<number, PtrKind[]>();
  for (const { kind, idx } of entries) {
    const list = byIdx.get(idx);
    if (list) {
      list.push(kind);
    } else {
      byIdx.set(idx, [kind]);
    }
  }

  const offsetsForCount = (n: number): number[] => {
    if (n <= 1) return [0];
    if (n === 2) return [-gap, gap];
    const mid = (n - 1) / 2;
    return Array.from({ length: n }, (_, i) => (i - mid) * gap);
  };

  const out: PointerOverlayCenters = {};
  for (const [idx, kinds] of byIdx) {
    kinds.sort((a, b) => ptrKindOrder[a] - ptrKindOrder[b]);
    const c = colCenter(idx);
    if (c === undefined) continue;
    const offs = offsetsForCount(kinds.length);
    kinds.forEach((kind, i) => {
      const x = c + offs[i]!;
      if (kind === "i") out.i = x;
      else if (kind === "j") out.j = x;
      else if (kind === "jm1") out.jMinus1 = x;
      else out.min = x;
    });
  }

  return out;
}
