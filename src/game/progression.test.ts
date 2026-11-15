import { describe, expect, it } from 'vitest';
import { CONFIG } from './config';
import {
  activeApprentices,
  apprenticeIncomeRate,
  automatedIncomeRate,
  hasEnded,
  manualCallRate,
  manualDistricts,
  patienceMs,
} from './progression';
import { stateWith } from './testHelpers';

describe('districts', () => {
  it('starts with Main Street alone', () => {
    expect(manualDistricts(stateWith())).toEqual(['main']);
  });

  it('adds districts as the board is extended, and the trunk once bought', () => {
    const state = stateWith({ upgrades: { extendMill: 1, extendHill: 1, trunk: 1 } });
    expect(manualDistricts(state)).toEqual(['main', 'mill', 'hill', 'trunk']);
  });

  it('removes automated districts from the board', () => {
    const state = stateWith({ upgrades: { extendMill: 1, switchMill: 1, dial: 1, trunk: 1 } });
    expect(manualDistricts(state)).toEqual(['trunk']);
  });

  it('has nothing left to switch by hand at the end', () => {
    const state = stateWith({ upgrades: { trunk: 1, automaticExchange: 1 } });
    expect(hasEnded(state)).toBe(true);
    expect(manualDistricts(state)).toEqual([]);
    expect(manualCallRate(state)).toBe(0);
  });
});

describe('apprentices', () => {
  it('lose one position per automation', () => {
    expect(activeApprentices(stateWith({ upgrades: { apprentice: 3 } }))).toBe(3);
    expect(activeApprentices(stateWith({ upgrades: { apprentice: 3, switchMill: 1 } }))).toBe(2);
    expect(
      activeApprentices(
        stateWith({ upgrades: { apprentice: 2, switchMill: 1, switchHill: 1, switchRiver: 1 } }),
      ),
    ).toBe(0);
  });

  it('earn offline no more than the calls the town places', () => {
    const few = stateWith({ upgrades: { apprentice: 1 } });
    const perApprentice = CONFIG.districts.main.payoutCents / CONFIG.apprentices.workMs;
    expect(apprenticeIncomeRate(few)).toBeCloseTo(perApprentice);

    const many = stateWith({ upgrades: { apprentice: 100 } });
    const cap = manualCallRate(many) * CONFIG.districts.main.payoutCents;
    expect(apprenticeIncomeRate(many)).toBeCloseTo(cap);
  });
});

describe('automated income', () => {
  it('is zero until a district is automated', () => {
    expect(automatedIncomeRate(stateWith({ upgrades: { extendMill: 1 } }))).toBe(0);
  });

  it('scales with the district volume and payout', () => {
    const { callsPerMinute, payoutCents } = CONFIG.districts.mill;
    const expected = (callsPerMinute * CONFIG.automation.volumeMultiplier * payoutCents) / 60_000;
    const state = stateWith({ upgrades: { extendMill: 1, switchMill: 1 } });
    expect(automatedIncomeRate(state)).toBeCloseTo(expected);
  });
});

describe('patience', () => {
  it('is longer with a headset', () => {
    expect(patienceMs(stateWith())).toBe(CONFIG.calls.patienceMs);
    expect(patienceMs(stateWith({ upgrades: { headset: 1 } }))).toBe(
      CONFIG.calls.patienceMs * CONFIG.headset.patienceMultiplier,
    );
  });
});
