import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const visualizerUiEntry = path.resolve(
  configDir,
  "./shared/visualizer-ui/index.tsx",
);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@visualizer-ui": visualizerUiEntry,
    },
  },
});
