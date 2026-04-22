import { nearestSpeedPresetMs } from "./speedPresets";
import {
  getAlgorithmDemo,
  type AlgorithmId,
  type LoopPulseRestartRule,
  type MockStep,
} from "./mockTrace";
import { strings } from "../strings";

export type PanelKey = "editor" | "console" | "animation" | "variables" | "pdf";

export type ExecutionState = {
  algorithmId: AlgorithmId;
  trace: MockStep[];
  loopPulseRules: LoopPulseRestartRule[];
  stepIndex: number;
  /** Accumulated console lines from steps 0..stepIndex */
  consoleLines: string[];
  source: string;
  baselineSource: string;
  codeDirty: boolean;
  playing: boolean;
  speedMs: number;
  panels: Record<PanelKey, boolean>;
  toast: string | null;
  /** Show 0-based index labels under bars in the animation panel */
  showArrayIndices: boolean;
  /** When false, animation panel scales to fit instead of scrolling */
  enableAnimationScroll: boolean;
  /**
   * When scrollbars are off: if true, diagram may scale up to fill the panel
   * (capped); if false, only shrink-to-fit (max scale 1).
   */
  animationFitAllowUpscale: boolean;
  /** Quick Find: show/hide DSU connection lines in animation panel. */
  displayConnections: boolean;
  /**
   * True after the Animation panel was auto-hidden because its viewport was
   * too small; cleared when the user toggles the Animation chip.
   */
  animationAutoCollapsed: boolean;
};

const initialPanels: Record<PanelKey, boolean> = {
  editor: true,
  console: true,
  animation: true,
  variables: true,
  pdf: false,
};

function recomputeConsole(trace: MockStep[], throughIndex: number): string[] {
  const lines: string[] = [];
  for (let i = 0; i <= throughIndex && i < trace.length; i++) {
    const appends = trace[i].consoleAppend;
    if (appends) lines.push(...appends);
  }
  return lines;
}

export function createInitialState(
  overrides?: Partial<Pick<ExecutionState, "displayConnections">>
): ExecutionState {
  const demo = getAlgorithmDemo("insertion");
  return {
    algorithmId: "insertion",
    trace: demo.trace,
    loopPulseRules: demo.loopPulseRules,
    stepIndex: 0,
    consoleLines: recomputeConsole(demo.trace, 0),
    source: demo.source,
    baselineSource: demo.source,
    codeDirty: false,
    playing: false,
    speedMs: 650,
    panels: { ...initialPanels },
    toast: null,
    showArrayIndices: true,
    enableAnimationScroll: false,
    animationFitAllowUpscale: true,
    displayConnections: overrides?.displayConnections ?? false,
    animationAutoCollapsed: false,
  };
}

export type ExecutionAction =
  | { type: "STEP" }
  | { type: "STEP_BACK" }
  | { type: "RESET" }
  | { type: "JUMP_TO_END" }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "TICK" }
  | { type: "SET_SPEED"; ms: number }
  | { type: "SET_SOURCE"; value: string }
  | { type: "TOGGLE_PANEL"; key: PanelKey }
  | { type: "CLEAR_TOAST" }
  | { type: "SET_SHOW_ARRAY_INDICES"; value: boolean }
  | { type: "SET_ENABLE_ANIMATION_SCROLL"; value: boolean }
  | { type: "SET_ANIMATION_FIT_ALLOW_UPSCALE"; value: boolean }
  | { type: "SET_DISPLAY_CONNECTIONS"; value: boolean }
  | { type: "AUTO_CLOSE_ANIMATION_PANEL" }
  | { type: "SET_ALGORITHM"; algorithmId: AlgorithmId };

