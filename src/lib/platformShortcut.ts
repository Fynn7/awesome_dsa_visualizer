/** True for macOS / iOS-style platforms where ⌘ replaces Ctrl for common shortcuts. */
export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

export function commandPaletteShortcutLabel(): string {
  return isApplePlatform() ? "Cmd+Shift+P" : "Ctrl+Shift+P";
}
