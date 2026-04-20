DSA Visualizer
==============

A browser-based visualization tool for teaching university-level data structures and algorithms (DSA) in the classroom. The app is designed for **projection during lectures**, keeping the instructor in full control of code execution, animations, and on-screen variables.

## Features

- **Step-by-step execution**
  - Highlighted current line inside Python code.
  - Synchronized animation in the visualization panel (for example, sorting traces and union-find graph steps).
  - Persistent variable tracking area, optimized for classroom readability.

- **Teaching-focused workspace**
  - Resizable layout with panels for **Code**, **Console**, **Animation**, **Variables**, and an optional **PDF** panel for problem statements.
  - All panels can be shown/hidden via the toolbar, with an empty-state hint when everything is hidden.

- **Command palette and keyboard shortcuts**
  - Command palette to switch demos and scenarios (`Ctrl+Shift+P` / `Cmd+Shift+P`).
  - Dedicated shortcuts help overlay (opened with the `?` key) describing play/pause, step, and exit controls.

- **Minimal search home**
  - `/` shows a Google-like minimal entry page with a single algorithm search input.
  - Includes **Quick Find** (one animation step per `union()`) and **Quick Find - Full** (line-by-step inside `union`) for *Exercise 1: Analysis of quick-find*; open via `/app?algorithm=quick-find` or `/app?algorithm=quick-find-full`.
  - Includes **Quick Union** (one animation step per `union()`) and **Quick Union - Full** (line-by-step inside `union` and `find`) for *Exercise 2: Analysis of quick-union*; open via `/app?algorithm=quick-union` or `/app?algorithm=quick-union-full`.
  - Search behavior and row highlighting reuse the same matching and UI style as the in-app command palette.
  - Each query piece must fuzzy-match the item title before that item can appear in results.
  - Press `Enter` to open the top match, or choose a row with keyboard/mouse; both go to `/app`.
  - If there is no match, you stay on `/` and see the same empty-state copy used by command palette.
  - If the route throws an uncaught error while rendering, the app shows a full-screen recovery screen (back to home or reload). User-visible copy is defined in `src/strings.ts` under `routeError`.

### Union-Find Exercise Traces

