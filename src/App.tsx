import { flushSync } from "react-dom";
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { HelpCircle, Search, Settings } from "lucide-react";
import { Button, IconButton, Toast, ToastProvider } from "@visualizer-ui";
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
import {
  loadUiPreferences,
  saveUiPreferences,
} from "./lib/uiPreferencesStorage";
import { OverlayProvider } from "./providers/OverlayProvider";
import { useOverlayManager } from "./hooks/useOverlayManager";
import { strings } from "./strings";
import type { AlgorithmId } from "./lib/mockTrace";

const HEADER_ICON = { size: 18, strokeWidth: 2 } as const;

type PresentationMode = "off" | "native" | "overlay";

type AppProps = {
  initialAlgorithmId?: AlgorithmId;
};

export default function App({ initialAlgorithmId }: AppProps) {
  return (
    <ToastProvider>
      <OverlayProvider>
        <AppInner initialAlgorithmId={initialAlgorithmId} />
      </OverlayProvider>
    </ToastProvider>
  );
}

function AppInner({ initialAlgorithmId }: AppProps) {
  const [state, dispatch] = useReducer(
    executionReducer,
    undefined,
    () => createInitialState(loadUiPreferences())
  );
  const [presentationMode, setPresentationMode] =
    useState<PresentationMode>("off");
  const [presentationNotice, setPresentationNotice] = useState<string | null>(
    null
  );
  const [workspaceBusy, setWorkspaceBusy] = useState(true);
  const presentationShellRef = useRef<HTMLDivElement | null>(null);
  const overlay = useOverlayManager();

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
    if (!initialAlgorithmId) return;
    dispatch({ type: "SET_ALGORITHM", algorithmId: initialAlgorithmId });
  }, [initialAlgorithmId]);

  useEffect(() => {
    saveUiPreferences({
      displayConnections: state.displayConnections,
      replayAnimationsOnStepBack: state.replayAnimationsOnStepBack,
    });
  }, [state.displayConnections, state.replayAnimationsOnStepBack]);

  return (
    <div className="app-shell" aria-busy={workspaceBusy}>
      <header className="app-header">
        <h1 className="app-header-title">
          {getAlgorithmTitle(state.algorithmId)}
        </h1>
        <div className="app-header-actions">
          <button
            ref={(el) => overlay.registerTrigger("commandPalette", el)}
            type="button"
            className="command-palette-trigger"
            aria-label={strings.header.commandAria}
            onClick={() => overlay.open("commandPalette")}
          >
            <span className="command-palette-trigger-icon" aria-hidden>
              <Search size={14} strokeWidth={2} />
            </span>
            <span className="command-palette-trigger-placeholder">
              {strings.header.commandPlaceholder}
            </span>
          </button>
          <IconButton
            ref={(el) => overlay.registerTrigger("help", el)}
            className="app-header-help"
            aria-label={strings.toolbar.openKeyboardHelp}
            onClick={() => overlay.open("help")}
          >
            <HelpCircle {...HEADER_ICON} aria-hidden />
          </IconButton>
          <IconButton
            ref={(el) => overlay.registerTrigger("settings", el)}
            className="app-header-settings"
            aria-label={strings.toolbar.openSettings}
            onClick={() => overlay.open("settings")}
          >
            <Settings {...HEADER_ICON} aria-hidden />
          </IconButton>
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
      <Toast
        open={presentationNotice !== null}
        onOpenChange={(open) => {
          if (!open) setPresentationNotice(null);
        }}
      >
        {presentationNotice ?? ""}
      </Toast>
      <Toast
        open={state.toast !== null}
        onOpenChange={(open) => {
          if (!open) dispatch({ type: "CLEAR_TOAST" });
        }}
        action={
          state.toast === strings.toast.codeDirty ? (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: "RESET" });
              }}
            >
              {strings.toast.resetDemoButton}
            </Button>
          ) : undefined
        }
      >
        {state.toast ?? ""}
      </Toast>
      <SettingsModal
        open={overlay.isOpen("settings")}
        onClose={() => overlay.close("settings")}
        showArrayIndices={state.showArrayIndices}
        enableAnimationScroll={state.enableAnimationScroll}
        animationFitAllowUpscale={state.animationFitAllowUpscale}
        replayAnimationsOnStepBack={state.replayAnimationsOnStepBack}
        dispatch={dispatch}
      />
      <KeyboardHelpModal
        open={overlay.isOpen("help")}
        onClose={() => overlay.close("help")}
        commandPaletteShortcut={paletteShortcut}
      />
      <CommandPalette
        open={overlay.isOpen("commandPalette")}
        onClose={() => overlay.close("commandPalette")}
        onPick={(algorithmId) =>
          dispatch({ type: "SET_ALGORITHM", algorithmId })
        }
        currentAlgorithmId={state.algorithmId}
      />
    </div>
  );
}
