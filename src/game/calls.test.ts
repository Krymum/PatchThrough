import { describe, expect, it } from 'vitest';
import { connectCall, freeCords, idleSubscribers, settleCalls, spawnCall } from './calls';
import { CONFIG } from './config';
import { SUBSCRIBER_IDS } from './directory';
import { createInitialState } from './engine';
import type { Call, GameState } from './types';

function ringing(id: number, overrides: Partial<Call> = {}): Call {
  return {
    id,
    from: 'grocer',
    to: 'doctor',
    status: 'ringing',
    expiresAt: 10_000,
    endsAt: null,
    ...overrides,
  };
}

function stateWith(overrides: Partial<GameState>): GameState {
  return { ...createInitialState(123), ...overrides };
}

describe('spawnCall', () => {
  it('rings a call between two different idle subscribers', () => {
    const { state, events } = spawnCall(stateWith({ clock: 1_000 }));
    expect(state.calls).toHaveLength(1);
    const call = state.calls[0];
    expect(call?.status).toBe('ringing');
    expect(call?.from).not.toBe(call?.to);
    expect(call?.expiresAt).toBe(1_000 + CONFIG.calls.patienceMs);
    expect(events).toEqual([{ type: 'call-incoming', callId: 1 }]);
    expect(state.nextCallId).toBe(2);
  });

  it('schedules the next call within the configured jitter', () => {
    const { intervalMs, intervalJitter } = CONFIG.calls;
    const { state } = spawnCall(stateWith({ clock: 0 }));
    expect(state.nextCallAt).toBeGreaterThanOrEqual(intervalMs * (1 - intervalJitter));
    expect(state.nextCallAt).toBeLessThanOrEqual(intervalMs * (1 + intervalJitter));
  });

  it('never involves a subscriber who is already on the line', () => {
    let state = stateWith({});
    for (let i = 0; i < SUBSCRIBER_IDS.length; i++) {
      state = spawnCall(state).state;
    }
    const lines = state.calls.flatMap((call) => [call.from, call.to]);
    expect(new Set(lines).size).toBe(lines.length);
    expect(idleSubscribers(state.calls).length).toBeLessThan(2);
  });

  it('skips the call but still reschedules when the town is busy', () => {
    const busy: Call[] = [];
    const ids = [...SUBSCRIBER_IDS];
    for (let i = 0; i + 1 < ids.length; i += 2) {
      busy.push(ringing(i + 1, { from: ids[i], to: ids[i + 1] }));
    }
    const { state, events } = spawnCall(stateWith({ calls: busy, clock: 500 }));
    expect(state.calls).toHaveLength(busy.length);
    expect(events).toEqual([]);
    expect(state.nextCallAt).toBeGreaterThan(500);
  });
});

describe('settleCalls', () => {
  it('drops ringing calls past their patience and counts them as missed', () => {
    const state = stateWith({ clock: 10_000, calls: [ringing(1)] });
    const result = settleCalls(state);
    expect(result.state.calls).toEqual([]);
    expect(result.state.stats.missed).toBe(1);
    expect(result.events).toEqual([{ type: 'call-lost', callId: 1 }]);
  });

  it('hangs up finished conversations without counting a miss', () => {
    const call = ringing(1, { status: 'connected', endsAt: 5_000 });
    const result = settleCalls(stateWith({ clock: 5_000, calls: [call] }));
    expect(result.state.calls).toEqual([]);
    expect(result.state.stats.missed).toBe(0);
    expect(result.events).toEqual([{ type: 'call-ended', callId: 1 }]);
  });

  it('returns the same state object when nothing changes', () => {
    const state = stateWith({ clock: 100, calls: [ringing(1)] });
    expect(settleCalls(state).state).toBe(state);
  });
});

describe('connectCall', () => {
  it('connects the call to the requested line and pays the operator', () => {
    const state = stateWith({ clock: 2_000, calls: [ringing(1)] });
    const result = connectCall(state, 1, 'doctor');
    expect(result.outcome).toBe('connected');
    const call = result.state.calls[0];
    expect(call?.status).toBe('connected');
    expect(call?.endsAt).toBeGreaterThanOrEqual(2_000 + CONFIG.calls.minDurationMs);
    expect(call?.endsAt).toBeLessThanOrEqual(2_000 + CONFIG.calls.maxDurationMs);
    expect(result.state.moneyCents).toBe(CONFIG.calls.payoutCents);
    expect(result.state.stats.connected).toBe(1);
    expect(result.state.stats.earnedCents).toBe(CONFIG.calls.payoutCents);
  });

  it('refuses the wrong destination without changing anything', () => {
    const state = stateWith({ calls: [ringing(1)] });
    const result = connectCall(state, 1, 'bakery');
    expect(result.outcome).toBe('wrong-line');
    expect(result.state).toBe(state);
  });

  it('refuses unknown or already connected calls', () => {
    const state = stateWith({ calls: [ringing(1, { status: 'connected', endsAt: 9_000 })] });
    expect(connectCall(state, 1, 'doctor').outcome).toBe('not-ringing');
    expect(connectCall(state, 99, 'doctor').outcome).toBe('not-ringing');
  });

  it('needs a free cord pair', () => {
    const calls = [
      ringing(1, { from: 'grocer', to: 'doctor', status: 'connected', endsAt: 9_000 }),
      ringing(2, { from: 'bakery', to: 'garage', status: 'connected', endsAt: 9_000 }),
      ringing(3, { from: 'school', to: 'hotel' }),
    ];
    const state = stateWith({ calls });
    expect(freeCords(state)).toBe(CONFIG.cords.initial - 2);
    expect(connectCall(state, 3, 'hotel').outcome).toBe('no-free-cord');
  });
});
