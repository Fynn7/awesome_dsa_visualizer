/**
 * Persists user-facing UI preferences (display connections toggle, step-back
 * replay, etc.) in `localStorage`. Extracted from `App.tsx` so the storage
 * shape lives in exactly one place and can be unit-tested independently of
 * React.
 */

const STORAGE_KEY = "awesome-dsa-visualizer:ui-preferences";

export type UiPreferences = {
  displayConnections: boolean;
  replayAnimationsOnStepBack: boolean;
};

const DEFAULTS: UiPreferences = {
  displayConnections: false,
  replayAnimationsOnStepBack: false,
};

function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(window.localStorage);
  } catch {
    return false;
  }
}

export function loadUiPreferences(): UiPreferences {
  if (!isStorageAvailable()) return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<UiPreferences> & Record<string, unknown>;
    return {
      displayConnections: parsed.displayConnections === true,
      replayAnimationsOnStepBack: parsed.replayAnimationsOnStepBack === true,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveUiPreferences(prefs: UiPreferences): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore write failures (private mode, quota, disabled storage).
  }
}

export const UI_PREFERENCES_STORAGE_KEY = STORAGE_KEY;
