import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AlignEndHorizontal, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AlgorithmId } from "../lib/mockTrace";
import {
  getFilteredPaletteItems,
  getTitleMatchIndices,
} from "../lib/commandPaletteItems";
import { strings } from "../strings";
import { BlockingLoadingOverlay } from "../components/LoadingState";

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
  const listId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [isRoutePending, setIsRoutePending] = useState(false);

  const filtered = useMemo(() => getFilteredPaletteItems(query), [query]);

  useEffect(() => {
    setActiveIndex((i) =>
      filtered.length === 0 ? 0 : Math.min(i, filtered.length - 1)
    );
  }, [filtered]);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const enterApp = (algorithmId: AlgorithmId) => {
    if (isRoutePending) return;
    setIsRoutePending(true);
    navigate(`/app?algorithm=${encodeURIComponent(algorithmId)}`);
  };

  const pickAt = (index: number) => {
    const row = filtered[index];
    if (!row) return;
    enterApp(row.item.id);
  };

  const activeOptionId =
    filtered.length > 0
      ? `${listId}-opt-${filtered[activeIndex].item.id}`
      : undefined;

  return (
    <main className="home-page">
      <div className="home-search-wrap">
        <div className="home-search-input-wrap">
          <button
            type="button"
            className="home-search-leading-icon-button"
            aria-label={strings.home.searchIconAria}
            disabled={isRoutePending}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pickAt(activeIndex)}
          >
            <Search size={16} strokeWidth={2} />
          </button>
          <input
            ref={inputRef}
            type="search"
            className="command-palette-input home-search-input"
            placeholder={strings.home.searchPlaceholder}
            role="combobox"
            aria-label={strings.home.searchAria}
            aria-expanded={isSuggestionOpen}
            aria-autocomplete="list"
            aria-controls={listId}
            aria-activedescendant={activeOptionId}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            disabled={isRoutePending}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsSuggestionOpen(true)}
            onBlur={() => setIsSuggestionOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                if (filtered.length === 0) return;
                setActiveIndex((i) => (i + 1) % filtered.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                if (filtered.length === 0) return;
                setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
              } else if (e.key === "Enter") {
                e.preventDefault();
                pickAt(activeIndex);
              }
            }}
          />
        </div>
        {isSuggestionOpen ? (
          <div
            id={listId}
            className="command-palette-list home-search-list"
            role="listbox"
            aria-label={strings.home.searchAria}
          >
            {filtered.length === 0 ? (
              <div className="command-palette-empty" role="status">
                {strings.commandPalette.empty}
              </div>
            ) : (
              filtered.map(({ item }, index) => {
                const active = index === activeIndex;
                const titleMatchIndices = getTitleMatchIndices(query, item);
                const showSortIcon =
                  item.id === "insertion" || item.id === "selection";
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    id={`${listId}-opt-${item.id}`}
                    className={`command-palette-row${active ? " command-palette-row--active" : ""}`}
                    disabled={isRoutePending}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickAt(index)}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    {showSortIcon ? (
                      <span className="home-search-row-type-icon" aria-hidden>
                        <AlignEndHorizontal size={15} strokeWidth={2} />
                      </span>
                    ) : null}
                    <HighlightedTitle
                      title={item.title}
                      matchIndices={titleMatchIndices}
                    />
                  </button>
                );
              })
            )}
          </div>
        ) : null}
      </div>
      <BlockingLoadingOverlay
        active={isRoutePending}
        label={strings.loading.routeTransition}
      />
    </main>
  );
}
