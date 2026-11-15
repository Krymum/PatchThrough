import { describe, expect, it } from 'vitest';
import { connectCall } from './calls';
import { CONFIG } from './config';
import { advance, createInitialState } from './engine';

describe('advance', () => {
  it('rings the first call quickly', () => {
    const { state, events } = advance(createInitialState(1), CONFIG.calls.intervalMs / 2);
    expect(state.calls).toHaveLength(1);
    expect(events.some((e) => e.type === 'call-incoming')).toBe(true);
  });

  it('is deterministic for a given seed', () => {
    expect(advance(createInitialState(9), 60_000)).toEqual(advance(createInitialState(9), 60_000));
  });

  it('gives the same result whether time arrives in one chunk or many frames', () => {
    const oneChunk = advance(createInitialState(5), 30_000).state;
    let framed = createInitialState(5);
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
    expect(state.moneyCents).toBe(state.stats.connected * CONFIG.calls.payoutCents);
    const plugged = state.calls.filter((c) => c.status === 'connected').length;
    expect(plugged).toBeLessThanOrEqual(CONFIG.cords.initial);
  });
});
