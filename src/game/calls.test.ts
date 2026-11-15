import { describe, expect, it } from 'vitest';
import {
  assignApprentices,
  connectCall,
  freeCords,
  payoutFor,
  settleCalls,
  spawnCall,
} from './calls';
import { CONFIG } from './config';
import { districtOf, subscribersIn } from './directory';
import { manualCallRate } from './progression';
import { connectedCall, ringingCall, stateWith } from './testHelpers';
import type { GameState } from './types';

function spawnMany(state: GameState, count: number): GameState {
  let next = state;
  for (let i = 0; i < count; i++) {
    // Keep the board clear so every draw is possible.
    next = { ...spawnCall(next).state, calls: [] };
  }
  return next;
}

describe('spawnCall', () => {
  it('rings a call between two different idle subscribers of Main Street', () => {
    const { state, events } = spawnCall(stateWith({ clock: 1_000 }));
    const call = state.calls[0];
    expect(call).toBeDefined();
    if (!call) return;
    expect(call.status).toBe('ringing');
    expect(call.from).not.toBe(call.to);
    expect(districtOf(call.from)).toBe('main');
    expect(districtOf(call.to)).toBe('main');
    expect(call.rangAt).toBe(1_000);
    expect(call.expiresAt).toBe(1_000 + CONFIG.calls.patienceMs);
    expect(events).toEqual([{ type: 'call-incoming', callId: 1, from: call.from }]);
  });

  it('schedules the next call around the current call rate', () => {
    const state = stateWith({ clock: 0 });
    const mean = 1 / manualCallRate(state);
    const { intervalJitter } = CONFIG.calls;
    const next = spawnCall(state).state.nextCallAt;
    expect(next).toBeGreaterThanOrEqual(Math.floor(mean * (1 - intervalJitter)));
    expect(next).toBeLessThanOrEqual(Math.ceil(mean * (1 + intervalJitter)));
  });

  it('never involves a subscriber who is already on the line', () => {
    let state = stateWith({ upgrades: { extendMill: 1 } });
    for (let i = 0; i < 20; i++) state = spawnCall(state).state;
    const lines = state.calls.flatMap((call) => [call.from, call.to]);
    expect(new Set(lines).size).toBe(lines.length);
  });

  it('skips the call but still reschedules when the town is busy', () => {
    const [a, b, c, d, e, f, g, h] = subscribersIn('main');
    const busy = [
      ringingCall(1, { from: a, to: b }),
      ringingCall(2, { from: c, to: d }),
      ringingCall(3, { from: e, to: f }),
      ringingCall(4, { from: g, to: h }),
    ];
    const { state, events } = spawnCall(stateWith({ calls: busy, clock: 500 }));
    expect(state.calls).toEqual(busy);
    expect(events).toEqual([]);
    expect(state.nextCallAt).toBeGreaterThan(500);
  });

  it('gives callers a longer patience once the operator has a headset', () => {
    const { state } = spawnCall(stateWith({ upgrades: { headset: 1 } }));
    expect(state.calls[0]?.expiresAt).toBe(
      CONFIG.calls.patienceMs * CONFIG.headset.patienceMultiplier,
    );
  });

  it('keeps automated districts off the board, except for long-distance calls', () => {
    let state = stateWith({
      upgrades: { extendMill: 1, switchMill: 1, trunk: 1, extendHill: 1 },
    });
    const seen: { from: string; to: string }[] = [];
    for (let i = 0; i < 300; i++) {
      state = spawnCall(state).state;
      const call = state.calls[0];
      if (call) seen.push({ from: districtOf(call.from), to: districtOf(call.to) });
      state = { ...state, calls: [] };
    }
    expect(seen.some((c) => c.from === 'mill')).toBe(false);
    expect(seen.some((c) => c.from !== 'trunk' && c.to === 'mill')).toBe(false);
    expect(seen.some((c) => c.from === 'trunk' && c.to === 'mill')).toBe(true);
    expect(seen.some((c) => c.to === 'trunk')).toBe(false);
  });

  it('draws districts roughly in proportion to how often they call', () => {
    let state = stateWith({ upgrades: { extendMill: 1 } });
    let fromMill = 0;
    const draws = 2_000;
    for (let i = 0; i < draws; i++) {
      state = spawnCall(state).state;
      if (state.calls[0] && districtOf(state.calls[0].from) === 'mill') fromMill += 1;
      state = { ...state, calls: [] };
    }
    const { main, mill } = CONFIG.districts;
    const expected = mill.callsPerMinute / (main.callsPerMinute + mill.callsPerMinute);
    expect(fromMill / draws).toBeCloseTo(expected, 1);
  });

  it('stops ringing once the exchange is fully automatic', () => {
    const state = spawnMany(stateWith({ upgrades: { automaticExchange: 1 } }), 1);
    expect(state.nextCallAt).toBe(Infinity);
  });
});

