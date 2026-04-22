import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Combobox,
  type ComboboxRow,
} from "@visualizer-ui";
import type { AlgorithmId } from "../lib/mockTrace";
import {
  getFilteredPaletteItems,
  getTitleMatchIndices,
  type PaletteItem,
} from "../lib/commandPaletteItems";
import { strings } from "../strings";
import { BlockingLoadingOverlay } from "../components/LoadingState";
import { AlgorithmTypeIcon } from "../components/AlgorithmTypeIcon";

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

  const indexSet = new Set(matchIndices);
  const parts: { text: string; match: boolean }[] = [];
  let i = 0;
  while (i < title.length) {
    const start = i;
    const match = indexSet.has(i);
    while (i < title.length && indexSet.has(i) === match) {
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

export function HomePage() {
  const navigate = useNavigate();
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [isRoutePending, setIsRoutePending] = useState(false);

  const filter = useMemo(
    () => (query: string): PaletteComboboxRow[] => {
      return getFilteredPaletteItems(query).map((row) => ({
        item: row.item,
        key: row.item.id,
      }));
    },
    []
  );

  const enterApp = (algorithmId: AlgorithmId) => {
    if (isRoutePending) return;
    setIsRoutePending(true);
    navigate(`/app?algorithm=${encodeURIComponent(algorithmId)}`);
  };

  return (
    <main className="home-page">
      <Combobox<PaletteItem>
        filter={filter}
        onPick={(item) => enterApp(item.id)}
        autoFocus
        placeholder={strings.home.searchPlaceholder}
        ariaLabel={strings.home.searchAria}
        listVisible={isSuggestionOpen}
        disabled={isRoutePending}
        rowIdPrefix="home-palette"
        classes={{
          root: "home-search-wrap",
          inputWrap: "home-search-input-wrap",
          input: "command-palette-input home-search-input",
          list: "command-palette-list home-search-list",
          empty: "command-palette-empty",
        }}
        onInputFocus={() => setIsSuggestionOpen(true)}
        onInputBlur={() => setIsSuggestionOpen(false)}
        leadingSlot={
          <HomeSearchLeadingIcon
            disabled={isRoutePending}
            onActivate={() => {
              // click fires before blur on some browsers; explicit open keeps list accessible for keyboard users too.
              setIsSuggestionOpen(true);
            }}
          />
        }
        renderEmpty={() => (
          <div className="command-palette-empty" role="status">
            {strings.commandPalette.empty}
          </div>
        )}
        renderRow={({ row, query, active, onClick, onMouseEnter }) => {
          const item = row.item;
          const matchIndices = getTitleMatchIndices(query, item);
          return (
            <button
              type="button"
              className={`command-palette-row${active ? " command-palette-row--active" : ""}`}
              disabled={isRoutePending}
              onClick={onClick}
              onMouseEnter={onMouseEnter}
            >
              <AlgorithmTypeIcon iconKey={item.iconKey} />
              <HighlightedTitle
                title={item.title}
                matchIndices={matchIndices}
              />
            </button>
          );
        }}
      />
      <BlockingLoadingOverlay
        active={isRoutePending}
        label={strings.loading.routeTransition}
      />
    </main>
  );
}

function HomeSearchLeadingIcon({
  disabled,
  onActivate,
}: {
  disabled: boolean;
  onActivate: () => void;
}) {
  return (
    <button
      type="button"
      className="home-search-leading-icon-button"
      aria-label={strings.home.searchIconAria}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onActivate}
      tabIndex={-1}
    >
      <Search size={16} strokeWidth={2} />
    </button>
  );
}
