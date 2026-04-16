import type { Dispatch } from "react";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { ToggleControl } from "@visualizer-ui";
import { handleFocusTrapTab } from "../lib/focusTrap";
import type { AlgorithmId } from "../lib/mockTrace";
import type { ExecutionAction } from "../lib/executionReducer";
import { strings } from "../strings";

const CLOSE_ICON = { size: 22, strokeWidth: 2.5 } as const;

type Props = {
  open: boolean;
  onClose: () => void;
  algorithmId: AlgorithmId;
  showArrayIndices: boolean;
  enableAnimationScroll: boolean;
  animationFitAllowUpscale: boolean;
  dispatch: Dispatch<ExecutionAction>;
};

export function SettingsModal({
  open,
  onClose,
  algorithmId,
  showArrayIndices,
  enableAnimationScroll,
  animationFitAllowUpscale,
  dispatch,
}: Props) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const showIndexToggle = algorithmId !== "stack";

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
      const firstField = dialogRef.current?.querySelector<HTMLInputElement>(
        ".settings-dialog-body input[type=\"checkbox\"]"
      );
      firstField?.focus();
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
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="settings-dialog-head">
          <h2 id={titleId} className="settings-dialog-title">
            {strings.settings.title}
          </h2>
          <button
            type="button"
            className="btn btn-icon settings-dialog-close"
            aria-label={strings.settings.close}
            onClick={onClose}
          >
            <X {...CLOSE_ICON} aria-hidden />
          </button>
        </div>
        <div className="settings-dialog-body">
          <div className="settings-toggle-group">
            {showIndexToggle ? (
              <ToggleControl
                label={strings.settings.showArrayIndices}
                checked={showArrayIndices}
                onChange={(value) =>
                  dispatch({
                    type: "SET_SHOW_ARRAY_INDICES",
                    value,
                  })
                }
              />
            ) : null}
            <div className="settings-animation-fit-block">
              <ToggleControl
                label={strings.settings.enableAnimationScroll}
                checked={enableAnimationScroll}
                onChange={(value) =>
                  dispatch({
                    type: "SET_ENABLE_ANIMATION_SCROLL",
                    value,
                  })
                }
              />
              {!enableAnimationScroll ? (
                <div className="settings-toggle-nested">
                  <ToggleControl
                    label={strings.settings.animationFitAllowUpscale}
                    checked={animationFitAllowUpscale}
                    onChange={(value) =>
                      dispatch({
                        type: "SET_ANIMATION_FIT_ALLOW_UPSCALE",
                        value,
                      })
                    }
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
