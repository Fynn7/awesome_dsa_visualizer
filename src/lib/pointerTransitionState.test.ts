import { describe, expect, it } from "vitest";
import {
  beginPointerExit,
  completePointerExit,
  createPointerTransitionMap,
  showPointer,
} from "./pointerTransitionState";

describe("pointerTransitionState", () => {
  it("shows pointer by mounting and clearing exiting", () => {
    const state = createPointerTransitionMap(["i"] as const);
    state.i.exiting = true;
    showPointer(state, "i");
    expect(state.i).toEqual({ mounted: true, exiting: false });
  });

  it("starts exit only for mounted pointers", () => {
    const state = createPointerTransitionMap(["i"] as const);
    expect(beginPointerExit(state, "i")).toBe(false);
    showPointer(state, "i");
    expect(beginPointerExit(state, "i")).toBe(true);
    expect(state.i).toEqual({ mounted: true, exiting: true });
  });

  it("does not restart an already running exit", () => {
    const state = createPointerTransitionMap(["i"] as const);
    showPointer(state, "i");
    expect(beginPointerExit(state, "i")).toBe(true);
    expect(beginPointerExit(state, "i")).toBe(false);
  });

  it("completes exit by unmounting pointer", () => {
    const state = createPointerTransitionMap(["i"] as const);
    showPointer(state, "i");
    beginPointerExit(state, "i");
    completePointerExit(state, "i");
    expect(state.i).toEqual({ mounted: false, exiting: false });
  });
});
