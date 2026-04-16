import type { ChangeEvent } from "react";

type ToggleControlProps = {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

export function ToggleControl({ label, checked, onChange }: ToggleControlProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        width: "100%",
      }}
    >
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={handleChange} />
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
