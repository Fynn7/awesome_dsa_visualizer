import { flushSync } from "react-dom";
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { HelpCircle, Search, Settings } from "lucide-react";
import { CommandPalette } from "./components/CommandPalette";
import { KeyboardHelpModal } from "./components/KeyboardHelpModal";
import { PresentationShell } from "./components/PresentationShell";
import { SettingsModal } from "./components/SettingsModal";
import { Toolbar } from "./components/Toolbar";
import { Workspace } from "./components/Workspace";
import { BlockingLoadingOverlay } from "./components/LoadingState";
import {
  createInitialState,
  executionReducer,
} from "./lib/executionReducer";
import { getAlgorithmTitle } from "./lib/commandPaletteItems";
import { commandPaletteShortcutLabel } from "./lib/platformShortcut";
import { strings } from "./strings";
import type { AlgorithmId } from "./lib/mockTrace";

const HEADER_ICON = { size: 18, strokeWidth: 2 } as const;

type PresentationMode = "off" | "native" | "overlay";

type AppProps = {
  initialAlgorithmId?: AlgorithmId;
};

export default function App({ initialAlgorithmId }: AppProps) {
  const [state, dispatch] = useReducer(
    executionReducer,
    undefined,
    createInitialState
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [presentationMode, setPresentationMode] =
    useState<PresentationMode>("off");
  const [presentationNotice, setPresentationNotice] = useState<string | null>(
    null
  );
  const [workspaceBusy, setWorkspaceBusy] = useState(true);
  const presentationShellRef = useRef<HTMLDivElement | null>(null);
  const commandPaletteTriggerRef = useRef<HTMLButtonElement>(null);
  const settingsTriggerRef = useRef<HTMLButtonElement>(null);
  const helpTriggerRef = useRef<HTMLButtonElement>(null);

  const paletteShortcut = commandPaletteShortcutLabel();

  const exitPresentation = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setPresentationMode("off");
  }, []);

  const enterPresentationNative = useCallback(() => {
    flushSync(() => setPresentationMode("native"));
    let attempts = 0;
    const run = () => {
      const el = presentationShellRef.current;
      if (el) {
        el.requestFullscreen().catch(() => {
          setPresentationMode("overlay");
          setPresentationNotice(strings.presentation.toastFullscreenFallback);
          window.setTimeout(() => setPresentationNotice(null), 6000);
        });
        return;
      }
      attempts += 1;
      if (attempts > 24) {
        setPresentationMode("off");
        return;
      }
      requestAnimationFrame(run);
    };
    run();
  }, []);

  const enterPresentationOverlay = useCallback(() => {
    setPresentationMode("overlay");
  }, []);

  const closeCommandPalette = useCallback(() => {
    setCommandPaletteOpen(false);
    requestAnimationFrame(() => commandPaletteTriggerRef.current?.focus());
  }, []);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    requestAnimationFrame(() => settingsTriggerRef.current?.focus());
  }, []);

  const closeHelp = useCallback(() => {
    setHelpOpen(false);
    requestAnimationFrame(() => helpTriggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!state.playing) return;
    const id = window.setInterval(() => {
      dispatch({ type: "TICK" });
    }, state.speedMs);
    return () => window.clearInterval(id);
  }, [state.playing, state.speedMs]);

  useEffect(() => {
    if (!state.toast) return;
    const id = window.setTimeout(() => {
      dispatch({ type: "CLEAR_TOAST" });
    }, 6000);
    return () => window.clearTimeout(id);
  }, [state.toast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || !e.shiftKey) return;
      if (e.key !== "P" && e.key !== "p" && e.code !== "KeyP") return;
      e.preventDefault();
      setCommandPaletteOpen((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "?") return;
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (
        t.closest(
          "input, textarea, select, [contenteditable=true], .monaco-editor"
        )
      ) {
        return;
      }
      if (settingsOpen || commandPaletteOpen) return;
      e.preventDefault();
      setHelpOpen((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commandPaletteOpen, settingsOpen]);

  useEffect(() => {
    const onFs = () => {
      if (!document.fullscreenElement && presentationMode === "native") {
        setPresentationMode("off");
      }
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, [presentationMode]);

  useEffect(() => {
    if (!state.panels.animation && presentationMode !== "off") {
      exitPresentation();
    }
  }, [state.panels.animation, presentationMode, exitPresentation]);

  useEffect(() => {
    if (!initialAlgorithmId) {
      return;
    }
    dispatch({ type: "SET_ALGORITHM", algorithmId: initialAlgorithmId });
  }, [initialAlgorithmId]);

  return (
    <div className="app-shell" aria-busy={workspaceBusy}>
      <header className="app-header">
        <h1 className="app-header-title">
          {getAlgorithmTitle(state.algorithmId)}
        </h1>
        <div className="app-header-actions">
          <button
            ref={commandPaletteTriggerRef}
            type="button"
            className="command-palette-trigger"
            aria-label={strings.header.commandAria}
            onClick={() => setCommandPaletteOpen(true)}
          >
            <span className="command-palette-trigger-icon" aria-hidden>
              <Search size={14} strokeWidth={2} />
            </span>
            <span className="command-palette-trigger-placeholder">
              {strings.header.commandPlaceholder}
            </span>
          </button>
          <button
            ref={helpTriggerRef}
            type="button"
            className="btn btn-icon app-header-help"
            aria-label={strings.toolbar.openKeyboardHelp}
            onClick={() => setHelpOpen(true)}
          >
            <HelpCircle {...HEADER_ICON} aria-hidden />
          </button>
          <button
            ref={settingsTriggerRef}
            type="button"
            className="btn btn-icon app-header-settings"
            aria-label={strings.toolbar.openSettings}
            onClick={() => setSettingsOpen(true)}
          >
            <Settings {...HEADER_ICON} aria-hidden />
          </button>
        </div>
      </header>
      <Toolbar state={state} dispatch={dispatch} />
      <main className="app-main">
        <Workspace
          state={state}
          dispatch={dispatch}
          presentationMode={presentationMode}
          onPresentNative={enterPresentationNative}
          onPresentOverlay={enterPresentationOverlay}
          onBusyChange={setWorkspaceBusy}
        />
      </main>
      <BlockingLoadingOverlay
        active={workspaceBusy}
        label={strings.loading.appBoot}
      />
      {presentationMode !== "off" && state.panels.animation ? (
        <PresentationShell
          ref={presentationShellRef}
          mode={presentationMode === "native" ? "native" : "overlay"}
          state={state}
          dispatch={dispatch}
          title={getAlgorithmTitle(state.algorithmId)}
          onExit={exitPresentation}
        />
      ) : null}
      {presentationNotice ? (
        <div
          className="toast"
          role="status"
          onClick={() => setPresentationNotice(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setPresentationNotice(null);
            }
          }}
          tabIndex={0}
        >
          {presentationNotice}
        </div>
      ) : null}
      {state.toast ? (
        <div
          className="toast"
          role="status"
          onClick={() => dispatch({ type: "CLEAR_TOAST" })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              dispatch({ type: "CLEAR_TOAST" });
            }
          }}
          tabIndex={0}
        >
          <div className="toast-row">
            <span>{state.toast}</span>
            {state.toast === strings.toast.codeDirty ? (
              <div className="toast-actions">
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: "RESET" });
                  }}
                >
                  {strings.toast.resetDemoButton}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <SettingsModal
        open={settingsOpen}
        onClose={closeSettings}
        showArrayIndices={state.showArrayIndices}
        enableAnimationScroll={state.enableAnimationScroll}
        animationFitAllowUpscale={state.animationFitAllowUpscale}
        dispatch={dispatch}
      />
      <KeyboardHelpModal
        open={helpOpen}
        onClose={closeHelp}
        commandPaletteShortcut={paletteShortcut}
      />
      <CommandPalette
        open={commandPaletteOpen}
        onClose={closeCommandPalette}
        onPick={(algorithmId) =>
          dispatch({ type: "SET_ALGORITHM", algorithmId })
        }
        currentAlgorithmId={state.algorithmId}
      />
    </div>
  );
}
