import type { Plugin } from "vite";
import { buildRootCssVarsBlock } from "./tokens";
import { MOTION_CSS_VAR_ENTRIES } from "./motionTokens";

/**
 * Vite plugin: injects design tokens as a `:root` CSS variable block at the
 * top of every CSS module Vite processes that contains the sentinel comment
 * `/* @design-tokens-root *`/. There should be exactly one such sentinel in
 * the project (`src/index.css`).
 *
 * Benefits:
 *   - The `tokens.ts` / `motionTokens.ts` modules are the single authoritative
 *     source; `:root` CSS variables are generated, never hand-written.
 *   - TypeScript code that reads tokens (e.g. for class-binding logic) and CSS
 *     that reads `var(--name)` stay provably in sync at build time.
 *   - Removing a token from TS removes the CSS variable too, surfacing dead
 *     references at lint/typecheck time rather than as runtime color regressions.
 */
const SENTINEL = "/* @design-tokens-root */";

export function viteDesignTokensPlugin(): Plugin {
  const rootBlock = buildRootCssVarsBlock(MOTION_CSS_VAR_ENTRIES);
  return {
    name: "awesome-visualizer:design-tokens",
    enforce: "pre",
    transform(code, id) {
      if (!id.endsWith(".css")) return null;
      if (!code.includes(SENTINEL)) return null;
      return {
        code: code.replace(SENTINEL, rootBlock),
        map: null,
      };
    },
  };
}
