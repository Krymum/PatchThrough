import { CONFIG } from './config';
import type { GameState, StepResult, UpgradeId } from './types';

export const UPGRADE_IDS: readonly UpgradeId[] = ['cord'];

/** Price of the next level of an upgrade, or null when it is maxed out. */
export function nextUpgradeCost(state: GameState, upgrade: UpgradeId): number | null {
  const costs = CONFIG.upgrades[upgrade].costsCents;
  return costs[state.upgrades[upgrade]] ?? null;
}

export function maxUpgradeLevel(upgrade: UpgradeId): number {
  return CONFIG.upgrades[upgrade].costsCents.length;
}

export function canBuyUpgrade(state: GameState, upgrade: UpgradeId): boolean {
  const cost = nextUpgradeCost(state, upgrade);
  return cost !== null && state.moneyCents >= cost;
}

export function buyUpgrade(state: GameState, upgrade: UpgradeId): StepResult {
  const cost = nextUpgradeCost(state, upgrade);
  if (cost === null || state.moneyCents < cost) {
    return { state, events: [] };
  }
  const level = state.upgrades[upgrade] + 1;
  return {
    state: {
      ...state,
      moneyCents: state.moneyCents - cost,
      upgrades: { ...state.upgrades, [upgrade]: level },
    },
    events: [{ type: 'upgrade-bought', upgrade, level }],
  };
}

/** Number of cord pairs the operator can have plugged in at once. */
export function cordCount(state: GameState): number {
  return CONFIG.cords.initial + state.upgrades.cord;
}
