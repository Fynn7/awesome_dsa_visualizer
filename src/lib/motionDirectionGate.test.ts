import { describe, expect, it } from "vitest";
import { shouldPlayTransitions } from "./motionDirectionGate";

describe("shouldPlayTransitions", () => {
  it("plays on forward steps regardless of the replay toggle", () => {
    expect(shouldPlayTransitions("forward", false)).toBe(true);
    expect(shouldPlayTransitions("forward", true)).toBe(true);
  });

  it("snaps on backward steps when replay is disabled (default)", () => {
    expect(shouldPlayTransitions("back", false)).toBe(false);
  });

  it("plays on backward steps when replay is enabled", () => {
    expect(shouldPlayTransitions("back", true)).toBe(true);
  });

  it("never plays on instant transitions (reset / algorithm change / init)", () => {
    expect(shouldPlayTransitions("instant", false)).toBe(false);
    expect(shouldPlayTransitions("instant", true)).toBe(false);
  });
});
