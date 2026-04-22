import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { viteDesignTokensPlugin } from "./src/design/viteDesignTokensPlugin";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const visualizerUiEntry = path.resolve(
  configDir,
  "./shared/visualizer-ui/index.ts",
);

export default defineConfig({
  plugins: [react(), viteDesignTokensPlugin()],
  resolve: {
    alias: {
      "@visualizer-ui": visualizerUiEntry,
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./tests/setup.ts"],
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "tests/**/*.{test,spec}.{ts,tsx}",
    ],
  },
});
