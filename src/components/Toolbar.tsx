import { useId, type Dispatch } from "react";
import {
  ChevronRight,
  ChevronsRight,
  Pause,
  Play,
  RotateCcw,
  StepBack,
  StepForward,
} from "lucide-react";
import type {
  ExecutionAction,
  ExecutionState,
  PanelKey,
} from "../lib/executionReducer";
import {
  nearestSpeedPresetMs,
  SPEED_PRESETS_MS,
  speedRateLabelAtIndex,
} from "../lib/speedPresets";
import { strings } from "../strings";

const ICON = { size: 18, strokeWidth: 2 } as const;
const METER_ICON = { size: 14, strokeWidth: 2.25 } as const;

type Props = {
  state: ExecutionState;
  dispatch: Dispatch<ExecutionAction>;
  /** When false, hide panel visibility chips (e.g. presentation / fullscreen). */
  showPanelToggles?: boolean;
};

const PANEL_TOGGLE_ITEMS: { key: PanelKey; label: string }[] = [
  { key: "editor", label: strings.toolbar.showEditor },
  { key: "console", label: strings.toolbar.showConsole },
  { key: "animation", label: strings.toolbar.showAnimation },
  { key: "variables", label: strings.toolbar.showVariables },
  { key: "pdf", label: strings.toolbar.showPdf },
];

export function Toolbar({
  state,
  dispatch,
  showPanelToggles = true,
}: Props) {
  const playEndHintId = useId();
  const last = Math.max(0, state.trace.length - 1);
  const atEnd = state.stepIndex >= last;
  const atStart = state.stepIndex <= 0;
  const playDisabledAtEnd = atEnd && !state.playing;

  const presetMs = nearestSpeedPresetMs(state.speedMs);
  const speedIdx = SPEED_PRESETS_MS.indexOf(presetMs);
  const speedMaxIdx = SPEED_PRESETS_MS.length - 1;
  const rateLabel = speedRateLabelAtIndex(speedIdx);
  const ariaValueText = `${rateLabel}, ${presetMs} milliseconds per step`;

  return (
    <div className="toolbar">
      {playDisabledAtEnd ? (
        <span id={playEndHintId} className="sr-only">
          {strings.toolbar.playAtEndHint}
        </span>
      ) : null}
      <div className="toolbar-group">
        <button
          type="button"
          className="btn btn-primary btn-icon"
          disabled={playDisabledAtEnd}
          aria-label={
            state.playing ? strings.toolbar.pause : strings.toolbar.play
          }
          aria-describedby={playDisabledAtEnd ? playEndHintId : undefined}
          onClick={() =>
            dispatch({ type: state.playing ? "PAUSE" : "PLAY" })
          }
        >
          {state.playing ? (
            <Pause {...ICON} aria-hidden />
          ) : (
            <Play {...ICON} aria-hidden />
          )}
        </button>
        <button
          type="button"
          className="btn btn-icon"
          disabled={atStart}
          aria-label={strings.toolbar.stepBack}
          onClick={() => dispatch({ type: "STEP_BACK" })}
        >
          <StepBack {...ICON} aria-hidden />
        </button>
        <button
          type="button"
          className="btn btn-icon"
          disabled={atEnd}
          aria-label={strings.toolbar.step}
          onClick={() => dispatch({ type: "STEP" })}
        >
          <StepForward {...ICON} aria-hidden />
        </button>
        <button
          type="button"
          className="btn btn-icon"
          disabled={atEnd}
          aria-label={strings.toolbar.jumpToEnd}
          onClick={() => dispatch({ type: "JUMP_TO_END" })}
        >
          <ChevronsRight {...ICON} aria-hidden />
        </button>
        <button
          type="button"
          className="btn btn-icon"
          aria-label={strings.toolbar.reset}
          onClick={() => dispatch({ type: "RESET" })}
        >
          <RotateCcw {...ICON} aria-hidden />
        </button>
      </div>

      <div className="toolbar-sep" aria-hidden />

      <div className="speed speed-slider">
        <div className="speed-label-row">
          <span className="speed-label">{strings.toolbar.speed}</span>
        </div>
        <div className="speed-slider-column">
          <input
            type="range"
            className="speed-slider-input"
            min={0}
            max={speedMaxIdx}
            step={1}
            value={speedIdx}
            aria-label={strings.toolbar.speed}
            aria-valuemin={0}
            aria-valuemax={speedMaxIdx}
            aria-valuenow={speedIdx}
            aria-valuetext={ariaValueText}
            onChange={(e) =>
              dispatch({
                type: "SET_SPEED",
                ms: SPEED_PRESETS_MS[Number(e.target.value)],
              })
            }
          />
          <div className="speed-slider-meter" aria-hidden>
            <div className="speed-meter-cell speed-meter-cell--start">
              <ChevronRight {...METER_ICON} />
            </div>
            <div className="speed-meter-cell speed-meter-cell--center">
              <ChevronsRight {...METER_ICON} />
            </div>
            <div className="speed-meter-cell speed-meter-cell--end">
              <span className="speed-meter-triple">
                <ChevronRight {...METER_ICON} />
                <ChevronRight {...METER_ICON} />
                <ChevronRight {...METER_ICON} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {showPanelToggles ? (
        <>
          <div className="toolbar-sep" aria-hidden />

          <div className="toolbar-group toolbar-group--end">
            <div
              className="panel-toggle-group"
              role="group"
              aria-label={strings.toolbar.panelVisibilityGroup}
            >
              {PANEL_TOGGLE_ITEMS.map(({ key, label }) => {
                const on = state.panels[key];
                const autoCollapsedChip =
                  key === "animation" &&
                  !on &&
                  state.animationAutoCollapsed;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`panel-toggle-chip${on ? " panel-toggle-chip--on" : ""}${autoCollapsedChip ? " panel-toggle-chip--auto-collapsed" : ""}`}
                    aria-pressed={on}
                    aria-label={
                      autoCollapsedChip
                        ? `${label}. ${strings.toolbar.animationChipAutoClosedHint}`
                        : undefined
                    }
                    onClick={() => dispatch({ type: "TOGGLE_PANEL", key })}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
