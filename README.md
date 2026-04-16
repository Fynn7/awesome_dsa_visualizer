DSA Visualizer
==============

A browser-based visualization tool for teaching university-level data structures and algorithms (DSA) in the classroom. The app is designed for **projection during lectures**, keeping the instructor in full control of code execution, animations, and on-screen variables.

## Features

- **Step-by-step execution**
  - Highlighted current line inside Python code.
  - Synchronized animation in the visualization panel (for example, sorting traces).
  - Persistent variable tracking area, optimized for classroom readability.

- **Teaching-focused workspace**
  - Resizable layout with panels for **Code**, **Console**, **Animation**, **Variables**, and an optional **PDF** panel for problem statements.
  - All panels can be shown/hidden via the toolbar, with an empty-state hint when everything is hidden.

- **Command palette and keyboard shortcuts**
  - Command palette to switch demos and scenarios (`Ctrl+Shift+P` / `Cmd+Shift+P`).
  - Dedicated shortcuts help overlay (opened with the `?` key) describing play/pause, step, and exit controls.

- **Presentation modes**
  - Native browser fullscreen presentation when available.
  - In-app overlay presentation as a fallback, with clear on-screen hints for left/right click behavior.

- **Accessible, classroom-ready UI**
  - Dark, low-glare, IDE-like theme tuned for projection.
  - English-only UI copy for this milestone.
  - ARIA labels and reduced-motion behavior for better accessibility.

## Tech Stack

- **Runtime**: Browser / Web only
- **Language for demos**: Python (algorithm code displayed in the editor)
- **Frontend**: React + TypeScript (SPA)
- **Editor**: Monaco Editor with a custom dark green theme

## Getting Started (Local Development)

> The exact commands may vary depending on your package manager setup; the typical Vite/React workflow is shown below.

1. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   # or
   yarn install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   # or the equivalent script for your package manager
   ```

3. **Open the app**
   - Visit `http://localhost:5173` (or whatever port your dev server reports) in a modern desktop browser.
   - Use the toolbar and command palette to explore available demos.

## Project Status

This project is an **instructor-facing classroom tool**, not a student-distributed app. The current milestone focuses on:

- Reliable step-by-step visualization for selected DSA topics.
- A stable, projector-friendly layout and color system.
- Clear English UI copy aligned with the in-code `strings` definitions.

## Further Reading

For detailed product vision and interaction rules, see:

- `docs/vision-dsa-visualizer.md` — overall direction, teaching context, and feature expectations.
- `docs/ui-design.md` — current UI design draft, layout structure, color system, and animation behavior details.

These documents are the **single source of truth** for behavior and visual design; `README.md` only provides a high-level overview.

