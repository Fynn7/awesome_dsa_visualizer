import type { Dispatch } from "react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pause, Play, StepBack, StepForward, X } from "lucide-react";
import type { ExecutionAction, ExecutionState } from "../lib/executionReducer";
import { getCurrentStep } from "../lib/executionReducer";
import { strings } from "../strings";
import { AnimationPanel } from "./AnimationPanel";
import { Toolbar } from "./Toolbar";

export type PresentationShellMode = "native" | "overlay";

type Props = {
  mode: PresentationShellMode;
  state: ExecutionState;
  dispatch: Dispatch<ExecutionAction>;
  title: string;
  onExit: () => void;
};

const ICON = { size: 18, strokeWidth: 2 } as const;
const HINT_ICON = { size: 64, strokeWidth: 1.75 } as const;
const HINT_HIDE_MS = 1300;

type TransientHintKind = "play" | "pause" | "next" | "prev";

export const PresentationShell = forwardRef<HTMLDivElement, Props>(
  function PresentationShell({ mode, state, dispatch, title, onExit }, ref) {
    const chromeRef = useRef<HTMLDivElement | null>(null);
    const hintTimerRef = useRef<number | null>(null);
    const [hintKind, setHintKind] = useState<TransientHintKind | null>(null);
    const [hintNonce, setHintNonce] = useState(0);
    const lastIndex = Math.max(0, state.trace.length - 1);
    const atEnd = state.stepIndex >= lastIndex;
    const step = getCurrentStep(state);

    const scheduleHintHide = useCallback(() => {
      if (hintTimerRef.current !== null) {
        window.clearTimeout(hintTimerRef.current);
      }
      hintTimerRef.current = window.setTimeout(() => {
        setHintKind(null);
        hintTimerRef.current = null;
      }, HINT_HIDE_MS);
    }, []);

    const flashHint = useCallback(
      (kind: TransientHintKind) => {
        setHintNonce((n) => n + 1);
        setHintKind(kind);
        scheduleHintHide();
      },
      [scheduleHintHide]
    );

    const stepPointerNavigation = useMemo(
      () => ({
        canStepForward: !atEnd,
        canStepBack: state.stepIndex > 0,
        onStepForward: () => {
          dispatch({ type: "STEP" });
          flashHint("next");
        },
        onStepBack: () => {
          dispatch({ type: "STEP_BACK" });
          flashHint("prev");
        },
      }),
      [atEnd, dispatch, flashHint, state.stepIndex]
    );

    useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        const t = e.target;
        if (chromeRef.current?.contains(t as Node)) {
          if (e.key === "Escape") {
            e.preventDefault();
            onExit();
          }
          return;
        }

        if (e.key === "Escape") {
          e.preventDefault();
          onExit();
          return;
        }

        if (e.repeat) return;

        if (e.key === " " || e.code === "Space") {
          e.preventDefault();
          const willPlay = !state.playing;
          dispatch({ type: state.playing ? "PAUSE" : "PLAY" });
          flashHint(willPlay ? "play" : "pause");
          return;
        }

        if (e.key === "ArrowRight" || e.key === "Enter") {
          e.preventDefault();
          if (!atEnd) {
            dispatch({ type: "STEP" });
            flashHint("next");
          }
          return;
        }

        if (e.key === "ArrowLeft") {
          e.preventDefault();
          if (state.stepIndex > 0) {
            dispatch({ type: "STEP_BACK" });
            flashHint("prev");
          }
        }
      };

      window.addEventListener("keydown", onKey);
      return () => {
        window.removeEventListener("keydown", onKey);
        if (hintTimerRef.current !== null) {
          window.clearTimeout(hintTimerRef.current);
          hintTimerRef.current = null;
        }
      };
    }, [atEnd, dispatch, flashHint, onExit, state.playing, state.stepIndex]);

    const stepLabel = strings.presentation.stepLabel(
      state.stepIndex + 1,
      state.trace.length
    );

    return (
      <div
        ref={ref}
        className={`presentation-shell presentation-shell--${mode}`}
        role="dialog"
        aria-modal="true"
        aria-label={strings.presentation.shellAria}
      >
        <div
          ref={chromeRef}
          className="presentation-shell-chrome"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="presentation-shell-chrome-main">
            <span className="presentation-shell-title">{title}</span>
            <span className="presentation-shell-step" aria-live="polite">
              {stepLabel}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-icon presentation-shell-exit"
            aria-label={strings.presentation.exit}
            onClick={() => onExit()}
          >
            <X {...ICON} aria-hidden />
          </button>
        </div>
        <div className="presentation-shell-toolbar">
          <Toolbar
            state={state}
            dispatch={dispatch}
            showPanelToggles={false}
          />
        </div>
        <div
          className="presentation-shell-body"
          aria-label={strings.presentation.bodyPointerHint}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.stopPropagation();
          }}
        >
          {hintKind ? (
            <div
              className="presentation-play-hint-layer"
              aria-live="polite"
              aria-atomic="true"
            >
              <div
                key={hintNonce}
                className={`presentation-play-hint presentation-play-hint--${hintKind}`}
                aria-label={
                  hintKind === "play"
                    ? strings.toolbar.play
                    : hintKind === "pause"
                      ? strings.toolbar.pause
                      : hintKind === "next"
                        ? strings.toolbar.step
                        : strings.toolbar.stepBack
                }
              >
                {hintKind === "play" ? (
                  <Play {...HINT_ICON} aria-hidden className="presentation-play-hint-icon" />
                ) : hintKind === "pause" ? (
                  <Pause {...HINT_ICON} aria-hidden className="presentation-play-hint-icon" />
                ) : hintKind === "next" ? (
                  <StepForward
                    {...HINT_ICON}
                    aria-hidden
                    className="presentation-play-hint-icon"
                  />
                ) : (
                  <StepBack
                    {...HINT_ICON}
                    aria-hidden
                    className="presentation-play-hint-icon"
                  />
                )}
              </div>
            </div>
          ) : null}
          <AnimationPanel
            trace={state.trace}
            viz={step.viz}
            variables={step.variables}
            algorithmId={state.algorithmId}
            stepLine={step.line}
            showArrayIndices={state.showArrayIndices}
            enableAnimationScroll={state.enableAnimationScroll}
            animationFitAllowUpscale={state.animationFitAllowUpscale}
            speedMs={state.speedMs}
            isAutoPlayingStep={state.playing}
            stepPointerNavigation={stepPointerNavigation}
          />
        </div>
      </div>
    );
  }
);
