import { describe, expect, it } from "vitest";

import {
  barClassNameForTone,
  barToneClassForTone,
  pointerToneClassForTone,
} from "./visualToneClassMap";

describe("visualToneClassMap", () => {
  it("maps tones to bar classes", () => {
    expect(barToneClassForTone("min")).toBe("viz-bar--min");
    expect(barToneClassForTone("key")).toBe("viz-bar--key");
    expect(barToneClassForTone("hl")).toBe("viz-bar--hl");
    expect(barToneClassForTone("sorted")).toBe("viz-bar--sorted");
    expect(barToneClassForTone("neutral")).toBe("");
  });

  it("maps tones to pointer classes", () => {
    expect(pointerToneClassForTone("min")).toBe("viz-pointer--toneMin");
    expect(pointerToneClassForTone("key")).toBe("viz-pointer--toneKey");
    expect(pointerToneClassForTone("hl")).toBe("viz-pointer--toneHl");
    expect(pointerToneClassForTone("sorted")).toBe("viz-pointer--toneSorted");
    expect(pointerToneClassForTone("neutral")).toBe("viz-pointer--toneNeutral");
  });

  it("builds bar class names from a base class", () => {
    expect(barClassNameForTone("viz-bar", "neutral")).toBe("viz-bar");
    expect(barClassNameForTone("viz-bar", "key")).toBe("viz-bar viz-bar--key");
  });
});