- Both demos use the same precomputed operation sequence `(9,0) (3,4) (5,8) (7,2) (2,1) (5,7) (0,3) (4,2)` and the same displayed source (synced with `src_py/uebung1.py`, including `connected` and the input loop).
- **Quick Find** (`algorithm=quick-find`): one animation step per completed `union()`; animation captions show only the `union(p,q)` call in inline code style; console logs are union summaries only (no per-`i` scan lines); the code panel highlights the `def union(self, p, q):` line on each union step; `array_accesses` in Variables is the total for that union on each step.
- **Quick Find - Full** (`algorithm=quick-find-full`): same DSU rules and final numbers as today’s line-by-step trace inside `union`.
- **Quick Union** (`algorithm=quick-union`): one animation step per completed `union()` using the Exercise 2 official answer table. Variables show `id[] before`, `id[] after`, root pair (`root_p`, `root_q`), and union-level `array_accesses`; the animation panel renders parent-pointer tree edges (`i -> id[i]` for non-root nodes) after each union.
- **Quick Union - Full** (`algorithm=quick-union-full`): line-by-line execution inside `union` and `find` (`while` checks, advances, and final root-link assignment). Running `array_accesses` follows the quick-union counting used by the official answer.
- In Quick Find modes (Quick Find / Quick Find - Full), Animation panel includes a `display connections` toggle (default OFF). Its state is persisted in `localStorage`, so your preference is reused on next visit. In Quick Union modes (Quick Union / Quick Union - Full), connections are always visible and the toggle is not shown.
- The Animation panel renders a DSU graph (`0..9` nodes): each circle labels vertex index `i`, with the current `id[i]` value shown at the top-right of the circle. Union edges are SVG paths that follow the same detour keypoints as before (endpoints on node circles) with small rounded corners at bends so lines stay close to the guide polyline; segments that would cross unrelated nodes still route through a horizontal gutter (cross-row pairs use the mid channel between the two rows; non-adjacent pairs on the **top** row use stacked channels **between** the top row and the mid gutter so they do not overlap cross-row routes such as 0–9; non-adjacent pairs on the **bottom** row use stacked channels **above** that row but **below** the mid gutter, with lane height determined by span width so wider spans such as 5–8 keep a stable y across steps, while narrower spans such as 5–7 are always placed slightly lower than 5–8 to avoid overlap). In **Full** mode, a new union edge is added only after the trace hits `if self.id[i] == pid` with a match (aligned with the Python control flow), then stays for the rest of that union; longer non-highlighted edges are slightly de-emphasized. The current union edge is highlighted while it is active, and the last `Finished` frame renders all edges with one uniform color.
- The Animation panel renders a DSU graph (`0..9` nodes): each circle labels vertex index `i`, with the current `id[i]` value shown at the top-right of the circle. Nodes are deterministically color-mapped by current `id[i]` group value, so equal groups share the same node fill color in both Quick Find modes; the palette was tuned for stronger cross-group contrast while staying consistent with the dark classroom theme. Node fills keep a translucent look, with an opaque underlay disk so edge strokes do not visually bleed through node interiors. Union edges are SVG paths that follow the same detour keypoints as before (endpoints on node circles) with small rounded corners at bends so lines stay close to the guide polyline; segments that would cross unrelated nodes still route through a horizontal gutter (cross-row pairs use the mid channel between the two rows; non-adjacent pairs on the **top** row use stacked channels **between** the top row and the mid gutter so they do not overlap cross-row routes such as 0–9; non-adjacent pairs on the **bottom** row use stacked channels **above** that row but **below** the mid gutter, with lane height determined by span width so wider spans such as 5–8 keep a stable y across steps, while narrower spans such as 5–7 are always placed slightly lower than 5–8 to avoid overlap). In **Full** mode, a new union edge is added only after the trace hits `if self.id[i] == pid` with a match (aligned with the Python control flow), then stays for the rest of that union; longer non-highlighted edges are slightly de-emphasized. The current union edge is highlighted while it is active, and the last `Finished` frame renders all edges with one uniform color.
- **Full** mode: the code panel uses fine-grained execution highlighting inside `QuickFindUF.union` with real line timing (`19 -> 20 -> 21 -> 22 -> 23 -> 24`); captions render the `union(p,q)` call in inline code where it appears; `array_accesses` is a running counter per sub-step and each union completion matches the official totals.

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
> Node.js 20+ is required (router dependencies declare `engines.node >= 20.0.0`).

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
   - **Development only**: open `/app?crash=1` to intentionally render the route error recovery screen (remove the query to continue).

## Deployment (Vercel)

The app is a single-page application with client-side routes such as `/` and `/app`. Vercel must serve `index.html` for those paths so deep links and browser refresh work. The repo root includes `vercel.json` with a rewrite rule that maps unmatched routes to `/index.html` (static assets under `dist/assets/` are still served as files). After changing this file, redeploy the project for production to pick up the update.

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

Developer maintenance note:

- Pointer movement animation is centralized in `src/lib/pointerMoveAnimation.ts`.
- Pointer enter/exit lifecycle animation is centralized in `src/lib/pointerLifecycleAnimation.ts`.
- Pointer key registry and visibility-map helpers are centralized in `src/lib/pointerRegistry.ts`.
- Pointer per-frame stage decisions (hide/enter/flip + delta baseline) are centralized in `src/lib/pointerStagePlan.ts`.
- Bar FLIP and assign animation policy is centralized in `src/lib/barAnimationPolicy.ts`.
- Bar identity reuse/derivation is centralized in `src/lib/visualBars.ts`.
- Bar/pointer tone-to-class mapping is centralized in `src/lib/visualToneClassMap.ts`.
- Shared animation tokens (easing/threshold/buffer) are centralized in `src/lib/motionTokens.ts`.
- To change one animation category across all algorithms and all steps, edit the corresponding module above and keep `AnimationPanel` consuming those helpers only.

`README.md` is the single source of truth for current entry flow and routing behavior.

