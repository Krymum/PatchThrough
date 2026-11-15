/**
 * Everything about the exchange's growth is derived from the upgrades owned:
 * which districts are on the board, which ones are automatic, how many
 * apprentices still work there. Nothing here is stored in the save.
 */

import { CONFIG } from './config';
import { LOCAL_DISTRICTS, type DistrictId, type LocalDistrictId } from './directory';
import type { GameState, UpgradeId } from './types';

const MS_PER_MINUTE = 60_000;

/** The purchase that adds each district to the board (Main Street is there from the start). */
export const OPENED_BY: Readonly<Record<LocalDistrictId, UpgradeId | null>> = {
  main: null,
  mill: 'extendMill',
  hill: 'extendHill',
  river: 'extendRiver',
};

/** The purchase that hands each district over to automatic switching. */
export const AUTOMATED_BY: Readonly<Record<LocalDistrictId, UpgradeId>> = {
  main: 'dial',
  mill: 'switchMill',
  hill: 'switchHill',
  river: 'switchRiver',
};

const AUTOMATIONS: readonly UpgradeId[] = Object.values(AUTOMATED_BY);

type Owned = Pick<GameState, 'upgrades'>;

export function hasEnded(state: Owned): boolean {
  return state.upgrades.automaticExchange > 0;
}

export function isOpen(state: Owned, district: LocalDistrictId): boolean {
  const opener = OPENED_BY[district];
  return opener === null || state.upgrades[opener] > 0;
}

export function isAutomated(state: Owned, district: LocalDistrictId): boolean {
  return state.upgrades[AUTOMATED_BY[district]] > 0;
}

/** Districts whose calls still go through the operator's board. */
export function manualDistricts(state: Owned): DistrictId[] {
  if (hasEnded(state)) return [];
  const local: DistrictId[] = LOCAL_DISTRICTS.filter(
    (d) => isOpen(state, d) && !isAutomated(state, d),
  );
  return state.upgrades.trunk > 0 ? [...local, 'trunk'] : local;
}

export function automatedDistricts(state: Owned): LocalDistrictId[] {
  return LOCAL_DISTRICTS.filter((d) => isAutomated(state, d));
}

/** Apprentices still at the board: each automation lets one of them go. */
export function activeApprentices(state: Owned): number {
  const automations = AUTOMATIONS.filter((id) => state.upgrades[id] > 0).length;
  return hasEnded(state) ? 0 : Math.max(0, state.upgrades.apprentice - automations);
}

export function patienceMs(state: Owned): number {
  const multiplier = state.upgrades.headset > 0 ? CONFIG.headset.patienceMultiplier : 1;
  return CONFIG.calls.patienceMs * multiplier;
}

/** Calls per millisecond reaching the board by hand. */
export function manualCallRate(state: Owned): number {
  return (
    manualDistricts(state).reduce((sum, d) => sum + CONFIG.districts[d].callsPerMinute, 0) /
    MS_PER_MINUTE
  );
}

/** Average payout of a hand-switched call, weighted by how often each district calls. */
export function averageManualPayout(state: Owned): number {
  const districts = manualDistricts(state);
  const rate = districts.reduce((sum, d) => sum + CONFIG.districts[d].callsPerMinute, 0);
  if (rate === 0) return 0;
  const weighted = districts.reduce(
    (sum, d) => sum + CONFIG.districts[d].callsPerMinute * CONFIG.districts[d].payoutCents,
    0,
  );
  return weighted / rate;
}

/** Cents per millisecond earned by automatic switches, with nobody at the board. */
export function automatedIncomeRate(state: Owned): number {
  if (hasEnded(state)) return 0;
  const perMinute = automatedDistricts(state).reduce((sum, d) => {
    const { callsPerMinute, payoutCents } = CONFIG.districts[d];
    return sum + callsPerMinute * CONFIG.automation.volumeMultiplier * payoutCents;
  }, 0);
  return perMinute / MS_PER_MINUTE;
}

/**
 * Cents per millisecond the apprentices earn when the operator is away: each
 * one handles a call every `workMs`, but never more calls than the town places.
 */
export function apprenticeIncomeRate(state: Owned): number {
  const capacity = activeApprentices(state) / CONFIG.apprentices.workMs;
  return Math.min(capacity, manualCallRate(state)) * averageManualPayout(state);
}

/** Total income the exchange makes on its own, in cents per millisecond. */
export function passiveIncomeRate(state: Owned): number {
  return automatedIncomeRate(state) + apprenticeIncomeRate(state);
}
