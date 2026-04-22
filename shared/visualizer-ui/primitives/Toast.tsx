import * as RadixToast from "@radix-ui/react-toast";
import type { ReactNode } from "react";

/**
 * Toast primitive wrapping Radix Toast. Replaces the hand-written
 * `<div className="toast">` patterns in `App.tsx`. Dismissal semantics:
 * click / Escape / auto-timeout (default 6000 ms). Action slot supports
 * the current "Reset demo" button behavior.
 */
export type ToastProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Main status message. */
  children: ReactNode;
  /** Optional action row rendered after the message (e.g. "Reset demo"). */
  action?: ReactNode;
  /** Auto-dismiss duration in ms. Defaults to 6000. */
  durationMs?: number;
};

/**
 * Toast provider for the whole app. Must wrap the React tree once near the
 * root so all Toast components can render into the shared viewport.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <RadixToast.Provider swipeDirection="down" duration={6000}>
      {children}
      <RadixToast.Viewport className="ui-toast-viewport" />
    </RadixToast.Provider>
  );
}

export function Toast({
  open,
  onOpenChange,
  children,
  action,
  durationMs,
}: ToastProps) {
  return (
    <RadixToast.Root
      open={open}
      onOpenChange={onOpenChange}
      className="ui-toast"
      duration={durationMs}
    >
      <RadixToast.Description asChild>
        <div className="ui-toast-row">
          <span>{children}</span>
          {action ? <div className="ui-toast-actions">{action}</div> : null}
        </div>
      </RadixToast.Description>
    </RadixToast.Root>
  );
}
