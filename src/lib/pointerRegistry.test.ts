import { describe, expect, it } from "vitest";

import {
  ARRAY_POINTER_KEYS,
  createPointerVisibilityMap,
} from "./pointerRegistry";

describe("pointerRegistry", () => {
  it("exports canonical pointer key order", () => {
    expect(ARRAY_POINTER_KEYS).toEqual([
      "i",
      "j",
      "jMinus1",
      "min",
    ]);
  });

  it("creates hidden visibility map by default", () => {
    expect(createPointerVisibilityMap()).toEqual({
      i: false,
      j: false,
      jMinus1: false,
      min: false,
    });
  });

  it("creates visible visibility map when requested", () => {
    expect(createPointerVisibilityMap(true)).toEqual({
      i: true,
      j: true,
      jMinus1: true,
      min: true,
    });
  });
});