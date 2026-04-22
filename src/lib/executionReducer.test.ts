import { describe, expect, it } from "vitest";
import {
  createInitialState,
  executionReducer,
  type ExecutionState,
} from "./executionReducer";

/**
 * Drive enough STEP actions so step-oriented actions have a meaningful range
 * (needed because STEP_BACK is a no-op at stepIndex === 0).
 */
function advance(state: ExecutionState, steps: number): ExecutionState {
  let s = state;
  for (let i = 0; i < steps; i += 1) {
    s = executionReducer(s, { type: "STEP" });
  }
  return s;
}

describe("executionReducer step direction", () => {
  it("starts in the instant direction with replay disabled by default", () => {
    const s0 = createInitialState();
    expect(s0.lastStepDirection).toBe("instant");
    expect(s0.replayAnimationsOnStepBack).toBe(false);
  });

  it("createInitialState honors the replayAnimationsOnStepBack override", () => {
    const s0 = createInitialState({ replayAnimationsOnStepBack: true });
    expect(s0.replayAnimationsOnStepBack).toBe(true);
  });

  it("STEP sets direction to forward", () => {
    const s0 = createInitialState();
    const s1 = executionReducer(s0, { type: "STEP" });
    expect(s1.lastStepDirection).toBe("forward");
    expect(s1.stepIndex).toBe(1);
  });

  it("STEP_BACK sets direction to back (after advancing at least one step)", () => {
    const s0 = createInitialState();
    const s1 = executionReducer(s0, { type: "STEP" });
    const s2 = executionReducer(s1, { type: "STEP_BACK" });
    expect(s2.lastStepDirection).toBe("back");
    expect(s2.stepIndex).toBe(0);
  });

  it("RESET sets direction to instant", () => {
    const s0 = createInitialState();
    const advanced = advance(s0, 3);
    const reset = executionReducer(advanced, { type: "RESET" });
    expect(reset.lastStepDirection).toBe("instant");
    expect(reset.stepIndex).toBe(0);
  });

  it("JUMP_TO_END sets direction to instant", () => {
    const s0 = createInitialState();
    const jumped = executionReducer(s0, { type: "JUMP_TO_END" });
    expect(jumped.lastStepDirection).toBe("instant");
  });

  it("SET_ALGORITHM sets direction to instant", () => {
    const s0 = createInitialState();
    const advanced = advance(s0, 2);
    const switched = executionReducer(advanced, {
      type: "SET_ALGORITHM",
      algorithmId: "selection",
    });
    expect(switched.lastStepDirection).toBe("instant");
    expect(switched.algorithmId).toBe("selection");
  });

  it("TICK (during autoplay) sets direction to forward", () => {
    const s0 = createInitialState();
    const playing = executionReducer(s0, { type: "PLAY" });
    const ticked = executionReducer(playing, { type: "TICK" });
    expect(ticked.lastStepDirection).toBe("forward");
    expect(ticked.stepIndex).toBe(1);
  });

  it("STEP at the end of the trace does not flip direction (no-op)", () => {
    const s0 = createInitialState();
    const atEnd = executionReducer(s0, { type: "JUMP_TO_END" });
    const same = executionReducer(atEnd, { type: "STEP" });
    // STEP at end is a no-op; direction should remain "instant"
    // from the prior JUMP_TO_END.
    expect(same.lastStepDirection).toBe("instant");
    expect(same.stepIndex).toBe(atEnd.stepIndex);
  });

  it("STEP_BACK at the start of the trace does not flip direction (no-op)", () => {
    const s0 = createInitialState();
    const same = executionReducer(s0, { type: "STEP_BACK" });
    expect(same.lastStepDirection).toBe("instant");
    expect(same.stepIndex).toBe(0);
  });
});

describe("executionReducer replay toggle", () => {
  it("SET_REPLAY_ON_STEP_BACK flips the flag without touching step direction", () => {
    const s0 = createInitialState();
    const s1 = executionReducer(s0, { type: "STEP" });
    expect(s1.lastStepDirection).toBe("forward");

    const enabled = executionReducer(s1, {
      type: "SET_REPLAY_ON_STEP_BACK",
      value: true,
    });
    expect(enabled.replayAnimationsOnStepBack).toBe(true);
    expect(enabled.lastStepDirection).toBe("forward");

    const disabled = executionReducer(enabled, {
      type: "SET_REPLAY_ON_STEP_BACK",
      value: false,
    });
    expect(disabled.replayAnimationsOnStepBack).toBe(false);
  });
});
