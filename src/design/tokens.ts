/**
 * Single source of truth for design tokens (colors, spacing, typography).
 *
 * These values are mirrored to `:root` CSS custom properties by a Vite plugin
 * (`viteDesignTokensPlugin` in `vite.config.ts`). Do not hardcode color,
 * spacing, or font literals in business components — reference the generated
 * CSS variables (e.g. `var(--accent)`) or import from this module directly.
 *
 * Motion tokens (durations, easing) live in `./motionTokens` to keep
 * category-specific concerns decoupled.
 */

/** Color tokens — surfaces, text, accents, and semantic roles. */
export const COLOR_TOKENS = {
  /** Main background and body. Lighter deep green. */
  "bg-app": "#031417",
  /** Panel content background (same tone as app; kept separate for future divergence). */
  "bg-panel": "#031417",
  /** Chrome tone (toolbar, panel headers). Darker green. */
  "bg-panel-head": "#021012",
  /** Dividers, weak borders, and control edges. */
  border: "#0d2e2c",
  /** Primary text, body labels. */
  text: "#e2f0ed",
  /** Secondary text, captions, placeholders. */
  "text-muted": "#7a9e98",
  /** Accent 1 — primary actions, focus rings, active highlights. */
  accent: "#2dd4bf",
  /** Accent 2 — darker accent variant for primary button borders. */
  "accent-dim": "#14b8a6",
  /** Bar-chart default tone. */
  bar: "#1a3834",
  /** Bar-chart currently-key element. */
  "bar-key": "#a3e635",
  /** Bar-chart min-index indicator. */
  "bar-min-index": "#c084fc",
  /** Bar-chart comparison highlight. */
  "bar-compare": "#0d9488",
  /** Bar-chart sorted prefix (color-mix of accent + bar). */
  "bar-sorted": "color-mix(in srgb, var(--accent) 28%, var(--bar))",
  /** Warning / error state. */
  danger: "#f87171",
} as const;

/** Font stack tokens. */
export const FONT_TOKENS = {
  ui: 'system-ui, "Segoe UI", Roboto, sans-serif',
  mono: '"Cascadia Code", "Fira Code", ui-monospace, monospace',
} as const;

/**
 * Scrollbar presentation tokens (VS Code-style narrow scrollbar).
 * Exposed as CSS variables so Firefox `scrollbar-color` and Chromium
 * `::-webkit-scrollbar-*` can both reference them.
 */
export const SCROLLBAR_TOKENS = {
  "scrollbar-size": "10px",
  "scrollbar-thumb": "rgba(106, 144, 149, 0.357)",
  "scrollbar-thumb-hover": "rgba(22, 159, 177, 0.384)",
  "scrollbar-thumb-active": "rgba(22, 159, 177, 0.678)",
  "scrollbar-track": "transparent",
} as const;

export type ColorTokenName = keyof typeof COLOR_TOKENS;
export type FontTokenName = keyof typeof FONT_TOKENS;
export type ScrollbarTokenName = keyof typeof SCROLLBAR_TOKENS;

/**
 * Build the `:root` CSS variable declaration string from all token tables.
 * Consumed by `viteDesignTokensPlugin` at build time.
 */
export function buildRootCssVarsBlock(extraEntries: Record<string, string> = {}): string {
  const entries: string[] = [];
  for (const [key, value] of Object.entries(COLOR_TOKENS)) {
    entries.push(`  --${key}: ${value};`);
  }
  for (const [key, value] of Object.entries(FONT_TOKENS)) {
    entries.push(`  --font-${key}: ${value};`);
  }
  for (const [key, value] of Object.entries(SCROLLBAR_TOKENS)) {
    entries.push(`  --${key}: ${value};`);
  }
  for (const [key, value] of Object.entries(extraEntries)) {
    entries.push(`  --${key}: ${value};`);
  }
  return `:root {\n  color-scheme: dark;\n${entries.join("\n")}\n}`;
}
