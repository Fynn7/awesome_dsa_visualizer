import { describe, expect, it, vi } from "vitest";
import {
  schedulePointerPlayback,
  shouldAnimatePointerFlip,
} from "./pointerAnimationScheduler";
import { POINTER_MOVE_MIN_DELTA_PX } from "./pointerMoveAnimation";

describe("pointerAnimationScheduler", () => {
  it("starts flip first and enter in same frame window", () => {
    const order: string[] = [];
    let scheduled: (time: number) => void = () => {};

    const frameId = schedulePointerPlayback({
      hasFlip: true,
      hasEnter: true,
      scheduleFrame: (cb: FrameRequestCallback) => {
        scheduled = cb;
        return 7;
      },
      startFlip: () => {
        order.push("flip");
      },
      playEnter: () => {
        order.push("enter");
      },
    });

    expect(frameId).toBe(7);
    expect(order).toEqual([]);
    scheduled(0);
    expect(order).toEqual(["flip", "enter"]);
  });

  it("plays enter immediately when there is no flip", () => {
    const order: string[] = [];
    const scheduleFrame = vi.fn(() => 1);

    const frameId = schedulePointerPlayback({
      hasFlip: false,
      hasEnter: true,
      scheduleFrame,
      startFlip: () => {
        order.push("flip");
      },
      playEnter: () => {
        order.push("enter");
      },
    });

    expect(frameId).toBeNull();
    expect(scheduleFrame).not.toHaveBeenCalled();
    expect(order).toEqual(["enter"]);
  });

  it("animates pointer flip even when index does not change", () => {
    expect(
      shouldAnimatePointerFlip(200, 200 + POINTER_MOVE_MIN_DELTA_PX)
    ).toBe(true);
  });

  it("does not animate tiny pointer offset jitter", () => {
    expect(
      shouldAnimatePointerFlip(200, 200 + POINTER_MOVE_MIN_DELTA_PX - 0.01)
    ).toBe(false);
  });
});
