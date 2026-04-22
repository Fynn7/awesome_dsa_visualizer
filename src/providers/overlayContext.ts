import { createContext } from "react";

/** Identifiers for modal / overlay surfaces coordinated by `OverlayProvider`. */
export type OverlayId = "commandPalette" | "settings" | "help";

export type OverlayContextValue = {
  openId: OverlayId | null;
  isOpen: (id: OverlayId) => boolean;
  /** Opens the overlay and records the current focused element for restoration. */
  open: (id: OverlayId) => void;
  /** Closes the currently open overlay (if matching) and restores focus. */
  close: (id: OverlayId) => void;
  /** Toggles an overlay (used by keyboard shortcuts). */
  toggle: (id: OverlayId) => void;
  /**
   * Registers a DOM element (typically a trigger button) whose focus should be
   * restored when the matching overlay closes. Pass `null` to clear.
   */
  registerTrigger: (id: OverlayId, el: HTMLElement | null) => void;
};

export const OverlayContext = createContext<OverlayContextValue | null>(null);
