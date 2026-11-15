import { describe, expect, it } from 'vitest';
import { CONFIG } from '../config';
import { advance, createInitialState } from '../engine';
import { migrateSave, type Migration } from './migrate';
import { fromSave, isSave, toSave, type Save, type Settings } from './schema';
import { loadSave, writeSave, type SaveStorage } from './storage';

const settings: Settings = { muted: false, locale: 'en' };

function validSave(): Save {
  const state = { ...createInitialState(1), moneyCents: 1_234, upgrades: { cord: 2 } };
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

  it('rejects malformed values', () => {
    const save = validSave();
    expect(isSave(save)).toBe(true);
    expect(isSave({ ...save, moneyCents: -5 })).toBe(false);
    expect(isSave({ ...save, moneyCents: 1.5 })).toBe(false);
    expect(isSave({ ...save, upgrades: { cord: 999 } })).toBe(false);
    expect(isSave({ ...save, settings: { muted: false, locale: 'de' } })).toBe(false);
    expect(isSave({ ...save, stats: null })).toBe(false);
  });
});

describe('migrateSave', () => {
  it('accepts a current save as is', () => {
    const save = validSave();
    expect(migrateSave(JSON.parse(JSON.stringify(save)))).toEqual(save);
  });

  it('walks a chain of migrations up to the target version', () => {
    const save = validSave();
    const { moneyCents, ...rest } = save;
    const legacy = { ...rest, version: -1, cash: moneyCents };
    const chain: Record<number, Migration> = {
      [-1]: ({ cash, ...old }) => ({ ...old, version: 0, moneyCents: cash }),
      0: (old) => ({ ...old, version: 1 }),
    };
    expect(migrateSave(legacy, chain)).toEqual(save);
  });

  it('rejects saves from a newer game, missing steps and garbage', () => {
    expect(migrateSave({ ...validSave(), version: 99 })).toBeNull();
    expect(migrateSave({ ...validSave(), version: 0 }, {})).toBeNull();
    expect(migrateSave({ version: 'one' })).toBeNull();
    expect(migrateSave(null)).toBeNull();
    expect(migrateSave([1, 2])).toBeNull();
  });

  it('rejects a migration that forgets to bump the version', () => {
    const chain: Record<number, Migration> = { 0: (old) => old };
    expect(migrateSave({ ...validSave(), version: 0 }, chain)).toBeNull();
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
