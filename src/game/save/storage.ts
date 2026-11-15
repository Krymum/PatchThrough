import { CONFIG } from '../config';
import { migrateSave } from './migrate';
import type { Save } from './schema';

/** The subset of the Web Storage API the game needs; easy to fake in tests. */
export type SaveStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type LoadResult =
  | { status: 'empty' }
  | { status: 'loaded'; save: Save }
  /** The stored value could not be read; it was copied to the backup key. */
  | { status: 'corrupt' }
  /** Storage itself is unavailable (private mode, blocked site data...). */
  | { status: 'unavailable' };

/** Returns window.localStorage, or null when the browser refuses access. */
export function browserStorage(): SaveStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadSave(storage: SaveStorage | null): LoadResult {
  if (!storage) return { status: 'unavailable' };
  let text: string | null;
  try {
    text = storage.getItem(CONFIG.save.storageKey);
  } catch {
    return { status: 'unavailable' };
  }
  if (text === null) return { status: 'empty' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }
  const save = migrateSave(parsed);
  if (save) return { status: 'loaded', save };

  try {
    storage.setItem(CONFIG.save.backupKey, text);
    storage.removeItem(CONFIG.save.storageKey);
  } catch {
    // Keeping the unreadable save around is harmless; the game starts fresh.
  }
  return { status: 'corrupt' };
}

/** Returns false when the save could not be written (quota, privacy mode). */
export function writeSave(storage: SaveStorage | null, save: Save): boolean {
  if (!storage) return false;
  try {
    storage.setItem(CONFIG.save.storageKey, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}
