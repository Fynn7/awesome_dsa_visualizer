export type PointerTransitionState = {
  mounted: boolean;
  exiting: boolean;
};

export type PointerTransitionMap<K extends string> = Record<
  K,
  PointerTransitionState
>;

export function createPointerTransitionMap<K extends string>(
  keys: readonly K[]
): PointerTransitionMap<K> {
  return keys.reduce(
    (acc, key) => {
      acc[key] = { mounted: false, exiting: false };
      return acc;
    },
    {} as PointerTransitionMap<K>
  );
}

export function showPointer<K extends string>(
  state: PointerTransitionMap<K>,
  key: K
): void {
  state[key].mounted = true;
  state[key].exiting = false;
}

export function beginPointerExit<K extends string>(
  state: PointerTransitionMap<K>,
  key: K
): boolean {
  const entry = state[key];
  if (!entry.mounted || entry.exiting) return false;
  entry.exiting = true;
  return true;
}

export function completePointerExit<K extends string>(
  state: PointerTransitionMap<K>,
  key: K
): void {
  state[key].mounted = false;
  state[key].exiting = false;
}
