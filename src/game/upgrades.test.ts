import { describe, expect, it } from 'vitest';
import { CONFIG } from './config';
import { connectedCall, ringingCall, stateWith, toldStory } from './testHelpers';
import { UPGRADE_IDS } from './types';
import {
  availableUpgrades,
  buyUpgrade,
  canBuyUpgrade,
  cordCount,
  isUpgradeUnlocked,
  maxUpgradeLevel,
  nextUpgradeCost,
} from './upgrades';

const cordCosts = CONFIG.upgrades.cord.costsCents;

describe('catalogue', () => {
  it('only requires upgrades that exist, at reachable levels', () => {
    for (const id of UPGRADE_IDS) {
      for (const [required, level] of Object.entries(CONFIG.upgrades[id].requires)) {
        expect(UPGRADE_IDS).toContain(required);
        expect(level).toBeLessThanOrEqual(
          maxUpgradeLevel(required as (typeof UPGRADE_IDS)[number]),
        );
      }
    }
  });

  it('starts by offering cords and the headset only', () => {
    expect(availableUpgrades(stateWith())).toEqual(['cord', 'headset']);
  });

  it('reveals upgrades once their prerequisites are owned', () => {
    expect(isUpgradeUnlocked(stateWith(), 'extendMill')).toBe(false);
    expect(isUpgradeUnlocked(stateWith({ upgrades: { cord: 1 } }), 'extendMill')).toBe(true);
    expect(isUpgradeUnlocked(stateWith({ upgrades: { extendRiver: 1 } }), 'switchMill')).toBe(
      false,
    );
    expect(
      isUpgradeUnlocked(stateWith({ upgrades: { extendRiver: 1, apprentice: 2 } }), 'switchMill'),
    ).toBe(true);
  });

  it('hides maxed-out upgrades and closes the shop at the end', () => {
    const maxed = stateWith({ upgrades: { cord: maxUpgradeLevel('cord'), headset: 1 } });
    expect(availableUpgrades(maxed)).not.toContain('cord');
    expect(availableUpgrades(stateWith({ upgrades: { automaticExchange: 1 } }))).toEqual([]);
  });
});

describe('buyUpgrade', () => {
  it('cannot be bought without enough money', () => {
    const state = stateWith({ moneyCents: (cordCosts[0] ?? 0) - 1 });
    expect(canBuyUpgrade(state, 'cord')).toBe(false);
    const result = buyUpgrade(state, 'cord');
    expect(result.state).toBe(state);
    expect(result.events).toEqual([]);
  });

  it("waits for a district's story to be told before automating it", () => {
    const upgrades = { extendMill: 1, extendHill: 1, extendRiver: 1, apprentice: 2 };
    const untold = stateWith({ moneyCents: 1e9, upgrades });
    expect(availableUpgrades(untold)).toContain('switchMill');
    expect(canBuyUpgrade(untold, 'switchMill')).toBe(false);
    expect(buyUpgrade(untold, 'switchMill').state).toBe(untold);

    const told = stateWith({ moneyCents: 1e9, upgrades, story: toldStory() });
    expect(canBuyUpgrade(told, 'switchMill')).toBe(true);
  });

  it('cannot be bought while locked, even with money', () => {
    const state = stateWith({ moneyCents: 1e9 });
    expect(buyUpgrade(state, 'switchMill').state).toBe(state);
  });

  it('spends the price and adds a cord pair', () => {
    const state = stateWith({ moneyCents: (cordCosts[0] ?? 0) + 10 });
    const result = buyUpgrade(state, 'cord');
    expect(result.state.moneyCents).toBe(10);
    expect(cordCount(result.state)).toBe(CONFIG.cords.initial + 1);
    expect(nextUpgradeCost(result.state, 'cord')).toBe(cordCosts[1]);
    expect(result.events).toEqual([{ type: 'upgrade-bought', upgrade: 'cord', level: 1 }]);
  });

  it('stops at the last level', () => {
    const state = stateWith({ moneyCents: 1e9, upgrades: { cord: maxUpgradeLevel('cord') } });
    expect(nextUpgradeCost(state, 'cord')).toBeNull();
    expect(buyUpgrade(state, 'cord').state).toBe(state);
  });

  it('seats a new apprentice who is free straight away', () => {
    const state = stateWith({ clock: 5_000, moneyCents: 1e9, upgrades: { extendMill: 1 } });
    const { state: next } = buyUpgrade(state, 'apprentice');
    expect(next.apprenticeBusyUntil).toEqual([5_000]);
  });

  it('hands a district to its switch and lets one apprentice go', () => {
    const calls = [
      ringingCall(1, { from: 'mill', to: 'tavern' }),
      connectedCall(2, { from: 'grocer', to: 'chapel' }),
      ringingCall(3, { from: 'grocer', to: 'doctor' }),
    ];
    const state = stateWith({
      moneyCents: 1e9,
      calls,
      story: toldStory(),
      apprenticeBusyUntil: [0, 0],
      upgrades: { extendMill: 1, extendHill: 1, extendRiver: 1, apprentice: 2 },
    });
    const { state: next } = buyUpgrade(state, 'switchMill');
    expect(next.calls.map((c) => c.id)).toEqual([3]);
    expect(next.apprenticeBusyUntil).toHaveLength(1);
  });

  it('keeps apprentice seats in line with automations already built', () => {
    const state = stateWith({
      moneyCents: 1e9,
      story: toldStory(),
      upgrades: { extendMill: 1, apprentice: 2, switchMill: 1, switchHill: 1 },
    });
    const { state: next } = buyUpgrade(state, 'apprentice');
    expect(next.apprenticeBusyUntil).toHaveLength(1);
  });

  it('clears the board when the automatic exchange arrives', () => {
    const state = stateWith({
      moneyCents: 1e9,
      story: toldStory(),
      calls: [ringingCall(1, { from: 'longDistance', to: 'grocer' })],
      apprenticeBusyUntil: [0],
      upgrades: { dial: 1 },
    });
    const { state: next } = buyUpgrade(state, 'automaticExchange');
    expect(next.calls).toEqual([]);
    expect(next.apprenticeBusyUntil).toEqual([]);
    expect(next.nextCallAt).toBe(Infinity);
  });
});
