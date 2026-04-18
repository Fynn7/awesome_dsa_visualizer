import { describe, expect, it } from "vitest";

import {
  applyPointerEnterAnimation,
  clearPointerEnterAnimation,
  clearPointerExiting,
  getPointerEnterCleanupDelayMs,
  getPointerEnterDurationMs,
  markPointerExiting,
  setPointerAnimationDuration,
} from "./pointerLifecycleAnimation";

type StyleStub = {
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
  offsetHeight: number;
};

function createElementStub() {
  const classes = new Set<string>();
  const cssVars = new Map<string, string>();
  const element: ElementStub = {
    style: {
      setProperty: (name: string, value: string) => {
        cssVars.set(name, value);
      },
    },
    classList: {
      add: (name: string) => classes.add(name),
      remove: (name: string) => classes.delete(name),
      has: (name: string) => classes.has(name),
    },
    offsetHeight: 0,
  };
  return { element, classes, cssVars };
}

describe("pointerLifecycleAnimation", () => {
  it("derives enter duration from flip duration with clamp", () => {
    expect(getPointerEnterDurationMs(100)).toBe(120);
    expect(getPointerEnterDurationMs(1000)).toBe(400);
    expect(getPointerEnterDurationMs(2000)).toBe(480);
  });

  it("computes enter cleanup delay with buffer", () => {
    expect(getPointerEnterCleanupDelayMs(320)).toBe(440);
  });

  it("applies pointer enter animation class and duration css var", () => {
    const { element, classes, cssVars } = createElementStub();

    applyPointerEnterAnimation(element as unknown as HTMLElement, 360);

    expect(classes.has("viz-pointer--entering")).toBe(true);
    expect(cssVars.get("--viz-pointer-enter-duration")).toBe("360ms");
  });

  it("marks and clears pointer exiting class", () => {
    const { element, classes } = createElementStub();

    markPointerExiting(element as unknown as HTMLElement);
    expect(classes.has("viz-pointer--exiting")).toBe(true);

    clearPointerExiting(element as unknown as HTMLElement);
    expect(classes.has("viz-pointer--exiting")).toBe(false);
  });

  it("can clear enter class and set animation duration directly", () => {
    const { element, classes, cssVars } = createElementStub();

    applyPointerEnterAnimation(element as unknown as HTMLElement, 240);
    clearPointerEnterAnimation(element as unknown as HTMLElement);
    setPointerAnimationDuration(element as unknown as HTMLElement, 180);

    expect(classes.has("viz-pointer--entering")).toBe(false);
    expect(cssVars.get("--viz-pointer-enter-duration")).toBe("180ms");
  });
});
