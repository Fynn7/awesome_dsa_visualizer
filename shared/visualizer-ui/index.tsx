import type { ChangeEvent } from "react";
import { useRef } from "react";

type ToggleControlProps = {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

export function ToggleControl({ label, checked, onChange }: ToggleControlProps) {
  const inputIdRef = useRef(
    `toggle-${Math.random().toString(36).slice(2, 10)}`
  );
  const switchTrackStyle = {
    position: "relative",
    width: "2.25rem",
    height: "1.25rem",
    borderRadius: "999px",
    border: "1px solid rgba(122, 158, 152, 0.45)",
    backgroundColor: checked ? "rgba(45, 212, 191, 0.35)" : "rgba(0, 0, 0, 0.22)",
    transition: "background-color 140ms ease, border-color 140ms ease",
    flexShrink: 0,
  } as const;
  const switchKnobStyle = {
    position: "absolute",
    top: "50%",
    left: checked ? "calc(100% - 0.125rem)" : "0.125rem",
    width: "0.95rem",
    height: "0.95rem",
    borderRadius: "999px",
    transform: checked ? "translate(-100%, -50%)" : "translate(0, -50%)",
    backgroundColor: checked ? "rgba(45, 212, 191, 0.95)" : "rgba(226, 240, 237, 0.9)",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.45)",
    transition: "left 140ms ease, transform 140ms ease, background-color 140ms ease",
  } as const;
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  return (
    <label
      htmlFor={inputIdRef.current}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        width: "100%",
      }}
    >
      <span>{label}</span>
      <input
        id={inputIdRef.current}
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        style={{
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
        }}
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
