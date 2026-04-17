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

- **Minimal search home**
  - `/` shows a Google-like minimal entry page with a single algorithm search input.
  - Search behavior and row highlighting reuse the same matching and UI style as the in-app command palette.
  - Each query piece must fuzzy-match the item title before that item can appear in results.
  - Press `Enter` to open the top match, or choose a row with keyboard/mouse; both go to `/app`.
  - If there is no match, you stay on `/` and see the same empty-state copy used by command palette.

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
   - At `/`, use the search input to pick a demo and enter the visualizer at `/app`.
   - You can also open `/app` directly to enter the full workspace.

## Project Status

This project is an **instructor-facing classroom tool**, not a student-distributed app. The current milestone focuses on:

- Reliable step-by-step visualization for selected DSA topics.
- A stable, projector-friendly layout and color system.
- Clear English UI copy aligned with the in-code `strings` definitions.

## Further Reading

For detailed product vision and interaction rules, see:

- `docs/vision-dsa-visualizer.md` — overall direction, teaching context, and feature expectations.
- `docs/ui-design.md` — UI design notes that summarize layout/color behavior and link back here for entry-flow specifics.
- Loading and waiting behavior rules are maintained in `docs/ui-design.md` (see Global Feedback and Accessibility), including inline/section/blocking semantics.

`README.md` is the single source of truth for current entry flow and routing behavior.

