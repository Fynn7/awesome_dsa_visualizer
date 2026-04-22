import type { ReactNode } from "react";
import {
  CircleHelp,
  LogOut,
  Pause,
  Play,
  Search,
  StepBack,
  StepForward,
} from "lucide-react";
import { Dialog } from "@visualizer-ui";
import { strings } from "../strings";

const ROW_ICON = { size: 20, strokeWidth: 2 } as const;

type Props = {
  open: boolean;
  onClose: () => void;
  commandPaletteShortcut: string;
};

function HelpRow({
  icon,
  keys,
  ariaLabel,
}: {
  icon: ReactNode;
  keys: ReactNode;
  ariaLabel: string;
}) {
  return (
    <div className="help-row" role="listitem" aria-label={ariaLabel}>
      <span className="help-row-icon" aria-hidden>
        {icon}
      </span>
      <div className="help-row-keys">{keys}</div>
    </div>
  );
}

export function KeyboardHelpModal({
  open,
  onClose,
  commandPaletteShortcut,
}: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={strings.help.title}
      closeAriaLabel={strings.help.close}
      variant="centered"
      className="help-dialog"
    >
      <div className="help-grid" role="list">
        <HelpRow
          ariaLabel={strings.help.rowShortcutsHelpAria}
          icon={<CircleHelp {...ROW_ICON} />}
          keys={<kbd className="help-kbd">?</kbd>}
        />
        <HelpRow
          ariaLabel={`${strings.help.rowPalette}: ${commandPaletteShortcut}`}
          icon={<Search {...ROW_ICON} />}
          keys={<kbd className="help-kbd">{commandPaletteShortcut}</kbd>}
        />
      </div>
      <div className="help-group-label" aria-hidden>
        <span className="help-group-line" />
        <span>{strings.help.presentGroup}</span>
        <span className="help-group-line" />
      </div>
      <div className="help-grid" role="list">
        <HelpRow
          ariaLabel={`${strings.help.rowExit}: Escape`}
          icon={<LogOut {...ROW_ICON} />}
          keys={<kbd className="help-kbd">Esc</kbd>}
        />
        <HelpRow
          ariaLabel={`${strings.help.rowPlayPause}: Space`}
          icon={
            <>
              <Play {...ROW_ICON} />
              <Pause {...ROW_ICON} />
            </>
          }
          keys={<kbd className="help-kbd">Space</kbd>}
        />
        <HelpRow
          ariaLabel={`${strings.help.rowNext}: ${strings.help.rowNextAria}`}
          icon={<StepForward {...ROW_ICON} />}
          keys={
            <>
              <kbd className="help-kbd">Enter</kbd>
              <span className="help-kbd-sep" aria-hidden>
                {strings.help.rowNextKeySep}
              </span>
              <kbd className="help-kbd">→</kbd>
              <span className="help-kbd-sep" aria-hidden>
                {strings.help.rowNextKeySep}
              </span>
              <kbd className="help-kbd">{strings.help.mouseLeftClick}</kbd>
            </>
          }
        />
        <HelpRow
          ariaLabel={`${strings.help.rowPrev}: ${strings.help.rowPrevAria}`}
          icon={<StepBack {...ROW_ICON} />}
          keys={
            <>
              <kbd className="help-kbd">←</kbd>
              <span className="help-kbd-sep" aria-hidden>
                {strings.help.rowNextKeySep}
              </span>
              <kbd className="help-kbd">{strings.help.mouseRightClick}</kbd>
            </>
          }
        />
      </div>
    </Dialog>
  );
}
