import type { BarTone } from "./vizBarTone";

const BAR_TONE_CLASS_MAP: Record<BarTone, string> = {
  key: "viz-bar--key",
  hl: "viz-bar--hl",
  min: "viz-bar--min",
  sorted: "viz-bar--sorted",
  neutral: "",
};

const POINTER_TONE_CLASS_MAP: Record<BarTone, string> = {
  key: "viz-pointer--toneKey",
  hl: "viz-pointer--toneHl",
  min: "viz-pointer--toneMin",
  sorted: "viz-pointer--toneSorted",
  neutral: "viz-pointer--toneNeutral",
};

export function barToneClassForTone(tone: BarTone): string {
  return BAR_TONE_CLASS_MAP[tone];
}

export function pointerToneClassForTone(tone: BarTone): string {
  return POINTER_TONE_CLASS_MAP[tone];
}

export function barClassNameForTone(baseClass: string, tone: BarTone): string {
  const toneClass = barToneClassForTone(tone);
  return toneClass ? `${baseClass} ${toneClass}` : baseClass;
}
