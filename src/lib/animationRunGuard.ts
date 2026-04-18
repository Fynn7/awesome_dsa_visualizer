export type AnimationRunGuard = {
  currentRunId: number;
};

export function createAnimationRunGuard(): AnimationRunGuard {
  return { currentRunId: 0 };
}

export function beginAnimationRun(guard: AnimationRunGuard): number {
  guard.currentRunId += 1;
  return guard.currentRunId;
}

export function isAnimationRunCurrent(
  guard: AnimationRunGuard,
  runId: number
): boolean {
  return guard.currentRunId === runId;
}
