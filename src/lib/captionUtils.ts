/**
 * Pure string utilities for parsing inline-code segments within animation
 * captions (backtick-delimited). Moved here from the UI module to keep
 * `@visualizer-ui` strictly limited to UI component exports.
 */

export type CaptionSegment = {
  code: boolean;
  text: string;
};

/**
 * Splits a caption string on backtick characters, alternating between plain
 * and inline-code segments. Always returns at least one segment.
 */
export function splitCaptionByBackticks(input: string): CaptionSegment[] {
  if (input.length === 0) {
    return [{ code: false, text: "" }];
  }
  const parts = input.split("`");
  const result: CaptionSegment[] = [];
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
