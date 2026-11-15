import { assignApprentices, settleCalls, spawnCall } from './calls';
import { CONFIG } from './config';
import { automatedIncomeRate } from './progression';
import type { GameEvent, GameState, StepResult } from './types';

export function createInitialState(seed: number): GameState {
  return {
    clock: 0,
    seed,
    moneyCents: 0,
    incomeCarry: 0,
    upgrades: {
      cord: 0,
      headset: 0,
      extendMill: 0,
      apprentice: 0,
      extendHill: 0,
      trunk: 0,
      extendRiver: 0,
      switchMill: 0,
      switchHill: 0,
      switchRiver: 0,
      dial: 0,
      automaticExchange: 0,
    },
    stats: { connected: 0, missed: 0, earnedCents: 0, playMs: 0 },
    calls: [],
    nextCallId: 1,
    // A first call arrives quickly so a new player is not left waiting.
    nextCallAt: CONFIG.calls.firstCallMs,
    apprenticeBusyUntil: [],
  };
}

/**
 * Earliest moment something happens on its own after the current clock:
 * an arrival, a deadline, or an apprentice ready to take a waiting call.
 */
function nextEventTime(state: GameState): number {
  let time = state.nextCallAt;
  const hasApprentices = state.apprenticeBusyUntil.length > 0;
  for (const call of state.calls) {
    if (call.status === 'ringing') {
      time = Math.min(time, call.expiresAt);
      const takeable = call.rangAt + CONFIG.apprentices.reactionMs;
      if (hasApprentices && takeable > state.clock) time = Math.min(time, takeable);
    } else if (call.endsAt !== null) {
      time = Math.min(time, call.endsAt);
    }
  }
  if (state.calls.some((call) => call.status === 'ringing')) {
    for (const free of state.apprenticeBusyUntil) {
      if (free > state.clock) time = Math.min(time, free);
    }
  }
  return time;
}

/** Adds what the automatic switches earned, keeping fractions of a cent. */
function collectAutomatedIncome(state: GameState, dtMs: number): GameState {
  const rate = automatedIncomeRate(state);
  if (rate === 0) return state;
  const total = state.incomeCarry + rate * dtMs;
  // The epsilon absorbs float drift so 0.999999… counts as the cent it is.
  const cents = Math.floor(total + 1e-9);
  return {
    ...state,
    moneyCents: state.moneyCents + cents,
    incomeCarry: Math.max(0, total - cents),
    stats: { ...state.stats, earnedCents: state.stats.earnedCents + cents },
  };
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
    const assigned = assignApprentices(next);
    next = assigned.state;
    events.push(...assigned.events);
  }

  next = collectAutomatedIncome(next, dtMs);
  return {
    state: { ...next, clock: target, stats: { ...next.stats, playMs: next.stats.playMs + dtMs } },
    events,
  };
}
