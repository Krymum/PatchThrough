import { CONFIG } from './config';
import {
  LOCAL_DISTRICTS,
  districtOf,
  subscribersIn,
  type DistrictId,
  type SubscriberId,
} from './directory';
import { manualCallRate, manualDistricts, patienceMs, isOpen } from './progression';
import { nextRandom, randomInt } from './rng';
import type { Call, GameEvent, GameState, Handler, StepResult } from './types';
import { cordCount } from './upgrades';

function busyLines(calls: readonly Call[]): Set<SubscriberId> {
  const busy = new Set<SubscriberId>();
  for (const call of calls) {
    busy.add(call.from);
    busy.add(call.to);
  }
  return busy;
}

export function freeCords(state: GameState): number {
  const used = state.calls.filter((call) => call.handler === 'player').length;
  return cordCount(state) - used;
}

/** Delay until the next incoming call, randomised around the current average. */
export function drawCallDelay(state: GameState): { delayMs: number; seed: number } {
  const rate = manualCallRate(state);
  if (rate === 0) return { delayMs: Infinity, seed: state.seed };
  const { intervalJitter } = CONFIG.calls;
  const draw = nextRandom(state.seed);
  const factor = 1 - intervalJitter + draw.value * 2 * intervalJitter;
  return { delayMs: Math.round(factor / rate), seed: draw.seed };
}

/**
 * Who may be called from a district. Local calls stay among hand-switched
 * lines; long-distance calls can reach any open line, even an automatic one,
 * because incoming trunk calls still need the operator.
 */
function calleePool(state: GameState, from: DistrictId, busy: Set<SubscriberId>): SubscriberId[] {
  const districts: DistrictId[] =
    from === 'trunk'
      ? LOCAL_DISTRICTS.filter((d) => isOpen(state, d))
      : manualDistricts(state).filter((d) => d !== 'trunk');
  return districts.flatMap(subscribersIn).filter((id) => !busy.has(id));
}

/**
 * Lights a new lamp on the board. The calling district is drawn in
 * proportion to how often it calls; when nobody suitable is free the call
 * is skipped: the town is busy.
 */
export function spawnCall(state: GameState): StepResult {
  const delay = drawCallDelay(state);
  const base: GameState = { ...state, seed: delay.seed, nextCallAt: state.clock + delay.delayMs };
  const busy = busyLines(state.calls);

  const candidates = manualDistricts(state)
    .map((district) => ({
      district,
      callers: subscribersIn(district).filter((id) => !busy.has(id)),
    }))
    .filter(({ callers }) => callers.length > 0);
  const totalWeight = candidates.reduce(
    (sum, c) => sum + CONFIG.districts[c.district].callsPerMinute,
    0,
  );
  if (totalWeight === 0) return { state: base, events: [] };

  const districtDraw = nextRandom(base.seed);
  let pick = districtDraw.value * totalWeight;
  const chosen =
    candidates.find((c) => (pick -= CONFIG.districts[c.district].callsPerMinute) < 0) ??
    candidates[candidates.length - 1];
  if (!chosen) return { state: base, events: [] };

  const fromDraw = randomInt(districtDraw.seed, 0, chosen.callers.length - 1);
  const from = chosen.callers[fromDraw.value];
  if (from === undefined) return { state: base, events: [] };
  const callees = calleePool(state, chosen.district, busy).filter((id) => id !== from);
  const toDraw = randomInt(fromDraw.seed, 0, callees.length - 1);
  const to = callees[toDraw.value];
  if (to === undefined) return { state: { ...base, seed: toDraw.seed }, events: [] };

  const call: Call = {
    id: state.nextCallId,
    from,
    to,
    status: 'ringing',
    rangAt: state.clock,
    expiresAt: state.clock + patienceMs(state),
    endsAt: null,
    handler: null,
  };
  return {
    state: {
      ...base,
      seed: toDraw.seed,
      calls: [...state.calls, call],
      nextCallId: state.nextCallId + 1,
    },
    events: [{ type: 'call-incoming', callId: call.id, from }],
  };
}

/** Drops callers who waited too long and frees cords of finished calls. */
export function settleCalls(state: GameState): StepResult {
  const events: GameEvent[] = [];
  let missed = 0;
  const calls = state.calls.filter((call) => {
    if (call.status === 'ringing' && state.clock >= call.expiresAt) {
      missed += 1;
      events.push({ type: 'call-lost', callId: call.id, from: call.from });
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

export function payoutFor(call: Pick<Call, 'from'>): number {
  return CONFIG.districts[districtOf(call.from)].payoutCents;
}

/** Plugs a ringing call through; callers check that the move is allowed. */
function plug(state: GameState, call: Call, handler: Handler): StepResult {
  const { minDurationMs, maxDurationMs } = CONFIG.calls;
  const duration = randomInt(state.seed, minDurationMs, maxDurationMs);
  const payoutCents = payoutFor(call);
  const connected: Call = {
    ...call,
    status: 'connected',
    endsAt: state.clock + duration.value,
    handler,
  };
  return {
    state: {
      ...state,
      seed: duration.seed,
      moneyCents: state.moneyCents + payoutCents,
      calls: state.calls.map((c) => (c.id === call.id ? connected : c)),
      stats: {
        ...state.stats,
        connected: state.stats.connected + 1,
        earnedCents: state.stats.earnedCents + payoutCents,
      },
    },
    events: [
      {
        type: 'call-connected',
        callId: call.id,
        from: call.from,
        to: call.to,
        payoutCents,
        handler,
      },
    ],
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
  return { ...plug(state, call, 'player'), outcome: 'connected' };
}

/**
 * Free apprentices take the oldest lamps the operator has left ringing for
 * a while. They work their own positions, so they use none of the
 * operator's cords.
 */
export function assignApprentices(state: GameState): StepResult {
  const { reactionMs, workMs } = CONFIG.apprentices;
  const events: GameEvent[] = [];
  let next = state;
  const busyUntil = [...state.apprenticeBusyUntil];

  for (let i = 0; i < busyUntil.length; i++) {
    if ((busyUntil[i] ?? Infinity) > next.clock) continue;
    const waiting = next.calls.find(
      (call) => call.status === 'ringing' && next.clock - call.rangAt >= reactionMs,
    );
    if (!waiting) break;
    const result = plug(next, waiting, 'apprentice');
    next = result.state;
    events.push(...result.events);
    busyUntil[i] = next.clock + workMs;
  }
  if (events.length === 0) return { state, events };
  return { state: { ...next, apprenticeBusyUntil: busyUntil }, events };
}
