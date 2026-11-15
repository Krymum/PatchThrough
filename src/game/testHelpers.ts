/** Builders shared by the game's unit tests. */

import { createInitialState } from './engine';
import { PLOTS, PLOT_IDS } from './story';
import type { Call, GameState, StoryProgress, UpgradeId } from './types';

/** Story progress where every plot has been fully placed, so nothing holds a switch back. */
export function toldStory(): StoryProgress {
  return {
    offered: Object.fromEntries(PLOT_IDS.map((id) => [id, PLOTS[id].fragments.length])) as Record<
      (typeof PLOT_IDS)[number],
      number
    >,
    heard: [],
  };
}

export function stateWith(
  overrides: Partial<Omit<GameState, 'upgrades'>> & {
    upgrades?: Partial<Record<UpgradeId, number>>;
  } = {},
): GameState {
  const initial = createInitialState(123);
  const { upgrades, ...rest } = overrides;
  return { ...initial, ...rest, upgrades: { ...initial.upgrades, ...upgrades } };
}

export function ringingCall(id: number, overrides: Partial<Call> = {}): Call {
  return {
    id,
    from: 'grocer',
    to: 'doctor',
    status: 'ringing',
    rangAt: 0,
    expiresAt: 10_000,
    endsAt: null,
    handler: null,
    fragment: null,
    ...overrides,
  };
}

export function connectedCall(id: number, overrides: Partial<Call> = {}): Call {
  return ringingCall(id, { status: 'connected', endsAt: 60_000, handler: 'player', ...overrides });
}
