import { PLOT_IDS } from '../story';
import { UPGRADE_IDS } from '../types';
import { CURRENT_SAVE_VERSION, isSave, type Save } from './schema';

/**
 * Upgrades a raw save from version N to version N + 1, keyed by N.
 *
 * When the save format changes: bump CURRENT_SAVE_VERSION, describe the new
 * shape in schema.ts, and add an entry here converting the previous shape.
 * Entries are never removed, so any old save can walk up the chain.
 */
export type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

export const MIGRATIONS: Readonly<Record<number, Migration>> = {
  // v1 → v2: the catalogue grew from one upgrade to many; new ones start at zero.
  1: (v1) => {
    const old = typeof v1.upgrades === 'object' && v1.upgrades !== null ? v1.upgrades : {};
    const upgrades = Object.fromEntries(UPGRADE_IDS.map((id) => [id, 0]));
    return { ...v1, version: 2, upgrades: { ...upgrades, ...old } };
  },
  // v2 → v3: stories begin. Plots of districts already automated stay untold.
  2: (v2) => ({
    ...v2,
    version: 3,
    story: { offered: Object.fromEntries(PLOT_IDS.map((id) => [id, 0])), heard: [] },
  }),
};

/**
 * Brings any stored value up to the current save format. Returns null when
 * the value is unreadable, comes from a newer game, or has a missing step.
 */
export function migrateSave(
  raw: unknown,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
  targetVersion: number = CURRENT_SAVE_VERSION,
): Save | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  let current = raw as Record<string, unknown>;

  for (;;) {
    const version = current.version;
    if (typeof version !== 'number' || !Number.isInteger(version) || version > targetVersion) {
      return null;
    }
    if (version === targetVersion) break;
    const migration = migrations[version];
    if (!migration) return null;
    current = migration(current);
    if (current.version !== version + 1) return null;
  }
  return isSave(current) ? current : null;
}
