import { useMemo, useRef } from "react";
import {
  Combobox,
  Dialog,
  type ComboboxHandle,
  type ComboboxRow,
} from "@visualizer-ui";
import type { AlgorithmId } from "../lib/mockTrace";
import {
  getFilteredPaletteItems,
  getTitleMatchIndices,
  type PaletteItem,
} from "../lib/commandPaletteItems";
import { strings } from "../strings";
import { AlgorithmTypeIcon } from "./AlgorithmTypeIcon";

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (id: AlgorithmId) => void;
  currentAlgorithmId: AlgorithmId;
};

type PaletteComboboxRow = ComboboxRow<PaletteItem>;

function HighlightedTitle({
  title,
  matchIndices,
}: {
  title: string;
  matchIndices: number[];
}) {
  if (matchIndices.length === 0) {
    return <span className="command-palette-row-title">{title}</span>;
  }
  const set = new Set(matchIndices);
  const parts: { text: string; match: boolean }[] = [];
  let i = 0;
  while (i < title.length) {
    const start = i;
    const match = set.has(i);
    while (i < title.length && set.has(i) === match) {
      i += 1;
    }
    parts.push({ text: title.slice(start, i), match });
  }
  return (
    <span className="command-palette-row-title">
      {parts.map((part, idx) =>
        part.match ? (
          <span key={idx} className="command-palette-row-title-match">
            {part.text}
          </span>
        ) : (
          <span key={idx}>{part.text}</span>
        )
      )}
    </span>
  );
}

export function CommandPalette({
  open,
  onClose,
  onPick,
  currentAlgorithmId,
}: Props) {
  const comboboxRef = useRef<ComboboxHandle>(null);

  const filter = useMemo(
    () => (query: string): PaletteComboboxRow[] => {
      return getFilteredPaletteItems(query).map((row) => ({
        item: row.item,
        key: row.item.id,
      }));
    },
    []
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={strings.commandPalette.ariaLabel}
      visibleTitle={false}
      showCloseButton={false}
      variant="command"
    >
      <Combobox<PaletteItem>
        ref={comboboxRef}
        filter={filter}
        onPick={(item) => {
          onPick(item.id);
          onClose();
        }}
        autoFocus
        open={open}
        placeholder={strings.commandPalette.inputPlaceholder}
        ariaLabel={strings.commandPalette.ariaLabel}
        classes={{
          input: "command-palette-input",
          list: "command-palette-list",
          empty: "command-palette-empty",
        }}
        rowIdPrefix="cmd-palette"
        renderEmpty={() => (
          <div className="command-palette-empty" role="status">
            {strings.commandPalette.empty}
          </div>
        )}
        renderRow={({ row, index, active, query, onClick, onMouseEnter }) => {
          const item = row.item;
          const current = item.id === currentAlgorithmId;
          const matchIndices = getTitleMatchIndices(query, item);
          return (
            <button
              key={`${item.id}-${index}`}
              type="button"
              className={`command-palette-row${active ? " command-palette-row--active" : ""}`}
              onClick={onClick}
              onMouseEnter={onMouseEnter}
            >
              <AlgorithmTypeIcon iconKey={item.iconKey} />
              <HighlightedTitle
                title={item.title}
                matchIndices={matchIndices}
              />
              {current ? (
                <span className="command-palette-row-badge">
                  {strings.commandPalette.currentBadge}
                </span>
              ) : null}
            </button>
          );
        }}
      />
    </Dialog>
  );
}
