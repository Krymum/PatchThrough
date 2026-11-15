import { createInitialState } from '../engine';
import type { GameState, Stats, UpgradeId } from '../types';
import { UPGRADE_IDS, maxUpgradeLevel } from '../upgrades';

export const LOCALES = ['en', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];

export interface Settings {
  muted: boolean;
  locale: Locale;
}

/**
 * Version 1 of the save format. Ringing and connected calls are transient
 * and deliberately not saved: a reloaded board starts quiet.
 */
export interface SaveV1 {
  version: 1;
  /** Wall-clock time of the save, used for offline progress. */
  savedAt: number;
  moneyCents: number;
  upgrades: Record<UpgradeId, number>;
  stats: Stats;
  settings: Settings;
}

export type Save = SaveV1;
export const CURRENT_SAVE_VERSION: Save['version'] = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isLocale(value: unknown): value is Locale {
  return LOCALES.some((locale) => locale === value);
}

export function isSave(value: unknown): value is Save {
  if (!isRecord(value) || value.version !== CURRENT_SAVE_VERSION) return false;
  const { savedAt, moneyCents, upgrades, stats, settings } = value;
  return (
    isCount(savedAt) &&
    isCount(moneyCents) &&
    isRecord(upgrades) &&
    UPGRADE_IDS.every((id) => isCount(upgrades[id]) && upgrades[id] <= maxUpgradeLevel(id)) &&
    isRecord(stats) &&
    isCount(stats.connected) &&
    isCount(stats.missed) &&
    isCount(stats.earnedCents) &&
    isCount(stats.playMs) &&
    isRecord(settings) &&
    typeof settings.muted === 'boolean' &&
    isLocale(settings.locale)
  );
}

export function toSave(state: GameState, settings: Settings, now: number): Save {
  return {
    version: CURRENT_SAVE_VERSION,
    savedAt: now,
    moneyCents: state.moneyCents,
    upgrades: { ...state.upgrades },
    stats: { ...state.stats },
    settings: { ...settings },
  };
}

export function fromSave(save: Save, seed: number): GameState {
  return {
    ...createInitialState(seed),
    moneyCents: save.moneyCents,
    upgrades: { ...save.upgrades },
    stats: { ...save.stats },
  };
}
