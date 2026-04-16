const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter((el) => {
    const style = window.getComputedStyle(el);
    return style.visibility !== "hidden" && style.display !== "none";
  });
}

/** Call from container keydown (capture) or document keydown when focus is inside container. */
export function handleFocusTrapTab(
  e: KeyboardEvent,
  container: HTMLElement
): void {
  if (e.key !== "Tab") return;
  const active = document.activeElement;
  if (!(active instanceof Node) || !container.contains(active)) return;

  const nodes = getFocusableElements(container);
  if (nodes.length === 0) return;

  const first = nodes[0];
  const last = nodes[nodes.length - 1];

  if (e.shiftKey) {
    if (active === first) {
      e.preventDefault();
      last.focus();
    }
  } else if (active === last) {
    e.preventDefault();
    first.focus();
  }
}
