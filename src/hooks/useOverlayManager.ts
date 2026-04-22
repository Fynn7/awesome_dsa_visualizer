import { useContext } from "react";
import {
  OverlayContext,
  type OverlayContextValue,
} from "../providers/overlayContext";

/**
 * Consumer hook for the overlay coordination context established by
 * `OverlayProvider`. Throws if used outside a provider so bugs surface at
 * render time rather than as silent no-ops.
 */
export function useOverlayManager(): OverlayContextValue {
  const ctx = useContext(OverlayContext);
  if (!ctx) {
    throw new Error("useOverlayManager must be used inside <OverlayProvider>");
  }
  return ctx;
}
