import { describe, expect, it } from 'vitest';
import { CONFIG } from './config';
import { createInitialState } from './engine';
import { buyUpgrade, canBuyUpgrade, cordCount, maxUpgradeLevel, nextUpgradeCost } from './upgrades';

const costs = CONFIG.upgrades.cord.costsCents;

describe('cord upgrade', () => {
  it('cannot be bought without enough money', () => {
    const state = { ...createInitialState(1), moneyCents: costs[0] - 1 };
    expect(canBuyUpgrade(state, 'cord')).toBe(false);
    const result = buyUpgrade(state, 'cord');
    expect(result.state).toBe(state);
    expect(result.events).toEqual([]);
  });

  it('spends the price and adds a cord pair', () => {
    const state = { ...createInitialState(1), moneyCents: costs[0] + 10 };
    const result = buyUpgrade(state, 'cord');
    expect(result.state.moneyCents).toBe(10);
    expect(cordCount(result.state)).toBe(CONFIG.cords.initial + 1);
    expect(nextUpgradeCost(result.state, 'cord')).toBe(costs[1]);
    expect(result.events).toEqual([{ type: 'upgrade-bought', upgrade: 'cord', level: 1 }]);
  });

  it('stops at the last level', () => {
    const max = maxUpgradeLevel('cord');
    const state = { ...createInitialState(1), moneyCents: 1e9, upgrades: { cord: max } };
    expect(nextUpgradeCost(state, 'cord')).toBeNull();
    expect(buyUpgrade(state, 'cord').state).toBe(state);
  });
});
