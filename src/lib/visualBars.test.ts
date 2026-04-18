import { describe, expect, it } from "vitest";

import {
  deriveVisualBars,
  type VisualBar,
} from "./visualBars";

describe("visualBars", () => {
  it("mints stable ids for initial render", () => {
    const { bars, nextSeed } = deriveVisualBars([], [4, 2, 3], 0);

    expect(bars.map((bar) => bar.id)).toEqual([
      "bar-1",
      "bar-2",
      "bar-3",
    ]);
    expect(bars.map((bar) => bar.value)).toEqual([4, 2, 3]);
    expect(nextSeed).toBe(3);
  });

  it("reuses ids when values stay at same index", () => {
    const prevBars: VisualBar[] = [
      { id: "bar-10", value: 1 },
      { id: "bar-11", value: 5 },
      { id: "bar-12", value: 9 },
    ];

    const { bars, nextSeed } = deriveVisualBars(prevBars, [1, 5, 9], 12);

    expect(bars.map((bar) => bar.id)).toEqual([
      "bar-10",
      "bar-11",
      "bar-12",
    ]);
    expect(nextSeed).toBe(12);
  });

  it("reuses same-value ids across indexes for swap/shift", () => {
    const prevBars: VisualBar[] = [
      { id: "bar-a", value: 1 },
      { id: "bar-b", value: 2 },
    ];

    const { bars, nextSeed } = deriveVisualBars(prevBars, [2, 1], 2);

    expect(bars.map((bar) => bar.id)).toEqual(["bar-b", "bar-a"]);
    expect(nextSeed).toBe(2);
  });
});