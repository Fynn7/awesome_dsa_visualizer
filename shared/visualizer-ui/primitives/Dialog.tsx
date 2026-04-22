import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

/**
 * Dialog primitive wrapping Radix Dialog. Provides a consistent modal shell
 * with focus trap, scroll lock, Esc-to-close, and backdrop dismiss — replaces
 * the hand-written backdrop + focusTrap combinations in `SettingsModal`,
 * `KeyboardHelpModal`, and `CommandPalette`.
 *
 * Variants:
 *   - `centered` (default): small centered dialog for settings / confirmation.
 *   - `command`: top-anchored narrow panel for command palette style UIs.
 */
export type DialogVariant = "centered" | "command";

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Visible title rendered at the top of the dialog head. */
  title: ReactNode;
  /** Provide when the title should be visible to sighted users; if omitted, title is screen-reader-only. */
  visibleTitle?: boolean;
  /** Optional description, read after title by screen readers. */
  description?: ReactNode;
  /** Rendered inside the dialog body slot. */
  children: ReactNode;
  /** Optional right-side adornment in the dialog head (e.g. close button). */
  headActions?: ReactNode;
  variant?: DialogVariant;
  /** Additional class applied to the dialog panel (size overrides etc.). */
  className?: string;
  /** If true (default), renders the built-in close (X) button. */
  showCloseButton?: boolean;
  closeAriaLabel?: string;
};

const VARIANT_OVERLAY_CLASS: Record<DialogVariant, string> = {
  centered: "ui-dialog-overlay ui-dialog-overlay--centered",
  command: "ui-dialog-overlay ui-dialog-overlay--command",
};

const VARIANT_PANEL_CLASS: Record<DialogVariant, string> = {
  centered: "ui-dialog-panel ui-dialog-panel--centered",
  command: "ui-dialog-panel ui-dialog-panel--command",
};

export function Dialog({
  open,
  onOpenChange,
  title,
  visibleTitle = true,
  description,
  children,
  headActions,
  variant = "centered",
  className,
  showCloseButton = true,
  closeAriaLabel,
}: DialogProps) {
  const panelClass = [VARIANT_PANEL_CLASS[variant], className ?? ""]
    .filter(Boolean)
    .join(" ");
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={VARIANT_OVERLAY_CLASS[variant]} />
        <RadixDialog.Content className={panelClass}>
          {(visibleTitle || headActions || showCloseButton) && (
            <div className="ui-dialog-head">
              {visibleTitle ? (
                <RadixDialog.Title className="ui-dialog-title">
                  {title}
                </RadixDialog.Title>
              ) : (
                <RadixDialog.Title className="sr-only">{title}</RadixDialog.Title>
              )}
              <div className="ui-dialog-head-actions">
                {headActions}
                {showCloseButton ? (
                  <RadixDialog.Close
                    className="btn btn-icon ui-dialog-close"
                    aria-label={closeAriaLabel ?? "Close"}
                  >
                    <CloseGlyph />
                  </RadixDialog.Close>
                ) : null}
              </div>
            </div>
          )}
          {!visibleTitle && !headActions && !showCloseButton ? (
            <RadixDialog.Title className="sr-only">{title}</RadixDialog.Title>
          ) : null}
          {description ? (
            <RadixDialog.Description className="ui-dialog-description">
              {description}
            </RadixDialog.Description>
          ) : null}
          <div className="ui-dialog-body">{children}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

function CloseGlyph() {
  return (
    <svg
      aria-hidden
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export { RadixDialog };
