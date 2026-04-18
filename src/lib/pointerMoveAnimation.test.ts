import { describe, expect, it } from "vitest";
import {
  POINTER_MOVE_EASING,
  playPointerMoveFlip,
  primePointerMoveFlip,
  settlePointerMoveAtRest,
} from "./pointerMoveAnimation";

type StyleStub = {
  willChange: string;
  transition: string;
  transform: string;
};

type ElementStub = {
  style: StyleStub;
};

function createElementStub(): ElementStub {
  return {
    style: {
      willChange: "",
      transition: "",
      transform: "",
    },
  };
}

describe("pointerMoveAnimation", () => {
  it("primes pointer FLIP from visual delta", () => {
    const el = createElementStub();

    primePointerMoveFlip(el as unknown as HTMLElement, 12.5);

    expect(el.style.willChange).toBe("transform");
    expect(el.style.transition).toBe("none");
    expect(el.style.transform).toBe("translate(calc(-50% + 12.5px), 0)");
  });

  it("plays pointer FLIP with shared easing", () => {
    const el = createElementStub();

    playPointerMoveFlip(el as unknown as HTMLElement, 360);

    expect(el.style.transition).toBe(
      `transform 360ms ${POINTER_MOVE_EASING}`
    );
    expect(el.style.transform).toBe("translate(-50%, 0)");
  });

  it("settles pointer styles at rest", () => {
    const el = createElementStub();

    primePointerMoveFlip(el as unknown as HTMLElement, 4);
    settlePointerMoveAtRest(el as unknown as HTMLElement);

    expect(el.style.willChange).toBe("");
    expect(el.style.transition).toBe("");
    expect(el.style.transform).toBe("translate(-50%, 0)");
  });
});
