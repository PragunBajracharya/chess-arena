import type { ClockState, Color } from "@chess/shared";

export function createClock(initialMs: number, incrementMs: number): ClockState {
  return { whiteMs: initialMs, blackMs: initialMs, lastMoveAt: null, incrementMs };
}

/** Time left for `color` right now (the running side's clock keeps ticking). */
export function remainingMs(
  clock: ClockState,
  color: Color,
  toMove: Color,
  now = Date.now(),
): number {
  const base = color === "white" ? clock.whiteMs : clock.blackMs;
  if (clock.lastMoveAt === null || color !== toMove) return base;
  return Math.max(0, base - (now - clock.lastMoveAt));
}

/**
 * Charge the mover for the time spent and add the increment.
 * The clock does not run before white's first move (like most sites).
 */
export function pressClock(
  clock: ClockState,
  mover: Color,
  now = Date.now(),
): { clock: ClockState; timeSpentMs: number; flagged: boolean } {
  const spent = clock.lastMoveAt === null ? 0 : now - clock.lastMoveAt;
  const key = mover === "white" ? "whiteMs" : "blackMs";
  const left = clock[key] - spent;
  if (left <= 0) {
    return { clock: { ...clock, [key]: 0 }, timeSpentMs: spent, flagged: true };
  }
  return {
    clock: { ...clock, [key]: left + clock.incrementMs, lastMoveAt: now },
    timeSpentMs: spent,
    flagged: false,
  };
}
