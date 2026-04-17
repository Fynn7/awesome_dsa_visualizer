/** UI copy. English only for this milestone */

export const strings = {
  home: {
    searchPlaceholder: "Type to filter demos by name…",
    searchAria: "Algorithm search",
  },
  header: {
    commandPlaceholder: "Search commands and scenarios…",
    commandAria: "Open command palette",
  },
  commandPalette: {
    inputPlaceholder: "Type to filter demos by name…",
    empty: "No matching demos",
    ariaLabel: "Command palette",
    currentBadge: "Current",
  },
  toolbar: {
    play: "Play",
    pause: "Pause",
    step: "Step",
    stepBack: "Step back",
    reset: "Reset",
    speed: "Speed",
    showEditor: "Editor",
    showConsole: "Console",
    showAnimation: "Animation",
    showVariables: "Variables",
    showPdf: "PDF",
    /** Toolbar: aria-label for panel visibility chip group */
    panelVisibilityGroup: "Visible panels",
    /** Appended in aria-label when Animation was auto-hidden (viewport too small). */
    animationChipAutoClosedHint:
      "Hidden because the animation area was too small — click to open again",
    openSettings: "Settings",
    /** aria-describedby when Play is disabled at end of trace */
    playAtEndHint:
      "At the end of the demo. Use Reset to run again from the start.",
    openKeyboardHelp: "Shortcuts (?)",
  },
  settings: {
    title: "Settings",
    showArrayIndices: "Show array index labels under bars",
    enableAnimationScroll: "Enable animation panel scrollbars",
    animationFitAllowUpscale:
      "Scale diagram up to fill available space (when scrollbars are off)",
    close: "Close",
  },
  panels: {
    codeEditor: "Code",
    console: "Console",
    animation: "Animation",
    variables: "Variables",
    pdf: "PDF",
    pdfPlaceholder: "PDF viewer (coming soon)",
    emptyConsole: "No output yet. Step or Play to run the demo.",
    noVariables: "No variables at this step.",
  },
  toast: {
    codeDirty:
      "Code was edited; mock trace may not match. Reset restores the demo script.",
    resetDemoButton: "Reset demo",
  },
  help: {
    title: "Shortcuts",
    close: "Close",
    /** Row aria-labels (full phrase for screen readers) */
    rowPalette: "Open command palette",
    rowShortcutsHelpAria: "Open shortcuts panel with ?",
    rowExit: "Exit presentation",
    rowPlayPause: "Play or pause autoplay",
    rowNext: "Next step",
    /** Shown between keycaps; alternatives, not a chord */
    rowNextKeySep: "/",
    rowNextAria: "Enter, Right arrow, or Left click",
    rowPrev: "Previous step",
    rowPrevAria: "Left arrow or Right click",
    mouseLeftClick: "Left click",
    mouseRightClick: "Right click",
    presentGroup: "While presenting",
  },
  emptyAllPanels:
    "All panels are hidden. Use the toolbar to show at least one panel.",
  presentation: {
    /** Animation panel: enter browser fullscreen presentation */
    presentNative: "Browser fullscreen presentation",
    /** Animation panel: in-app fullscreen overlay */
    presentOverlay: "In-app window presentation",
    exit: "Exit presentation",
    shellAria: "Animation presentation",
    stepLabel: (current: number, total: number) => `Step ${current} / ${total}`,
    /** Hint on presentation main area: click targets */
    bodyPointerHint:
      "Left-click: next step. Right-click: previous step.",
    toastFullscreenFallback:
      "Browser fullscreen was unavailable; using in-app presentation instead.",
  },
} as const;
