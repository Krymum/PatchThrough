/**
 * Every balance value lives here. Game modules read from this object and
 * never hard-code numbers of their own, so tuning the game means editing
 * this file only.
 *
 * Units: money is in integer cents, durations are in milliseconds.
 */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

export const CONFIG = {
  calls: {
    /** Average delay between two incoming calls, randomised by ±jitter. */
    intervalMs: 5 * SECOND,
    intervalJitter: 0.5,
    /** How long a caller waits on a ringing line before hanging up. */
    patienceMs: 14 * SECOND,
    /** How long a connected conversation keeps its cord busy. */
    minDurationMs: 8 * SECOND,
    maxDurationMs: 18 * SECOND,
    /** Paid when a call is connected. */
    payoutCents: 15,
  },

  cords: {
    /** Cord pairs available at the start of the game. */
    initial: 2,
  },

  upgrades: {
    /** Each purchase adds one cord pair; one price per purchase. */
    cord: { costsCents: [500, 1_500, 4_000, 8_000, 15_000, 20_000] },
  },

  offline: {
    /** Absences shorter than this are not worth a welcome-back summary. */
    minAwayMs: MINUTE,
    /** Offline progress stops counting after this long away. */
    maxAwayMs: 4 * HOUR,
  },

  save: {
    storageKey: 'patch-through:save',
    backupKey: 'patch-through:save:backup',
    autosaveMs: 10 * SECOND,
  },
} as const;

export type Config = typeof CONFIG;
