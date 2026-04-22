import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  OverlayContext,
  type OverlayContextValue,
  type OverlayId,
} from "./overlayContext";

/**
 * Central overlay coordination.
 *
 * Responsibilities (previously scattered across `App.tsx`):
 *   - Track which overlay is currently open (commandPalette / settings / help).
 *   - Record the triggering HTML element and restore focus to it on close.
 *   - Own the global keyboard shortcuts that open overlays:
 *       - `Ctrl+Shift+P` / `Cmd+Shift+P` — toggle command palette.
 *       - `?` — toggle keyboard help (suppressed while any overlay is open or
 *         while the focus is in an editable target).
 *   - Enforce mutual exclusion: opening one overlay closes the others.
 *
 * Presentation mode (native fullscreen vs in-app overlay) remains owned by
 * `App.tsx` because it drives DOM side effects on a specific ref and
 * interacts with `document.requestFullscreen`. Toasts are also managed
 * independently through the Radix Toast Provider.
 */

type TriggerRegistry = Partial<Record<OverlayId, HTMLElement | null>>;

/**
 * Returns true if the current keyboard event target is a text input or an
 * active Monaco editor — in either case we should not hijack the `?` key.
 */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("input, textarea, select, [contenteditable=true], .monaco-editor")
  );
}

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<OverlayId | null>(null);
  const triggerRegistry = useRef<TriggerRegistry>({});
  const lastOpenIdRef = useRef<OverlayId | null>(null);

  const registerTrigger = useCallback((id: OverlayId, el: HTMLElement | null) => {
    triggerRegistry.current[id] = el;
  }, []);

  const open = useCallback((id: OverlayId) => {
    setOpenId(id);
  }, []);

  const close = useCallback((id: OverlayId) => {
    setOpenId((current) => (current === id ? null : current));
  }, []);

  const toggle = useCallback((id: OverlayId) => {
    setOpenId((current) => (current === id ? null : id));
  }, []);

  const isOpen = useCallback(
    (id: OverlayId) => openId === id,
    [openId]
  );

  // Restore focus when an overlay closes.
  useEffect(() => {
    const previous = lastOpenIdRef.current;
    lastOpenIdRef.current = openId;
    if (previous !== null && openId === null) {
      const el = triggerRegistry.current[previous];
      if (el) {
        const raf = window.requestAnimationFrame(() => {
          el.focus();
        });
        return () => window.cancelAnimationFrame(raf);
      }
    }
    return undefined;
  }, [openId]);

  // Global shortcut: Ctrl+Shift+P / Cmd+Shift+P -> toggle command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || !e.shiftKey) return;
      if (e.key !== "P" && e.key !== "p" && e.code !== "KeyP") return;
      e.preventDefault();
      toggle("commandPalette");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  // Global shortcut: `?` -> toggle help (suppressed in editable fields / while another overlay is open).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "?") return;
      if (isEditableTarget(e.target)) return;
      if (openId !== null && openId !== "help") return;
      e.preventDefault();
      toggle("help");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId, toggle]);

  const value = useMemo<OverlayContextValue>(
    () => ({
      openId,
      isOpen,
      open,
      close,
      toggle,
      registerTrigger,
    }),
    [openId, isOpen, open, close, toggle, registerTrigger]
  );

  return (
    <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>
  );
}
