export const ARRAY_POINTER_KEYS = [
  "i",
  "j",
  "jMinus1",
  "min",
] as const;

export type PointerKey = (typeof ARRAY_POINTER_KEYS)[number];

export type PointerMetaEntry = {
  idx: number;
  center: number;
};

export type PointerMetaMap = Partial<
  Record<PointerKey, PointerMetaEntry>
>;

export type PointerVisibilityMap = Record<PointerKey, boolean>;

export function createPointerVisibilityMap(
  initialVisible = false
): PointerVisibilityMap {
  return {
    i: initialVisible,
    j: initialVisible,
    jMinus1: initialVisible,
    min: initialVisible,
  };
}