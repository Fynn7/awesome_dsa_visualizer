import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { AlgorithmId } from "../lib/mockTrace";
import { getFilteredPaletteItems, getTitleMatchIndices } from "../lib/commandPaletteItems";
import { handleFocusTrapTab } from "../lib/focusTrap";
import { strings } from "../strings";

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (id: AlgorithmId) => void;
  currentAlgorithmId: AlgorithmId;
};

function CommandPaletteHighlightedTitle({
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
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(
    () => getFilteredPaletteItems(query),
    [query]
  );

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const t = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(t);
  }, [open]);

  useEffect(() => {
    setActiveIndex((i) =>
      filtered.length === 0 ? 0 : Math.min(i, filtered.length - 1)
    );
  }, [filtered]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  useLayoutEffect(() => {
    if (!open || filtered.length === 0) return;
    const row = filtered[activeIndex];
    if (!row) return;
    const id = `${listId}-opt-${row.item.id}`;
    document.getElementById(id)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, filtered, listId, open]);

  if (!open) return null;

  const pickAt = (index: number) => {
    const row = filtered[index];
    if (!row) return;
    onPick(row.item.id);
    onClose();
  };

  const activeOptionId =
    filtered.length > 0
      ? `${listId}-opt-${filtered[activeIndex].item.id}`
      : undefined;

  const onKeyDownPanel = (e: React.KeyboardEvent) => {
    const panel = panelRef.current;
    if (e.key === "Tab" && panel) {
      handleFocusTrapTab(e.nativeEvent, panel);
      return;
    }
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
  };

  return (
    <div className="command-palette-overlay" role="presentation">
      <button
        type="button"
        className="command-palette-backdrop-hit"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="command-palette-panel"
        role="dialog"
        aria-modal="true"
        aria-label={strings.commandPalette.ariaLabel}
        onKeyDown={onKeyDownPanel}
      >
        <input
          ref={inputRef}
          type="search"
          className="command-palette-input"
          placeholder={strings.commandPalette.inputPlaceholder}
          role="combobox"
          aria-expanded={filtered.length > 0}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={activeOptionId}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div
          id={listId}
          className="command-palette-list"
          role="listbox"
          aria-label={strings.commandPalette.ariaLabel}
        >
          {filtered.length === 0 ? (
            <div className="command-palette-empty" role="status">
              {strings.commandPalette.empty}
            </div>
          ) : (
            filtered.map(({ item }, index) => {
              const current = item.id === currentAlgorithmId;
              const active = index === activeIndex;
              const titleMatchIndices = getTitleMatchIndices(query, item);
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  id={`${listId}-opt-${item.id}`}
                  className={`command-palette-row${active ? " command-palette-row--active" : ""}`}
                  onClick={() => pickAt(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <CommandPaletteHighlightedTitle
                    title={item.title}
                    matchIndices={titleMatchIndices}
                  />
                  {current ? (
                    <span className="command-palette-row-badge">
                      {strings.commandPalette.currentBadge}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
