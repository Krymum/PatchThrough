import { CONFIG } from './config';
import { SUBSCRIBER_IDS, type SubscriberId } from './directory';
import { nextRandom, randomInt } from './rng';
import type { Call, GameEvent, GameState, StepResult } from './types';
import { cordCount } from './upgrades';

/** Subscribers that are neither calling nor being called right now. */
export function idleSubscribers(calls: readonly Call[]): SubscriberId[] {
  const busy = new Set<SubscriberId>();
  for (const call of calls) {
    busy.add(call.from);
    busy.add(call.to);
  }
  return SUBSCRIBER_IDS.filter((id) => !busy.has(id));
}

export function freeCords(state: GameState): number {
  const used = state.calls.filter((call) => call.status === 'connected').length;
  return cordCount(state) - used;
}

/** Delay until the next incoming call, randomised around the average. */
export function drawCallDelay(seed: number): { delayMs: number; seed: number } {
  const { intervalMs, intervalJitter } = CONFIG.calls;
  const draw = nextRandom(seed);
  const factor = 1 - intervalJitter + draw.value * 2 * intervalJitter;
  return { delayMs: Math.round(intervalMs * factor), seed: draw.seed };
}

/**
 * Lights a new lamp on the board between two idle subscribers. When fewer
 * than two subscribers are free the call is skipped: the town is busy.
 */
export function spawnCall(state: GameState): StepResult {
  const idle = idleSubscribers(state.calls);
  const delay = drawCallDelay(state.seed);
  const base = { ...state, seed: delay.seed, nextCallAt: state.clock + delay.delayMs };
  if (idle.length < 2) {
    return { state: base, events: [] };
  }

  const fromDraw = randomInt(base.seed, 0, idle.length - 1);
  const from = idle[fromDraw.value];
  const others = idle.filter((id) => id !== from);
  const toDraw = randomInt(fromDraw.seed, 0, others.length - 1);
  const to = others[toDraw.value];
  if (from === undefined || to === undefined) {
    return { state: base, events: [] };
  }

  const call: Call = {
    id: state.nextCallId,
    from,
    to,
    status: 'ringing',
    expiresAt: state.clock + CONFIG.calls.patienceMs,
    endsAt: null,
  };
  return {
    state: {
      ...base,
      seed: toDraw.seed,
      calls: [...state.calls, call],
      nextCallId: state.nextCallId + 1,
    },
    events: [{ type: 'call-incoming', callId: call.id }],
  };
}

/** Drops callers who waited too long and frees cords of finished calls. */
export function settleCalls(state: GameState): StepResult {
  const events: GameEvent[] = [];
  let missed = 0;
  const calls = state.calls.filter((call) => {
    if (call.status === 'ringing' && state.clock >= call.expiresAt) {
      missed += 1;
      events.push({ type: 'call-lost', callId: call.id });
      return false;
    }
    if (call.status === 'connected' && call.endsAt !== null && state.clock >= call.endsAt) {
      events.push({ type: 'call-ended', callId: call.id });
      return false;
    }
    return true;
  });
  if (events.length === 0) {
    return { state, events };
  }
  return {
    state: { ...state, calls, stats: { ...state.stats, missed: state.stats.missed + missed } },
    events,
  };
}

export type ConnectOutcome = 'connected' | 'not-ringing' | 'wrong-line' | 'no-free-cord';

export interface ConnectResult extends StepResult {
  outcome: ConnectOutcome;
}

/**
 * The operator plugs a ringing call into a destination jack. Only the jack
 * the caller asked for completes the call, and a free cord pair is needed.
 */
export function connectCall(state: GameState, callId: number, target: SubscriberId): ConnectResult {
  const call = state.calls.find((c) => c.id === callId);
  if (call?.status !== 'ringing') {
    return { state, events: [], outcome: 'not-ringing' };
  }
  if (call.to !== target) {
    return { state, events: [], outcome: 'wrong-line' };
  }
  if (freeCords(state) <= 0) {
    return { state, events: [], outcome: 'no-free-cord' };
  }

  const { minDurationMs, maxDurationMs, payoutCents } = CONFIG.calls;
  const duration = randomInt(state.seed, minDurationMs, maxDurationMs);
  const connected: Call = { ...call, status: 'connected', endsAt: state.clock + duration.value };
  return {
    state: {
      ...state,
      seed: duration.seed,
      moneyCents: state.moneyCents + payoutCents,
      calls: state.calls.map((c) => (c.id === callId ? connected : c)),
      stats: {
        ...state.stats,
        connected: state.stats.connected + 1,
        earnedCents: state.stats.earnedCents + payoutCents,
      },
    },
    events: [{ type: 'call-connected', callId, payoutCents }],
    outcome: 'connected',
  };
}
