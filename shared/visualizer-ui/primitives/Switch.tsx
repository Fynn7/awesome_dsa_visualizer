import * as RadixSwitch from "@radix-ui/react-switch";
import type { ForwardedRef, ReactNode } from "react";
import { forwardRef, useId } from "react";

/**
 * Switch primitive. Single source of truth for toggle-style controls across
 * the app (settings, panel headers, animation toggles). Replaces both the
 * legacy inline-styled `ToggleControl` from `shared/visualizer-ui/index.tsx`
 * and the ad-hoc `.panel-head-switch-*` CSS-only rendering. All colors and
 * sizes come from `--accent`, `--border`, `--text`, `--text-muted`.
 *
 * Size axis:
 *   - `md` (default) — 2.25rem x 1.25rem; for Settings and form-like surfaces.
 *   - `sm` — 2.05rem x 1.08rem; for dense panel headers.
 */
export type SwitchSize = "md" | "sm";

export type SwitchProps = {
  /** Visible inline label rendered next to the switch; also acts as the accessible name. */
  label: ReactNode;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  /** When provided, replaces `label` for accessibility without hiding the visible label. */
  ariaLabel?: string;
  size?: SwitchSize;
  /** Optional class to style the outer label row. */
  className?: string;
  disabled?: boolean;
  /** When provided, renders the label as a regular `<span>` for aria-labelledby scenarios. */
  labelId?: string;
};

const ROOT_CLASS_BY_SIZE: Record<SwitchSize, string> = {
  md: "ui-switch ui-switch--md",
  sm: "ui-switch ui-switch--sm",
};

export const Switch = forwardRef(function Switch(
  {
    label,
    checked,
    onCheckedChange,
    ariaLabel,
    size = "md",
    className,
    disabled = false,
    labelId,
  }: SwitchProps,
  ref: ForwardedRef<HTMLButtonElement>
) {
  const autoId = useId();
  const resolvedLabelId = labelId ?? `${autoId}-label`;
  const rootClass = [ROOT_CLASS_BY_SIZE[size], className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={rootClass}>
      <span id={resolvedLabelId} className="ui-switch-label">
        {label}
      </span>
      <RadixSwitch.Root
        ref={ref}
        className="ui-switch-track"
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : resolvedLabelId}
      >
        <RadixSwitch.Thumb className="ui-switch-thumb" />
      </RadixSwitch.Root>
    </label>
  );
});
