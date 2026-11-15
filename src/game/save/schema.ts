import { createInitialState } from '../engine';
import { activeApprentices } from '../progression';
import { PLOTS, PLOT_IDS, isFragmentId } from '../story';
import {
  UPGRADE_IDS,
  type GameState,
  type Stats,
  type StoryProgress,
  type UpgradeId,
} from '../types';
import { maxUpgradeLevel } from '../upgrades';

export const LOCALES = ['en', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];

export interface Settings {
  muted: boolean;
  locale: Locale;
}

/**
 * Version 1 of the save format: the first public release, when the only
 * upgrade was the cord pair. Kept to document what migrations start from.
 */
export interface SaveV1 {
  version: 1;
  savedAt: number;
  moneyCents: number;
  upgrades: { cord: number };
  stats: Stats;
  settings: Settings;
}

/** Version 2: one counter per upgrade of the full catalogue. */
export interface SaveV2 {
  version: 2;
  savedAt: number;
  moneyCents: number;
  upgrades: Record<UpgradeId, number>;
  stats: Stats;
  settings: Settings;
}

/**
 * Version 3: adds the progress of the town's stories. Ringing and connected
 * calls are transient and deliberately not saved: a reloaded board starts
 * quiet.
 */
export interface SaveV3 {
  version: 3;
  /** Wall-clock time of the save, used for offline progress. */
  savedAt: number;
  moneyCents: number;
  upgrades: Record<UpgradeId, number>;
  stats: Stats;
  story: StoryProgress;
  settings: Settings;
}

export type Save = SaveV3;
export const CURRENT_SAVE_VERSION: Save['version'] = 3;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isLocale(value: unknown): value is Locale {
  return LOCALES.some((locale) => locale === value);
}

function isStory(value: unknown): value is StoryProgress {
  if (!isRecord(value) || !isRecord(value.offered) || !Array.isArray(value.heard)) return false;
  const { offered, heard } = value;
  return (
    PLOT_IDS.every((id) => isCount(offered[id]) && offered[id] <= PLOTS[id].fragments.length) &&
    heard.every(isFragmentId)
  );
}

export function isSave(value: unknown): value is Save {
  if (!isRecord(value) || value.version !== CURRENT_SAVE_VERSION) return false;
  const { savedAt, moneyCents, upgrades, stats, story, settings } = value;
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
    isStory(story) &&
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
    // Frame timings are fractional; the save stores whole milliseconds.
    stats: { ...state.stats, playMs: Math.round(state.stats.playMs) },
    story: { offered: { ...state.story.offered }, heard: [...state.story.heard] },
    settings: { ...settings },
  };
}

export function fromSave(save: Save, seed: number): GameState {
  const state: GameState = {
    ...createInitialState(seed),
    moneyCents: save.moneyCents,
    upgrades: { ...save.upgrades },
    stats: { ...save.stats },
    story: { offered: { ...save.story.offered }, heard: [...save.story.heard] },
  };
  return { ...state, apprenticeBusyUntil: Array<number>(activeApprentices(state)).fill(0) };
}
