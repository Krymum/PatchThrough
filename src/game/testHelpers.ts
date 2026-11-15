/** Builders shared by the game's unit tests. */

import { createInitialState } from './engine';
import type { Call, GameState, UpgradeId } from './types';

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
    ...overrides,
  };
}

export function connectedCall(id: number, overrides: Partial<Call> = {}): Call {
  return ringingCall(id, { status: 'connected', endsAt: 60_000, handler: 'player', ...overrides });
}
