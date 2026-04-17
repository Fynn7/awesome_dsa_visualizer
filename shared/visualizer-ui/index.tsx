import type { ChangeEvent, CSSProperties, FocusEvent } from "react";
import { useId, useMemo, useState } from "react";

const toggleLabelStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
  width: "100%",
} as const;

const hiddenCheckboxStyle = {
  position: "absolute",
  width: "1px",
  height: "1px",
  margin: "-1px",
  padding: 0,
  border: 0,
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  overflow: "hidden",
  whiteSpace: "nowrap",
  appearance: "none",
} as const;

const switchTrackBaseStyle = {
  position: "relative",
  width: "2.25rem",
  height: "1.25rem",
  borderRadius: "999px",
  borderWidth: "1px",
  borderStyle: "solid",
  transition: "background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease",
  flexShrink: 0,
} as const;

const switchKnobBaseStyle = {
  position: "absolute",
  top: "50%",
  width: "0.95rem",
  height: "0.95rem",
  borderRadius: "999px",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.45)",
  transition: "left 140ms ease, transform 140ms ease, background-color 140ms ease",
} as const;

type ToggleControlProps = {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

export function ToggleControl({ label, checked, onChange }: ToggleControlProps) {
  const inputId = useId();
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const switchTrackStyle = useMemo<CSSProperties>(
    () => ({
      ...switchTrackBaseStyle,
      borderColor: isFocusVisible ? "rgba(45, 212, 191, 0.9)" : "rgba(122, 158, 152, 0.45)",
      backgroundColor: checked ? "rgba(45, 212, 191, 0.35)" : "rgba(0, 0, 0, 0.22)",
      boxShadow: isFocusVisible
        ? "0 0 0 2px rgba(45, 212, 191, 0.42)"
        : "none",
    }),
    [checked, isFocusVisible]
  );
  const switchKnobStyle = useMemo<CSSProperties>(
    () => ({
      ...switchKnobBaseStyle,
      left: checked ? "calc(100% - 0.125rem)" : "0.125rem",
      transform: checked ? "translate(-100%, -50%)" : "translate(0, -50%)",
      backgroundColor: checked ? "rgba(45, 212, 191, 0.95)" : "rgba(226, 240, 237, 0.9)",
    }),
    [checked]
  );
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };
  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    setIsFocusVisible(event.currentTarget.matches(":focus-visible"));
  };
  const handleBlur = () => {
    setIsFocusVisible(false);
  };

  return (
    <label htmlFor={inputId} style={toggleLabelStyle}>
      <span>{label}</span>
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={hiddenCheckboxStyle}
      />
      <span aria-hidden style={switchTrackStyle}>
        <span style={switchKnobStyle} />
      </span>
    </label>
  );
}

export function splitCaptionByBackticks(input: string): Array<{
  code: boolean;
  text: string;
}> {
  if (input.length === 0) {
    return [{ code: false, text: "" }];
  }

  const parts = input.split("`");
  const result: Array<{ code: boolean; text: string }> = [];
  for (let i = 0; i < parts.length; i += 1) {
    result.push({
      code: i % 2 === 1,
      text: parts[i] ?? "",
    });
  }
  return result;
}

export function stripCaptionBackticks(input: string): string {
  return input.replaceAll("`", "");
}
