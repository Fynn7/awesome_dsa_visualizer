import { useEffect, useId, useRef, type ReactNode } from "react";
import {
  CircleHelp,
  LogOut,
  Pause,
  Play,
  Search,
  StepBack,
  StepForward,
  X,
} from "lucide-react";
import { handleFocusTrapTab } from "../lib/focusTrap";
import { strings } from "../strings";

const CLOSE_ICON = { size: 22, strokeWidth: 2.5 } as const;
const ROW_ICON = { size: 20, strokeWidth: 2 } as const;

type Props = {
  open: boolean;
  onClose: () => void;
  commandPaletteShortcut: string;
};

function HelpRow({
  icon,
  keys,
  ariaLabel,
}: {
  icon: ReactNode;
  keys: ReactNode;
  ariaLabel: string;
}) {
  return (
    <div className="help-row" role="listitem" aria-label={ariaLabel}>
      <span className="help-row-icon" aria-hidden>
        {icon}
      </span>
      <div className="help-row-keys">{keys}</div>
    </div>
  );
}

export function KeyboardHelpModal({
  open,
  onClose,
  commandPaletteShortcut,
}: Props) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const root = dialogRef.current;
    if (!root) return;
    const onKey = (e: KeyboardEvent) => handleFocusTrapTab(e, root);
    root.addEventListener("keydown", onKey);
    return () => root.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = window.requestAnimationFrame(() => {
      dialogRef.current
        ?.querySelector<HTMLButtonElement>(".settings-dialog-close")
        ?.focus();
    });
    return () => window.cancelAnimationFrame(t);
  }, [open]);

  if (!open) return null;

  return (
    <div className="settings-backdrop">
      <button
        type="button"
        className="settings-backdrop-hit"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className="settings-dialog help-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="settings-dialog-head help-dialog-head">
          <div className="help-dialog-title-wrap">
            <h2 id={titleId} className="settings-dialog-title">
              {strings.help.title}
            </h2>
          </div>
          <button
            type="button"
            className="btn btn-icon settings-dialog-close"
            aria-label={strings.help.close}
            onClick={onClose}
          >
            <X {...CLOSE_ICON} aria-hidden />
          </button>
        </div>
        <div className="settings-dialog-body help-dialog-body">
          <div className="help-grid" role="list">
            <HelpRow
              ariaLabel={strings.help.rowShortcutsHelpAria}
              icon={<CircleHelp {...ROW_ICON} />}
              keys={<kbd className="help-kbd">?</kbd>}
            />
            <HelpRow
              ariaLabel={`${strings.help.rowPalette}: ${commandPaletteShortcut}`}
              icon={<Search {...ROW_ICON} />}
              keys={
                <kbd className="help-kbd">{commandPaletteShortcut}</kbd>
              }
            />
          </div>
          <div className="help-group-label" aria-hidden>
            <span className="help-group-line" />
            <span>{strings.help.presentGroup}</span>
            <span className="help-group-line" />
          </div>
          <div className="help-grid" role="list">
            <HelpRow
              ariaLabel={`${strings.help.rowExit}: Escape`}
              icon={<LogOut {...ROW_ICON} />}
              keys={<kbd className="help-kbd">Esc</kbd>}
            />
            <HelpRow
              ariaLabel={`${strings.help.rowPlayPause}: Space`}
              icon={
                <>
                  <Play {...ROW_ICON} />
                  <Pause {...ROW_ICON} />
                </>
              }
              keys={<kbd className="help-kbd">Space</kbd>}
            />
            <HelpRow
              ariaLabel={`${strings.help.rowNext}: ${strings.help.rowNextAria}`}
              icon={<StepForward {...ROW_ICON} />}
              keys={
                <>
                  <kbd className="help-kbd">Enter</kbd>
                  <span className="help-kbd-sep" aria-hidden>
                    {strings.help.rowNextKeySep}
                  </span>
                  <kbd className="help-kbd">→</kbd>
                  <span className="help-kbd-sep" aria-hidden>
                    {strings.help.rowNextKeySep}
                  </span>
                  <kbd className="help-kbd">{strings.help.mouseLeftClick}</kbd>
                </>
              }
            />
            <HelpRow
              ariaLabel={`${strings.help.rowPrev}: ${strings.help.rowPrevAria}`}
              icon={<StepBack {...ROW_ICON} />}
              keys={
                <>
                  <kbd className="help-kbd">←</kbd>
                  <span className="help-kbd-sep" aria-hidden>
                    {strings.help.rowNextKeySep}
                  </span>
                  <kbd className="help-kbd">{strings.help.mouseRightClick}</kbd>
                </>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
