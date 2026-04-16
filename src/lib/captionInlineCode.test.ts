import { describe, expect, it } from "vitest";
import {
  splitCaptionByBackticks,
  stripCaptionBackticks,
} from "@visualizer-ui";

describe("captionInlineCode", () => {
  it("splits on backticks", () => {
    expect(splitCaptionByBackticks("a `x` b")).toEqual([
      { code: false, text: "a " },
      { code: true, text: "x" },
      { code: false, text: " b" },
    ]);
  });

  it("strips backticks for aria", () => {
    expect(stripCaptionBackticks("Compare `arr[1]` and `arr[0]`")).toBe(
      "Compare arr[1] and arr[0]"
    );
  });
});
