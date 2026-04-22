import "@testing-library/jest-dom/vitest";

/**
 * Radix UI primitives (Dialog, Popover, Tooltip) rely on these browser APIs
 * that jsdom does not implement. We stub conservative no-ops so component
 * contract tests can run without touching layout semantics.
 */
if (typeof window !== "undefined") {
  if (!("PointerEvent" in window)) {
    (window as unknown as { PointerEvent: typeof MouseEvent }).PointerEvent =
      class extends MouseEvent {} as unknown as typeof MouseEvent;
  }
  type ScrollableElement = {
    scrollIntoView?: (options?: boolean | ScrollIntoViewOptions) => void;
    hasPointerCapture?: (pointerId: number) => boolean;
    releasePointerCapture?: (pointerId: number) => void;
    setPointerCapture?: (pointerId: number) => void;
  };
  const proto = window.Element.prototype as unknown as ScrollableElement;
  if (typeof proto.scrollIntoView !== "function") {
    proto.scrollIntoView = () => {};
  }
  if (typeof proto.hasPointerCapture !== "function") {
    proto.hasPointerCapture = () => false;
  }
  if (typeof proto.releasePointerCapture !== "function") {
    proto.releasePointerCapture = () => {};
  }
  if (typeof proto.setPointerCapture !== "function") {
    proto.setPointerCapture = () => {};
  }
  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList;
  }
  if (!("ResizeObserver" in window)) {
    class ResizeObserverPolyfill {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
    (window as unknown as { ResizeObserver: typeof ResizeObserverPolyfill })
      .ResizeObserver = ResizeObserverPolyfill;
  }
}
