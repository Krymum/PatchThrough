/**
 * Plays the whole game with a scripted operator to check the pacing.
 *
 * The bot behaves like an attentive but human player: it acts at most once
 * every ACTION_MS, only answers lamps that have been lit for REACTION_MS, and
 * buys the cheapest upgrade on offer as soon as it can afford it. When a
 * balance value changes in config.ts, this test tells whether each stage of
 * the game still arrives roughly when intended.
 */

import { describe, expect, it } from 'vitest';
import { connectCall, freeCords } from './calls';
import { advance, createInitialState } from './engine';
import { hasEnded } from './progression';
import type { GameState, UpgradeId } from './types';
import { availableUpgrades, buyUpgrade, nextUpgradeCost } from './upgrades';

const ACTION_MS = 1_200;
const REACTION_MS = 1_000;
const MINUTE = 60_000;
const GIVE_UP_MS = 5 * 60 * MINUTE;

type Timeline = Partial<Record<UpgradeId, number>>;

function botAction(state: GameState): GameState {
  const cheapest = availableUpgrades(state)
    .map((id) => ({ id, cost: nextUpgradeCost(state, id) ?? Infinity }))
    .sort((a, b) => a.cost - b.cost)[0];
  if (cheapest && cheapest.cost <= state.moneyCents) {
    return buyUpgrade(state, cheapest.id).state;
  }
  const call = state.calls.find(
    (c) => c.status === 'ringing' && state.clock - c.rangAt >= REACTION_MS,
  );
  if (call && freeCords(state) > 0) return connectCall(state, call.id, call.to).state;
  return state;
}

function playThrough(seed: number): { timeline: Timeline; endedAt: number | null } {
  let state = createInitialState(seed);
  const timeline: Timeline = {};
  while (!hasEnded(state) && state.clock < GIVE_UP_MS) {
    state = advance(state, ACTION_MS).state;
    const before = state.upgrades;
    state = botAction(state);
    for (const [id, level] of Object.entries(state.upgrades) as [UpgradeId, number][]) {
      if (level > 0 && before[id] === 0) timeline[id] = state.clock;
    }
  }
  return { timeline, endedAt: hasEnded(state) ? state.clock : null };
}

/** Intended arrival of each stage, in minutes of play (see the README). */
const TARGETS: [UpgradeId, number, number][] = [
  ['extendMill', 8, 22],
  ['apprentice', 25, 55],
  ['switchMill', 55, 95],
  ['dial', 95, 140],
  ['automaticExchange', 120, 180],
];

describe('pacing', () => {
  it.each([1, 2, 3])('reaches each stage on time (seed %i)', (seed) => {
    const { timeline, endedAt } = playThrough(seed);
    expect(endedAt).not.toBeNull();
    for (const [upgrade, min, max] of TARGETS) {
      const minutes = (timeline[upgrade] ?? Infinity) / MINUTE;
      expect({ upgrade, minutes }).toEqual({
        upgrade,
        minutes: expect.toSatisfy((m: number) => m >= min && m <= max) as unknown,
      });
    }
  });
});
