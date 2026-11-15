/**
 * Every balance value lives here. Game modules read from this object and
 * never hard-code numbers of their own, so tuning the game means editing
 * this file only. `balance.test.ts` plays the whole game with a scripted
 * operator and checks that the pacing still matches the intended curve.
 *
 * Units: money is in integer cents, durations are in milliseconds.
 */

import type { DistrictId } from './directory';
import type { UpgradeId } from './types';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

export interface DistrictConfig {
  /** Calls placed by this district's subscribers while it is switched by hand. */
  callsPerMinute: number;
  /** Paid for each call placed from this district. */
  payoutCents: number;
}

export interface UpgradeConfig {
  /** One price per purchase; the length is the number of levels. */
  costsCents: readonly number[];
  /** Levels of other upgrades needed before this one appears. */
  requires: Partial<Record<UpgradeId, number>>;
}

export const CONFIG = {
  districts: {
    main: { callsPerMinute: 12, payoutCents: 15 },
    mill: { callsPerMinute: 10, payoutCents: 40 },
    hill: { callsPerMinute: 14, payoutCents: 100 },
    river: { callsPerMinute: 16, payoutCents: 250 },
    trunk: { callsPerMinute: 3, payoutCents: 600 },
  } satisfies Record<DistrictId, DistrictConfig>,

  calls: {
    /** Delay between calls varies by ±jitter around the average. */
    intervalJitter: 0.5,
    /** How long a caller waits on a ringing line before hanging up. */
    patienceMs: 14 * SECOND,
    /** How long a connected conversation keeps its cord busy. */
    minDurationMs: 8 * SECOND,
    maxDurationMs: 18 * SECOND,
    /** Delay before the very first call of a session. */
    firstCallMs: 2.5 * SECOND,
  },

  cords: {
    /** Cord pairs available at the start of the game. */
    initial: 2,
  },

  headset: {
    /** Callers wait this much longer once the operator has a headset. */
    patienceMultiplier: 1.5,
  },

  apprentices: {
    /** An apprentice leaves a lamp ringing this long before taking it. */
    reactionMs: 4 * SECOND,
    /** Time an apprentice spends on a call before taking the next one. */
    workMs: 6 * SECOND,
  },

  automation: {
    /**
     * An automated district places this many times more calls than it did
     * by hand: the switch never sleeps and the town picks up the habit.
     */
    volumeMultiplier: 3,
  },

  upgrades: {
    cord: { costsCents: [300, 800, 2_000, 4_500, 9_000, 16_000], requires: {} },
    headset: { costsCents: [1_500], requires: {} },
    extendMill: { costsCents: [1_200], requires: { cord: 1 } },
    apprentice: {
      costsCents: [5_000, 10_000, 18_000, 28_000],
      requires: { extendMill: 1 },
    },
    extendHill: { costsCents: [3_500], requires: { extendMill: 1 } },
    trunk: { costsCents: [20_000], requires: { extendHill: 1 } },
    extendRiver: { costsCents: [12_000], requires: { extendHill: 1 } },
    switchMill: { costsCents: [60_000], requires: { extendRiver: 1, apprentice: 2 } },
    switchHill: { costsCents: [100_000], requires: { switchMill: 1 } },
    switchRiver: { costsCents: [160_000], requires: { switchHill: 1 } },
    dial: { costsCents: [200_000], requires: { switchRiver: 1, trunk: 1 } },
    automaticExchange: { costsCents: [350_000], requires: { dial: 1 } },
  } satisfies Record<UpgradeId, UpgradeConfig>,

  offline: {
    /** Absences shorter than this are not worth a welcome-back summary. */
    minAwayMs: MINUTE,
    /** Offline progress stops counting after this long away. */
    maxAwayMs: 4 * HOUR,
    /**
     * Share of the passive income kept while away, so that closing the page
     * never beats playing and nobody skips a stage, and its stories, by waiting.
     */
    efficiency: 0.5,
  },

  save: {
    storageKey: 'patch-through:save',
    backupKey: 'patch-through:save:backup',
    autosaveMs: 10 * SECOND,
  },
} as const;

export type Config = typeof CONFIG;