export function executionReducer(
  state: ExecutionState,
  action: ExecutionAction
): ExecutionState {
  const lastIndex = Math.max(0, state.trace.length - 1);

  switch (action.type) {
    case "STEP": {
      if (state.stepIndex >= lastIndex) return { ...state, playing: false };
      const stepIndex = state.stepIndex + 1;
      return {
        ...state,
        stepIndex,
        consoleLines: recomputeConsole(state.trace, stepIndex),
        playing: false,
        toast: state.codeDirty ? strings.toast.codeDirty : state.toast,
      };
    }
    case "STEP_BACK": {
      if (state.stepIndex <= 0) return { ...state, playing: false };
      const stepIndex = state.stepIndex - 1;
      return {
        ...state,
        stepIndex,
        consoleLines: recomputeConsole(state.trace, stepIndex),
        playing: false,
        toast: state.codeDirty ? strings.toast.codeDirty : state.toast,
      };
    }
    case "RESET": {
      const demo = getAlgorithmDemo(state.algorithmId);
      return {
        ...state,
        trace: demo.trace,
        loopPulseRules: demo.loopPulseRules,
        stepIndex: 0,
        consoleLines: recomputeConsole(demo.trace, 0),
        source: demo.source,
        baselineSource: demo.source,
        codeDirty: false,
        playing: false,
        toast: null,
      };
    }
    case "JUMP_TO_END": {
      const demo = getAlgorithmDemo(state.algorithmId);
      const endIndex = Math.max(0, demo.trace.length - 1);
      return {
        ...state,
        trace: demo.trace,
        loopPulseRules: demo.loopPulseRules,
        stepIndex: endIndex,
        consoleLines: recomputeConsole(demo.trace, endIndex),
        source: demo.source,
        baselineSource: demo.source,
        codeDirty: false,
        playing: false,
        toast: null,
      };
    }
    case "SET_ALGORITHM": {
      const demo = getAlgorithmDemo(action.algorithmId);
      return {
        ...state,
        algorithmId: action.algorithmId,
        trace: demo.trace,
        loopPulseRules: demo.loopPulseRules,
        stepIndex: 0,
        consoleLines: recomputeConsole(demo.trace, 0),
        source: demo.source,
        baselineSource: demo.source,
        codeDirty: false,
        playing: false,
        toast: null,
      };
    }
    case "PLAY":
      return {
        ...state,
        playing: true,
        toast: null,
      };
    case "PAUSE":
      return { ...state, playing: false };
    case "TICK": {
      if (!state.playing) return state;
      if (state.stepIndex >= lastIndex) {
        return { ...state, playing: false };
      }
      const stepIndex = state.stepIndex + 1;
      return {
        ...state,
        stepIndex,
        consoleLines: recomputeConsole(state.trace, stepIndex),
        toast: state.codeDirty ? strings.toast.codeDirty : state.toast,
      };
    }
    case "SET_SPEED":
      return {
        ...state,
        speedMs: nearestSpeedPresetMs(
          Math.min(3000, Math.max(120, action.ms))
        ),
      };
    case "SET_SOURCE": {
      const dirty = action.value !== state.baselineSource;
      return {
        ...state,
        source: action.value,
        codeDirty: dirty,
        toast: dirty ? null : state.toast,
      };
    }
    case "TOGGLE_PANEL": {
      const nextOpen = !state.panels[action.key];
      const animationAutoCollapsed =
        action.key === "animation" ? false : state.animationAutoCollapsed;
      return {
        ...state,
        animationAutoCollapsed,
        panels: {
          ...state.panels,
          [action.key]: nextOpen,
        },
      };
    }
    case "AUTO_CLOSE_ANIMATION_PANEL": {
      if (!state.panels.animation) return state;
      return {
        ...state,
        animationAutoCollapsed: true,
        panels: { ...state.panels, animation: false },
      };
    }
    case "CLEAR_TOAST":
      return { ...state, toast: null };
    case "SET_SHOW_ARRAY_INDICES":
      return { ...state, showArrayIndices: action.value };
    case "SET_ENABLE_ANIMATION_SCROLL":
      return { ...state, enableAnimationScroll: action.value };
    case "SET_ANIMATION_FIT_ALLOW_UPSCALE":
      return { ...state, animationFitAllowUpscale: action.value };
    case "SET_DISPLAY_CONNECTIONS":
      return { ...state, displayConnections: action.value };
    default:
      return state;
  }
}

export function getCurrentStep(state: ExecutionState): MockStep {
  return state.trace[state.stepIndex] ?? state.trace[0];
}
