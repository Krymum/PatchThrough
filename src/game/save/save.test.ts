import { describe, expect, it } from 'vitest';
import { CONFIG } from '../config';
import { advance, createInitialState } from '../engine';
import { migrateSave, type Migration } from './migrate';
import { stateWith } from '../testHelpers';
import { fromSave, isSave, toSave, type Save, type SaveV1, type Settings } from './schema';
import { loadSave, writeSave, type SaveStorage } from './storage';

const settings: Settings = { muted: false, locale: 'en' };

function validSave(): Save {
  const state = stateWith({ moneyCents: 1_234, upgrades: { cord: 2 } });
  return toSave(state, settings, 1_700_000_000_000);
}

class MemoryStorage implements SaveStorage {
  readonly items = new Map<string, string>();
  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }
  removeItem(key: string): void {
    this.items.delete(key);
  }
}

const throwingStorage: SaveStorage = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
  removeItem: () => {
    throw new Error('SecurityError');
  },
};

describe('save schema', () => {
  it('round-trips the persistent part of the state', () => {
    const played = advance({ ...createInitialState(4), moneyCents: 900 }, 30_000).state;
    const restored = fromSave(toSave(played, settings, 0), 77);
    expect(restored.moneyCents).toBe(900);
    expect(restored.upgrades).toEqual(played.upgrades);
    expect(restored.stats).toEqual(played.stats);
    expect(restored.calls).toEqual([]);
    expect(restored.seed).toBe(77);
  });

  it('keeps story progress across a save', () => {
    const state = stateWith({
      story: {
        ...createInitialState(0).story,
        offered: { ...createInitialState(0).story.offered, looms: 3 },
        heard: ['looms-1', 'looms-3'],
      },
    });
    const restored = fromSave(toSave(state, settings, 0), 1);
    expect(restored.story).toEqual(state.story);
  });

  it('seats the apprentices still working when a save is loaded', () => {
    const save = toSave(stateWith({ upgrades: { apprentice: 3, switchMill: 1 } }), settings, 0);
    expect(fromSave(save, 1).apprenticeBusyUntil).toEqual([0, 0]);
  });

  it('produces a valid save after fractional frame times', () => {
    const played = advance(createInitialState(4), 1_000 / 60).state;
    const save = toSave(played, settings, 1_700_000_000_000);
    expect(isSave(save)).toBe(true);
    expect(save.stats.playMs).toBe(17);
  });

  it('rejects malformed values', () => {
    const save = validSave();
    expect(isSave(save)).toBe(true);
    expect(isSave({ ...save, moneyCents: -5 })).toBe(false);
    expect(isSave({ ...save, moneyCents: 1.5 })).toBe(false);
    expect(isSave({ ...save, upgrades: { ...save.upgrades, cord: 999 } })).toBe(false);
    expect(isSave({ ...save, upgrades: { cord: 1 } })).toBe(false);
    expect(isSave({ ...save, settings: { muted: false, locale: 'de' } })).toBe(false);
    expect(isSave({ ...save, stats: null })).toBe(false);
    expect(isSave({ ...save, story: { ...save.story, heard: ['looms-99'] } })).toBe(false);
    expect(isSave({ ...save, story: { offered: { looms: 1 }, heard: [] } })).toBe(false);
  });
});

describe('migrateSave', () => {
  it('accepts a current save as is', () => {
    const save = validSave();
    expect(migrateSave(JSON.parse(JSON.stringify(save)))).toEqual(save);
  });

  it('upgrades a version 1 save from the first release', () => {
    const v1: SaveV1 = {
      version: 1,
      savedAt: 1_700_000_000_000,
      moneyCents: 640,
      upgrades: { cord: 2 },
      stats: { connected: 40, missed: 3, earnedCents: 900, playMs: 600_000 },
      settings: { muted: false, locale: 'fr' },
    };
    const migrated = migrateSave(JSON.parse(JSON.stringify(v1)));
    expect(migrated?.version).toBe(3);
    expect(migrated?.moneyCents).toBe(640);
    expect(migrated?.upgrades).toEqual({ ...createInitialState(0).upgrades, cord: 2 });
    expect(migrated?.settings.locale).toBe('fr');
    expect(migrated?.story).toEqual(createInitialState(0).story);
  });

  it('walks a chain of migrations up to the target version', () => {
    const save = validSave();
    const { moneyCents, ...rest } = save;
    const legacy = { ...rest, version: 0, cash: moneyCents };
    const chain: Record<number, Migration> = {
      0: ({ cash, ...old }) => ({ ...old, version: 1, moneyCents: cash }),
      1: (old) => ({ ...old, version: 2 }),
      2: (old) => ({ ...old, version: 3 }),
    };
    expect(migrateSave(legacy, chain)).toEqual(save);
  });

  it('rejects saves from a newer game, missing steps and garbage', () => {
    expect(migrateSave({ ...validSave(), version: 99 })).toBeNull();
    expect(migrateSave({ ...validSave(), version: 2 }, {})).toBeNull();
    expect(migrateSave({ version: 'one' })).toBeNull();
    expect(migrateSave(null)).toBeNull();
    expect(migrateSave([1, 2])).toBeNull();
  });

  it('rejects a migration that forgets to bump the version', () => {
    const chain: Record<number, Migration> = { 2: (old) => old };
    expect(migrateSave({ ...validSave(), version: 2 }, chain)).toBeNull();
  });
});

describe('storage', () => {
  it('writes then loads a save', () => {
    const storage = new MemoryStorage();
    expect(writeSave(storage, validSave())).toBe(true);
    expect(loadSave(storage)).toEqual({ status: 'loaded', save: validSave() });
  });

  it('reports an empty slot', () => {
    expect(loadSave(new MemoryStorage())).toEqual({ status: 'empty' });
  });

  it('moves an unreadable save to the backup key', () => {
    const storage = new MemoryStorage();
    storage.setItem(CONFIG.save.storageKey, '{not json');
    expect(loadSave(storage)).toEqual({ status: 'corrupt' });
    expect(storage.getItem(CONFIG.save.backupKey)).toBe('{not json');
    expect(storage.getItem(CONFIG.save.storageKey)).toBeNull();
  });

  it('survives a storage that throws on every access', () => {
    expect(loadSave(throwingStorage)).toEqual({ status: 'unavailable' });
    expect(writeSave(throwingStorage, validSave())).toBe(false);
    expect(loadSave(null)).toEqual({ status: 'unavailable' });
    expect(writeSave(null, validSave())).toBe(false);
  });
});
