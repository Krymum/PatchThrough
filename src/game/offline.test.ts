import { describe, expect, it } from 'vitest';
import { CONFIG } from './config';
import { applyOfflineProgress, offlineProgress } from './offline';
import { passiveIncomeRate } from './progression';
import { stateWith } from './testHelpers';

const automated = stateWith({
  moneyCents: 100,
  upgrades: { extendMill: 1, apprentice: 2, switchMill: 1 },
});

describe('offlineProgress', () => {
  it('ignores short absences', () => {
    expect(offlineProgress(automated, CONFIG.offline.minAwayMs - 1)).toBeNull();
    expect(offlineProgress(automated, Number.NaN)).toBeNull();
  });

  it('counts passive income for the time away', () => {
    const awayMs = 30 * 60_000;
    const report = offlineProgress(automated, awayMs);
    expect(report).toEqual({
      countedMs: awayMs,
      earnedCents: Math.floor(passiveIncomeRate(automated) * awayMs * CONFIG.offline.efficiency),
    });
    expect(report?.earnedCents).toBeGreaterThan(0);
  });

  it('earns less than staying at the board would', () => {
    const awayMs = 30 * 60_000;
    const report = offlineProgress(automated, awayMs);
    expect(report?.earnedCents).toBeLessThan(passiveIncomeRate(automated) * awayMs);
  });

  it('stops counting at the cap', () => {
    const report = offlineProgress(automated, CONFIG.offline.maxAwayMs * 10);
    expect(report?.countedMs).toBe(CONFIG.offline.maxAwayMs);
  });

  it('earns nothing when nothing runs without the operator', () => {
    expect(offlineProgress(stateWith(), 3_600_000)?.earnedCents).toBe(0);
  });

  it('adds the earnings to money and stats', () => {
    const next = applyOfflineProgress(automated, { countedMs: 1, earnedCents: 250 });
    expect(next.moneyCents).toBe(350);
    expect(next.stats.earnedCents).toBe(250);
  });
});
