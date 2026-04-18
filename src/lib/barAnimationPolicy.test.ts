import { describe, expect, it } from "vitest";

import {
  finishBarAssignAnimation,
  getBarAssignCleanupDelayMs,
  getBarHeightPercent,
  playBarAssignAnimation,
  playBarFlip,
  primeBarAssignAnimation,
  primeBarFlip,
  resetBarFlipStyles,
  shouldAnimateBarFlip,
} from "./barAnimationPolicy";

type StyleStub = {
  willChange: string;
  transition: string;
  transform: string;
  height: string;
  setProperty: (name: string, value: string) => void;
};

type ClassListStub = {
  add: (name: string) => void;
  remove: (name: string) => void;
  has: (name: string) => boolean;
};

type ElementStub = {
  style: StyleStub;
  classList: ClassListStub;
};

function createElementStub(): ElementStub {
  const classes = new Set<string>();
  return {
    style: {
      willChange: "",
      transition: "",
      transform: "",
      height: "",
      setProperty: () => {},
    },
    classList: {
      add: (name: string) => classes.add(name),
      remove: (name: string) => classes.delete(name),
      has: (name: string) => classes.has(name),
    },
  };
}

describe("barAnimationPolicy", () => {
  it("formats bar height as percentage", () => {
    expect(getBarHeightPercent(5, 10)).toBe("50%");
  });

  it("uses shared threshold for bar FLIP", () => {
    expect(shouldAnimateBarFlip(0.49)).toBe(false);
    expect(shouldAnimateBarFlip(0.5)).toBe(true);
  });

  it("primes and plays bar FLIP styles", () => {
    const el = createElementStub();

    primeBarFlip(el as unknown as HTMLElement, 12, 2);
    expect(el.style.transition).toBe("none");
    expect(el.style.transform).toBe("translateX(6px)");

    playBarFlip(el as unknown as HTMLElement, 300);
    expect(el.style.transition).toContain("transform 300ms");
    expect(el.style.transform).toBe("translateX(0)");

    resetBarFlipStyles(el as unknown as HTMLElement);
    expect(el.style.transition).toBe("");
    expect(el.style.transform).toBe("");
  });

  it("runs and finishes bar assign animation", () => {
    const el = createElementStub();

    primeBarAssignAnimation(el as unknown as HTMLElement, "25%", 450);
    expect(el.style.height).toBe("25%");
    expect(el.classList.has("viz-bar--assigning")).toBe(false);

    playBarAssignAnimation(el as unknown as HTMLElement, "60%", 450);
    expect(el.style.height).toBe("60%");
    expect(el.classList.has("viz-bar--assigning")).toBe(true);

    finishBarAssignAnimation(el as unknown as HTMLElement, "60%");
    expect(el.classList.has("viz-bar--assigning")).toBe(false);
    expect(el.style.transition).toBe("");
  });

  it("uses cleanup buffer after assign transition", () => {
    expect(getBarAssignCleanupDelayMs(500)).toBe(620);
  });
});
