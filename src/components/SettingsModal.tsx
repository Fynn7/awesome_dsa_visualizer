import type { Dispatch } from "react";
import { Dialog, Switch } from "@visualizer-ui";
import type { ExecutionAction } from "../lib/executionReducer";
import { strings } from "../strings";

type Props = {
  open: boolean;
  onClose: () => void;
  showArrayIndices: boolean;
  enableAnimationScroll: boolean;
  animationFitAllowUpscale: boolean;
  replayAnimationsOnStepBack: boolean;
  dispatch: Dispatch<ExecutionAction>;
};

export function SettingsModal({
  open,
  onClose,
  showArrayIndices,
  enableAnimationScroll,
  animationFitAllowUpscale,
  replayAnimationsOnStepBack,
  dispatch,
}: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={strings.settings.title}
      closeAriaLabel={strings.settings.close}
      variant="centered"
    >
      <div className="settings-toggle-group">
        <Switch
          label={strings.settings.showArrayIndices}
          checked={showArrayIndices}
          onCheckedChange={(value) =>
            dispatch({ type: "SET_SHOW_ARRAY_INDICES", value })
          }
        />
        <div className="settings-animation-fit-block">
          <Switch
            label={strings.settings.enableAnimationScroll}
            checked={enableAnimationScroll}
            onCheckedChange={(value) =>
              dispatch({ type: "SET_ENABLE_ANIMATION_SCROLL", value })
            }
          />
          {!enableAnimationScroll ? (
            <div className="settings-toggle-nested">
              <Switch
                label={strings.settings.animationFitAllowUpscale}
                checked={animationFitAllowUpscale}
                onCheckedChange={(value) =>
                  dispatch({ type: "SET_ANIMATION_FIT_ALLOW_UPSCALE", value })
                }
              />
            </div>
          ) : null}
        </div>
        <Switch
          label={strings.settings.replayAnimationsOnStepBack}
          checked={replayAnimationsOnStepBack}
          onCheckedChange={(value) =>
            dispatch({ type: "SET_REPLAY_ON_STEP_BACK", value })
          }
        />
      </div>
    </Dialog>
  );
}
