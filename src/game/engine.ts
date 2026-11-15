import { settleCalls, spawnCall } from './calls';
import { CONFIG } from './config';
import type { GameEvent, GameState, StepResult } from './types';

export function createInitialState(seed: number): GameState {
  return {
    clock: 0,
    seed,
    moneyCents: 0,
    upgrades: { cord: 0 },
    stats: { connected: 0, missed: 0, earnedCents: 0, playMs: 0 },
    calls: [],
    nextCallId: 1,
    // A first call arrives quickly so a new player is not left waiting.
    nextCallAt: Math.round(CONFIG.calls.intervalMs / 2),
  };
}

/** Earliest moment something happens on its own: an arrival or a deadline. */
function nextEventTime(state: GameState): number {
  let time = state.nextCallAt;
  for (const call of state.calls) {
    time = Math.min(time, call.status === 'ringing' ? call.expiresAt : (call.endsAt ?? time));
  }
  return time;
}

/**
 * Advances the simulation by `dtMs` of live play. The clock jumps from one
 * scheduled event to the next, so the outcome does not depend on how the
 * elapsed time is sliced into frames.
 */
export function advance(state: GameState, dtMs: number): StepResult {
  if (dtMs <= 0) return { state, events: [] };
  const target = state.clock + dtMs;
  const events: GameEvent[] = [];
  let next = state;

  for (let time = nextEventTime(next); time <= target; time = nextEventTime(next)) {
    next = { ...next, clock: time };
    const settled = settleCalls(next);
    next = settled.state;
    events.push(...settled.events);
    if (next.clock >= next.nextCallAt) {
      const spawned = spawnCall(next);
      next = spawned.state;
      events.push(...spawned.events);
    }
  }

  return {
    state: { ...next, clock: target, stats: { ...next.stats, playMs: next.stats.playMs + dtMs } },
    events,
  };
}
