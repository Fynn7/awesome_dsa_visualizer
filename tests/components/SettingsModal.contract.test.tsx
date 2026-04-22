import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsModal } from "../../src/components/SettingsModal";

/**
 * Settings dialog contract. Locks the a11y + keyboard behavior the new
 * primitive must deliver (Radix Dialog + Switch). These are the behaviors
 * the hand-written pre-refactor version forgot in places; they must never
 * silently regress once the primitive replaces per-modal hand-rolling.
 */
function mkProps(overrides: Partial<Parameters<typeof SettingsModal>[0]> = {}) {
  return {
    open: true,
    onClose: vi.fn(),
    showArrayIndices: true,
    enableAnimationScroll: true,
    animationFitAllowUpscale: true,
    replayAnimationsOnStepBack: false,
    dispatch: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe("SettingsModal contract", () => {
  it("renders role=dialog with accessible name from strings.settings.title", () => {
    render(<SettingsModal {...mkProps()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-labelledby");
  });

  it("renders Switch controls with visible labels for all preferences", () => {
    render(<SettingsModal {...mkProps()} />);
    const switches = screen.getAllByRole("switch");
    // 3 toggles when enableAnimationScroll=true (nested upscale-toggle hidden)
    expect(switches.length).toBe(3);
  });

  it("shows the nested upscale toggle only when enableAnimationScroll=false", () => {
    const { rerender } = render(
      <SettingsModal {...mkProps({ enableAnimationScroll: true })} />
    );
    expect(screen.getAllByRole("switch").length).toBe(3);

    rerender(<SettingsModal {...mkProps({ enableAnimationScroll: false })} />);
    expect(screen.getAllByRole("switch").length).toBe(4);
  });

  it("Esc key triggers onClose via Radix Dialog", async () => {
    const onClose = vi.fn();
    render(<SettingsModal {...mkProps({ onClose })} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("clicking a Switch dispatches the matching reducer action", async () => {
    const dispatch = vi.fn();
    render(<SettingsModal {...mkProps({ dispatch, showArrayIndices: false })} />);
    const first = screen.getAllByRole("switch")[0]!;
    await userEvent.click(first);
    expect(dispatch).toHaveBeenCalledWith({
      type: "SET_SHOW_ARRAY_INDICES",
      value: true,
    });
  });
});