describe('settleCalls', () => {
  it('drops ringing calls past their patience and counts them as missed', () => {
    const result = settleCalls(stateWith({ clock: 10_000, calls: [ringingCall(1)] }));
    expect(result.state.calls).toEqual([]);
    expect(result.state.stats.missed).toBe(1);
    expect(result.events).toEqual([{ type: 'call-lost', callId: 1, from: 'grocer' }]);
  });

  it('hangs up finished conversations without counting a miss', () => {
    const call = connectedCall(1, { endsAt: 5_000 });
    const result = settleCalls(stateWith({ clock: 5_000, calls: [call] }));
    expect(result.state.calls).toEqual([]);
    expect(result.state.stats.missed).toBe(0);
    expect(result.events).toEqual([{ type: 'call-ended', callId: 1 }]);
  });

  it('returns the same state object when nothing changes', () => {
    const state = stateWith({ clock: 100, calls: [ringingCall(1)] });
    expect(settleCalls(state).state).toBe(state);
  });
});

describe('connectCall', () => {
  it('connects the call to the requested line and pays by district', () => {
    const state = stateWith({ clock: 2_000, calls: [ringingCall(1)] });
    const result = connectCall(state, 1, 'doctor');
    const payout = CONFIG.districts.main.payoutCents;
    expect(result.outcome).toBe('connected');
    const call = result.state.calls[0];
    expect(call?.status).toBe('connected');
    expect(call?.handler).toBe('player');
    expect(call?.endsAt).toBeGreaterThanOrEqual(2_000 + CONFIG.calls.minDurationMs);
    expect(call?.endsAt).toBeLessThanOrEqual(2_000 + CONFIG.calls.maxDurationMs);
    expect(result.state.moneyCents).toBe(payout);
    expect(result.state.stats).toMatchObject({ connected: 1, earnedCents: payout });
    expect(result.events).toEqual([
      {
        type: 'call-connected',
        callId: 1,
        from: 'grocer',
        to: 'doctor',
        payoutCents: payout,
        handler: 'player',
      },
    ]);
  });

  it('pays long-distance calls at the trunk rate', () => {
    expect(payoutFor({ from: 'longDistance' })).toBe(CONFIG.districts.trunk.payoutCents);
  });

  it('refuses the wrong destination without changing anything', () => {
    const state = stateWith({ calls: [ringingCall(1)] });
    const result = connectCall(state, 1, 'bakery');
    expect(result.outcome).toBe('wrong-line');
    expect(result.state).toBe(state);
  });

  it('refuses unknown or already connected calls', () => {
    const state = stateWith({ calls: [connectedCall(1)] });
    expect(connectCall(state, 1, 'doctor').outcome).toBe('not-ringing');
    expect(connectCall(state, 99, 'doctor').outcome).toBe('not-ringing');
  });

  it("needs a free cord pair, and only counts the operator's own cords", () => {
    const calls = [
      connectedCall(1, { from: 'grocer', to: 'doctor' }),
      connectedCall(2, { from: 'bakery', to: 'garage' }),
      connectedCall(3, { from: 'pharmacy', to: 'newspaper', handler: 'apprentice' }),
      ringingCall(4, { from: 'school', to: 'hotel' }),
    ];
    const state = stateWith({ calls });
    expect(freeCords(state)).toBe(CONFIG.cords.initial - 2);
    expect(connectCall(state, 4, 'hotel').outcome).toBe('no-free-cord');
  });
});

describe('assignApprentices', () => {
  const { reactionMs, workMs } = CONFIG.apprentices;

  it('leaves fresh lamps to the operator', () => {
    const state = stateWith({
      clock: reactionMs - 1,
      calls: [ringingCall(1)],
      apprenticeBusyUntil: [0],
    });
    expect(assignApprentices(state).state).toBe(state);
  });

  it('takes the oldest waiting call without using operator cords', () => {
    const calls = [
      ringingCall(1, { rangAt: 0, from: 'grocer', to: 'doctor' }),
      ringingCall(2, { rangAt: 100, from: 'bakery', to: 'garage' }),
      connectedCall(3, { from: 'school', to: 'hotel' }),
      connectedCall(4, { from: 'pharmacy', to: 'newspaper' }),
    ];
    const state = stateWith({ clock: reactionMs + 100, calls, apprenticeBusyUntil: [0] });
    const { state: next, events } = assignApprentices(state);
    expect(next.calls.find((c) => c.id === 1)?.handler).toBe('apprentice');
    expect(next.calls.find((c) => c.id === 2)?.status).toBe('ringing');
    expect(next.apprenticeBusyUntil).toEqual([reactionMs + 100 + workMs]);
    expect(events).toHaveLength(1);
    expect(next.moneyCents).toBe(CONFIG.districts.main.payoutCents);
  });

  it('waits while every apprentice is busy', () => {
    const state = stateWith({
      clock: reactionMs,
      calls: [ringingCall(1)],
      apprenticeBusyUntil: [reactionMs + 1],
    });
    expect(assignApprentices(state).state).toBe(state);
  });
});
