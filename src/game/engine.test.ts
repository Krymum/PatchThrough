import { describe, expect, it } from 'vitest';
import { connectCall } from './calls';
import { CONFIG } from './config';
import { advance, createInitialState } from './engine';
import { automatedIncomeRate } from './progression';
import { stateWith } from './testHelpers';

describe('advance', () => {
  it('rings the first call quickly', () => {
    const { state, events } = advance(createInitialState(1), CONFIG.calls.firstCallMs);
    expect(state.calls).toHaveLength(1);
    expect(events.some((e) => e.type === 'call-incoming')).toBe(true);
  });

  it('is deterministic for a given seed', () => {
    expect(advance(createInitialState(9), 60_000)).toEqual(advance(createInitialState(9), 60_000));
  });

  it('gives the same result whether time arrives in one chunk or many frames', () => {
    const staffed = stateWith({
      upgrades: { extendMill: 1, apprentice: 2 },
      apprenticeBusyUntil: [0, 0],
    });
    const oneChunk = advance(staffed, 30_000).state;
    let framed = staffed;
    for (let i = 0; i < 1_875; i++) framed = advance(framed, 16).state;
    expect(framed).toEqual(oneChunk);
  });

  it('loses every call when nobody answers', () => {
    const { state } = advance(createInitialState(3), 120_000);
    expect(state.stats.missed).toBeGreaterThan(10);
    expect(state.stats.connected).toBe(0);
    expect(state.moneyCents).toBe(0);
    expect(state.stats.playMs).toBe(120_000);
  });

  it('ignores negative time', () => {
    const initial = createInitialState(3);
    expect(advance(initial, -50).state).toBe(initial);
  });

  it('lets an attentive operator earn money and frees cords when calls end', () => {
    let state = createInitialState(11);
    for (let t = 0; t < 120_000; t += 500) {
      state = advance(state, 500).state;
      for (const call of state.calls) {
        if (call.status === 'ringing') state = connectCall(state, call.id, call.to).state;
      }
    }
    expect(state.stats.connected).toBeGreaterThan(10);
    expect(state.moneyCents).toBe(state.stats.connected * CONFIG.districts.main.payoutCents);
    const plugged = state.calls.filter((c) => c.handler === 'player').length;
    expect(plugged).toBeLessThanOrEqual(CONFIG.cords.initial);
  });

  it('lets apprentices answer calls the operator leaves ringing', () => {
    const staffed = stateWith({
      upgrades: { extendMill: 1, apprentice: 1 },
      apprenticeBusyUntil: [0],
    });
    const { state: next } = advance(staffed, 120_000);
    expect(next.stats.connected).toBeGreaterThan(5);
    expect(next.calls.every((c) => c.handler !== 'player')).toBe(true);
  });

  it('pays automatic switches continuously, without losing fractions of a cent', () => {
    const state = stateWith({ upgrades: { extendMill: 1, switchMill: 1, dial: 1 } });
    const rate = automatedIncomeRate(state);
    let framed = state;
    for (let i = 0; i < 600; i++) framed = advance(framed, 100).state;
    expect(framed.moneyCents).toBe(Math.floor(rate * 60_000 + 1e-9));
  });

  it('stays silent once the exchange is fully automatic', () => {
    const ended = stateWith({ nextCallAt: Infinity, upgrades: { automaticExchange: 1 } });
    const { state, events } = advance(ended, 3_600_000);
    expect(events).toEqual([]);
    expect(state.moneyCents).toBe(0);
  });
});
