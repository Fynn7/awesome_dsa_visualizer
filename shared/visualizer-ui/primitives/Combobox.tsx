import type {
  ChangeEvent,
  FocusEvent,
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  Ref,
} from "react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * Combobox primitive. Headless wrapper for the shared search + keyboard-navigable
 * list UI used by both the home search (inline, shows on focus) and the command
 * palette (modal). It owns:
 *   - input element + controlled query
 *   - active index + arrow key navigation
 *   - aria-activedescendant wiring
 *   - Enter-to-pick
 *   - scroll-into-view of the active row
 *
 * Visual styles are driven by classes caller provides (`classes` prop) so both
 * surfaces can keep their distinct framing while sharing behavior.
 */

export type ComboboxRow<Item> = {
  item: Item;
  /** Stable key used for React `key` and `aria-activedescendant` id derivation. */
  key: string;
};

export type ComboboxRenderRowArgs<Item> = {
  row: ComboboxRow<Item>;
  index: number;
  active: boolean;
  id: string;
  query: string;
  onClick: () => void;
  onMouseEnter: () => void;
};

export type ComboboxClasses = {
  /** Outer wrapper; defaults to no class. */
  root?: string;
  inputWrap?: string;
  input?: string;
  list?: string;
  empty?: string;
};

export type ComboboxHandle = {
  focusInput: () => void;
  resetQuery: () => void;
};

export type ComboboxProps<Item> = {
  /** Current query text; if omitted, component manages it internally. */
  query?: string;
  onQueryChange?: (next: string) => void;
  /** Given the current query, returns the filtered rows to display. */
  filter: (query: string) => ComboboxRow<Item>[];
  /** Called when user picks a row (Enter / click). */
  onPick: (item: Item, index: number) => void;
  /** Required: renders a single row button. */
  renderRow: (args: ComboboxRenderRowArgs<Item>) => ReactNode;
  /** Optional empty-state content. */
  renderEmpty?: () => ReactNode;
  /** Whether list is visible. Defaults to `true`; HomePage toggles this on focus/blur. */
  listVisible?: boolean;
  /** Autofocus input on mount. */
  autoFocus?: boolean;
  /** Reset query + activeIndex when `open` flips true (useful for modal usage). */
  open?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  classes?: ComboboxClasses;
  /** Disabled state for input + rows. */
  disabled?: boolean;
  /** Called when the input gets focus; used by HomePage to open its list. */
  onInputFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  /** Called when the input loses focus. */
  onInputBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  /** Forwarded attributes on the input element. */
  inputExtraProps?: Omit<
    HTMLAttributes<HTMLInputElement>,
    "role" | "aria-expanded" | "aria-controls" | "aria-activedescendant"
  >;
  /** Optional leading slot rendered inside the input row (e.g. search icon). */
  leadingSlot?: ReactNode;
  /** Key used to namespace row IDs (useful when multiple comboboxes are on screen). */
  rowIdPrefix?: string;
};

function ComboboxInner<Item>(
  props: ComboboxProps<Item>,
  ref: Ref<ComboboxHandle>
) {
  const {
    query: controlledQuery,
    onQueryChange,
    filter,
    onPick,
    renderRow,
    renderEmpty,
    listVisible = true,
    autoFocus = false,
    open,
    placeholder,
    ariaLabel,
    classes,
    disabled = false,
    onInputFocus,
    onInputBlur,
    inputExtraProps,
    leadingSlot,
    rowIdPrefix,
  } = props;

  const autoId = useId();
  const listId = `${autoId}-list`;
  const prefix = rowIdPrefix ?? autoId;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [internalQuery, setInternalQuery] = useState("");
  const query = controlledQuery ?? internalQuery;
  const setQuery = useCallback(
    (next: string) => {
      if (onQueryChange) onQueryChange(next);
      else setInternalQuery(next);
    },
    [onQueryChange]
  );

  const filtered = useMemo(() => filter(query), [filter, query]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex((i) =>
      filtered.length === 0 ? 0 : Math.min(i, filtered.length - 1)
    );
  }, [filtered]);

  useEffect(() => {
    if (open === undefined) return;
    if (open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open, setQuery]);

  useEffect(() => {
    if (!autoFocus) return;
    const raf = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [autoFocus]);

  useImperativeHandle(
    ref,
    () => ({
      focusInput: () => {
        inputRef.current?.focus();
      },
      resetQuery: () => {
        setQuery("");
        setActiveIndex(0);
      },
    }),
    [setQuery]
  );

  const activeRow = filtered[activeIndex];
  const activeOptionId = activeRow ? `${prefix}-opt-${activeRow.key}` : undefined;

  useLayoutEffect(() => {
    if (!listVisible || filtered.length === 0) return;
    const row = filtered[activeIndex];
    if (!row) return;
    const el = document.getElementById(`${prefix}-opt-${row.key}`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, filtered, listVisible, prefix]);

  const pickAt = (index: number) => {
    const row = filtered[index];
    if (!row) return;
    onPick(row.item, index);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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

  const preventMouseDownBlur = (e: MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div className={classes?.root}>
      <div className={classes?.inputWrap}>
        {leadingSlot}
        <input
          {...inputExtraProps}
          ref={inputRef}
          type="search"
          value={query}
          onChange={onInputChange}
          onKeyDown={onInputKeyDown}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
          placeholder={placeholder}
          aria-label={ariaLabel}
          role="combobox"
          aria-expanded={listVisible && filtered.length > 0}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={listVisible ? activeOptionId : undefined}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={disabled}
          className={classes?.input}
        />
      </div>
      {listVisible ? (
        <div
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className={classes?.list}
        >
          {filtered.length === 0
            ? renderEmpty
              ? renderEmpty()
              : null
            : filtered.map((row, index) => {
                const id = `${prefix}-opt-${row.key}`;
                const active = index === activeIndex;
                return (
                  <div
                    key={row.key}
                    id={id}
                    role="option"
                    aria-selected={active}
                    onMouseDown={preventMouseDownBlur}
                  >
                    {renderRow({
                      row,
                      index,
                      active,
                      id,
                      query,
                      onClick: () => pickAt(index),
                      onMouseEnter: () => setActiveIndex(index),
                    })}
                  </div>
                );
              })}
        </div>
      ) : null}
    </div>
  );
}

export const Combobox = forwardRef(ComboboxInner) as <Item>(
  props: ComboboxProps<Item> & { ref?: Ref<ComboboxHandle> }
) => ReturnType<typeof ComboboxInner<Item>>;
