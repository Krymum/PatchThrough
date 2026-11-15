import { CONFIG } from './config';
import { passiveIncomeRate } from './progression';
import type { GameState } from './types';

export interface OfflineReport {
  /** Time away that was counted, after the cap. */
  countedMs: number;
  earnedCents: number;
}

/**
 * What the exchange earned while the operator was away. Only the work that
 * runs without the player counts (apprentices and automatic switches), at a
 * reduced rate and up to the configured cap. Short absences are ignored.
 */
export function offlineProgress(state: GameState, awayMs: number): OfflineReport | null {
  if (!Number.isFinite(awayMs) || awayMs < CONFIG.offline.minAwayMs) return null;
  const countedMs = Math.min(awayMs, CONFIG.offline.maxAwayMs);
  const earnedCents = Math.floor(passiveIncomeRate(state) * countedMs * CONFIG.offline.efficiency);
  return { countedMs, earnedCents };
}

export function applyOfflineProgress(state: GameState, report: OfflineReport): GameState {
  return {
    ...state,
    moneyCents: state.moneyCents + report.earnedCents,
    stats: { ...state.stats, earnedCents: state.stats.earnedCents + report.earnedCents },
  };
}
